"use client";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";
import {
  navigation,
} from "@/lib/navigation";
import styles from
  "./AdminNavigation.module.css";
const items = [
  {
    label:
      "Tableau de bord",
    href:
      navigation.admin,
  },
  {
    label:
      "Réalisations",
    href:
      navigation.adminProjects,
  },
  {
    label:
      "Services",
    href:
      navigation.adminServices,
  },
  {
    label:
      "Équipe",
    href:
      navigation.adminTeam,
  },
  {
    label:
      "Statistiques",
    href:
      navigation.adminStats,
  },
  {
    label:
      "À propos",
    href:
      navigation.adminAbout,
  },
  {
    label:
      "Devis",
    href:
      navigation.adminQuotes,
  },
  {
    label:
      "Questions du devis",
    href:
      navigation.adminQuoteQuestions,
  },
  {
    label:
      "Coordonnées",
    href:
      navigation.adminCoordinates,
  },
  {
    label:
      "Pages légales",
    href:
      navigation.adminPages,
  },
  {
    label:
      "Paramètres",
    href:
      navigation.adminSettings,
  },
];
export default function AdminNavigation() {
  const pathname =
    usePathname();
  return (
    <aside
      className={
        styles.sidebar
      }
    >
      <Link
        href="/"
        className={
          styles.logo
        }
      >
        <strong>
          CREDESS
        </strong>
        <span>
          CONSTRUCTION
        </span>
      </Link>
      <small
        className={
          styles.label
        }
      >
        ADMINISTRATION
      </small>
      <nav>
        {items.map(
          (
            item,
            index
          ) => {
            const active =
              item.href ===
                "/admin"
                ? pathname ===
                  "/admin"
                : pathname.startsWith(
                    item.href
                  );
            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className={
                  active
                    ? styles.active
                    : ""
                }
              >
                <span>
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
                <strong>
                  {item.label}
                </strong>
                <b>
                  →
                </b>
              </Link>
            );
          }
        )}
      </nav>
      <Link
        href="/"
        className={
          styles.publicSite
        }
      >
        Voir le site
        <span>↗</span>
      </Link>
    </aside>
  );
}