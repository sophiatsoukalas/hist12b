export type Location = {
  id: string;
  title: string;
  slug: string;
  latitude: number;
  longitude: number;
  geometry_json: any | null;
  neighborhood: string | null;
  categories: string[];
  era: string | null;
  short_summary: string | null;
  narrative_md: string | null;
  images: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type Policy = {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  jurisdiction: "federal" | "state" | "city" | "county";
  short_summary: string | null;
  narrative_md: string | null;
  tags: string[];
  genre: "Policy" | "Resistance";
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type Citation = {
  id: string;
  citation_key: string;
  title: string;
  author: string | null;
  year: number | null;
  publication: string | null;
  url: string | null;
  notes: string | null;
  created_at: string;
};

