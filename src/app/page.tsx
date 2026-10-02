"use client";
import { useCredessPublicData } from "@/hooks/useCredessPublicData";
import { whatsappUrl } from "@/lib/credess-links";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const {
    projects,
    services,
    team,
    stats,
    settings,
    pages,
  } = useCredessPublicData();

  const statsRef = useRef<HTMLElement | null>(null);
  const [started, setStarted] = useState(false);
  const [counts, setCounts] = useState<number[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const whatsappNumber = settings.whatsapp || settings.phone || "";
  const whatsappContact = whatsappUrl(
    whatsappNumber,
    "Bonjour CREDESS Construction, je souhaite vous contacter."
  );
  const companyName = settings.company_name || "CREDESS Construction";
  const location = settings.location || "Bukavu, Sud-Kivu";
  const phone = settings.phone || "";
  const email = settings.email || "";
  const copyright = settings.copyright || `© ${new Date().getFullYear()} CREDESS Construction`;
  const footerCredit = settings.footer_credit || "KrossNumérique";
  const heroServices = services.length > 0
    ? services.slice(0, 4).map((service) => service.title)
    : ["Construction", "Architecture", "Études techniques", "Ingénierie"];
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const target = statsRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [stats.length]);
  useEffect(() => {
    setCounts(stats.map(() => 0));
    setStarted(false);
  }, [stats]);

  useEffect(() => {
    if (!started || stats.length === 0) return;
    let frame = 0;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased =
        1 - Math.pow(1 - progress, 3);
      setCounts(
        stats.map((item) =>
          Math.round(item.value * eased)
        )
      );
      if (progress < 1) {
        frame =
          requestAnimationFrame(animate);
      }
    };
    frame =
      requestAnimationFrame(animate);
    return () =>
      cancelAnimationFrame(frame);
  }, [started, stats]);
  return (
    <main className="home3">
      {/* HEADER */}
      <header className="topbar">
        <Link href="/" className="logo">
          <span className="logoMark">
            <i />
            <i />
            <i />
          </span>
          <span className="logoText">
            <strong>CREDESS</strong>
            <small>CONSTRUCTION</small>
          </span>
        </Link>
        <nav className="desktopNav">
          <a href="#accueil">
            Accueil
          </a>
          <a href="#realisations">
            Réalisations
          </a>
          <Link href="/a-propos">
            À propos
          </Link>
          <Link href="/services">
            Services
          </Link>
          <a href="#contact">
            Contact
          </a>
        </nav>
        <button
  className={`hamburger ${menuOpen ? "isOpen" : ""}`}
  aria-label="Menu"
  aria-expanded={menuOpen}
  onClick={() => setMenuOpen(!menuOpen)}
>
  <span />
  <span />
  <span />
</button>
      </header>
      {/* HERO */}
      <section
        className="home3-hero"
        id="accueil"
      >
        <Image
          src="/images/projets/credess-05.png"
          alt="CREDESS Construction"
          fill
          priority
          className="home3-heroImage"
        />
        <div className="home3-heroOverlay" />
        <div className="home3-heroContent">
          <div className="home3-categories">
            {heroServices.map((service, index) => (
              <span key={service}>
                {index > 0 && <b>•</b>}
                <span>{service.toUpperCase()}</span>
              </span>
            ))}
          </div>
          <div className="home3-heroSpace" />
          <div className="home3-heroButtons">
  <Link
    href="/projets"
    className="heroSecondaryButton"
  >
    <span>Nos projets</span>
    <b>→</b>
  </Link>
  <Link
    href="/devis"
    className="heroMainQuote"
  >
    Demander un devis
    <span>→</span>
  </Link>
  <a
    href={whatsappContact}
    target="_blank"
    rel="noopener noreferrer"
    className="heroSecondaryButton heroContactButton"
  >
    <span>Nous contacter</span>
    <b>→</b>
  </a>
</div>
        </div>
      </section>
      {/* REALISATIONS */}
      <section
        className="home3-projectsSection"
        id="realisations"
      >
        <div className="home3-sectionTitle">
          <strong>
            NOS RÉALISATIONS
          </strong>
        </div>
        <div className="home3-projectsGrid">
          {projects
            .slice(0, 2)
            .map((project) => (
              <Link
                href={`/projets/${project.slug}`}
                className="home3-projectCard"
                key={project.slug}
              >
                <div className="home3-projectImageBox">
                  {project.cover_url ? (
                    <img
                      src={project.cover_url}
                      alt={project.title}
                      className="home3-projectImageReal"
                    />
                  ) : (
                    <div className="home3-projectImageFallback">
                      CREDESS
                    </div>
                  )}
                  <div className="home3-projectShade" />
                  <span className="home3-viewProject">
                    Voir le projet
                    <b>↗</b>
                  </span>
                </div>
                <div className="home3-projectInfo">
                  <small>
                    {project.category}
                  </small>
                  <h2>
                    {project.title}
                  </h2>
                  <p>
                    {project.location}
                  </p>
                </div>
              </Link>
            ))}
        </div>
        <div className="viewAllWrapper">
          <Link
            href="/projets"
            className="viewAllProjects"
          >
            Voir tous les projets
            <span>→</span>
          </Link>
        </div>
      </section>
      {/* STATISTIQUES — Supabase */}
      {stats.length > 0 && (
        <section
          className="home3-stats"
          ref={statsRef}
        >
          <div className="home3-statsInner">
            {stats.map((item, index) => (
              <article
                className="home3-statCard"
                key={item.id || item.stat_key}
              >
                <strong>
                  {counts[index] ?? 0}
                  {item.suffix || ""}
                </strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* EQUIPE — Supabase */}
      {team.length > 0 && (
        <section className="home3-team" id="equipe">
          <div className="home3-sectionTitle">
            <strong>NOTRE ÉQUIPE</strong>
          </div>
          <div className="home3-teamGrid">
            {team.map((member) => {
              const initials = (member.name || "?")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("");

              return (
                <article className="home3-teamCard" key={member.id}>
                  <div className="home3-teamCircle">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} />
                    ) : (
                      initials
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {/* LIENS IMPORTANTS */}
      {/* CONTACT */}
      <section
        className="home3-contact"
        id="contact"
      >
        <small>
          VOUS AVEZ UN PROJET ?
        </small>
        <h2>
          Parlons de votre construction.
        </h2>
        <div className="home3-contactButtons">
          <a
  href={whatsappContact}
  target="_blank"
  rel="noopener noreferrer"
  className="home3WhatsappButton"
>
  <strong>Nous contacter sur WhatsApp</strong>
  <b>→</b>
</a>
        </div>
      </section>
      {/* FOOTER */}
      <footer className="compactFooter">
  <div className="compactFooterBrand">
    <strong>{companyName}</strong>
    <span>
      Construction • Architecture • Études techniques • Ingénierie
    </span>
  </div>
  <nav className="compactFooterLinks">
    <Link href="/a-propos">
      À propos
    </Link>
    <Link href="/services">
      Nos services
    </Link>
    <Link href="/projets">
      Réalisations
    </Link>
    {pages.privacy?.length > 0 && (
      <Link href="/confidentialite">Confidentialité</Link>
    )}
    {pages.legal?.length > 0 && (
      <Link href="/mentions-legales">Mentions légales</Link>
    )}
    {pages.terms?.length > 0 && (
      <Link href="/conditions-utilisation">Conditions d’utilisation</Link>
    )}
  </nav>
  <div
    className="compactFooterContact"
    id="footer-contacts"
  >
    <span>{location}</span>
    {phone && (
      <>
        <i>•</i>
        <a href={`tel:${phone}`}>{phone}</a>
      </>
    )}
    {email && (
      <>
        <i>•</i>
        <a href={`mailto:${email}`}>{email}</a>
      </>
    )}
  </div>
  <div className="compactFooterBottom">
    <span>{copyright}</span>
    <span className="designedBy">
      Conçu par
      <strong>{footerCredit}</strong>
    </span>
  </div>
</footer>
                {menuOpen && (
        <div className="mobileMenuOverlay">
          <div className="mobileMenuHeader">
            <Link
              href="/"
              className="logo"
              onClick={() => setMenuOpen(false)}
            >
              <span className="logoMark">
                <i />
                <i />
                <i />
              </span>
              <span className="logoText">
                <strong>CREDESS</strong>
                <small>CONSTRUCTION</small>
              </span>
            </Link>
            <button
              className="mobileMenuClose"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              ×
            </button>
          </div>
          <nav className="mobileMenuNav">
            <a
              href="#accueil"
              onClick={() => setMenuOpen(false)}
            >
              <span>01</span>
              <strong>Accueil</strong>
              <b>→</b>
            </a>
            <a
              href="#realisations"
              onClick={() => setMenuOpen(false)}
            >
              <span>02</span>
              <strong>Nos réalisations</strong>
              <b>→</b>
            </a>
            <Link
              href="/services"
              onClick={() => setMenuOpen(false)}
            >
              <span>03</span>
              <strong>Nos services</strong>
              <b>→</b>
            </Link>
            <Link
              href="/a-propos"
              onClick={() => setMenuOpen(false)}
            >
              <span>04</span>
              <strong>À propos de CREDESS</strong>
              <b>→</b>
            </Link>
            <a
              href="#equipe"
              onClick={() => setMenuOpen(false)}
            >
              <span>05</span>
              <strong>Notre équipe</strong>
              <b>→</b>
            </a>
            <Link
              href="/projets"
              onClick={() => setMenuOpen(false)}
            >
              <span>06</span>
              <strong>Nos autres projets</strong>
              <b>→</b>
            </Link>
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
            >
              <span>07</span>
              <strong>Contact</strong>
              <b>→</b>
            </a>
          </nav>
          <div className="mobileMenuActions">
            <a
              href="/devis" className="mobileMenuQuote"
              onClick={() => setMenuOpen(false)}
            >
              Demander un devis
              <span>→</span>
            </a>
            <a
  href={whatsappContact}
  target="_blank"
  rel="noopener noreferrer"
  className="mobileMenuWhatsapp"
>
  <span className="mobileWaIcon">W</span>
  <span className="mobileWaText">
    <small>WHATSAPP</small>
    <strong>Discuter avec CREDESS</strong>
  </span>
  <b>→</b>
</a>
          </div>
        </div>
      )}      {showBackToTop && (
        <button
          className="backToTop"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          aria-label="Retour en haut"
        >
          ↑
        </button>
      )}
    </main>
  );
}