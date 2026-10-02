"use client";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  compressProjectImage,
  formatImageSize,
} from "@/lib/compress-image";
import styles from
  "@/app/admin/projets/projects.module.css";
type Project = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  location: string | null;
  project_type: string | null;
  status: string | null;
  year: number | null;
  client_name: string | null;
  surface: string | null;
  description: string | null;
  cover_url: string | null;
  is_published: boolean;
  sort_order: number;
};
type Props = {
  projectId?: string;
};
const initialForm = {
  title: "",
  slug: "",
  category: "",
  location: "",
  project_type: "",
  status: "Réalisé",
  year:
    new Date()
      .getFullYear()
      .toString(),
  client_name: "",
  surface: "",
  description: "",
  is_published: true,
};
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}
function storagePathFromUrl(
  url: string | null
) {
  if (!url) return null;
  const marker =
    "/storage/v1/object/public/projects/";
  if (!url.includes(marker)) {
    return null;
  }
  return decodeURIComponent(
    url.split(marker)[1]
  );
}
export default function ProjectEditor({
  projectId,
}: Props) {
  const router = useRouter();
  const editing =
    Boolean(projectId);
  const [project, setProject] =
    useState<Project | null>(null);
  const [form, setForm] =
    useState(initialForm);
  const [cover, setCover] =
    useState<File | null>(null);
  const [compressionInfo, setCompressionInfo] =
    useState("");
  const [compressing, setCompressing] =
    useState(false);
  const [loading, setLoading] =
    useState(editing);
  const [saving, setSaving] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);
  const [error, setError] =
    useState("");
  const [message, setMessage] =
    useState("");
  useEffect(() => {
    initialise();
  }, [projectId]);
  async function initialise() {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();
    if (!user) {
      router.replace(
        "/admin/login"
      );
      return;
    }
    const { data: isAdmin } =
      await supabase.rpc(
        "is_admin"
      );
    if (!isAdmin) {
      await supabase.auth.signOut();
      router.replace(
        "/admin/login"
      );
      return;
    }
    if (
      projectId
    ) {
      await loadProject(
        projectId
      );
    }
    setLoading(false);
  }
  async function loadProject(
    id: string
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
    if (error || !data) {
      setError(
        "Projet introuvable."
      );
      return;
    }
    const p =
      data as Project;
    setProject(p);
    setForm({
      title:
        p.title || "",
      slug:
        p.slug || "",
      category:
        p.category || "",
      location:
        p.location || "",
      project_type:
        p.project_type || "",
      status:
        p.status || "Réalisé",
      year:
        p.year
          ? String(p.year)
          : "",
      client_name:
        p.client_name || "",
      surface:
        p.surface || "",
      description:
        p.description || "",
      is_published:
        p.is_published,
    });
  }
  function update(
    key: keyof typeof initialForm,
    value: string | boolean
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
    if (
      key === "title" &&
      !editing
    ) {
      setForm(
        (previous) => ({
          ...previous,
          title:
            String(value),
          slug:
            slugify(
              String(value)
            ),
        })
      );
    }
  }
  async function uploadCover() {
    if (!cover) {
      return (
        project?.cover_url ||
        null
      );
    }
    const extension =
      cover.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";
    const filePath =
      `covers/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;
    const {
      error,
    } =
      await supabase.storage
        .from("projects")
        .upload(
          filePath,
          cover,
          {
            upsert: false,
            cacheControl: "3600",
          }
        );
    if (error) {
      throw error;
    }
    const {
      data,
    } =
      supabase.storage
        .from("projects")
        .getPublicUrl(
          filePath
        );
    return data.publicUrl;
  }
  async function save(
    event: FormEvent
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const previousCover =
        project?.cover_url ||
        null;
      const coverUrl =
        await uploadCover();
      const payload = {
        title:
          form.title.trim(),
        slug:
          slugify(
            form.slug ||
            form.title
          ),
        category:
          form.category.trim() ||
          null,
        location:
          form.location.trim() ||
          null,
        project_type:
          form.project_type.trim() ||
          null,
        status:
          form.status ||
          "Réalisé",
        year:
          form.year
            ? Number(
                form.year
              )
            : null,
        client_name:
          form.client_name.trim() ||
          null,
        surface:
          form.surface.trim() ||
          null,
        description:
          form.description.trim() ||
          null,
        cover_url:
          coverUrl,
        is_published:
          form.is_published,
        updated_at:
          new Date().toISOString(),
      };
      if (
        projectId
      ) {
        const {
          error,
        } =
          await supabase
            .from("projects")
            .update(payload)
            .eq(
              "id",
              projectId
            );
        if (error) {
          throw error;
        }
        if (
          cover &&
          previousCover
        ) {
          const oldPath =
            storagePathFromUrl(
              previousCover
            );
          if (oldPath) {
            await supabase.storage
              .from("projects")
              .remove([
                oldPath,
              ]);
          }
        }
        setMessage(
          "Projet modifié avec succès."
        );
        await loadProject(
          projectId
        );
        setCover(null);
      } else {
        const {
          data: maxData,
        } =
          await supabase
            .from("projects")
            .select(
              "sort_order"
            )
            .order(
              "sort_order",
              {
                ascending:
                  false,
              }
            )
            .limit(1);
        const nextOrder =
          (maxData?.[0]
            ?.sort_order ||
            0) + 1;
        const {
          data,
          error,
        } =
          await supabase
            .from("projects")
            .insert({
              ...payload,
              sort_order:
                nextOrder,
            })
            .select("id")
            .single();
        if (error) {
          throw error;
        }
        router.replace(
          `/admin/projets/${data.id}`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }
  async function removeProject() {
    if (
      !projectId ||
      !project
    ) {
      return;
    }
    const firstConfirm =
      window.confirm(
        `Supprimer "${project.title}" ?`
      );
    if (!firstConfirm) {
      return;
    }
    const secondConfirm =
      window.confirm(
        "Cette action supprimera définitivement ce projet de la base de données. Continuer ?"
      );
    if (!secondConfirm) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      const coverPath =
        storagePathFromUrl(
          project.cover_url
        );
      /*
       * Suppression réelle
       * de la ligne Supabase.
       */
      const {
        error,
      } =
        await supabase
          .from("projects")
          .delete()
          .eq(
            "id",
            projectId
          );
      if (error) {
        throw error;
      }
      /*
       * On supprime aussi
       * la couverture si elle
       * se trouve dans Storage.
       */
      if (coverPath) {
        await supabase.storage
          .from("projects")
          .remove([
            coverPath,
          ]);
      }
      router.replace(
        "/admin/projets"
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le projet."
      );
      setDeleting(false);
    }
  }
  if (loading) {
    return (
      <main
        className={
          styles.loading
        }
      >
        Chargement du projet...
      </main>
    );
  }
  return (
    <main
      className={
        styles.editorPage
      }
    >
      <header
        className={
          styles.editorHeader
        }
      >
        <div>
          <Link
            href="/admin/projets"
            className={
              styles.back
            }
          >
            ← Retour aux projets
          </Link>
          <small>
            {editing
              ? "MODIFICATION DU PROJET"
              : "NOUVEAU PROJET"}
          </small>
          <h1>
            {editing
              ? form.title ||
                "Projet"
              : "Ajouter un projet"}
          </h1>
        </div>
        {project?.slug && (
          <Link
            href={
              `/projets/${project.slug}`
            }
            target="_blank"
            className={
              styles.publicLink
            }
          >
            Voir sur le site ↗
          </Link>
        )}
      </header>
      <form
        onSubmit={save}
        className={
          styles.editorForm
        }
      >
        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <span>
              01
            </span>
            <div>
              <h2>
                Informations principales
              </h2>
              <p>
                Informations affichées
                sur le site.
              </p>
            </div>
          </div>
          <div
            className={
              styles.fields
            }
          >
            <label
              className={
                styles.full
              }
            >
              Nom du projet *
              <input
                required
                value={
                  form.title
                }
                onChange={
                  (e) =>
                    update(
                      "title",
                      e.target.value
                    )
                }
              />
            </label>
            <label>
              Slug / URL *
              <input
                required
                value={
                  form.slug
                }
                onChange={
                  (e) =>
                    update(
                      "slug",
                      e.target.value
                    )
                }
              />
            </label>
            <label>
              Catégorie
              <input
                value={
                  form.category
                }
                onChange={
                  (e) =>
                    update(
                      "category",
                      e.target.value
                    )
                }
                placeholder="Architecture • Construction"
              />
            </label>
            <label>
              Type de projet
              <input
                value={
                  form.project_type
                }
                onChange={
                  (e) =>
                    update(
                      "project_type",
                      e.target.value
                    )
                }
                placeholder="Villa résidentielle"
              />
            </label>
            <label>
              Localisation
              <input
                value={
                  form.location
                }
                onChange={
                  (e) =>
                    update(
                      "location",
                      e.target.value
                    )
                }
                placeholder="Bukavu, Sud-Kivu"
              />
            </label>
            <label>
              Statut
              <select
                value={
                  form.status
                }
                onChange={
                  (e) =>
                    update(
                      "status",
                      e.target.value
                    )
                }
              >
                <option>
                  Réalisé
                </option>
                <option>
                  En cours
                </option>
                <option>
                  Planifié
                </option>
              </select>
            </label>
            <label>
              Année
              <input
                type="number"
                value={
                  form.year
                }
                onChange={
                  (e) =>
                    update(
                      "year",
                      e.target.value
                    )
                }
              />
            </label>
            <label>
              Surface
              <input
                value={
                  form.surface
                }
                onChange={
                  (e) =>
                    update(
                      "surface",
                      e.target.value
                    )
                }
                placeholder="450 m²"
              />
            </label>
            <label>
              Client
              <input
                value={
                  form.client_name
                }
                onChange={
                  (e) =>
                    update(
                      "client_name",
                      e.target.value
                    )
                }
                placeholder="Client privé"
              />
            </label>
            <label
              className={
                styles.full
              }
            >
              Description
              <textarea
                value={
                  form.description
                }
                onChange={
                  (e) =>
                    update(
                      "description",
                      e.target.value
                    )
                }
              />
            </label>
          </div>
        </section>
        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <span>
              02
            </span>
            <div>
              <h2>
                Photo de couverture
              </h2>
              <p>
                Image principale du projet.
              </p>
            </div>
          </div>
          {project?.cover_url && (
            <div
              className={
                styles.coverPreview
              }
              style={{
                backgroundImage:
                  `url("${project.cover_url}")`,
              }}
            />
          )}
          <label
            className={
              styles.upload
            }
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                (
                  event:
                    ChangeEvent<HTMLInputElement>
                ) =>
                  setCover(
                    event.target
                      .files?.[0] ||
                    null
                  )
              }
            />
            <strong>
              + Choisir une image
            </strong>
            <span>
              JPG, PNG ou WEBP
            </span>
            {cover && (
              <b>
                {cover.name}
              </b>
            )}
          </label>
        </section>
        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <span>
              03
            </span>
            <div>
              <h2>
                Publication
              </h2>
              <p>
                Contrôlez la visibilité.
              </p>
            </div>
          </div>
          <label
            className={
              styles.publishSwitch
            }
          >
            <input
              type="checkbox"
              checked={
                form.is_published
              }
              onChange={
                (e) =>
                  update(
                    "is_published",
                    e.target.checked
                  )
              }
            />
            <div>
              <strong>
                Publier ce projet
              </strong>
              <span>
                Il sera visible
                sur le site public.
              </span>
            </div>
          </label>
        </section>
        {error && (
          <div
            className={
              styles.error
            }
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className={
              styles.success
            }
          >
            {message}
          </div>
        )}
        <div
          className={
            styles.saveArea
          }
        >
          <Link
            href="/admin/projets"
          >
            Annuler
          </Link>
          <button
            disabled={
              saving
            }
          >
            {saving
              ? "Enregistrement..."
              : editing
              ? "Enregistrer les modifications"
              : "Créer le projet"}
            <span>
              →
            </span>
          </button>
        </div>
      </form>
      {editing && (
        <section
          className={
            styles.dangerZone
          }
        >
          <div>
            <small>
              ZONE DANGEREUSE
            </small>
            <h2>
              Supprimer ce projet
            </h2>
            <p>
              Le projet sera supprimé
              définitivement de Supabase
              et ne sera plus disponible
              sur le site.
            </p>
          </div>
          <button
            type="button"
            onClick={
              removeProject
            }
            disabled={
              deleting
            }
          >
            {deleting
              ? "Suppression..."
              : "Supprimer définitivement"}
          </button>
        </section>
      )}
    </main>
  );
}