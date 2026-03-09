"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { Location } from "@/types/content";
import { supabase } from "@/lib/supabaseClient";
import "leaflet/dist/leaflet.css";
import ReactMarkdown from "react-markdown";



type FilterState = {
  search: string;
  category: string;
  era: string;
  neighborhood: string;
};

type LocationCitationLink = {
  id: string;
  context_note: string | null;
  citations: { id: string; citation_key: string; title: string } | null;
};

type RelatedPolicyLink = {
  id: string;
  relationship_note: string | null;
  policies: { id: string; title: string; slug: string; date: string | null } | null;
};


const LA_CENTER: [number, number] = [34.05, -118.25];

function FitBoundsComponent({ locations }: { locations: Location[] }) {
  const map = useMap();
  const hasFitBounds = useRef(false);

  useEffect(() => {
    if (hasFitBounds.current) return;
    if (locations.length === 0) {
      map.setView(LA_CENTER, 11);
    } else {
      const bounds = locations.map(
        (loc) => [loc.latitude, loc.longitude] as [number, number],
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    hasFitBounds.current = true;
  }, [locations, map]);

  return null;
}

function FlyToLocation({ location }: { location: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);
    if (!isFinite(lat) || !isFinite(lng)) return;
    // Skip if the map's container is hidden (display:none), offsetParent is null in that case
    if (!map.getContainer().offsetParent) return;
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [location, map]);

  return null;
}

export default function MapExplorer() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Location | null>(null);
  const [selectedCitations, setSelectedCitations] = useState<
    LocationCitationLink[]
  >([]);
  const [selectedPolicies, setSelectedPolicies] = useState<RelatedPolicyLink[]>(
    [],
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    era: "all",
    neighborhood: "all",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("locations")
        .select("*")
        .eq("published", true)
        .order("title", { ascending: true });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const normalized =
        data?.map((row: any) => ({
          ...row,
          categories: row.categories ?? [],
          images: row.images ?? [],
        })) ?? [];

      setLocations(normalized);
      setLoading(false);
    };

    load();
  }, []);

  // Load citations and related policies when a location is selected
  useEffect(() => {
    if (!selected) {
      setSelectedCitations([]);
      setSelectedPolicies([]);
      return;
    }

    const loadDetails = async () => {
      setDetailsLoading(true);

      const [{ data: citData }, { data: polData }] = await Promise.all([
        supabase
          .from("location_citations")
          .select(
            `
            id,
            context_note,
            citations (
              id,
              citation_key,
              title
            )
          `,
          )
          .eq("location_id", selected.id)
          .order("id"),
        supabase
          .from("policy_locations")
          .select(
            `
            id,
            relationship_note,
            policies (
              id,
              title,
              slug,
              date
            )
          `,
          )
          .eq("location_id", selected.id)
          .order("id"),
      ]);

      setSelectedCitations(
        (citData ?? []) as unknown as LocationCitationLink[],
      );
      setSelectedPolicies(
        (polData ?? []) as unknown as RelatedPolicyLink[],
      );
      setDetailsLoading(false);
    };

    void loadDetails();
  }, [selected]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => l.categories?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [locations]);

  const eraOptions = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => l.era && set.add(l.era));
    return Array.from(set).sort();
  }, [locations]);

  const neighborhoodOptions = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => l.neighborhood && set.add(l.neighborhood));
    return Array.from(set).sort();
  }, [locations]);

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      if (
        filters.search &&
        !loc.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.category !== "all" &&
        !(loc.categories || []).includes(filters.category)
      ) {
        return false;
      }
      if (filters.era !== "all" && loc.era !== filters.era) {
        return false;
      }
      if (
        filters.neighborhood !== "all" &&
        loc.neighborhood !== filters.neighborhood
      ) {
        return false;
      }
      return true;
    });
  }, [locations, filters]);

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden h-[calc(100vh-56px)] flex-col gap-4 sm:flex sm:flex-row">
        {/* Search Panel */}
        <aside className="w-1/5 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Map Explorer
        </h1>
        <p className="mb-3 text-xs text-zinc-700 dark:text-zinc-300">
          Filter locations by category, decade/era, and neighborhood. Hover to
          see names, click to open full narratives.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
              Search
            </label>
            <input
              type="search"
              placeholder="Search by name…"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-2 py-1 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
            >
              <option value="all">All</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">Era</label>
            <select
              value={filters.era}
              onChange={(e) =>
                setFilters((f) => ({ ...f, era: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
            >
              <option value="all">All</option>
              {eraOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
              Neighborhood
            </label>
            <select
              value={filters.neighborhood}
              onChange={(e) =>
                setFilters((f) => ({ ...f, neighborhood: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
            >
              <option value="all">All</option>
              {neighborhoodOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <p className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {filtered.length === 0
              ? "No Result Found"
              : `Showing ${filtered.length} of ${locations.length} locations.`}
          </p>

          {error && (
            <p className="text-[11px] text-red-600">
              Error loading locations: {error}
            </p>
          )}
        </div>
      </aside>

      <div className="relative flex-1 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
            Loading map…
          </div>
        ) : (
          <MapContainer
            center={LA_CENTER}
            zoom={11}
            className="h-full w-full rounded-xl"
            scrollWheelZoom
          >
            <FitBoundsComponent locations={filtered} />
            <FlyToLocation location={selected} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((loc) => (
              <CircleMarker
                key={loc.id}
                center={[loc.latitude, loc.longitude]}
                radius={8}
                pathOptions={{
                  color:
                    selected?.id === loc.id ? "#111827" : "rgba(24,24,27,0.7)",
                  fillColor:
                    selected?.id === loc.id ? "#111827" : "rgba(24,24,27,0.9)",
                  fillOpacity: 0.9,
                  weight: 1,
                }}
                eventHandlers={{
                  click: () => setSelected(loc),
                }}
              >
                <Tooltip>{loc.title}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      <aside className="hidden w-2/5 flex-col rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm sm:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        {!selected && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Click a marker to see a narrative case study, images, and sources.
          </p>
        )}
        {selected && (
          <div className="space-y-3 overflow-y-auto">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {selected.title}
              </h2>
              {selected.neighborhood && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selected.neighborhood}
                </p>
              )}
              {selected.era && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{selected.era}</p>
              )}
            </div>
            {selected.short_summary && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{selected.short_summary}</p>
            )}
            {selected.narrative_md && (
              <div className="prose prose-sm max-w-none text-zinc-800 dark:text-zinc-200 dark:prose-invert">
                <ReactMarkdown>{selected.narrative_md}</ReactMarkdown>
              </div>
            )}
            {selected.categories?.length ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {selected.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {selected.images?.length ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {selected.images.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={selected.title}
                      className="h-24 w-full rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Citations
              </p>
              {detailsLoading && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Loading citations…
                </p>
              )}
              {!detailsLoading && selectedCitations.length === 0 && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  No citations linked yet.
                </p>
              )}
              <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                {selectedCitations.map((c) =>
                  c.citations ? (
                    <li key={c.id}>
                      <span className="font-medium">
                        {c.citations.citation_key}
                      </span>
                      {": "}
                      <span>{c.citations.title}</span>
                      {c.context_note && (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {` — ${c.context_note}`}
                        </span>
                      )}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Related policies
              </p>
              {detailsLoading && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Loading related policies…
                </p>
              )}
              {!detailsLoading && selectedPolicies.length === 0 && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  No policies linked yet.
                </p>
              )}
              <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                {selectedPolicies.map((p) =>
                  p.policies ? (
                    <li key={p.id}>
                      <span className="font-medium">
                        {p.policies.title}
                      </span>
                      {p.relationship_note && (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {` — ${p.relationship_note}`}
                        </span>
                      )}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          </div>
        )}
        </aside>
      </div>

      {/* Mobile/Portrait Layout */}
      <div className="flex h-[calc(100vh-56px)] flex-col gap-2 sm:hidden">
        {/* Area B - Map (top half) */}
        <div className="relative flex-1 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
              Loading map…
            </div>
          ) : (
            <MapContainer
              center={LA_CENTER}
              zoom={11}
              className="h-full w-full rounded-xl"
              scrollWheelZoom
            >
              <FitBoundsComponent locations={filtered} />
            <FlyToLocation location={selected} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((loc) => (
                <CircleMarker
                  key={loc.id}
                  center={[loc.latitude, loc.longitude]}
                  radius={8}
                  pathOptions={{
                    color:
                      selected?.id === loc.id ? "#111827" : "rgba(24,24,27,0.7)",
                    fillColor:
                      selected?.id === loc.id ? "#111827" : "rgba(24,24,27,0.9)",
                    fillOpacity: 0.9,
                    weight: 1,
                  }}
                  eventHandlers={{
                    click: () => setSelected(loc),
                  }}
                >
                  <Tooltip>{loc.title}</Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Area A - Search / Details (bottom half) */}
        <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 min-h-0 relative overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          {/* Search Area */}
          <div className={`absolute inset-0 flex flex-col overflow-y-auto p-4 transition-all duration-500 ease-in-out ${selected ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
            <h1 className="mb-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Map Explorer
            </h1>
            <p className="mb-3 text-xs text-zinc-700 dark:text-zinc-300">
              Filter locations by category, decade/era, and neighborhood. Hover to
              see names, click to open full narratives.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
                  Search
                </label>
                <input
                  type="search"
                  placeholder="Search by name…"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                >
                  <option value="all">All</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">Era</label>
                <select
                  value={filters.era}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, era: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                >
                  <option value="all">All</option>
                  {eraOptions.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-zinc-800 dark:text-zinc-200">
                  Neighborhood
                </label>
                <select
                  value={filters.neighborhood}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, neighborhood: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                >
                  <option value="all">All</option>
                  {neighborhoodOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <p className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {filtered.length === 0
                  ? "No Result Found"
                  : `Showing ${filtered.length} of ${locations.length} locations.`}
              </p>

              {error && (
                <p className="text-[11px] text-red-600">
                  Error loading locations: {error}
                </p>
              )}
            </div>
          </div>

          {/* Details Area */}
          <div className={`absolute inset-0 flex flex-col overflow-y-auto p-4 transition-all duration-500 ease-in-out ${!selected ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
            <button
              onClick={() => setSelected(null)}
              className="mb-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-200 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Back to the explorer
            </button>

            {selected && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {selected.title}
                  </h2>
                  {selected.neighborhood && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selected.neighborhood}
                    </p>
                  )}
                  {selected.era && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{selected.era}</p>
                  )}
                </div>
                {selected.short_summary && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{selected.short_summary}</p>
                )}
                {selected.narrative_md && (
                  <div className="prose prose-sm max-w-none text-zinc-800 dark:text-zinc-200 dark:prose-invert">
                    <ReactMarkdown>{selected.narrative_md}</ReactMarkdown>
                  </div>
                )}
                {selected.categories?.length ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedCitations?.length ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Citations</p>
                    <ul className="space-y-1 text-[11px]">
                      {selectedCitations.map((cit) =>
                        cit.citations ? (
                          <li key={cit.id} className="text-zinc-700 dark:text-zinc-300">
                            <span className="font-medium">{cit.citations.citation_key}</span>
                            {cit.context_note && (
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {` — ${cit.context_note}`}
                              </span>
                            )}
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                ) : null}
                {selectedPolicies?.length ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Related Policies</p>
                    <ul className="space-y-1 text-[11px]">
                      {selectedPolicies.map((p) =>
                        p.policies ? (
                          <li key={p.id} className="text-zinc-700 dark:text-zinc-300">
                            <span className="font-medium">{p.policies.title}</span>
                            {p.relationship_note && (
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {` — ${p.relationship_note}`}
                              </span>
                            )}
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
