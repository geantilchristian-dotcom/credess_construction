"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCredessPublicData } from "@/hooks/useCredessPublicData";
import { whatsappUrl } from "@/lib/credess-links";

export default function ServiceDetailPage() {
  const params = useParams<{ slug: string }>();
  const { services, settings, loading } = useCredessPublicData();
  const service = services.find((item) => item.slug === params.slug);

  if (loading) {
    return <main className="serviceDetailPage"><div className="credessPublicState">Chargement...</div></main>;
  }

  if (!service) {
    return (
      <main className="serviceDetailPage">
        <header className="detailHeader">
          <Link href="/" className="logo">
            <span className="logoMark"><i /><i /><i /></span>
            <span className="logoText"><strong>CREDESS</strong><small>CONSTRUCTION</small></span>
          </Link>
          <Link href="/services" className="backButton">← Services</Link>
        </header>
        <div className="credessPublicState">Ce service n&apos;est pas disponible.</div>
      </main>
    );
  }

  const whatsapp = settings.whatsapp || settings.phone || "";
  const message = service.whatsapp_message ||
    `Bonjour CREDESS Construction, je souhaite obtenir des informations concernant le service : ${service.title}.`;

  return (
    <main className="serviceDetailPage">
      <header className="detailHeader">
        <Link href="/" className="logo">
          <span className="logoMark"><i /><i /><i /></span>
          <span className="logoText"><strong>CREDESS</strong><small>CONSTRUCTION</small></span>
        </Link>
        <Link href="/services" className="backButton">← Services</Link>
      </header>

      <section className="serviceDetailHero">
        {service.image_url ? (
          <img src={service.image_url} alt={service.title} />
        ) : (
          <div className="serviceDetailFallback">CREDESS</div>
        )}
        <div className="serviceDetailShade" />
        <div className="serviceDetailTitle">
          <small>NOS SERVICES</small>
          <h1>{service.title}</h1>
          {service.short_description && <p>{service.short_description}</p>}
        </div>
      </section>

      <section className="serviceDetailContent">
        <small>CREDESS CONSTRUCTION</small>
        <h2>{service.title}</h2>
        <p>{service.description || service.short_description || "Informations à compléter."}</p>

        <div className="serviceDetailActions">
          <Link href="/devis">Demander un devis <span>→</span></Link>
          {whatsapp && (
            <a
              href={whatsappUrl(whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nous contacter sur WhatsApp <span>→</span>
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
