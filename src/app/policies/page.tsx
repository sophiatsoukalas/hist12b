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
  const [visibleDecades, setVisibleDecades] = useState<Set<string>>(new Set());

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

  // Trigger animations after initial render
  useEffect(() => {
    if (!loading && grouped.length > 0) {
      // Animate decades one by one
      grouped.forEach((group, index) => {
        setTimeout(() => {
          setVisibleDecades((prev) => new Set(prev).add(group.decade));
        }, index * 200);
      });
    }
  }, [loading]);

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

  // Analyze decade content for timeline color
  const getDecadeColor = (items: PolicyWithRelations[]) => {
    const hasPolicy = items.some((p) => p.genre === "Policy");
    const hasResistance = items.some((p) => p.genre === "Resistance");
    
    if (hasPolicy && hasResistance) {
      return "gradient";
    } else if (hasResistance) {
      return "red";
    } else {
      return "blue";
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-red-600">Resistance</span>
            <span className="text-zinc-800 mx-2 dark:text-zinc-200">&</span>
            <span className="text-blue-600">Policies</span>
          </h1>
          <p className="text-sm text-zinc-800 mx-2 dark:text-zinc-200">
            A chronological view of federal, state, county, and city-level
            policies and resistance movements that have shaped homelessness and housing in Los Angeles
            and the United States.
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
              Jurisdiction
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
            >
              <option value="all">All</option>
              <option value="federal">Federal</option>
              <option value="state">State</option>
              <option value="county">County</option>
              <option value="city">City</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
              Tag
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
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

      {/* Horizontal Timeline Navigation */}
      {!loading && grouped.length > 0 && (
        <div className="relative py-6 overflow-x-auto">
          <div className="flex items-center min-w-max px-4">
            {/* Horizontal line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"></div>
            
            {/* Timeline dots */}
            <div className="relative z-10 flex items-center gap-4">
              {grouped.map((group, index) => {
                const color = getDecadeColor(group.items);
                const isVisible = visibleDecades.has(group.decade);
                
                return (
                  <a
                    key={group.decade}
                    href={`#decade-${group.decade}`}
                    className={`transition-all duration-700 ease-out ${
                      isVisible 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-90'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <div className="flex flex-col items-center group cursor-pointer">
                      {/* Animated dot */}
                      <div
                        className={`w-5 h-5 rounded-full border-3 border-white dark:border-zinc-950 shadow-lg transition-transform duration-300 group-hover:scale-125 ${
                          color === "gradient"
                            ? "bg-gradient-to-br from-red-500 to-blue-500"
                            : color === "red"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      ></div>
                      
                      {/* Decade label */}
                      <span
                        className={`mt-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover:scale-110 ${
                          color === "gradient"
                            ? "bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent"
                            : color === "red"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {group.decade}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">
          Error loading policies: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading policies…</p>
      ) : (
        <div className="space-y-12">
          {grouped.map((group) => {
            const color = getDecadeColor(group.items);
            const isVisible = visibleDecades.has(group.decade);
            
            // Count items by genre
            const resistanceCount = group.items.filter((p) => p.genre === "Resistance").length;
            const policyCount = group.items.filter((p) => p.genre === "Policy").length;
            
            return (
              <section
                key={group.decade}
                id={`decade-${group.decade}`}
                className={`transition-all duration-700 ease-out ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-100 translate-y-8'
                }`}
              >
                {/* Decade header */}
                <div className="relative mb-8">
                  <div className="flex items-center">
                    <div className="flex-1 border-t-2 border-zinc-200 dark:border-zinc-700"></div>
                    <div
                      className={`mx-4 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-[0.2em] shadow-sm ${
                        color === "gradient"
                          ? "bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent border-2 border-current bg-white dark:bg-zinc-950"
                          : color === "red"
                          ? "text-red-600 border-2 border-red-600 bg-red-50 dark:bg-red-950/30"
                          : "text-blue-600 border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                      }`}
                    >
                      {group.decade}
                    </div>
                    <div className="flex-1 border-t-2 border-zinc-200 dark:border-zinc-700"></div>
                  </div>
                </div>

                {/* Dynamic grid layout based on content */}
                {resistanceCount > 0 && policyCount > 0 ? (
                  // Both exist: show side-by-side on desktop, stacked on mobile
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Left column: Resistance */}
                    <div className="space-y-4">
                      {group.items
                        .filter((p) => p.genre === "Resistance")
                        .map((p) => (
                          <ResistanceCard key={p.id} policy={p} jurisdictionLabel={jurisdictionLabel} />
                        ))}
                    </div>

                    {/* Right column: Policy */}
                    <div className="space-y-4">
                      {group.items
                        .filter((p) => p.genre === "Policy")
                        .map((p) => (
                          <PolicyCard key={p.id} policy={p} jurisdictionLabel={jurisdictionLabel} />
                        ))}
                    </div>
                  </div>
                ) : resistanceCount > 0 ? (
                  // Only Resistance: center it
                  <div className="max-w-3xl mx-auto space-y-4">
                    {group.items
                      .filter((p) => p.genre === "Resistance")
                      .map((p) => (
                        <ResistanceCard key={p.id} policy={p} jurisdictionLabel={jurisdictionLabel} />
                      ))}
                  </div>
                ) : policyCount > 0 ? (
                  // Only Policy: center it
                  <div className="max-w-3xl mx-auto space-y-4">
                    {group.items
                      .filter((p) => p.genre === "Policy")
                      .map((p) => (
                        <PolicyCard key={p.id} policy={p} jurisdictionLabel={jurisdictionLabel} />
                      ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {!grouped.length && (
        <p className="text-sm text-zinc-600 text-center py-8 dark:text-zinc-400">
          No policies match the current filters.
        </p>
      )}
    </div>
  );
}

// Helper component for Resistance cards
function ResistanceCard({ policy, jurisdictionLabel }: { 
  policy: PolicyWithRelations;
  jurisdictionLabel: (j: Policy["jurisdiction"]) => string;
}) {
  return (
    <article
      className="rounded-lg border-l-4 border-red-500 bg-white p-4 text-sm text-zinc-700 hover:shadow-md transition-shadow duration-300 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {policy.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {policy.date
              ? new Date(policy.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "No date recorded"}
            {" · "}
            {jurisdictionLabel(policy.jurisdiction)}
          </p>
        </div>
        {policy.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {policy.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {policy.short_summary && (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {policy.short_summary}
        </p>
      )}
      {policy.narrative_md && (
        <div className="prose prose-sm mt-2 max-w-none text-zinc-800 dark:text-zinc-200 dark:prose-invert">
          <ReactMarkdown>{policy.narrative_md}</ReactMarkdown>
        </div>
      )}
      {/* Citations and locations */}
      <PolicyDetails policy={policy} />
    </article>
  );
}

// Helper component for Policy cards
function PolicyCard({ policy, jurisdictionLabel }: { 
  policy: PolicyWithRelations;
  jurisdictionLabel: (j: Policy["jurisdiction"]) => string;
}) {
  return (
    <article
      className="rounded-lg border-r-4 border-blue-500 bg-white p-4 text-sm text-zinc-700 hover:shadow-md transition-shadow duration-300 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {policy.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {policy.date
              ? new Date(policy.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "No date recorded"}
            {" · "}
            {jurisdictionLabel(policy.jurisdiction)}
          </p>
        </div>
        {policy.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {policy.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {policy.short_summary && (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {policy.short_summary}
        </p>
      )}
      {policy.narrative_md && (
        <div className="prose prose-sm mt-2 max-w-none text-zinc-800 dark:text-zinc-200 dark:prose-invert">
          <ReactMarkdown>{policy.narrative_md}</ReactMarkdown>
        </div>
      )}
      {/* Citations and locations */}
      <PolicyDetails policy={policy} />
    </article>
  );
}

// Helper component for policy details
function PolicyDetails({ policy }: { policy: PolicyWithRelations }) {
  return (
    <div className="mt-3 grid gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 md:grid-cols-2">
      <div>
        <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
          Citations
        </p>
        {policy.policy_citations &&
        policy.policy_citations.length > 0 ? (
          <ul className="space-y-1">
            {policy.policy_citations.map((pc, idx) =>
              pc.citations ? (
                <li key={`${pc.citations.id}-${idx}`}>
                  <span className="font-medium">
                    {pc.citations.citation_key}
                  </span>
                  {": "}
                  <span>{pc.citations.title}</span>
                  {pc.context_note && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {` — ${pc.context_note}`}
                    </span>
                  )}
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
            No citations linked yet.
          </p>
        )}
      </div>
      <div>
        <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
          Related locations
        </p>
        {policy.policy_locations &&
        policy.policy_locations.length > 0 ? (
          <ul className="space-y-1">
            {policy.policy_locations.map((pl, idx) =>
              pl.locations ? (
                <li key={`${pl.locations.id}-${idx}`}>
                  <span className="font-medium">
                    {pl.locations.title}
                  </span>
                  {pl.locations.neighborhood && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {` (${pl.locations.neighborhood})`}
                    </span>
                  )}
                  {pl.relationship_note && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {` — ${pl.relationship_note}`}
                    </span>
                  )}
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
            No locations linked yet.
          </p>
        )}
      </div>
    </div>
  );
}
