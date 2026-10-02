import PageContentManager from "@/components/admin/PageContentManager";

const about = `CREDESS Construction est une entreprise spécialisée dans la construction, l'architecture, les études techniques et l'ingénierie.\n\nNous accompagnons nos clients depuis la conception de leur projet jusqu'à sa réalisation, avec une attention particulière portée à la qualité, à la fiabilité des travaux, au respect des choix du client et au suivi de chaque étape.\n\nNotre approche repose sur une organisation professionnelle, une vision moderne de la construction et la recherche de solutions adaptées aux réalités de chaque projet.`;
const mission = `La mission de CREDESS Construction est d'accompagner chaque client dans la transformation de son idée en un projet concret, réalisable et durable.\n\nNous réunissons la conception architecturale, les études techniques, l'ingénierie, le suivi et la construction afin d'assurer une meilleure continuité entre les différentes étapes d'un projet.`;
const engagement = `CREDESS Construction s'engage à assurer un suivi sérieux de chaque projet et à maintenir une communication claire avec le client durant les différentes étapes des travaux.\n\nNous accordons une importance particulière à la qualité des réalisations, au respect des choix validés et à la précision technique.`;

export default function AboutAdminPage() {
  return <PageContentManager
    title="À propos"
    description="Modifiez ici les textes À propos, Mission et Engagement. Aucun code technique à saisir."
    entries={[
      { pageKey: "about", label: "À propos de CREDESS", defaultTitle: "À propos de nous", defaultContent: about, allowPublish: false },
      { pageKey: "mission", label: "Notre mission", defaultTitle: "Notre mission", defaultContent: mission, allowPublish: false },
      { pageKey: "engagement", label: "Notre engagement", defaultTitle: "Notre engagement", defaultContent: engagement, allowPublish: false },
    ]}
  />;
}
