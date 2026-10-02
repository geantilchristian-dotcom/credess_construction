import PublicTextPage from "@/components/public/PublicTextPage";

const fallback = `CREDESS Construction s'engage à assurer un suivi sérieux de chaque projet et à maintenir une communication claire avec le client durant les différentes étapes des travaux.

Nous accordons une importance particulière à la qualité des réalisations, au respect des choix validés, à la précision technique et à l'utilisation responsable des ressources du projet.

Notre engagement est également de rechercher des solutions modernes, fonctionnelles et durables afin que chaque réalisation conserve sa valeur dans le temps.`;

export default function EngagementPage() {
  return <PublicTextPage pageKey="engagement" fallbackTitle="Notre engagement" fallbackContent={fallback} label="À PROPOS" backHref="/a-propos" backLabel="À propos" />;
}
