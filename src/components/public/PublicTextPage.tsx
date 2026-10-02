"use client";

import Link from "next/link";
import { useCredessPublicData } from "@/hooks/useCredessPublicData";

type Props = {
  pageKey: string;
  fallbackTitle: string;
  fallbackContent: string;
  label?: string;
  backHref?: string;
  backLabel?: string;
};

export default function PublicTextPage({
  pageKey,
  fallbackTitle,
  fallbackContent,
  label = "CREDESS CONSTRUCTION",
  backHref = "/",
  backLabel = "Accueil",
}: Props) {
  const { pages, loading } = useCredessPublicData();
  const section = (pages[pageKey] || [])[0];
  const title = section?.title || fallbackTitle;
  const content = section?.content || fallbackContent;
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <main className="innerPage">
      <header className="detailHeader">
        <Link href="/" className="logo">
          <span className="logoMark"><i /><i /><i /></span>
          <span className="logoText"><strong>CREDESS</strong><small>CONSTRUCTION</small></span>
        </Link>
        <Link href={backHref} className="backButton">← {backLabel}</Link>
      </header>

      <section className="textDetailPage">
        <span className="textDetailLabel">{label}</span>
        <h1>{loading && !section ? fallbackTitle : title}</h1>
        {paragraphs.map((paragraph, index) => (
          <p key={`${pageKey}-${index}`}>{paragraph}</p>
        ))}
      </section>
    </main>
  );
}
