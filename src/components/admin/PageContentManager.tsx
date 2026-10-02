"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./ConnectedAdmin.module.css";

type EntryConfig = {
  pageKey: string;
  sectionKey?: string;
  label: string;
  defaultTitle: string;
  defaultContent: string;
  allowPublish?: boolean;
};

type EntryState = EntryConfig & {
  id?: string;
  title: string;
  content: string;
  isPublished: boolean;
};

type Props = {
  title: string;
  description: string;
  entries: EntryConfig[];
};

export default function PageContentManager({ title, description, entries }: Props) {
  const [items, setItems] = useState<EntryState[]>(
    entries.map((entry) => ({
      ...entry,
      sectionKey: entry.sectionKey || "main",
      title: entry.defaultTitle,
      content: entry.defaultContent,
      isPublished: true,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const pageKeys = entries.map((entry) => entry.pageKey);
      const { data, error: loadError } = await supabase
        .from("page_contents")
        .select("*")
        .in("page_key", pageKeys);

      if (loadError) {
        setError(loadError.message);
      } else {
        setItems(
          entries.map((entry) => {
            const sectionKey = entry.sectionKey || "main";
            const row = (data || []).find(
              (candidate) => candidate.page_key === entry.pageKey && candidate.section_key === sectionKey
            );
            return {
              ...entry,
              sectionKey,
              id: row?.id,
              title: row?.title || entry.defaultTitle,
              content: row?.content || entry.defaultContent,
              isPublished: row ? Boolean(row.is_published) : true,
            };
          })
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  function update(index: number, patch: Partial<EntryState>) {
    setItems((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function save(index: number) {
    const item = items[index];
    setSavingKey(item.pageKey);
    setError("");
    setSuccess("");

    try {
      const { error: saveError } = await supabase
        .from("page_contents")
        .upsert(
          {
            page_key: item.pageKey,
            section_key: item.sectionKey || "main",
            title: item.title.trim(),
            content: item.content.trim(),
            subtitle: null,
            sort_order: 1,
            is_published: item.allowPublish === false ? true : item.isPublished,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "page_key,section_key" }
        );
      if (saveError) throw saveError;
      setSuccess(`${item.label} enregistré.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <small>ADMINISTRATION CREDESS</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      {loading ? <div className={styles.empty}>Chargement...</div> : items.map((item, index) => (
        <section className={styles.panel} key={item.pageKey}>
          <div className={styles.panelHeader}>
            <div><h2>{item.label}</h2><p>Ce texte est affiché directement sur le site public.</p></div>
            {item.allowPublish !== false && (
              <span className={item.isPublished ? styles.statusOn : styles.statusOff}>{item.isPublished ? "PUBLIÉ" : "MASQUÉ"}</span>
            )}
          </div>

          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.full}`}><span>Titre</span><input value={item.title} onChange={(e) => update(index, { title: e.target.value })} /></label>
            <label className={`${styles.field} ${styles.full}`}><span>Contenu</span><textarea value={item.content} onChange={(e) => update(index, { content: e.target.value })} rows={10} /></label>
            {item.allowPublish !== false && (
              <label className={styles.field}><span>Affichage</span><select value={item.isPublished ? "yes" : "no"} onChange={(e) => update(index, { isPublished: e.target.value === "yes" })}><option value="yes">Publié</option><option value="no">Masqué</option></select></label>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => save(index)} disabled={savingKey === item.pageKey}>{savingKey === item.pageKey ? "Enregistrement..." : "Enregistrer →"}</button>
            <a className={styles.secondary} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }} href={item.pageKey === "about" ? "/a-propos" : item.pageKey === "mission" ? "/mission" : item.pageKey === "engagement" ? "/engagement" : item.pageKey === "privacy" ? "/confidentialite" : item.pageKey === "legal" ? "/mentions-legales" : "/conditions-utilisation"} target="_blank" rel="noreferrer">Voir la page ↗</a>
          </div>
        </section>
      ))}

      {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
      {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}
    </div>
  );
}
