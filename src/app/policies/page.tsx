"use client";

import { useEffect, useMemo, useState } from "react";
import type { Policy } from "@/types/content";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";

type PolicyCitationLink = {
  context_note: string | null;
  citations: { id: string; citation_key: string; title: string } | null;
};

type PolicyLocationLink = {
  relationship_note: string | null;
  locations: {
    id: string;
    title: string;
    slug: string;
    neighborhood: string | null;
  } | null;
};

type PolicyWithRelations = Policy & {
  policy_citations?: PolicyCitationLink[];
  policy_locations?: PolicyLocationLink[];
};

type GroupedPolicies = {
  decade: string;
  items: PolicyWithRelations[];
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("policies")
        .select(
          `
          *,
          policy_citations (
            context_note,
            citations (
              id,
              citation_key,
              title
            )
          ),
          policy_locations (
            relationship_note,
            locations (
              id,
              title,
              slug,
              neighborhood
            )
          )
        `,
        )
        .eq("published", true)
        .order("date", { ascending: true });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const normalized =
        data?.map((row: any) => ({
          ...row,
          tags: row.tags ?? [],
        })) ?? [];

      setPolicies(normalized);
      setLoading(false);
    };

    load();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    policies.forEach((p) => p.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [policies]);

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (jurisdiction !== "all" && p.jurisdiction !== jurisdiction) {
        return false;
      }
      if (tag !== "all" && !p.tags.includes(tag)) {
        return false;
      }
      return true;
    });
  }, [policies, jurisdiction, tag]);

  const grouped: GroupedPolicies[] = useMemo(() => {
    const byDecade = new Map<string, Policy[]>();
    filtered.forEach((p) => {
      const year = p.date ? new Date(p.date).getFullYear() : null;
      const decade = year ? `${Math.floor(year / 10) * 10}s` : "No date";
      if (!byDecade.has(decade)) byDecade.set(decade, []);
      byDecade.get(decade)!.push(p);
    });
    return Array.from(byDecade.entries())
      .sort((a, b) => {
        if (a[0] === "No date") return 1;
        if (b[0] === "No date") return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([decade, items]) => ({ decade, items }));
  }, [filtered]);

  const jurisdictionLabel = (j: Policy["jurisdiction"]) => {
    switch (j) {
      case "federal":
        return "Federal";
      case "state":
        return "State";
      case "city":
        return "City";
      case "county":
        return "County";
      default:
        return j;
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Policy Timeline
          </h1>
          <p className="text-sm text-zinc-700">
            A chronological view of federal, state, county, and city-level
            policies that have shaped homelessness and housing in Los Angeles
            and the United States.
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-800">
              Jurisdiction
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900"
            >
              <option value="all">All</option>
              <option value="federal">Federal</option>
              <option value="state">State</option>
              <option value="county">County</option>
              <option value="city">City</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium text-zinc-800">
              Tag
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900"
            >
              <option value="all">All</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-600">
          Error loading policies: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600">Loading policies…</p>
      ) : (
        <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          {grouped.map((group) => (
            <section key={group.decade} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                {group.decade}
              </h2>
              <div className="space-y-3">
                {group.items.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {p.title}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {p.date
                            ? new Date(p.date).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "No date recorded"}
                          {" · "}
                          {jurisdictionLabel(p.jurisdiction)}
                        </p>
                      </div>
                      {p.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {p.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {p.short_summary && (
                      <p className="mt-2 text-sm text-zinc-700">
                        {p.short_summary}
                      </p>
                    )}
                    {p.narrative_md && (
                      <div className="prose prose-sm mt-2 max-w-none text-zinc-800">
                        <ReactMarkdown>{p.narrative_md}</ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-3 grid gap-2 text-[11px] text-zinc-700 md:grid-cols-2">
                      <div>
                        <p className="mb-1 font-medium text-zinc-800">
                          Citations
                        </p>
                        {p.policy_citations &&
                        p.policy_citations.length > 0 ? (
                          <ul className="space-y-1">
                            {p.policy_citations.map((pc, idx) =>
                              pc.citations ? (
                                <li key={`${pc.citations.id}-${idx}`}>
                                  <span className="font-medium">
                                    {pc.citations.citation_key}
                                  </span>
                                  {": "}
                                  <span>{pc.citations.title}</span>
                                  {pc.context_note && (
                                    <span className="text-zinc-500">
                                      {` — ${pc.context_note}`}
                                    </span>
                                  )}
                                </li>
                              ) : null,
                            )}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-zinc-500">
                            No citations linked yet.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-zinc-800">
                          Related locations
                        </p>
                        {p.policy_locations &&
                        p.policy_locations.length > 0 ? (
                          <ul className="space-y-1">
                            {p.policy_locations.map((pl, idx) =>
                              pl.locations ? (
                                <li key={`${pl.locations.id}-${idx}`}>
                                  <span className="font-medium">
                                    {pl.locations.title}
                                  </span>
                                  {pl.locations.neighborhood && (
                                    <span className="text-zinc-500">
                                      {` (${pl.locations.neighborhood})`}
                                    </span>
                                  )}
                                  {pl.relationship_note && (
                                    <span className="text-zinc-500">
                                      {` — ${pl.relationship_note}`}
                                    </span>
                                  )}
                                </li>
                              ) : null,
                            )}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-zinc-500">
                            No locations linked yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {!grouped.length && (
            <p className="text-sm text-zinc-600">
              No policies match the current filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}


