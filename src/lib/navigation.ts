export const navigation = {
  home: "/",
  projects: "/projets",
  services: "/services",
  about: "/a-propos",
  team: "/#equipe",
  quote: "/devis",
  privacy: "/confidentialite",
  legal: "/mentions-legales",
  admin: "/admin",
  adminProjects: "/admin/projets",
  adminServices: "/admin/services",
  adminTeam: "/admin/equipe",
  adminStats: "/admin/statistiques",
  adminAbout: "/admin/a-propos",
  adminQuotes: "/admin/devis",
  adminQuoteQuestions: "/admin/devis/questions",
  adminCoordinates: "/admin/coordonnees",
  adminPages: "/admin/pages",
  adminSettings: "/admin/parametres",
} as const;
export function projectUrl(
  slug: string
) {
  return `/projets/${slug}`;
}
export function serviceUrl(
  slug: string
) {
  return `/services/${slug}`;
}