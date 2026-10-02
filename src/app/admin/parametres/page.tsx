import SiteSettingsManager from "@/components/admin/SiteSettingsManager";
export default function SettingsAdminPage() {
  return <SiteSettingsManager
    title="Paramètres du site"
    description="Nom de l'entreprise et informations générales du pied de page."
    fields={[
      { key: "company_name", label: "Nom de l'entreprise", placeholder: "CREDESS Construction" },
      { key: "copyright", label: "Copyright", placeholder: "© 2026 CREDESS Construction" },
      { key: "footer_credit", label: "Conception du site", placeholder: "KrossNumérique" },
    ]}
  />;
}
