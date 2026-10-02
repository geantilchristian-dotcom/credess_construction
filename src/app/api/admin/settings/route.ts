import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SettingsPayload = {
  values?: Record<string, unknown>;
};

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error("Configuration Supabase serveur manquante.");
  }

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "Erreur inconnue.");
  }
  return String(error || "Erreur inconnue.");
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = (await request.json()) as SettingsPayload;
    const values = body.values;

    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return NextResponse.json(
        { success: false, message: "Données de coordonnées invalides." },
        { status: 400 }
      );
    }

    const entries = Object.entries(values)
      .filter(([key]) => /^[a-z0-9_.-]{1,80}$/i.test(key))
      .map(([key, value]) => [key, String(value ?? "").trim()] as const);

    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucune donnée à enregistrer." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    for (const [settingKey, settingValue] of entries) {
      const { data: existing, error: readError } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", settingKey)
        .limit(1);

      if (readError) {
        throw new Error(`Lecture ${settingKey} : ${readError.message}`);
      }

      if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from("site_settings")
          .update({ setting_value: settingValue })
          .eq("setting_key", settingKey);

        if (updateError) {
          throw new Error(`Modification ${settingKey} : ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert({
            setting_key: settingKey,
            setting_value: settingValue,
          });

        if (insertError) {
          throw new Error(`Création ${settingKey} : ${insertError.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Coordonnées enregistrées avec succès.",
    });
  } catch (error) {
    const rawMessage = messageFromError(error);

    if (rawMessage === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Session administrateur expirée. Reconnectez-vous." },
        { status: 401 }
      );
    }

    if (rawMessage === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "Ce compte n'est pas autorisé à administrer CREDESS." },
        { status: 403 }
      );
    }

    console.error("SETTINGS ADMIN ERROR:", error);

    return NextResponse.json(
      { success: false, message: rawMessage },
      { status: 500 }
    );
  }
}
