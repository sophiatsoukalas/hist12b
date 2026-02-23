export default function AboutPage() {
  return (
    <div className="space-y-4">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Methods</h1>
        <p className="text-sm text-zinc-700">
          Definitions, scope, and methodological notes for the project{" "}
          <span className="font-semibold">
            “Neoliberal Housing Logic &amp; Homelessness Policy in the United
            States.”
          </span>
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            Defining neoliberal housing logic
          </h2>
          <p>
            In this project, neoliberal housing logic refers to policies and
            discourses that prioritize property values, market incentives, and
            austerity over guarantees of housing as a social right. This often
            appears through criminalization, redevelopment, and “service” models
            that condition aid on compliance.
          </p>
        </div>
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            Scope & limitations
          </h2>
          <p>
            The map centers Los Angeles but connects to federal and statewide
            shifts. It is{" "}
            <span className="font-semibold">illustrative, not exhaustive</span>:
            we highlight a curated set of locations and policies to support
            classroom discussion rather than provide a full archive.
          </p>
        </div>
      </section>
      <section className="max-w-3xl space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
          Acknowledgements
        </h2>
        <p>
          This project was created for HIST 12B and draws on work by
          historians, geographers, urban planners, unhoused organizers, and
          local mutual aid groups. See the{" "}
          <a
            href="/sources"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Sources
          </a>{" "}
          page for full citations.
        </p>
      </section>
    </div>
  );
}

