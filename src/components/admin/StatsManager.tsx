"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./ConnectedAdmin.module.css";

type StatDraft = {
  stat_key: string;
  label: string;
  value: string;
  suffix: string;
  is_published: boolean;
};

const DEFAULTS: StatDraft[] = [
  { stat_key: "projects", label: "Projets réalisés", value: "128", suffix: "+", is_published: true },
  { stat_key: "experience", label: "Années d'expérience", value: "8", suffix: "+", is_published: true },
  { stat_key: "clients", label: "Clients satisfaits", value: "96", suffix: "%", is_published: true },
  { stat_key: "team", label: "Collaborateurs", value: "24", suffix: "", is_published: true },
];

export default function StatsManager() {
  const [stats, setStats] = useState<StatDraft[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("company_stats")
      .select("stat_key,label,value,suffix,is_published,sort_order")
      .order("sort_order", { ascending: true });

    if (loadError) {
      setError(loadError.message);
    } else if (data && data.length > 0) {
      const byKey = new Map(data.map((row) => [row.stat_key, row]));
      setStats(
        DEFAULTS.map((fallback) => {
          const row = byKey.get(fallback.stat_key);
          return row
            ? {
                stat_key: row.stat_key,
                label: row.label || fallback.label,
                value: String(row.value ?? 0),
                suffix: row.suffix || "",
                is_published: Boolean(row.is_published),
              }
            : fallback;
        })
      );
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function update(index: number, patch: Partial<StatDraft>) {
    setStats((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = stats.map((item, index) => ({
        stat_key: item.stat_key,
        label: item.label.trim(),
        value: Number(item.value || 0),
        suffix: item.suffix.trim(),
        sort_order: index + 1,
        is_published: item.is_published,
        updated_at: new Date().toISOString(),
      }));

      const { error: saveError } = await supabase
        .from("company_stats")
        .upsert(payload, { onConflict: "stat_key" });
      if (saveError) throw saveError;
      setSuccess("Statistiques enregistrées. Le site public se mettra à jour automatiquement.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <small>ADMINISTRATION CREDESS</small>
        <h1>Statistiques</h1>
        <p>Modifiez simplement les chiffres affichés sur l'accueil. Aucun identifiant technique ni ordre à saisir.</p>
      </header>

      <section className={styles.panel}>
        {loading ? <div className={styles.empty}>Chargement...</div> : (
          <div className={styles.statGrid}>
            {stats.map((item, index) => (
              <article className={styles.statCard} key={item.stat_key}>
                <strong>{item.label}</strong>
                <div className={styles.grid}>
                  <label className={styles.field}><span>Nom affiché</span><input value={item.label} onChange={(e) => update(index, { label: e.target.value })} /></label>
                  <label className={styles.field}><span>Valeur</span><input type="number" value={item.value} onChange={(e) => update(index, { value: e.target.value })} /></label>
                  <label className={styles.field}><span>Suffixe</span><input value={item.suffix} onChange={(e) => update(index, { suffix: e.target.value })} placeholder="+, %, etc." /></label>
                  <label className={styles.field}><span>Affichage</span><select value={item.is_published ? "yes" : "no"} onChange={(e) => update(index, { is_published: e.target.value === "yes" })}><option value="yes">Visible</option><option value="no">Masqué</option></select></label>
                </div>
              </article>
            ))}
          </div>
        )}
        {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
        {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}
        <div className={styles.actions}><button type="button" className={styles.primary} onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer les statistiques →"}</button></div>
      </section>
    </div>
  );
}
