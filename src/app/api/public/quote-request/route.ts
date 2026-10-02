import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "projects";

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const reference = text(form, "reference");
    const clientName = text(form, "client_name");
    const phone = text(form, "phone");
    const email = text(form, "email");
    const answersText = text(form, "answers");

    if (!reference || !clientName || !phone) {
      return NextResponse.json({ success: false, message: "Référence, nom et téléphone sont obligatoires." }, { status: 400 });
    }

    let answers: Record<string, unknown> = {};
    try {
      answers = answersText ? JSON.parse(answersText) : {};
    } catch {
      return NextResponse.json({ success: false, message: "Les réponses du devis sont invalides." }, { status: 400 });
    }

    let pdfUrl: string | null = null;
    const pdfValue = form.get("pdf");

    if (pdfValue instanceof File && pdfValue.size > 0) {
      const path = `quote-requests/${reference}-${randomUUID()}.pdf`;
      const bytes = Buffer.from(await pdfValue.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, bytes, {
          contentType: "application/pdf",
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`PDF : ${uploadError.message}`);
      }

      pdfUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await supabaseAdmin
      .from("quote_requests")
      .insert({
        reference,
        client_name: clientName,
        phone,
        email: email || null,
        answers,
        pdf_url: pdfUrl,
        status: "nouveau",
      })
      .select("id, reference, pdf_url, status")
      .single();

    if (error) {
      throw new Error(`DEVIS : ${error.message}`);
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("QUOTE REQUEST:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Impossible d'enregistrer la demande." },
      { status: 500 }
    );
  }
}
