import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const aptitude = CATEGORIES.filter((category) => category.group === "Aptitude");
  const attitude = CATEGORIES.filter((category) => category.group === "Attitude");

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Attitude and aptitude</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
            See how people think, and how they work.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Meridian is the workspace where organizations publish assessments, candidates take them under a timer, and
            leaders read a score they can defend.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Workplace Readiness</p>
          <p className="mt-3 font-serif text-5xl">82%</p>
          <div className="mt-6 space-y-4 text-sm">
            {[
              ["Numerical Reasoning", "85%"],
              ["Logical Reasoning", "78%"],
              ["Leadership", "90%"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b pb-3">
                <span>{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-3">
        {[
          ["Publish", "Admins write aptitude items with a right answer, and attitude items on a scale."],
          ["Sit the assessment", "Members work against a countdown. Answers save as they move between questions."],
          ["Read the report", "Scores, strengths, and weaknesses are calculated on the server, not in the browser."],
        ].map(([title, copy]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{copy}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 md:grid-cols-2">
        {[
          ["Aptitude", aptitude],
          ["Attitude", attitude],
        ].map(([title, items]) => (
          <div key={title as string}>
            <h2 className="font-serif text-3xl">{title as string}</h2>
            <div className="mt-4 space-y-3">
              {(items as typeof CATEGORIES).map((category) => (
                <div key={category.value} className="rounded-xl border bg-card px-4 py-3">
                  <p className="font-medium">{category.label}</p>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
