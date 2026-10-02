import type { Metadata } from "next";
import Link from "next/link";
import { FALLBACK_PLANS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pricing" };

async function loadPlans(): Promise<Plan[]> {
  if (!isSupabaseConfigured()) return FALLBACK_PLANS;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("plans").select("code, name, description, price_cents, interval, features").eq("is_active", true);
    if (error || !data?.length) return FALLBACK_PLANS;
    return data as Plan[];
  } catch {
    return FALLBACK_PLANS;
  }
}

export default async function PricingPage() {
  const plans = await loadPlans();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Pricing</p>
      <h1 className="mt-3 max-w-xl font-serif text-5xl tracking-tight">Start with a catalog. Grow into your own.</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Plans are stored in the database so a later billing integration can attach a subscription to an organization
        without reshaping the product.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.code} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="font-serif text-4xl">
                {plan.price_cents === 0 ? "Custom" : `$${(plan.price_cents / 100).toFixed(0)}`}
                {plan.price_cents > 0 ? <span className="text-base text-muted-foreground"> / {plan.interval}</span> : null}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/contact">{plan.price_cents === 0 ? "Talk to us" : "Get started"}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
