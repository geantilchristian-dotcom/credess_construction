import PageContentManager from "@/components/admin/PageContentManager";

export default function LegalPagesAdminPage() {
  return <PageContentManager
    title="Pages légales"
    description="Gérez uniquement les textes officiels affichés aux visiteurs. Les adresses techniques sont gérées automatiquement."
    entries={[
      { pageKey: "privacy", label: "Politique de confidentialité", defaultTitle: "Politique de confidentialité", defaultContent: "Présentez ici la manière dont CREDESS Construction traite les informations transmises par les visiteurs." },
      { pageKey: "legal", label: "Mentions légales", defaultTitle: "Mentions légales", defaultContent: "Ajoutez ici les informations légales et administratives de CREDESS Construction." },
      { pageKey: "terms", label: "Conditions d’utilisation", defaultTitle: "Conditions d’utilisation", defaultContent: "Ajoutez ici les conditions applicables à l'utilisation du site et de ses services." },
    ]}
  />;
}
