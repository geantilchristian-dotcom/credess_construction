"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { adminFetch } from "@/lib/admin-fetch";
import styles from "./ConnectedAdmin.module.css";

type FieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
};

type Props = {
  title: string;
  description: string;
  fields: FieldConfig[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

export default function SiteSettingsManager({ title, description, fields }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

      if (adminError || !isAdmin) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("site_settings")
        .select("setting_key,setting_value");

      if (!mounted) return;

      if (loadError) {
        setError(loadError.message);
      } else {
        setValues(
          Object.fromEntries(
            (data || []).map((row) => [row.setting_key, row.setting_value || ""])
          )
        );
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = Object.fromEntries(
        fields.map((field) => [field.key, values[field.key] || ""])
      );

      const response = await adminFetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: payload }),
      });

      const text = await response.text();
      let result: ApiResponse = {};

      if (text) {
        try {
          result = JSON.parse(text) as ApiResponse;
        } catch {
          result = { message: text };
        }
      }

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          router.replace("/admin/login");
        }

        throw new Error(result.message || `Erreur HTTP ${response.status}.`);
      }

      setSuccess(
        result.message ||
          "Informations enregistrées. Elles sont maintenant utilisées par le site public."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Enregistrement impossible."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <small>ADMINISTRATION CREDESS</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <section className={styles.panel}>
        {loading ? (
          <div className={styles.empty}>Chargement...</div>
        ) : (
          <div className={styles.grid}>
            {fields.map((field) => (
              <label className={styles.field} key={field.key}>
                <span>{field.label}</span>
                <input
                  value={values[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        )}

        {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
        {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={save}
            disabled={saving || loading}
          >
            {saving ? "Enregistrement..." : "Enregistrer →"}
          </button>
        </div>
      </section>
    </div>
  );
}
