import SiteSettingsManager from "@/components/admin/SiteSettingsManager";
export default function CoordinatesPage() {
  return <SiteSettingsManager
    title="Coordonnées"
    description="Ces informations alimentent automatiquement WhatsApp, le téléphone, l'e-mail et l'adresse du site."
    fields={[
      { key: "location", label: "Adresse / localisation", placeholder: "Ex. Bukavu, Sud-Kivu" },
      { key: "phone", label: "Téléphone", placeholder: "+243..." },
      { key: "whatsapp", label: "Numéro WhatsApp", placeholder: "+243..." },
      { key: "email", label: "E-mail", placeholder: "contact@credess.com" },
    ]}
  />;
}
