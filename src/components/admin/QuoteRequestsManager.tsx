"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./ConnectedAdmin.module.css";

type QuoteRow = {
  id: string;
  reference: string | null;
  client_name: string | null;
  phone: string | null;
  email: string | null;
  answers: Record<string,string> | null;
  pdf_url: string | null;
  status: string | null;
  created_at: string | null;
};

const statuses = ["nouveau", "en étude", "contacté", "accepté", "refusé", "terminé"];

export default function QuoteRequestsManager() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false });
    if (loadError) { setError(loadError.message); setRows([]); }
    else setRows((data || []) as QuoteRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(row: QuoteRow, status: string) {
    const { error: updateError } = await supabase.from("quote_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (updateError) setError(updateError.message); else await load();
  }

  async function remove(row: QuoteRow) {
    if (!window.confirm(`Supprimer la demande ${row.reference || ""} ?`)) return;
    const { error: deleteError } = await supabase.from("quote_requests").delete().eq("id", row.id);
    if (deleteError) setError(deleteError.message); else await load();
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}><small>ADMINISTRATION CREDESS</small><h1>Demandes de devis</h1><p>Chaque demande envoyée depuis le site est enregistrée ici, avec ses réponses et son PDF.</p></header>
      {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
      <section className={styles.panel}>
        <div className={styles.panelHeader}><div><h2>Demandes reçues</h2><p>{rows.length} demande(s)</p></div></div>
        {loading ? <div className={styles.empty}>Chargement...</div> : rows.length === 0 ? <div className={styles.empty}>Aucune demande enregistrée.</div> : (
          <div className={styles.list}>
            {rows.map((row) => (
              <article className={styles.row} key={row.id} style={{ gridTemplateColumns:"1fr" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div className={styles.rowText}><span className={styles.statusOn}>{(row.status || "nouveau").toUpperCase()}</span><strong>{row.client_name || "Client"} — {row.reference || "Sans référence"}</strong><small>{row.phone || ""}{row.email ? ` • ${row.email}` : ""}{row.created_at ? ` • ${new Intl.DateTimeFormat("fr-FR", { dateStyle:"medium", timeStyle:"short" }).format(new Date(row.created_at))}` : ""}</small></div>
                  <div className={styles.rowActions}>
                    <select value={row.status || "nouveau"} onChange={(e) => updateStatus(row,e.target.value)} style={{ minHeight:34, border:"1px solid #d4d7da", background:"#fff" }}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                    {row.pdf_url && <a className={styles.smallButton} style={{ display:"inline-flex", alignItems:"center", textDecoration:"none", color:"#111" }} href={row.pdf_url} target="_blank" rel="noreferrer">PDF ↗</a>}
                    <button className={styles.smallButton} onClick={() => setOpenId(openId === row.id ? null : row.id)}>{openId === row.id ? "Fermer" : "Voir les réponses"}</button>
                    <button className={styles.danger} onClick={() => remove(row)}>Supprimer</button>
                  </div>
                </div>
                {openId === row.id && (
                  <div className={styles.answerList}>
                    {Object.entries(row.answers || {}).map(([question, answer]) => <div key={question}><span>{question}</span><strong>{String(answer || "Non renseigné")}</strong></div>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
