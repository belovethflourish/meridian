import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">About</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">A quieter way to assess people.</h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-muted-foreground">
        <p>
          Meridian is built for organizations that need both aptitude evidence and a read on attitude. Numerical,
          logical, verbal, and abstract reasoning sit beside personality, leadership, emotional intelligence, and work
          behaviour.
        </p>
        <p>
          Members take assessments. Admins build them and read results for the people they are allowed to see. Super
          admins govern roles, settings, and the whole directory. Profile images follow the same boundary: a member
          never receives an admin portrait, and an admin never receives a super admin portrait.
        </p>
        <p>
          Scoring happens in Postgres. Candidates do not receive answer keys while a test is open. The schema also
          leaves room for organizations, subscriptions, and a queue for AI question drafts and candidate narratives.
        </p>
      </div>
    </main>
  );
}
