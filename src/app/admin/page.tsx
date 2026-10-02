"use client";
import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  supabase,
} from "@/lib/supabase";
import {
  navigation,
} from "@/lib/navigation";
const modules = [
  [
    "Réalisations",
    navigation.adminProjects,
    "projects",
  ],
  [
    "Services",
    navigation.adminServices,
    "services",
  ],
  [
    "Équipe",
    navigation.adminTeam,
    "team_members",
  ],
  [
    "Devis",
    navigation.adminQuotes,
    "quote_requests",
  ],
] as const;
export default function AdminDashboard() {
  const [
    counts,
    setCounts,
  ] =
    useState<
      Record<
        string,
        number
      >
    >({});
  useEffect(() => {
    async function load() {
      const result:
        Record<
          string,
          number
        > =
        {};
      await Promise.all(
        modules.map(
          async (
            [
              ,
              ,
              table,
            ]
          ) => {
            const {
              count,
            } =
              await supabase
                .from(
                  table
                )
                .select(
                  "*",
                  {
                    count:
                      "exact",
                    head:
                      true,
                  }
                );
            result[
              table
            ] =
              count ?? 0;
          }
        )
      );
      setCounts(
        result
      );
    }
    load();
  }, []);
  return (
    <div>
      <small
        style={{
          color:
            "#e30613",
          fontWeight:
            900,
        }}
      >
        ADMINISTRATION CREDESS
      </small>
      <h1
        style={{
          fontSize:
            42,
          margin:
            "8px 0 35px",
          letterSpacing:
            "-2px",
        }}
      >
        Tableau de bord
      </h1>
      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap:
            12,
        }}
      >
        {modules.map(
          (
            [
              label,
              href,
              table,
            ]
          ) => (
            <Link
              href={
                href
              }
              key={
                table
              }
              style={{
                minHeight:
                  150,
                padding:
                  22,
                display:
                  "flex",
                flexDirection:
                  "column",
                justifyContent:
                  "space-between",
                border:
                  "1px solid #dfe1e3",
                background:
                  "#fff",
                color:
                  "#111",
                textDecoration:
                  "none",
              }}
            >
              <span
                style={{
                  color:
                    "#777",
                  fontSize:
                    12,
                }}
              >
                {label}
              </span>
              <strong
                style={{
                  fontSize:
                    34,
                }}
              >
                {
                  counts[
                    table
                  ] ?? 0
                }
              </strong>
              <span
                style={{
                  color:
                    "#e30613",
                }}
              >
                Gérer →
              </span>
            </Link>
          )
        )}
      </div>
    </div>
  );
}