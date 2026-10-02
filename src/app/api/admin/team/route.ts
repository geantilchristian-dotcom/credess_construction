import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";
import {
  randomUUID,
} from "node:crypto";
import { requireAdmin } from "@/lib/require-admin";
export const runtime =
  "nodejs";
export const dynamic =
  "force-dynamic";
const BUCKET =
  "projects";
function getSupabase() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env
      .SUPABASE_SECRET_KEY;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL manquant."
    );
  }
  if (!secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY manquant."
    );
  }
  return createClient(
    url,
    secret,
    {
      auth: {
        persistSession:
          false,
        autoRefreshToken:
          false,
      },
    }
  );
}
function errorText(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message: unknown;
        }
      ).message
    );
  }
  return String(
    error
  );
}
function formText(
  form: FormData,
  key: string
) {
  const value =
    form.get(
      key
    );
  return typeof value ===
    "string"
      ? value.trim()
      : "";
}
/*
 * La base utilise full_name,
 * tandis que l'interface utilise name.
 *
 * On normalise donc toutes les réponses ici.
 */
function normalizeMember(
  row: any
) {
  if (!row) {
    return row;
  }
  return {
    ...row,
    name:
      row.full_name ||
      row.name ||
      "",
  };
}
async function uploadPhoto(
  supabase:
    ReturnType<
      typeof getSupabase
    >,
  file: File
) {
  const extension =
    file.type ===
      "image/png"
      ? "png"
      : file.type ===
        "image/jpeg"
        ? "jpg"
        : "webp";
  const storagePath =
    `team-members/${Date.now()}-${randomUUID()}.${extension}`;
  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );
  const {
    error,
  } =
    await supabase
      .storage
      .from(BUCKET)
      .upload(
        storagePath,
        buffer,
        {
          contentType:
            file.type ||
            "image/webp",
          cacheControl:
            "31536000",
          upsert:
            false,
        }
      );
  if (error) {
    throw new Error(
      `PHOTO SUPABASE : ${error.message}`
    );
  }
  const {
    data,
  } =
    supabase
      .storage
      .from(BUCKET)
      .getPublicUrl(
        storagePath
      );
  return {
    url:
      data.publicUrl,
    path:
      storagePath,
  };
}
async function removePhoto(
  supabase:
    ReturnType<
      typeof getSupabase
    >,
  publicUrl:
    string | null
) {
  if (!publicUrl) {
    return;
  }
  const marker =
    `/storage/v1/object/public/${BUCKET}/`;
  const position =
    publicUrl.indexOf(
      marker
    );
  if (
    position < 0
  ) {
    return;
  }
  const storagePath =
    decodeURIComponent(
      publicUrl.substring(
        position +
        marker.length
      )
    );
  await supabase
    .storage
    .from(BUCKET)
    .remove([
      storagePath,
    ]);
}
/* ==========================================================
   GET
========================================================== */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const supabase =
      getSupabase();
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "team_members"
        )
        .select(
          `
          id,
          full_name,
          role,
          photo_url,
          biography,
          phone,
          email,
          is_published,
          sort_order,
          created_at,
          updated_at
          `
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        );
    if (error) {
      throw new Error(
        `LECTURE team_members : ${error.message}`
      );
    }
    const members =
      (
        data ??
        []
      ).map(
        normalizeMember
      );
    return NextResponse.json({
      success:
        true,
      members,
      count:
        members.length,
    });
  }
  catch (error) {
    console.error(
      "TEAM GET ERROR:",
      error
    );
    return NextResponse.json(
      {
        success:
          false,
        message:
          errorText(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}
/* ==========================================================
   POST
========================================================== */
export async function POST(
  request:
    NextRequest
) {
  let uploadedPath =
    "";
  try {
    await requireAdmin(request);
    const supabase =
      getSupabase();
    const form =
      await request.formData();
    const name =
      formText(
        form,
        "name"
      );
    const role =
      formText(
        form,
        "role"
      );
    const phone =
      formText(
        form,
        "phone"
      );
    const email =
      formText(
        form,
        "email"
      );
    if (!name) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Le nom complet est obligatoire.",
        },
        {
          status:
            400,
        }
      );
    }
    if (!role) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "La fonction est obligatoire.",
        },
        {
          status:
            400,
        }
      );
    }
    /*
     * Position automatique
     */
    const {
      data:
        orderRows,
      error:
        orderError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .select(
          "sort_order"
        )
        .order(
          "sort_order",
          {
            ascending:
              false,
          }
        )
        .limit(1);
    if (orderError) {
      throw new Error(
        `ORDRE team_members : ${orderError.message}`
      );
    }
    const nextOrder =
      (
        orderRows?.[0]
          ?.sort_order ??
        0
      ) + 1;
    /*
     * Photo
     */
    const photoValue =
      form.get(
        "photo"
      );
    let photoUrl:
      string | null =
      null;
    if (
      photoValue instanceof File &&
      photoValue.size > 0
    ) {
      const upload =
        await uploadPhoto(
          supabase,
          photoValue
        );
      photoUrl =
        upload.url;
      uploadedPath =
        upload.path;
    }
    /*
     * IMPORTANT :
     * on écrit full_name et NON name.
     */
    const {
      data,
      error:
        insertError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .insert({
          full_name:
            name,
          role,
          photo_url:
            photoUrl,
          phone:
            phone ||
            null,
          email:
            email ||
            null,
          sort_order:
            nextOrder,
          is_published:
            true,
        })
        .select("*")
        .single();
    if (insertError) {
      if (
        uploadedPath
      ) {
        await supabase
          .storage
          .from(BUCKET)
          .remove([
            uploadedPath,
          ]);
      }
      throw new Error(
        `INSERT team_members : ${insertError.message}`
      );
    }
    return NextResponse.json({
      success:
        true,
      message:
        "Membre ajouté avec succès.",
      member:
        normalizeMember(
          data
        ),
    });
  }
  catch (error) {
    console.error(
      "TEAM POST ERROR:",
      error
    );
    return NextResponse.json(
      {
        success:
          false,
        message:
          errorText(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}
/* ==========================================================
   PATCH
========================================================== */
export async function PATCH(
  request:
    NextRequest
) {
  try {
    await requireAdmin(request);
    const supabase =
      getSupabase();
    const form =
      await request.formData();
    const id =
      formText(
        form,
        "id"
      );
    if (!id) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Identifiant manquant.",
        },
        {
          status:
            400,
        }
      );
    }
    const {
      data:
        current,
      error:
        currentError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .single();
    if (
      currentError ||
      !current
    ) {
      throw new Error(
        `MEMBRE INTROUVABLE : ${
          currentError?.message ??
          id
        }`
      );
    }
    const payload:
      Record<
        string,
        unknown
      > =
      {};
    /*
     * L'interface envoie name,
     * Supabase reçoit full_name.
     */
    if (
      form.has(
        "name"
      )
    ) {
      const name =
        formText(
          form,
          "name"
        );
      if (!name) {
        return NextResponse.json(
          {
            success:
              false,
            message:
              "Le nom complet est obligatoire.",
          },
          {
            status:
              400,
          }
        );
      }
      payload.full_name =
        name;
    }
    if (
      form.has(
        "role"
      )
    ) {
      const role =
        formText(
          form,
          "role"
        );
      if (!role) {
        return NextResponse.json(
          {
            success:
              false,
            message:
              "La fonction est obligatoire.",
          },
          {
            status:
              400,
          }
        );
      }
      payload.role =
        role;
    }
    if (
      form.has(
        "phone"
      )
    ) {
      payload.phone =
        formText(
          form,
          "phone"
        ) ||
        null;
    }
    if (
      form.has(
        "email"
      )
    ) {
      payload.email =
        formText(
          form,
          "email"
        ) ||
        null;
    }
    if (
      form.has(
        "is_published"
      )
    ) {
      payload.is_published =
        formText(
          form,
          "is_published"
        ) === "true";
    }
    const removeImage =
      formText(
        form,
        "remove_image"
      ) === "true";
    const photoValue =
      form.get(
        "photo"
      );
    let newPhotoUrl:
      string | null =
      null;
    if (
      photoValue instanceof File &&
      photoValue.size > 0
    ) {
      const upload =
        await uploadPhoto(
          supabase,
          photoValue
        );
      newPhotoUrl =
        upload.url;
      payload.photo_url =
        upload.url;
    }
    else if (
      removeImage
    ) {
      payload.photo_url =
        null;
    }
    const {
      data,
      error:
        updateError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .update(
          payload
        )
        .eq(
          "id",
          id
        )
        .select("*")
        .single();
    if (updateError) {
      throw new Error(
        `UPDATE team_members : ${updateError.message}`
      );
    }
    if (
      (
        newPhotoUrl ||
        removeImage
      ) &&
      current.photo_url
    ) {
      await removePhoto(
        supabase,
        current.photo_url
      );
    }
    return NextResponse.json({
      success:
        true,
      member:
        normalizeMember(
          data
        ),
    });
  }
  catch (error) {
    console.error(
      "TEAM PATCH ERROR:",
      error
    );
    return NextResponse.json(
      {
        success:
          false,
        message:
          errorText(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}
/* ==========================================================
   DELETE
========================================================== */
export async function DELETE(
  request:
    NextRequest
) {
  try {
    await requireAdmin(request);
    const supabase =
      getSupabase();
    const body =
      await request.json();
    const id =
      String(
        body?.id ??
        ""
      ).trim();
    if (!id) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Identifiant manquant.",
        },
        {
          status:
            400,
        }
      );
    }
    const {
      data:
        current,
      error:
        currentError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .select(
          "photo_url"
        )
        .eq(
          "id",
          id
        )
        .single();
    if (currentError) {
      throw new Error(
        `LECTURE AVANT SUPPRESSION : ${currentError.message}`
      );
    }
    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .delete()
        .eq(
          "id",
          id
        );
    if (deleteError) {
      throw new Error(
        `DELETE team_members : ${deleteError.message}`
      );
    }
    if (
      current?.photo_url
    ) {
      await removePhoto(
        supabase,
        current.photo_url
      );
    }
    return NextResponse.json({
      success:
        true,
      message:
        "Membre supprimé.",
    });
  }
  catch (error) {
    console.error(
      "TEAM DELETE ERROR:",
      error
    );
    return NextResponse.json(
      {
        success:
          false,
        message:
          errorText(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}