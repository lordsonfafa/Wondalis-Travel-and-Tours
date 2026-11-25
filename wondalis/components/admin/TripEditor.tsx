"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveTrip } from "@/app/admin/(panel)/trips/actions";
import { Button } from "@/components/Button";
import { ListEditor } from "./ListEditor";
import { useToast } from "./Toast";
import { useFxRate } from "@/components/FxProvider";
import type { EditorTrip } from "@/lib/data/admin-editor";

const inputCls =
  "w-full rounded-[12px] border border-border bg-ivory px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";
const cardCls = "flex flex-col gap-4 rounded-[20px] border border-border bg-white p-6";
const cardTitle = "font-sans text-xl font-semibold leading-7 text-forest-900";

function Field({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm leading-5 text-ink-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Input with a fixed prefix or suffix inside the box ($, GH₵, %, /trips/). */
function Affixed({
  id,
  prefix,
  suffix,
  ...rest
}: { id: string; prefix?: string; suffix?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-ink-secondary">
          {prefix}
        </span>
      )}
      <input
        id={id}
        {...rest}
        style={{
          paddingLeft: prefix ? `${16 + prefix.length * 9 + 6}px` : undefined,
          paddingRight: suffix ? "2.25rem" : undefined,
        }}
        className={inputCls}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-ink-secondary">
          {suffix}
        </span>
      )}
    </div>
  );
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Day = { id: number; title: string; body: string };

