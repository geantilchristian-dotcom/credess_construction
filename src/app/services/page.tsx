"use client";

import Link from "next/link";
import { useCredessPublicData } from "@/hooks/useCredessPublicData";

export default function ServicesPage() {
  const { services, loading, error } = useCredessPublicData();

  return (
    <main className="servicesCatalog">
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

      <section className="servicesCatalogIntro">
        <h1>Nos services</h1>
        <p>Découvrez les différents domaines d&apos;intervention de CREDESS Construction.</p>
      </section>

      {loading ? (
        <div className="credessPublicState">Chargement des services...</div>
      ) : error ? (
        <div className="credessPublicState">Impossible de charger les services.</div>
      ) : services.length === 0 ? (
        <div className="credessPublicState">Aucun service publié pour le moment.</div>
      ) : (
        <section className="servicesCatalogGrid">
          {services.map((service) => (
            <Link
              href={`/services/${service.slug}`}
              className="serviceVisualCard"
              key={service.id}
            >
              <div className="serviceVisualImage">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.title} />
                ) : (
                  <div className="serviceImageFallback">CREDESS</div>
                )}
                <div className="serviceVisualShade" />
                <span className="serviceVisualOpen">
                  Voir le service <b>→</b>
                </span>
              </div>
              <div className="serviceVisualInfo">
                <h2>{service.title}</h2>
                <p>{service.short_description || ""}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
