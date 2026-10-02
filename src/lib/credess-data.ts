import {
  supabase,
} from "@/lib/supabase";
export async function getPublishedProjects() {
  const {
    data,
    error,
  } =
    await supabase
      .from("projects")
      .select("*")
      .eq(
        "is_published",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );
  if (error) {
    throw error;
  }
  return data ?? [];
}
export async function getPublishedServices() {
  const {
    data,
    error,
  } =
    await supabase
      .from("services")
      .select("*")
      .eq(
        "is_published",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );
  if (error) {
    throw error;
  }
  return data ?? [];
}
export async function getTeamMembers() {
  const {
    data,
    error,
  } =
    await supabase
      .from("team_members")
      .select("*")
      .eq(
        "is_published",
        true
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        }
      );
  if (error) {
    throw error;
  }
  return (
    data ??
    []
  ).map(
    (member) => ({
      ...member,
      name:
        member.full_name ||
        member.name ||
        "",
    })
  );
}
export async function getStats() {
  const {
    data,
    error,
  } =
    await supabase
      .from("company_stats")
      .select("*")
      .eq(
        "is_published",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );
  if (error) {
    throw error;
  }
  return data ?? [];
}
export async function getSiteSettings() {
  const {
    data,
    error,
  } =
    await supabase
      .from("site_settings")
      .select("*");
  if (error) {
    throw error;
  }
  return Object.fromEntries(
    (data ?? []).map(
      (item) => [
        item.setting_key,
        item.setting_value,
      ]
    )
  );
}
export async function getQuoteQuestions() {
  const {
    data,
    error,
  } =
    await supabase
      .from("quote_questions")
      .select("*")
      .eq(
        "is_active",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );
  if (error) {
    throw error;
  }
  return data ?? [];
}
export async function getPageContents(
  pageKey: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("page_contents")
      .select("*")
      .eq(
        "page_key",
        pageKey
      )
      .eq(
        "is_published",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );
  if (error) {
    throw error;
  }
  return data ?? [];
}
export async function getProjectBySlug(
  slug: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("projects")
      .select("*")
      .eq(
        "slug",
        slug
      )
      .eq(
        "is_published",
        true
      )
      .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}
export async function getServiceBySlug(
  slug: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("services")
      .select("*")
      .eq(
        "slug",
        slug
      )
      .eq(
        "is_published",
        true
      )
      .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}