export function TripEditor({ initial, mode }: { initial: EditorTrip; mode: "edit" | "new" }) {
  const rate = useFxRate();
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [seoTouched, setSeoTouched] = useState(mode === "edit");
  const [ghsTouched, setGhsTouched] = useState(mode === "edit");
  const router = useRouter();
  const toast = useToast();
  const [saving, startSaving] = useTransition();
  const [photoUrl, setPhotoUrl] = useState("");

  const nextId = useRef(initial.itinerary.length);
  const [days, setDays] = useState<Day[]>(initial.itinerary.map((d, id) => ({ id, ...d })));
  const [editingId, setEditingId] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);

  const set = <K extends keyof EditorTrip>(key: K, value: EditorTrip[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function onTitle(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
      seoTitle: seoTouched ? f.seoTitle : title,
    }));
  }

  function onUsd(value: string) {
    setForm((f) => ({
      ...f,
      priceUsd: value,
      priceGhs:
        ghsTouched || value === "" ? f.priceGhs : String(Math.round(Number(value) * rate)),
    }));
  }

  function addDay() {
    const id = nextId.current++;
    setDays((d) => [...d, { id, title: "", body: "" }]);
    setEditingId(id);
  }

  function moveDay(to: number, fromIndex?: number) {
    const from = fromIndex ?? dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === to || to < 0) return;
    setDays((d) => {
      if (to >= d.length) return d;
      const copy = [...d];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  // Photos are added by address for now (a path like /images/x.png or an https link).
  // Uploading files from the computer needs file storage, which is not connected yet.
  function addPhoto() {
    const url = photoUrl.trim();
    if (!/^\/(?!\/)/.test(url) && !/^https:\/\//.test(url)) {
      return toast("Enter a photo address starting with / or https://", "error");
    }
    setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
    setPhotoUrl("");
  }

  function save(publish: boolean) {
    if (!form.title.trim()) return toast("Add a trip title first.", "error");
    if (!form.slug) return toast("Add a URL slug first.", "error");

    startSaving(async () => {
      const result = await saveTrip({
        ...form,
        originalSlug: mode === "edit" ? initial.slug : undefined,
        published: publish,
        itinerary: days.map(({ title, body }) => ({ title, body })),
      });
      if (!result.ok) return toast(result.error, "error");

      setForm((f) => ({ ...f, published: publish }));
      if (mode === "new") {
        toast(publish ? "Trip published" : "Draft saved");
        router.push("/admin/trips");
      } else {
        toast(publish ? "Changes published" : "Changes saved as a draft");
        if (result.slug !== initial.slug) router.replace(`/admin/trips/${result.slug}`); // the address changed
        else router.refresh();
      }
    });
  }

  const heading = form.title.trim() || "New trip";

  return (
    <div className="flex flex-col gap-7">
      {/* Top bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="text-sm leading-5 text-ink-secondary">
            <Link href="/admin/trips" className="hover:text-forest-900 hover:underline">
              Trips
            </Link>
            <span aria-hidden className="px-2">/</span>
            <span>{mode === "edit" ? "Edit trip" : "New trip"}</span>
          </nav>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
            {heading}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => save(false)} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Main form */}
        <div className="flex min-w-0 flex-col gap-6">
          <section className={cardCls}>
            <h2 className={cardTitle}>Basics</h2>
            <Field label="Trip title" htmlFor="title">
              <input
                id="title"
                value={form.title}
                onChange={(e) => onTitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="type">
                <div className="relative">
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => set("type", e.target.value as EditorTrip["type"])}
                    className={`${inputCls} appearance-none pr-10`}
                  >
                    <option value="ghana">In Ghana</option>
                    <option value="abroad">Abroad</option>
                  </select>
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-secondary">
                    ⌄
                  </span>
                </div>
              </Field>
              <Field label="Destination" htmlFor="destination">
                <input
                  id="destination"
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
                  placeholder="Accra · Labadi"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitle}>Overview and highlights</h2>
            <Field label="Overview" htmlFor="overview">
              <textarea
                id="overview"
                rows={3}
                value={form.overview}
                onChange={(e) => set("overview", e.target.value)}
                placeholder="One or two sentences that sell the trip."
                className={`${inputCls} resize-y`}
              />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm leading-5 text-ink-secondary">Highlights</span>
              <ListEditor
                label="Highlight"
                items={form.highlights}
                onChange={(v) => set("highlights", v)}
                placeholder="Beach day at Labadi"
                addLabel="Add highlight"
              />
            </div>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitle}>Dates and pricing</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Departure" htmlFor="departure">
                <input id="departure" type="date" value={form.departure} onChange={(e) => set("departure", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Return" htmlFor="return">
                <input id="return" type="date" value={form.returnDate} min={form.departure || undefined} onChange={(e) => set("returnDate", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Seats" htmlFor="seats">
                <input id="seats" type="number" min={1} value={form.seats} onChange={(e) => set("seats", e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (USD)" htmlFor="price-usd">
                <Affixed id="price-usd" prefix="$" type="number" min={0} value={form.priceUsd} onChange={(e) => onUsd(e.target.value)} />
              </Field>
              <Field label="Price (GHS)" htmlFor="price-ghs">
                <Affixed
                  id="price-ghs"
                  prefix="GH₵"
                  type="number"
                  min={0}
                  value={form.priceGhs}
                  onChange={(e) => {
                    setGhsTouched(true);
                    set("priceGhs", e.target.value);
                  }}
                />
              </Field>
              <Field label="Deposit" htmlFor="deposit">
                <Affixed id="deposit" suffix="%" type="number" min={0} max={100} value={form.depositPct} onChange={(e) => set("depositPct", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className={cardCls}>
            <div className="flex items-center justify-between gap-4">
              <h2 className={cardTitle}>Itinerary</h2>
              <Button variant="secondary" onClick={addDay}>
                Add day
              </Button>
            </div>
            {days.length === 0 && (
              <p className="text-base text-ink-secondary">No days yet. Add the first day.</p>
            )}
            <ol className="flex flex-col gap-4">
              {days.map((d, i) => {
                const editing = editingId === d.id;
                return (
                  <li
                    key={d.id}
                    draggable={!editing}
                    onDragStart={() => (dragFrom.current = i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => moveDay(i)}
                    className="flex flex-col gap-3 rounded-[12px] border border-border bg-ivory px-4 py-3.5"
                  >
                    <div className="flex items-center gap-4">
                    <span aria-hidden title="Drag to reorder" className="cursor-grab select-none text-base text-ink-secondary">
                      ⋮⋮
                    </span>
                    <span className="shrink-0 text-xs font-bold leading-4 tracking-[2px] text-forest-500">
                      DAY {i + 1}
                    </span>
                    {editing ? (
                      <input
                        autoFocus
                        aria-label={`Day ${i + 1} title`}
                        value={d.title}
                        onChange={(e) =>
                          setDays((all) => all.map((x) => (x.id === d.id ? { ...x, title: e.target.value } : x)))
                        }
                        onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                        className="min-w-0 flex-1 rounded-sm border border-border bg-white px-3 py-1.5 text-base text-ink focus:border-forest-500"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-base text-ink">
                        {d.title || "Untitled day"}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Move day ${i + 1} up`}
                      disabled={i === 0}
                      onClick={() => moveDay(i - 1, i)}
                      className="shrink-0 text-base text-forest-900 hover:text-forest-500 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move day ${i + 1} down`}
                      disabled={i === days.length - 1}
                      onClick={() => moveDay(i + 1, i)}
                      className="shrink-0 text-base text-forest-900 hover:text-forest-500 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(editing ? null : d.id)}
                      className="shrink-0 text-[15px] font-semibold text-forest-900 hover:underline"
                    >
                      {editing ? "Done" : "Edit"}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => {
                          setDays((all) => all.filter((x) => x.id !== d.id));
                          setEditingId(null);
                        }}
                        className="shrink-0 text-[15px] font-semibold text-kente-red hover:underline"
                      >
                        Remove
                      </button>
                    )}
                    </div>
                    {editing && (
                      <textarea
                        aria-label={`Day ${i + 1} description`}
                        rows={2}
                        value={d.body}
                        onChange={(e) =>
                          setDays((all) => all.map((x) => (x.id === d.id ? { ...x, body: e.target.value } : x)))
                        }
                        placeholder="What happens on this day"
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitle}>What is included</h2>
            <ListEditor
              label="Included item"
              items={form.included}
              onChange={(v) => set("included", v)}
              placeholder="Airport pickup and drop-off"
              addLabel="Add item"
            />
          </section>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <section className="flex items-center justify-between rounded-[20px] border border-border bg-white p-6">
            <span id="published-label" className={cardTitle}>
              {form.published ? "Published" : "Draft"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={form.published}
              aria-labelledby="published-label"
              onClick={() => set("published", !form.published)}
              className={`relative h-[26px] w-12 shrink-0 rounded-full transition-colors ${
                form.published ? "bg-[#2e7d4f]" : "bg-border"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-[22px] rounded-full bg-white shadow transition-transform ${
                  form.published ? "translate-x-[22px]" : ""
                }`}
              />
            </button>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitle}>Gallery</h2>
            <ul className="flex flex-wrap gap-2.5">
              {form.gallery.map((src, i) => (
                <li key={`${src}-${i}`} className="relative size-24 overflow-hidden rounded-[12px]">
                  <Image src={src} alt="" fill sizes="96px" unoptimized className="object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, j) => j !== i) }))}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-forest-900/80 text-sm leading-none text-ivory hover:bg-forest-900"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                aria-label="Photo address"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPhoto();
                  }
                }}
                placeholder="/images/trip-accra.png or https://…"
                className={`${inputCls} min-w-0 flex-1`}
              />
              <Button variant="secondary" onClick={addPhoto}>
                Add
              </Button>
            </div>
            <p className="text-sm leading-5 text-ink-secondary">
              The first photo is the cover. Uploading files from your computer is coming soon.
            </p>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitle}>Search listing</h2>
            <Field label="URL slug" htmlFor="slug">
              <Affixed
                id="slug"
                prefix="/trips/"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
                }}
                onBlur={() => set("slug", form.slug.replace(/^-+|-+$/g, ""))}
              />
            </Field>
            <Field label="SEO title" htmlFor="seo-title">
              <input
                id="seo-title"
                value={form.seoTitle}
                onChange={(e) => {
                  setSeoTouched(true);
                  set("seoTitle", e.target.value);
                }}
                className={inputCls}
              />
            </Field>
            <div className="flex flex-col gap-0.5 rounded-[12px] bg-ivory px-4 py-3.5">
              <p className="break-words text-sm leading-5 text-ink-secondary">
                wondalis.com › trips › {form.slug || "your-trip"}
              </p>
              <p className="text-xl font-semibold leading-7 text-[#2e7d4f]">
                {form.seoTitle || "Your trip title"}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}