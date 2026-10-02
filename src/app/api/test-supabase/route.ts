import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET() {
  try {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secretKey =
      process.env.SUPABASE_SECRET_KEY;
    // Vérification sans exposer les clés
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          step: "environment",
          error:
            "NEXT_PUBLIC_SUPABASE_URL est absent ou vide dans .env.local",
        },
        { status: 500 }
      );
    }
    if (!publishableKey) {
      return NextResponse.json(
        {
          success: false,
          step: "environment",
          error:
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY est absent ou vide dans .env.local",
        },
        { status: 500 }
      );
    }
    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          step: "environment",
          error:
            "SUPABASE_SECRET_KEY est absent ou vide dans .env.local",
        },
        { status: 500 }
      );
    }
    const supabase = createClient(
      url,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    const {
      count,
      error,
    } = await supabase
      .from("projects")
      .select("*", {
        count: "exact",
        head: true,
      });
    if (error) {
      return NextResponse.json(
        {
          success: false,
          step: "database",
          connection: "Supabase contacte",
          table: "projects",
          supabaseCode: error.code,
          supabaseMessage: error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      connection: "OK",
      database: "OK",
      table: "projects",
      projectCount: count ?? 0,
      message:
        "CREDESS est correctement connecté à Supabase.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        step: "unexpected",
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}