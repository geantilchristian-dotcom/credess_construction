"use client";

import Link from "next/link";
import { useCredessPublicData } from "@/hooks/useCredessPublicData";

const fallback = `CREDESS Construction est une entreprise spécialisée dans la construction, l'architecture, les études techniques et l'ingénierie.

Nous accompagnons nos clients depuis la conception de leur projet jusqu'à sa réalisation, avec une attention particulière portée à la qualité, à la fiabilité des travaux, au respect des choix du client et au suivi de chaque étape.

Notre approche repose sur une organisation professionnelle, une vision moderne de la construction et la recherche de solutions adaptées aux réalités de chaque projet.`;

export default function AboutPage() {
  const { pages } = useCredessPublicData();
  const section = (pages.about || [])[0];
  const title = section?.title || "À propos de nous";
  const content = section?.content || fallback;
  const paragraphs = content.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);

  return (
    <main className="innerPage">
      <header className="detailHeader">
        <Link href="/" className="logo">
          <span className="logoMark"><i /><i /><i /></span>
          <span className="logoText"><strong>CREDESS</strong><small>CONSTRUCTION</small></span>
        </Link>
        <Link href="/" className="backButton">← Accueil</Link>
      </header>

      <section className="aboutSimple">
        <h1>{title}</h1>
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <div className="aboutSimpleLinks">
          <Link href="/mission">Notre mission <span>→</span></Link>
          <Link href="/engagement">Notre engagement <span>→</span></Link>
        </div>
      </section>
    </main>
  );
}
