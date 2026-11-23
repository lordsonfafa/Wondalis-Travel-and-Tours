"use client";

import { useState } from "react";
import { Button } from "./Button";

const inputCls =
  "w-full rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";

const topics = ["Booking a trip", "Groups & weddings", "Payments", "Something else"];

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-border bg-white p-8">
        <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
          Message sent
        </h2>
        <p className="mt-2 text-base text-ink-secondary">We will get back to you within a day.</p>
      </div>
    );
  }

  return (
    <form
      // Dummy flow: nothing is sent. The backend will email the team here.
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-5 rounded-lg border border-border bg-white p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm text-ink-secondary">Name</label>
          <input id="name" name="name" required autoComplete="name" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-ink-secondary">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic" className="text-sm text-ink-secondary">Topic</label>
        <select id="topic" name="topic" className={inputCls} defaultValue={topics[0]}>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm text-ink-secondary">Message</label>
        <textarea id="message" name="message" rows={5} required className={inputCls} />
      </div>
      <div>
        <Button type="submit">Send message</Button>
      </div>
    </form>
  );
}
