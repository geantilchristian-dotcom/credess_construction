"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type PublicProject = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  location: string | null;
  project_type: string | null;
  status: string | null;
  year: number | null;
  client_name: string | null;
  surface: string | null;
  description: string | null;
  cover_url: string | null;
  is_published: boolean;
  sort_order: number | null;
};

export type PublicService = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  whatsapp_message: string | null;
  sort_order: number | null;
  is_published: boolean;
};

export type PublicTeamMember = {
  id: string;
  name: string;
  full_name?: string | null;
  role: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  biography?: string | null;
  sort_order: number | null;
  is_published: boolean;
};

export type PublicStat = {
  id: string;
  stat_key: string;
  label: string;
  value: number;
  suffix: string | null;
  sort_order: number | null;
  is_published: boolean;
};

export type PublicQuoteQuestion = {
  id: string;
  question: string;
  question_type: "choice" | "text" | "number" | "textarea";
  options: string[] | null;
  placeholder: string | null;
  is_required: boolean;
  sort_order: number | null;
  is_active: boolean;
};

export type PublicPageSection = {
  id: string;
  page_key: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  sort_order: number | null;
  is_published: boolean;
};

export type CredessPublicData = {
  projects: PublicProject[];
  services: PublicService[];
  team: PublicTeamMember[];
  stats: PublicStat[];
  settings: Record<string, string>;
  quoteQuestions: PublicQuoteQuestion[];
  pages: Record<string, PublicPageSection[]>;
};

const EMPTY_DATA: CredessPublicData = {
  projects: [],
  services: [],
  team: [],
  stats: [],
  settings: {},
  quoteQuestions: [],
  pages: {},
};

export function useCredessPublicData() {
  const [data, setData] = useState<CredessPublicData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/public/credess", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Impossible de charger les données CREDESS.");
      }

      setData({
        projects: payload.projects ?? [],
        services: payload.services ?? [],
        team: payload.team ?? [],
        stats: payload.stats ?? [],
        settings: payload.settings ?? {},
        quoteQuestions: payload.quoteQuestions ?? [],
        pages: payload.pages ?? {},
      });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const tables = [
      "projects",
      "services",
      "team_members",
      "company_stats",
      "site_settings",
      "quote_questions",
      "page_contents",
    ];

    const channel = supabase.channel("credess-public-sync");

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => load()
      );
    });

    channel.subscribe();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [load]);

  return {
    ...data,
    loading,
    error,
    reload: load,
  };
}
