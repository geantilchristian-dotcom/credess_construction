import PublicTextPage from "@/components/public/PublicTextPage";

const fallback = `La mission de CREDESS Construction est d'accompagner chaque client dans la transformation de son idée en un projet concret, réalisable et durable.

Nous réunissons la conception architecturale, les études techniques, l'ingénierie, le suivi et la construction afin d'assurer une meilleure continuité entre les différentes étapes d'un projet.

Notre objectif est de proposer des solutions adaptées au besoin réel du client, au terrain, au budget disponible et aux exigences techniques de l'ouvrage.`;

export default function MissionPage() {
  return <PublicTextPage pageKey="mission" fallbackTitle="Notre mission" fallbackContent={fallback} label="À PROPOS" backHref="/a-propos" backLabel="À propos" />;
}
