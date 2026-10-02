"use client";

import { useState } from "react";
import { sendContactMessage } from "@/server/contact";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await sendContactMessage({
      name: formData.get("name"),
      email: formData.get("email"),
      organization: formData.get("organization"),
      message: formData.get("message"),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-primary">Message received. We will reply to the email you entered.</p>;
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Name">
        <Input name="name" required />
      </Field>
      <Field label="Work email">
        <Input name="email" type="email" required />
      </Field>
      <Field label="Organization">
        <Input name="organization" />
      </Field>
      <Field label="How can we help?">
        <Textarea name="message" required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={pending} type="submit">
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
