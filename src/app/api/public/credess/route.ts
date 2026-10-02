import { NextResponse } from "next/server";
import {
  getPageContents,
  getPublishedProjects,
  getPublishedServices,
  getQuoteQuestions,
  getSiteSettings,
  getStats,
  getTeamMembers,
} from "@/lib/credess-data";

export const dynamic = "force-dynamic";

async function safe<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`CREDESS PUBLIC ${label}:`, error);
    return fallback;
  }
}

export async function GET() {
  const pageKeys = ["about", "mission", "engagement", "privacy", "legal", "terms"];

  const [projects, services, team, stats, settings, quoteQuestions, ...pageResults] =
    await Promise.all([
      safe(getPublishedProjects(), [], "projects"),
      safe(getPublishedServices(), [], "services"),
      safe(getTeamMembers(), [], "team"),
      safe(getStats(), [], "stats"),
      safe(getSiteSettings(), {}, "settings"),
      safe(getQuoteQuestions(), [], "quote questions"),
      ...pageKeys.map((key) => safe(getPageContents(key), [], `page ${key}`)),
    ]);

  const pages = Object.fromEntries(
    pageKeys.map((key, index) => [key, pageResults[index] ?? []])
  );

  return NextResponse.json({
    success: true,
    projects,
    services,
    team,
    stats,
    settings,
    quoteQuestions,
    pages,
  });
}
