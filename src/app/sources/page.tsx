"use client";

import { useEffect, useState } from "react";
import type { Citation } from "@/types/content";
import { supabase } from "@/lib/supabaseClient";

type CitationWithBacklinks = Citation & {
  location_citations?: {
    context_note: string | null;
    locations: { id: string; title: string; slug: string } | null;
  }[];
  policy_citations?: {
    context_note: string | null;
    policies: { id: string; title: string; slug: string } | null;
  }[];
};

const PAGE_SIZE = 10;

export default function SourcesPage() {
  const [citations, setCitations] = useState<CitationWithBacklinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("citations")
        .select(
          `
          *,
          location_citations (
            context_note,
            locations (
              id, title, slug
            )
          ),
          policy_citations (
            context_note,
            policies (
              id, title, slug
            )
          )
        `,
          { count: "exact" },
        )
        .order("year", { ascending: false, nullsFirst: false })
        .range(from, to);

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `title.ilike.${term},author.ilike.${term},publication.ilike.${term}`,
        );
      }

      const { data, error: err, count } = await query;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setCitations((data ?? []) as CitationWithBacklinks[]);
      setTotal(count ?? 0);
      setLoading(false);
    };

    load();
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          A shared bibliography for locations and policies. Each citation shows
          where it appears on the map and timeline.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            placeholder="Search by author, title, or publication…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 md:justify-end">
            <span>
              Page {page} of {totalPages} · {total} citations
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">Error loading sources: {error}</p>
        )}

        {loading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading citations…</p>
        ) : (
          <div className="space-y-4">
            {citations.map((c) => (
              <article
                key={c.id}
                className="border-t border-zinc-200 pt-3 first:border-t-0 first:pt-0 dark:border-zinc-700"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {c.author && `${c.author}. `}
                  <span className="italic">{c.title}</span>
                  {c.publication && `, ${c.publication}`}
                  {c.year && ` (${c.year})`}
                  .
                </p>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                  >
                    Open link
                  </a>
                )}
                {c.notes && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{c.notes}</p>
                )}

                <div className="mt-2 grid gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 md:grid-cols-2">
                  <div>
                    <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
                      Used in locations
                    </p>
                    {c.location_citations && c.location_citations.length > 0 ? (
                      <ul className="space-y-1">
                        {c.location_citations.map((lc, idx) =>
                          lc.locations ? (
                            <li key={`${lc.locations.id}-${idx}`}>
                              <span className="font-medium">
                                {lc.locations.title}
                              </span>
                              {lc.context_note && (
                                <span>{`: ${lc.context_note}`}</span>
                              )}
                            </li>
                          ) : null,
                        )}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
                        Not yet linked to specific locations.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
                      Used in policies
                    </p>
                    {c.policy_citations && c.policy_citations.length > 0 ? (
                      <ul className="space-y-1">
                        {c.policy_citations.map((pc, idx) =>
                          pc.policies ? (
                            <li key={`${pc.policies.id}-${idx}`}>
                              <span className="font-medium">
                                {pc.policies.title}
                              </span>
                              {pc.context_note && (
                                <span>{`: ${pc.context_note}`}</span>
                              )}
                            </li>
                          ) : null,
                        )}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
                        Not yet linked to specific policies.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {citations.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No citations match your search.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-zinc-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() =>
              setPage((p) => (p < totalPages ? p + 1 : totalPages))
            }
            className="rounded-full border border-zinc-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


