export default function Home() {
  return (
    <div className="space-y-8">
      <section className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Mapping Neoliberal Housing Logic in Los Angeles
        </h1>
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
          Interactive map · policy timeline · critical bibliography
        </p>
        <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          This project examines how{" "}
          <span className="font-semibold">neoliberal housing logic</span>—the
          prioritization of property values, market solutions, and austerity—has
          structured homelessness policy in Los Angeles and the United States.
          By layering locations, policies, and citations, the site invites users
          to see homelessness not as an individual failure, but as the outcome
          of political and spatial decisions.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Map Explorer
          </h2>
          <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
            Navigate key sites in Los Angeles—encampments, redevelopment zones,
            shelters, policing hotspots—and read narrative case studies that
            connect place to policy.
          </p>
          <a
            href="/hist12b/map"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Open the interactive map →
          </a>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Policy Timeline
          </h2>
          <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
            Trace federal, state, and local homelessness and housing policies
            over time, grouped by decade and tagged by theme.
          </p>
          <a
            href="/hist12b/policies"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Browse the timeline →
          </a>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sources & Methods
          </h2>
          <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
            Explore our bibliography and methods, including how we define
            neoliberal housing logic, our archive, and limits of the project.
          </p>
          <div className="space-x-3 text-sm font-medium text-zinc-900">
            <a
              href="/hist12b/sources"
              className="underline underline-offset-4"
            >
              View sources
            </a>
            <a
              href="/hist12b/about"
              className="underline underline-offset-4"
            >
              Read methods
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-3xl space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          How to use this site
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Use the <span className="font-semibold">Map</span> to locate
            specific neighborhoods, sweeps, shelters, and redevelopment
            projects.
          </li>
          <li>
            Use the <span className="font-semibold">Policy Timeline</span> to
            follow key federal, state, and city policies and see where they land
            on the map.
          </li>
          <li>
            Use the <span className="font-semibold">Sources</span> page to trace
            how each citation is mobilized across locations and policies.
          </li>
        </ul>
      </section>
    </div>
  );
}
