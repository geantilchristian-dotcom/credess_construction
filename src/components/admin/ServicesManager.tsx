"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import styles from "./ConnectedAdmin.module.css";

type ServiceRow = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  whatsapp_message: string | null;
  sort_order: number | null;
  is_published: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function storagePathFromUrl(url: string | null) {
  if (!url) return "";
  const marker = "/storage/v1/object/public/projects/";
  const index = url.indexOf(marker);
  if (index < 0) return "";
  return decodeURIComponent(url.substring(index + marker.length));
}

export default function ServicesManager() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [published, setPublished] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      setRows([]);
    } else {
      setRows((data || []) as ServiceRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function clearPreview() {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }

  function reset() {
    clearPreview();
    setEditingId(null);
    setTitle("");
    setShortDescription("");
    setDescription("");
    setWhatsappMessage("");
    setImageFile(null);
    setImagePreview("");
    setExistingImage("");
    setPublished(true);
    setError("");
  }

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisissez une image JPG, PNG ou WebP.");
      return;
    }
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.35,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.78,
      });
      const ready = new File([compressed], `${slugify(file.name.replace(/\.[^/.]+$/, "")) || "service"}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
      clearPreview();
      setImageFile(ready);
      setImagePreview(URL.createObjectURL(ready));
      setError("");
    } catch {
      setError("Impossible de préparer cette image.");
    }
  }

  function edit(row: ServiceRow) {
    clearPreview();
    setEditingId(row.id);
    setTitle(row.title || "");
    setShortDescription(row.short_description || "");
    setDescription(row.description || "");
    setWhatsappMessage(row.whatsapp_message || "");
    setExistingImage(row.image_url || "");
    setImagePreview("");
    setImageFile(null);
    setPublished(Boolean(row.is_published));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(file: File, serviceSlug: string) {
    const path = `services/${serviceSlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const { error: uploadError } = await supabase.storage.from("projects").upload(path, file, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    return {
      url: supabase.storage.from("projects").getPublicUrl(path).data.publicUrl,
      path,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Le nom du service est obligatoire.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    let uploadedPath = "";

    try {
      const slug = slugify(title);
      let imageUrl = existingImage || null;

      if (imageFile) {
        const uploaded = await uploadImage(imageFile, slug);
        imageUrl = uploaded.url;
        uploadedPath = uploaded.path;
      }

      const payload = {
        title: title.trim(),
        slug,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        whatsapp_message: whatsappMessage.trim() || null,
        image_url: imageUrl,
        is_published: published,
      };

      if (editingId) {
        const { error: updateError } = await supabase.from("services").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
        if (imageFile && existingImage) {
          const oldPath = storagePathFromUrl(existingImage);
          if (oldPath && oldPath !== uploadedPath) await supabase.storage.from("projects").remove([oldPath]);
        }
        setSuccess("Service modifié.");
      } else {
        const { data: last } = await supabase.from("services").select("sort_order").order("sort_order", { ascending: false }).limit(1);
        const sortOrder = ((last?.[0]?.sort_order as number | null) || 0) + 1;
        const { error: insertError } = await supabase.from("services").insert({ ...payload, sort_order: sortOrder });
        if (insertError) throw insertError;
        setSuccess("Service ajouté.");
      }

      reset();
      await load();
    } catch (caught) {
      if (uploadedPath) await supabase.storage.from("projects").remove([uploadedPath]);
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: ServiceRow) {
    const { error: updateError } = await supabase.from("services").update({ is_published: !row.is_published }).eq("id", row.id);
    if (updateError) setError(updateError.message);
    else await load();
  }

  async function remove(row: ServiceRow) {
    if (!window.confirm(`Supprimer définitivement le service « ${row.title} » ?`)) return;
    const { error: deleteError } = await supabase.from("services").delete().eq("id", row.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    const path = storagePathFromUrl(row.image_url);
    if (path) await supabase.storage.from("projects").remove([path]);
    await load();
  }

  const visibleImage = imagePreview || existingImage;

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <small>ADMINISTRATION CREDESS</small>
        <h1>Services</h1>
        <p>Ajoutez les services visibles par les visiteurs. Le lien, l’ordre et l’adresse de la page sont gérés automatiquement.</p>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div><h2>{editingId ? "Modifier le service" : "Nouveau service"}</h2><p>Photo, nom et présentation du service.</p></div>
          {editingId && <button type="button" className={styles.secondary} onClick={reset}>Annuler</button>}
        </div>

        <form onSubmit={submit}>
          <div className={styles.photoPicker}>
            <div className={styles.photoPreview}>
              {visibleImage ? <img src={visibleImage} alt="Aperçu du service" /> : <span>Aucune image</span>}
            </div>
            <div>
              <label className={styles.fileButton}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
                {visibleImage ? "Changer l’image" : "+ Ajouter une image"}
              </label>
              <p style={{ color: "#777", fontSize: 11, lineHeight: 1.5 }}>La photo est compressée automatiquement avant Supabase.</p>
            </div>
          </div>

          <div className={styles.grid} style={{ marginTop: 20 }}>
            <label className={styles.field}><span>Nom du service *</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Construction" /></label>
            <label className={styles.field}><span>Visible sur le site</span><select value={published ? "yes" : "no"} onChange={(e) => setPublished(e.target.value === "yes")}><option value="yes">Publié</option><option value="no">Masqué</option></select></label>
            <label className={`${styles.field} ${styles.full}`}><span>Description courte</span><input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Résumé affiché sur la carte du service" /></label>
            <label className={`${styles.field} ${styles.full}`}><span>Description complète</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Expliquez clairement ce service..." /></label>
            <label className={`${styles.field} ${styles.full}`}><span>Message WhatsApp personnalisé (facultatif)</span><textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} placeholder="Bonjour CREDESS, je souhaite des informations sur..." /></label>
          </div>

          {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
          {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}
          <div className={styles.actions}><button className={styles.primary} disabled={saving}>{saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications →" : "Ajouter le service →"}</button></div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}><div><h2>Services enregistrés</h2><p>{rows.length} service(s)</p></div></div>
        {loading ? <div className={styles.empty}>Chargement...</div> : rows.length === 0 ? <div className={styles.empty}>Aucun service enregistré.</div> : (
          <div className={styles.list}>
            {rows.map((row) => (
              <article className={styles.row} key={row.id}>
                <div className={styles.rowMain}>
                  {row.image_url && <img src={row.image_url} alt="" style={{ width: 72, height: 54, objectFit: "cover" }} />}
                  <div className={styles.rowText}><span className={row.is_published ? styles.statusOn : styles.statusOff}>{row.is_published ? "PUBLIÉ" : "MASQUÉ"}</span><strong>{row.title}</strong><small>{row.short_description || "Aucune description courte"}</small></div>
                </div>
                <div className={styles.rowActions}><button className={styles.smallButton} onClick={() => edit(row)}>Modifier</button><button className={styles.smallButton} onClick={() => toggle(row)}>{row.is_published ? "Masquer" : "Publier"}</button><button className={styles.danger} onClick={() => remove(row)}>Supprimer</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
