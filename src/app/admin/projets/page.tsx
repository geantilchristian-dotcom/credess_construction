"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./projects.module.css";
type Project = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  location: string | null;
  status: string | null;
  year: number | null;
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
};
export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] =
    useState<"all" | "published" | "hidden">("all");
  useEffect(() => {
    initialise();
  }, []);
  async function initialise() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    const { data: isAdmin } =
      await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      router.replace("/admin/login");
      return;
    }
    await loadProjects();
  }
  async function loadProjects() {
    setLoading(true);
    const { data, error } =
      await supabase
        .from("projects")
        .select(`
          id,
          title,
          slug,
          category,
          location,
          status,
          year,
          cover_url,
          is_published,
          created_at
        `)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: false,
        });
    if (error) {
      console.error(error);
      setProjects([]);
    } else {
      setProjects(
        (data || []) as Project[]
      );
    }
    setLoading(false);
  }
  const visibleProjects =
    projects.filter((project) => {
      if (filter === "published") {
        return project.is_published;
      }
      if (filter === "hidden") {
        return !project.is_published;
      }
      return true;
    });
  const publishedCount =
    projects.filter(
      (project) =>
        project.is_published
    ).length;
  const hiddenCount =
    projects.length -
    publishedCount;
  if (loading) {
    return (
      <main className={styles.loading}>
        Chargement des projets...
      </main>
    );
  }
  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <Link
            href="/admin"
            className={styles.back}
          >
            ← Administration
          </Link>
          <small>
            CREDESS CONSTRUCTION
          </small>
          <h1>
            Réalisations
          </h1>
          <p>
            Gérez les projets publiés
            sur le site CREDESS.
          </p>
        </div>
        <Link
          href="/admin/projets/nouveau"
          className={styles.newProject}
        >
          <span>＋</span>
          Nouveau projet
        </Link>
      </header>
      <section className={styles.statistics}>
        <button
          className={
            filter === "all"
              ? styles.statActive
              : ""
          }
          onClick={() =>
            setFilter("all")
          }
        >
          <span>
            TOUS LES PROJETS
          </span>
          <strong>
            {projects.length}
          </strong>
        </button>
        <button
          className={
            filter === "published"
              ? styles.statActive
              : ""
          }
          onClick={() =>
            setFilter("published")
          }
        >
          <span>
            PUBLIÉS
          </span>
          <strong>
            {publishedCount}
          </strong>
        </button>
        <button
          className={
            filter === "hidden"
              ? styles.statActive
              : ""
          }
          onClick={() =>
            setFilter("hidden")
          }
        >
          <span>
            MASQUÉS
          </span>
          <strong>
            {hiddenCount}
          </strong>
        </button>
      </section>
      <section className={styles.listSection}>
        <div className={styles.listTitle}>
          <div>
            <small>
              BASE DE DONNÉES
            </small>
            <h2>
              {filter === "published"
                ? "Projets publiés"
                : filter === "hidden"
                ? "Projets masqués"
                : "Tous les projets"}
            </h2>
          </div>
          <button
            onClick={loadProjects}
            className={styles.refresh}
          >
            Actualiser
          </button>
        </div>
        {visibleProjects.length === 0 ? (
          <div className={styles.empty}>
            <strong>
              Aucun projet dans cette liste.
            </strong>
            <p>
              Les projets actuellement visibles
              sur le site mais encore stockés
              localement devront être importés
              dans Supabase.
            </p>
            <Link
              href="/admin/projets/nouveau"
            >
              + Ajouter le premier projet
            </Link>
          </div>
        ) : (
          <div className={styles.projectList}>
            {visibleProjects.map(
              (project) => (
                <Link
                  href={
                    `/admin/projets/${project.id}`
                  }
                  className={styles.projectCard}
                  key={project.id}
                >
                  <div
                    className={styles.cover}
                    style={
                      project.cover_url
                        ? {
                            backgroundImage:
                              `url("${project.cover_url}")`,
                          }
                        : undefined
                    }
                  >
                    {!project.cover_url && (
                      <span>
                        CREDESS
                      </span>
                    )}
                  </div>
                  <div className={styles.projectContent}>
                    <div
                      className={
                        project.is_published
                          ? styles.statusPublished
                          : styles.statusHidden
                      }
                    >
                      {project.is_published
                        ? "PUBLIÉ"
                        : "MASQUÉ"}
                    </div>
                    <h3>
                      {project.title}
                    </h3>
                    <p>
                      {project.category ||
                        "Sans catégorie"}
                    </p>
                    <div
                      className={
                        styles.projectMeta
                      }
                    >
                      <span>
                        {project.location ||
                          "Localisation non renseignée"}
                      </span>
                      {project.year && (
                        <span>
                          {project.year}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={
                      styles.openProject
                    }
                  >
                    <span>
                      Ouvrir
                    </span>
                    <b>
                      →
                    </b>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}