"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./ConnectedAdmin.module.css";

type QuestionRow = {
  id: string;
  question: string;
  question_type: "choice" | "text" | "number" | "textarea";
  options: string[] | null;
  placeholder: string | null;
  is_required: boolean;
  sort_order: number | null;
  is_active: boolean;
};

export default function QuoteQuestionsManager() {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [type, setType] = useState<QuestionRow["question_type"]>("choice");
  const [optionsText, setOptionsText] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [required, setRequired] = useState(true);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("quote_questions").select("*").order("sort_order", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      setRows([]);
    } else {
      setRows((data || []) as QuestionRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function reset() {
    setEditingId(null);
    setQuestion("");
    setType("choice");
    setOptionsText("");
    setPlaceholder("");
    setRequired(true);
    setActive(true);
    setError("");
  }

  function edit(row: QuestionRow) {
    setEditingId(row.id);
    setQuestion(row.question);
    setType(row.question_type);
    setOptionsText((row.options || []).join("\n"));
    setPlaceholder(row.placeholder || "");
    setRequired(Boolean(row.is_required));
    setActive(Boolean(row.is_active));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) {
      setError("Écrivez la question.");
      return;
    }
    const options = type === "choice"
      ? optionsText.split(/\n/).map((item) => item.trim()).filter(Boolean)
      : [];
    if (type === "choice" && options.length < 2) {
      setError("Ajoutez au moins deux choix, un par ligne.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        question: question.trim(),
        question_type: type,
        options,
        placeholder: placeholder.trim() || null,
        is_required: required,
        is_active: active,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase.from("quote_questions").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
        setSuccess("Question modifiée.");
      } else {
        const nextOrder = (rows.reduce((max, row) => Math.max(max, row.sort_order || 0), 0)) + 1;
        const { error: insertError } = await supabase.from("quote_questions").insert({ ...payload, sort_order: nextOrder });
        if (insertError) throw insertError;
        setSuccess("Question ajoutée.");
      }
      reset();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: QuestionRow) {
    const { error: updateError } = await supabase.from("quote_questions").update({ is_active: !row.is_active }).eq("id", row.id);
    if (updateError) setError(updateError.message); else await load();
  }

  async function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= rows.length) return;
    const current = rows[index];
    const other = rows[destination];
    const firstOrder = current.sort_order ?? index + 1;
    const secondOrder = other.sort_order ?? destination + 1;
    const results = await Promise.all([
      supabase.from("quote_questions").update({ sort_order: secondOrder }).eq("id", current.id),
      supabase.from("quote_questions").update({ sort_order: firstOrder }).eq("id", other.id),
    ]);
    const updateError = results.find((result) => result.error)?.error;
    if (updateError) setError(updateError.message); else await load();
  }

  async function remove(row: QuestionRow) {
    if (!window.confirm("Supprimer cette question ?")) return;
    const { error: deleteError } = await supabase.from("quote_questions").delete().eq("id", row.id);
    if (deleteError) setError(deleteError.message); else await load();
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <small>ADMINISTRATION CREDESS</small>
        <h1>Questions du devis</h1>
        <p>Ces questions apparaissent réellement, une par une, dans le formulaire public. Le nom, le téléphone et l’e-mail du client sont ajoutés automatiquement à la fin.</p>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div><h2>{editingId ? "Modifier la question" : "Ajouter une question"}</h2><p>Pour un choix, écrivez une option par ligne.</p></div>
          {editingId && <button type="button" className={styles.secondary} onClick={reset}>Annuler</button>}
        </div>
        <form onSubmit={submit}>
          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.full}`}><span>Question *</span><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ex. Quel service recherchez-vous ?" /></label>
            <label className={styles.field}><span>Type de réponse</span><select value={type} onChange={(e) => setType(e.target.value as QuestionRow["question_type"])}><option value="choice">Boutons de choix</option><option value="text">Texte court</option><option value="number">Nombre</option><option value="textarea">Texte long</option></select></label>
            <label className={styles.field}><span>Obligatoire</span><select value={required ? "yes" : "no"} onChange={(e) => setRequired(e.target.value === "yes")}><option value="yes">Oui</option><option value="no">Non</option></select></label>
            {type === "choice" && <label className={`${styles.field} ${styles.full}`}><span>Choix disponibles — un par ligne</span><textarea className={styles.optionsBox} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder={"Construction\nArchitecture\nÉtudes techniques\nAutre"} /></label>}
            {type !== "choice" && <label className={`${styles.field} ${styles.full}`}><span>Exemple affiché dans le champ</span><input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Ex. Bukavu, Ibanda" /></label>}
            <label className={styles.field}><span>Affichage</span><select value={active ? "yes" : "no"} onChange={(e) => setActive(e.target.value === "yes")}><option value="yes">Active</option><option value="no">Masquée</option></select></label>
          </div>
          {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
          {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}
          <div className={styles.actions}><button className={styles.primary} disabled={saving}>{saving ? "Enregistrement..." : editingId ? "Enregistrer →" : "+ Ajouter la question"}</button></div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}><div><h2>Ordre des questions</h2><p>{rows.length} question(s)</p></div><a className={styles.secondary} style={{ display:"inline-flex", alignItems:"center", textDecoration:"none" }} href="/devis" target="_blank" rel="noreferrer">Voir le formulaire ↗</a></div>
        {loading ? <div className={styles.empty}>Chargement...</div> : rows.length === 0 ? <div className={styles.empty}>Aucune question. Ajoutez la première ci-dessus.</div> : (
          <div className={styles.list}>
            {rows.map((row, index) => (
              <article className={styles.row} key={row.id}>
                <div className={styles.rowMain}>
                  <strong style={{ color:"#e30613", minWidth:28 }}>{String(index + 1).padStart(2,"0")}</strong>
                  <div className={styles.rowText}><span className={row.is_active ? styles.statusOn : styles.statusOff}>{row.is_active ? "ACTIVE" : "MASQUÉE"}</span><strong>{row.question}</strong><small>{row.question_type === "choice" ? `${(row.options || []).length} choix` : row.question_type}</small></div>
                </div>
                <div className={styles.rowActions}><button className={styles.smallButton} disabled={index === 0} onClick={() => move(index,-1)}>↑</button><button className={styles.smallButton} disabled={index === rows.length-1} onClick={() => move(index,1)}>↓</button><button className={styles.smallButton} onClick={() => edit(row)}>Modifier</button><button className={styles.smallButton} onClick={() => toggle(row)}>{row.is_active ? "Masquer" : "Activer"}</button><button className={styles.danger} onClick={() => remove(row)}>Supprimer</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
