"use client";

import Link from "next/link";
import { useCredessPublicData } from "@/hooks/useCredessPublicData";

export default function ProjectsPage() {
  const { projects, loading, error } = useCredessPublicData();

  return (
    <main className="allProjectsPage">
      <header className="detailHeader">
        <Link href="/" className="logo">
          <span className="logoMark"><i /><i /><i /></span>
          <span className="logoText">
            <strong>CREDESS</strong>
            <small>CONSTRUCTION</small>
          </span>
        </Link>
        <Link href="/" className="backButton">← Accueil</Link>
      </header>

      <section className="allProjectsIntro">
        <small>NOS RÉALISATIONS</small>
      </section>

      {loading ? (
        <div className="credessPublicState">Chargement des réalisations...</div>
      ) : error ? (
        <div className="credessPublicState">Impossible de charger les réalisations.</div>
      ) : projects.length === 0 ? (
        <div className="credessPublicState">Aucune réalisation publiée pour le moment.</div>
      ) : (
        <section className="allProjectsGrid">
          {projects.map((project) => (
            <Link
              href={`/projets/${project.slug}`}
              className="projectCard"
              key={project.id}
            >
              <div className="projectImageBox">
                {project.cover_url ? (
                  <img
                    src={project.cover_url}
                    alt={project.title}
                    className="projectImage"
                  />
                ) : (
                  <div className="home3-projectImageFallback">CREDESS</div>
                )}
                <div className="projectShade" />
                <span className="viewProject">
                  Voir le projet <b>↗</b>
                </span>
              </div>
              <div className="projectInfo">
                <small>{project.category || "Réalisation"}</small>
                <h2>{project.title}</h2>
                <p>{project.location || ""}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
