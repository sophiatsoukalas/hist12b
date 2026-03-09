"use client";

import { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { supabase } from "@/lib/supabaseClient";
import type { Citation, Location, Policy } from "@/types/content";
import ReactMarkdown from "react-markdown";

type AuthState = "loading" | "unauthenticated" | "viewer" | "admin";

type LocationCitationLink = {
  id: string;
  context_note: string | null;
  citations: { id: string; citation_key: string; title: string } | null;
};

type PolicyCitationLink = {
  id: string;
  context_note: string | null;
  citations: { id: string; citation_key: string; title: string } | null;
};

function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setAuthState("unauthenticated");
        setCheckingSession(false);
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .maybeSingle();

      setAuthState(adminRow ? "admin" : "viewer");
      setCheckingSession(false);
    };

    check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthState("loading");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setAuthError(error?.message ?? "Unable to sign in.");
      setAuthState("unauthenticated");
      return;
    }

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id")
      .maybeSingle();

    setAuthState(adminRow ? "admin" : "viewer");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState("unauthenticated");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-zinc-700">
            Add and edit locations, policies, and citations without touching
            code. Only users listed in the <code>admin_users</code> table can
            publish or edit content.
          </p>
        </div>
        {authState === "admin" || authState === "viewer" ? (
          <button
            onClick={handleLogout}
            className="self-start rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
          >
            Sign out
          </button>
        ) : null}
      </header>

      {(authState === "loading" || checkingSession) && (
        <p className="text-sm text-zinc-600">Checking authentication…</p>
      )}

      {authState === "unauthenticated" && !checkingSession && (
        <div className="max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            Admin login
          </h2>
          <p className="text-sm text-zinc-600">
            Use the email and password configured for your Supabase project.
            Admin status is controlled by the <code>admin_users</code> table.
          </p>
          <form onSubmit={handleLogin} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-800">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-800">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-900"
              />
            </div>
            {authError && (
              <p className="text-xs text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
            >
              Sign in
            </button>
          </form>
        </div>
      )}

      {authState === "viewer" && (
        <div className="max-w-md space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Viewer access only</p>
          <p>
            You are signed in, but not listed as an admin. You can browse the
            public site, but only admins can edit content in this dashboard.
          </p>
        </div>
      )}

      {authState === "admin" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <AdminTabs />
        </div>
      )}
    </div>
  );
}

