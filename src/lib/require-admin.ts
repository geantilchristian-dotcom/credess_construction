import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Configuration Supabase publique manquante.");
  }

  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
  if (adminError || !isAdmin) {
    throw new Error("FORBIDDEN");
  }

  return userData.user;
}