function AdminTabs() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Location form state
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    title: "",
    slug: "",
    latitude: "",
    longitude: "",
    neighborhood: "",
    era: "",
    categoriesInput: "",
    short_summary: "",
    narrative_md: "",
    published: false,
  });
  const [locationImages, setLocationImages] = useState<File[]>([]);
  const [locationLinks, setLocationLinks] = useState<LocationCitationLink[]>(
    [],
  );
  const [locationCitationId, setLocationCitationId] = useState<string>("");
  const [locationCitationNote, setLocationCitationNote] = useState("");

  // Policy form state
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    title: "",
    slug: "",
    date: "",
    jurisdiction: "city",
    genre: "Policy" as "Policy" | "Resistance",
    short_summary: "",
    narrative_md: "",
    tagsInput: "",
    published: false,
  });
  const [policyLinks, setPolicyLinks] = useState<PolicyCitationLink[]>([]);
  const [policyCitationId, setPolicyCitationId] = useState<string>("");
  const [policyCitationNote, setPolicyCitationNote] = useState("");

  // Citation form state
  const [editingCitation, setEditingCitation] = useState<Citation | null>(null);
  const [citationForm, setCitationForm] = useState({
    citation_key: "",
    title: "",
    author: "",
    year: "",
    publication: "",
    url: "",
    notes: "",
  });

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      const [locRes, polRes, citRes] = await Promise.all([
        supabase.from("locations").select("*").order("title", {
          ascending: true,
        }),
        supabase.from("policies").select("*").order("date", {
          ascending: true,
        }),
        supabase.from("citations").select("*").order("year", {
          ascending: false,
        }),
      ]);

      if (locRes.error || polRes.error || citRes.error) {
        setError(
          locRes.error?.message ??
            polRes.error?.message ??
            citRes.error?.message ??
            "Error loading data.",
        );
        setLoading(false);
        return;
      }

      setLocations(
        (locRes.data ?? []).map((l: any) => ({
          ...l,
          categories: l.categories ?? [],
          images: l.images ?? [],
        })),
      );
      setPolicies(
        (polRes.data ?? []).map((p: any) => ({
          ...p,
          tags: p.tags ?? [],
        })),
      );
      setCitations(citRes.data ?? []);
      setLoading(false);
    };

    loadAll();
  }, []);

  const resetLocationForm = () => {
    setEditingLocation(null);
    setLocationForm({
      title: "",
      slug: "",
      latitude: "",
      longitude: "",
      neighborhood: "",
      era: "",
      categoriesInput: "",
      short_summary: "",
      narrative_md: "",
      published: false,
    });
    setLocationImages([]);
    setLocationLinks([]);
    setLocationCitationId("");
    setLocationCitationNote("");
  };

  const startEditLocation = async (loc: Location) => {
    setEditingLocation(loc);
    setLocationForm({
      title: loc.title,
      slug: loc.slug,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      neighborhood: loc.neighborhood ?? "",
      era: loc.era ?? "",
      categoriesInput: (loc.categories ?? []).join(", "),
      short_summary: loc.short_summary ?? "",
      narrative_md: loc.narrative_md ?? "",
      published: loc.published,
    });
    setLocationImages([]);

    const { data } = await supabase
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
      .eq("location_id", loc.id)
      .order("id");

    setLocationLinks((data ?? []) as unknown as LocationCitationLink[]);
  };

  const saveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const categories = locationForm.categoriesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      title: locationForm.title,
      slug: locationForm.slug,
      latitude: parseFloat(locationForm.latitude),
      longitude: parseFloat(locationForm.longitude),
      neighborhood:
        locationForm.neighborhood.trim() || null,
      era: locationForm.era.trim() || null,
      categories,
      short_summary:
        locationForm.short_summary.trim() || null,
      narrative_md:
        locationForm.narrative_md.trim() || null,
      published: locationForm.published,
    };

    let locationId = editingLocation?.id ?? null;
    let currentImages = editingLocation?.images ?? [];

    if (editingLocation) {
      const { data, error } = await supabase
        .from("locations")
        .update(payload)
        .eq("id", editingLocation.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      locationId = data.id;
      currentImages = data.images ?? [];
      setLocations((prev) =>
        prev.map((l) => (l.id === data.id ? { ...l, ...data } : l)),
      );
    } else {
      const { data, error } = await supabase
        .from("locations")
        .insert(payload)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      locationId = data.id;
      currentImages = data.images ?? [];
      setLocations((prev) => [...prev, data]);
      setEditingLocation(data);
    }

    // Upload images if any
    if (locationId && locationImages.length > 0) {
      const uploadedUrls: string[] = [];
      for (const file of locationImages) {
        const path = `${locationId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("location-images")
          .upload(path, file);
        if (uploadError) {
          setError(
            `Saved location, but an image failed to upload: ${uploadError.message}`,
          );
          continue;
        }
        const { data: publicUrlData } = supabase.storage
          .from("location-images")
          .getPublicUrl(path);
        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const newImages = [...currentImages, ...uploadedUrls];
        const { data, error } = await supabase
          .from("locations")
          .update({ images: newImages })
          .eq("id", locationId)
          .select()
          .single();

        if (!error && data) {
          setLocations((prev) =>
            prev.map((l) => (l.id === data.id ? { ...l, ...data } : l)),
          );
          setEditingLocation(data);
        }
      }
      setLocationImages([]);
    }
  };

  const deleteLocation = async (loc: Location) => {
    if (
      !window.confirm(
        `Delete location "${loc.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", loc.id);
    if (error) {
      setError(error.message);
      return;
    }
    setLocations((prev) => prev.filter((l) => l.id !== loc.id));
    if (editingLocation?.id === loc.id) {
      resetLocationForm();
    }
  };

  const attachLocationCitation = async () => {
    if (!editingLocation || !locationCitationId) return;
    const { data, error } = await supabase
      .from("location_citations")
      .insert({
        location_id: editingLocation.id,
        citation_id: locationCitationId,
        context_note: locationCitationNote || null,
      })
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
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setLocationLinks((prev) => [
      ...prev,
      data as unknown as LocationCitationLink,
    ]);
    setLocationCitationId("");
    setLocationCitationNote("");
  };

  const removeLocationCitation = async (link: LocationCitationLink) => {
    const { error } = await supabase
      .from("location_citations")
      .delete()
      .eq("id", link.id);
    if (error) {
      setError(error.message);
      return;
    }
    setLocationLinks((prev) => prev.filter((l) => l.id !== link.id));
  };

  const resetPolicyForm = () => {
    setEditingPolicy(null);
    setPolicyForm({
      title: "",
      slug: "",
      date: "",
      jurisdiction: "city",
      genre: "Policy" as "Policy" | "Resistance",
      short_summary: "",
      narrative_md: "",
      tagsInput: "",
      published: false,
    });
    setPolicyLinks([]);
    setPolicyCitationId("");
    setPolicyCitationNote("");
  };

  const startEditPolicy = async (p: Policy) => {
    setEditingPolicy(p);
    setPolicyForm({
      title: p.title,
      slug: p.slug,
      date: p.date ?? "",
      jurisdiction: p.jurisdiction,
      genre: p.genre ?? "Policy",
      short_summary: p.short_summary ?? "",
      narrative_md: p.narrative_md ?? "",
      tagsInput: (p.tags ?? []).join(", "),
      published: p.published,
    });

    const { data } = await supabase
      .from("policy_citations")
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
      .eq("policy_id", p.id)
      .order("id");

    setPolicyLinks((data ?? []) as unknown as PolicyCitationLink[]);
  };

  const savePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tags = policyForm.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: policyForm.title,
      slug: policyForm.slug,
      date: policyForm.date || null,
      jurisdiction: policyForm.jurisdiction as Policy["jurisdiction"],
      genre: policyForm.genre,
      short_summary: policyForm.short_summary.trim() || null,
      narrative_md: policyForm.narrative_md.trim() || null,
      tags,
      published: policyForm.published,
    };

    if (editingPolicy) {
      const { data, error } = await supabase
        .from("policies")
        .update(payload)
        .eq("id", editingPolicy.id)
        .select()
        .single();
      if (error) {
        setError(error.message);
        return;
      }
      setPolicies((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)),
      );
      setEditingPolicy(data);
    } else {
      const { data, error } = await supabase
        .from("policies")
        .insert(payload)
        .select()
        .single();
      if (error) {
        setError(error.message);
        return;
      }
      setPolicies((prev) => [...prev, data]);
      setEditingPolicy(data);
    }
  };

  const deletePolicy = async (p: Policy) => {
    if (
      !window.confirm(
        `Delete policy "${p.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    const { error } = await supabase
      .from("policies")
      .delete()
      .eq("id", p.id);
    if (error) {
      setError(error.message);
      return;
    }
    setPolicies((prev) => prev.filter((x) => x.id !== p.id));
    if (editingPolicy?.id === p.id) {
      resetPolicyForm();
    }
  };

  const attachPolicyCitation = async () => {
    if (!editingPolicy || !policyCitationId) return;
    const { data, error } = await supabase
      .from("policy_citations")
      .insert({
        policy_id: editingPolicy.id,
        citation_id: policyCitationId,
        context_note: policyCitationNote || null,
      })
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
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setPolicyLinks((prev) => [
      ...prev,
      data as unknown as PolicyCitationLink,
    ]);
    setPolicyCitationId("");
    setPolicyCitationNote("");
  };

  const removePolicyCitation = async (link: PolicyCitationLink) => {
    const { error } = await supabase
      .from("policy_citations")
      .delete()
      .eq("id", link.id);
    if (error) {
      setError(error.message);
      return;
    }
    setPolicyLinks((prev) => prev.filter((l) => l.id !== link.id));
  };

  const resetCitationForm = () => {
    setEditingCitation(null);
    setCitationForm({
      citation_key: "",
      title: "",
      author: "",
      year: "",
      publication: "",
      url: "",
      notes: "",
    });
  };

  const startEditCitation = (c: Citation) => {
    setEditingCitation(c);
    setCitationForm({
      citation_key: c.citation_key,
      title: c.title,
      author: c.author ?? "",
      year: c.year ? String(c.year) : "",
      publication: c.publication ?? "",
      url: c.url ?? "",
      notes: c.notes ?? "",
    });
  };

  const saveCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      citation_key: citationForm.citation_key,
      title: citationForm.title,
      author: citationForm.author.trim() || null,
      year: citationForm.year ? parseInt(citationForm.year, 10) : null,
      publication: citationForm.publication.trim() || null,
      url: citationForm.url.trim() || null,
      notes: citationForm.notes.trim() || null,
    };

    if (editingCitation) {
      const { data, error } = await supabase
        .from("citations")
        .update(payload)
        .eq("id", editingCitation.id)
        .select()
        .single();
      if (error) {
        setError(error.message);
        return;
      }
      setCitations((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)),
      );
      setEditingCitation(data);
    } else {
      const { data, error } = await supabase
        .from("citations")
        .insert(payload)
        .select()
        .single();
      if (error) {
        setError(error.message);
        return;
      }
      setCitations((prev) => [...prev, data]);
      setEditingCitation(data);
    }
  };

  const deleteCitation = async (c: Citation) => {
    if (
      !window.confirm(
        `Delete citation "${c.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    const { error } = await supabase
      .from("citations")
      .delete()
      .eq("id", c.id);
    if (error) {
      setError(error.message);
      return;
    }
    setCitations((prev) => prev.filter((x) => x.id !== c.id));
    if (editingCitation?.id === c.id) {
      resetCitationForm();
    }
  };

  return (
    <div className="space-y-4 text-sm text-zinc-700">
      {loading && (
        <p className="text-sm text-zinc-600">Loading existing content…</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Tab.Group>
        <Tab.List className="mb-4 inline-flex gap-1 rounded-full bg-zinc-100 p-1 text-xs">
          {["Locations", "Policies & Resistance", "Citations"].map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  "rounded-full px-3 py-1 outline-none",
                  selected
                    ? "bg-zinc-900 text-zinc-50"
                    : "text-zinc-700 hover:bg-zinc-200",
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <form
                onSubmit={saveLocation}
                className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {editingLocation ? "Edit location" : "New location"}
                  </h2>
                  {editingLocation && (
                    <button
                      type="button"
                      onClick={resetLocationForm}
                      className="text-xs text-zinc-500 underline"
                    >
                      New
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Title
                    </label>
                    <input
                      required
                      value={locationForm.title}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Slug
                    </label>
                    <input
                      required
                      value={locationForm.slug}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          slug: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Latitude
                    </label>
                    <input
                      required
                      type="number"
                      step="0.0001"
                      value={locationForm.latitude}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          latitude: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Longitude
                    </label>
                    <input
                      required
                      type="number"
                      step="0.0001"
                      value={locationForm.longitude}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          longitude: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Neighborhood
                    </label>
                    <input
                      value={locationForm.neighborhood}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          neighborhood: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Era / decade label
                    </label>
                    <input
                      value={locationForm.era}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          era: e.target.value,
                        }))
                      }
                      placeholder="e.g. 1970s–present"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Categories (comma-separated)
                  </label>
                  <input
                    value={locationForm.categoriesInput}
                    onChange={(e) =>
                      setLocationForm((f) => ({
                        ...f,
                        categoriesInput: e.target.value,
                      }))
                    }
                    placeholder="sweeps, shelters, redevelopment, policing, zoning, encampment bans"
                    className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Short summary
                  </label>
                  <textarea
                    rows={2}
                    value={locationForm.short_summary}
                    onChange={(e) =>
                      setLocationForm((f) => ({
                        ...f,
                        short_summary: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Narrative (Markdown)
                    </label>
                    <textarea
                      rows={6}
                      value={locationForm.narrative_md}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          narrative_md: e.target.value,
                        }))
                      }
                      className="h-40 w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium">
                      Markdown preview
                    </p>
                    <div className="h-40 overflow-y-auto rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-2 text-xs text-zinc-800">
                      {locationForm.narrative_md ? (
                        <div className="prose prose-xs max-w-none">
                          <ReactMarkdown>
                            {locationForm.narrative_md}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500">
                          Start typing to preview formatted text.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="mb-1 block text-xs font-medium">
                    Images (upload to Supabase Storage)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      setLocationImages(
                        e.target.files ? Array.from(e.target.files) : [],
                      )
                    }
                    className="text-xs"
                  />
                  {editingLocation?.images?.length ? (
                    <p className="text-[11px] text-zinc-500">
                      This location currently has {editingLocation.images.length}{" "}
                      image(s). New uploads will be added; removal can be done
                      later via a maintenance pass.
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      After saving, images will appear on the map detail panel.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={locationForm.published}
                      onChange={(e) =>
                        setLocationForm((f) => ({
                          ...f,
                          published: e.target.checked,
                        }))
                      }
                    />
                    <span>Published (visible on map)</span>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                  >
                    {editingLocation ? "Save changes" : "Create location"}
                  </button>
                </div>
              </form>
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Existing locations
                </h2>
                <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                  {locations.map((loc) => (
                    <li
                      key={loc.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-2 py-1"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">
                          {loc.title}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {loc.neighborhood ?? "No neighborhood"} ·{" "}
                          {loc.published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditLocation(loc)}
                          className="text-[11px] text-zinc-700 underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLocation(loc)}
                          className="text-[11px] text-red-600 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                  {locations.length === 0 && (
                    <li className="text-[11px] text-zinc-500">
                      No locations yet.
                    </li>
                  )}
                </ul>
                {editingLocation && (
                  <div className="space-y-2 border-t border-zinc-200 pt-2 text-xs">
                    <p className="font-semibold text-zinc-900">
                      Citations attached to this location
                    </p>
                    <ul className="space-y-1">
                      {locationLinks.map((link) =>
                        link.citations ? (
                          <li
                            key={link.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div>
                              <p className="font-medium">
                                {link.citations.citation_key}
                              </p>
                              <p className="text-[11px] text-zinc-600">
                                {link.citations.title}
                              </p>
                              {link.context_note && (
                                <p className="text-[11px] text-zinc-500">
                                  Note: {link.context_note}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLocationCitation(link)}
                              className="text-[11px] text-red-600 underline"
                            >
                              Remove
                            </button>
                          </li>
                        ) : null,
                      )}
                      {locationLinks.length === 0 && (
                        <li className="text-[11px] text-zinc-500">
                          No citations linked yet.
                        </li>
                      )}
                    </ul>
                    <div className="space-y-1 border-t border-dashed border-zinc-200 pt-2">
                      <p className="font-semibold text-zinc-900">
                        Attach a citation
                      </p>
                      <div className="flex flex-col gap-1">
                        <select
                          value={locationCitationId}
                          onChange={(e) =>
                            setLocationCitationId(e.target.value)
                          }
                          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                        >
                          <option value="">Select citation…</option>
                          {citations.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.citation_key} — {c.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Context note (optional)"
                          value={locationCitationNote}
                          onChange={(e) =>
                            setLocationCitationNote(e.target.value)
                          }
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={attachLocationCitation}
                          className="self-start rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800"
                        >
                          Attach citation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <form
                onSubmit={savePolicy}
                className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {editingPolicy ? "Edit Policy/Resistance" : "New Policy/Resistance"}
                  </h2>
                  {editingPolicy && (
                    <button
                      type="button"
                      onClick={resetPolicyForm}
                      className="text-xs text-zinc-500 underline"
                    >
                      New
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Title
                    </label>
                    <input
                      required
                      value={policyForm.title}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Slug
                    </label>
                    <input
                      required
                      value={policyForm.slug}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          slug: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      value={policyForm.date}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          date: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Jurisdiction
                    </label>
                    <select
                      value={policyForm.jurisdiction}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          jurisdiction: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                    >
                      <option value="federal">Federal</option>
                      <option value="state">State</option>
                      <option value="county">County</option>
                      <option value="city">City</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Type (Genre)
                    </label>
                    <select
                      value={policyForm.genre}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          genre: e.target.value as "Policy" | "Resistance",
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                    >
                      <option value="Policy">Policy</option>
                      <option value="Resistance">Resistance</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Tags (comma-separated)
                    </label>
                    <input
                      value={policyForm.tagsInput}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          tagsInput: e.target.value,
                        }))
                      }
                      placeholder="encampment bans, policing, supportive housing, zoning"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Short summary
                  </label>
                  <textarea
                    rows={2}
                    value={policyForm.short_summary}
                    onChange={(e) =>
                      setPolicyForm((f) => ({
                        ...f,
                        short_summary: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Narrative (Markdown)
                    </label>
                    <textarea
                      rows={6}
                      value={policyForm.narrative_md}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          narrative_md: e.target.value,
                        }))
                      }
                      className="h-40 w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium">
                      Markdown preview
                    </p>
                    <div className="h-40 overflow-y-auto rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-2 text-xs text-zinc-800">
                      {policyForm.narrative_md ? (
                        <div className="prose prose-xs max-w-none">
                          <ReactMarkdown>
                            {policyForm.narrative_md}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500">
                          Start typing to preview formatted text.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={policyForm.published}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          published: e.target.checked,
                        }))
                      }
                    />
                    <span>Published (visible on timeline)</span>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                  >
                    {editingPolicy ? "Save changes" : "Create item"}
                  </button>
                </div>
              </form>
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Existing items (Policies & Resistance)
                </h2>
                <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                  {policies.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-2 py-1"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {p.date ?? "No date"} · {p.genre} · {p.jurisdiction} ·{" "}
                          {p.published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditPolicy(p)}
                          className="text-[11px] text-zinc-700 underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePolicy(p)}
                          className="text-[11px] text-red-600 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                  {policies.length === 0 && (
                    <li className="text-[11px] text-zinc-500">
                      No policies yet.
                    </li>
                  )}
                </ul>
                {editingPolicy && (
                  <div className="space-y-2 border-t border-zinc-200 pt-2 text-xs">
                    <p className="font-semibold text-zinc-900">
                      Citations attached to this policy
                    </p>
                    <ul className="space-y-1">
                      {policyLinks.map((link) =>
                        link.citations ? (
                          <li
                            key={link.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div>
                              <p className="font-medium">
                                {link.citations.citation_key}
                              </p>
                              <p className="text-[11px] text-zinc-600">
                                {link.citations.title}
                              </p>
                              {link.context_note && (
                                <p className="text-[11px] text-zinc-500">
                                  Note: {link.context_note}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePolicyCitation(link)}
                              className="text-[11px] text-red-600 underline"
                            >
                              Remove
                            </button>
                          </li>
                        ) : null,
                      )}
                      {policyLinks.length === 0 && (
                        <li className="text-[11px] text-zinc-500">
                          No citations linked yet.
                        </li>
                      )}
                    </ul>
                    <div className="space-y-1 border-t border-dashed border-zinc-200 pt-2">
                      <p className="font-semibold text-zinc-900">
                        Attach a citation
                      </p>
                      <div className="flex flex-col gap-1">
                        <select
                          value={policyCitationId}
                          onChange={(e) => setPolicyCitationId(e.target.value)}
                          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
                        >
                          <option value="">Select citation…</option>
                          {citations.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.citation_key} — {c.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Context note (optional)"
                          value={policyCitationNote}
                          onChange={(e) =>
                            setPolicyCitationNote(e.target.value)
                          }
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={attachPolicyCitation}
                          className="self-start rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800"
                        >
                          Attach citation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <form
                onSubmit={saveCitation}
                className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {editingCitation ? "Edit citation" : "New citation"}
                  </h2>
                  {editingCitation && (
                    <button
                      type="button"
                      onClick={resetCitationForm}
                      className="text-xs text-zinc-500 underline"
                    >
                      New
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Citation key
                    </label>
                    <input
                      required
                      value={citationForm.citation_key}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          citation_key: e.target.value,
                        }))
                      }
                      placeholder="author_year_shorttitle"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Author
                    </label>
                    <input
                      value={citationForm.author}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          author: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Title
                    </label>
                    <input
                      required
                      value={citationForm.title}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Year
                    </label>
                    <input
                      type="number"
                      value={citationForm.year}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          year: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Publication
                    </label>
                    <input
                      value={citationForm.publication}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          publication: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      URL
                    </label>
                    <input
                      value={citationForm.url}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          url: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={citationForm.notes}
                      onChange={(e) =>
                        setCitationForm((f) => ({
                          ...f,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                  >
                    {editingCitation ? "Save changes" : "Create citation"}
                  </button>
                </div>
              </form>
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Existing citations
                </h2>
                <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                  {citations.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between gap-2 rounded-md border border-zinc-200 px-2 py-1"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">
                          {c.citation_key}
                        </p>
                        <p className="text-[11px] text-zinc-600">
                          {c.author && `${c.author}. `}
                          <span className="italic">{c.title}</span>
                          {c.publication && `, ${c.publication}`}
                          {c.year && ` (${c.year})`}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEditCitation(c)}
                          className="text-[11px] text-zinc-700 underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCitation(c)}
                          className="text-[11px] text-red-600 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                  {citations.length === 0 && (
                    <li className="text-[11px] text-zinc-500">
                      No citations yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}


