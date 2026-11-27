"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deletePlace, savePlace } from "@/app/admin/(panel)/places/actions";
import { Button } from "@/components/Button";
import type { PlaceItem } from "@/lib/db/places";
import { CATEGORIES } from "@/lib/place-categories";
import { useToast } from "./Toast";

const inputCls = "w-full rounded-[12px] border border-border bg-white px-4 py-3 text-base text-ink focus:border-forest-500";

type Draft = Omit<PlaceItem, "id" | "slug"> & { id?: string };
const blank: Draft = { name: "", region: "GHANA", area: "", category: "", description: "", image: "", active: true, position: 0 };

export function PlacesView({ initial }: { initial: PlaceItem[] }) {
  const toast = useToast();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open(p?: PlaceItem) {
    setDraft(p ? { id: p.id, name: p.name, region: p.region, area: p.area, category: p.category, description: p.description, image: p.image, active: p.active, position: p.position } : blank);
    dialogRef.current?.showModal();
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error("Use a JPG, PNG, WebP or AVIF photo.");
      if (file.size > 8 * 1024 * 1024) throw new Error("The photo must be under 8 MB.");
      const res = await fetch("/api/admin/upload", { method: "POST" });
      const sig = await res.json().catch(() => null);
      if (!res.ok || !sig?.signature) throw new Error(sig?.error ?? "Could not start the upload.");
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sig.apiKey);
      body.append("timestamp", String(sig.timestamp));
      body.append("signature", sig.signature);
      body.append("folder", sig.folder);
      body.append("allowed_formats", sig.allowedFormats);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
      const result = await up.json().catch(() => null);
      if (!up.ok || !result?.secure_url) throw new Error(result?.error?.message ?? "The upload was refused.");
      setDraft((d) => ({ ...d, image: result.secure_url as string }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startSaving(async () => {
      const res = await savePlace(draft);
      if (!res.ok) return toast(res.error, "error");
      dialogRef.current?.close();
      toast(draft.id ? "Place saved" : "Place added");
      router.refresh();
    });
  }

  function remove(p: PlaceItem) {
    if (!window.confirm(`Delete ${p.name}? Requests that already include it keep its name.`)) return;
    startSaving(async () => {
      const res = await deletePlace(p.id);
      if (!res.ok) return toast(res.error, "error");
      toast("Place deleted");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="hidden font-serif text-3xl font-semibold leading-tight text-forest-900 lg:block lg:text-[40px] lg:leading-[48px]">Places</h1>
          <p className="text-base text-ink-secondary">The places customers can choose on the Build a trip page.</p>
        </div>
        <Button onClick={() => open()}>Add place</Button>
      </div>

      {initial.length === 0 ? (
        <p className="rounded-[20px] border border-border bg-white p-10 text-center text-ink-secondary">No places yet. Add the first one so customers can start choosing.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {initial.map((p) => (
            <li key={p.id} className="flex gap-4 rounded-[20px] border border-border bg-white p-4">
              <span className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-forest-900">
                {p.image && <Image src={p.image} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-lg font-semibold text-forest-900">{p.name}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {p.region === "GHANA" ? "Ghana" : "Abroad"}
                  {p.area ? ` · ${p.area}` : ""}
                  {p.category ? ` · ${p.category}` : ""}
                </p>
                <p className={`text-xs font-bold tracking-[1.5px] ${p.active ? "text-[#2e7d4f]" : "text-ink-secondary"}`}>{p.active ? "VISIBLE" : "HIDDEN"}</p>
                <div className="mt-1 flex gap-4 text-sm font-semibold">
                  <button type="button" onClick={() => open(p)} className="text-forest-900 hover:underline">Edit</button>
                  <button type="button" onClick={() => remove(p)} disabled={saving} className="text-kente-red hover:underline">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialogRef} aria-labelledby="place-title" className="m-auto max-h-[92vh] w-[calc(100%-2.5rem)] max-w-lg overflow-y-auto rounded-[20px] border border-border bg-white p-0 backdrop:bg-forest-900/50">
        <form onSubmit={submit} className="flex flex-col gap-4 p-7">
          <h2 id="place-title" className="font-serif text-[28px] font-semibold leading-9 text-forest-900">{draft.id ? "Edit place" : "Add place"}</h2>
          <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Name
            <input required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Where is it?
              <select value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value as "GHANA" | "ABROAD" })} className={inputCls}>
                <option value="GHANA">In Ghana</option>
                <option value="ABROAD">Abroad</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Category
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls}>
                <option value="">None</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">City or area (for example Cape Coast, or Dubai, UAE)
            <input maxLength={80} value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Short description
            <textarea rows={3} maxLength={400} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={`${inputCls} resize-y`} />
          </label>
          <div className="flex flex-col gap-2 text-sm text-ink-secondary">
            Photo
            {draft.image && (
              <span className="relative h-36 w-full overflow-hidden rounded-[12px] bg-forest-900">
                <Image src={draft.image} alt="" fill sizes="480px" className="object-cover" />
              </span>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} className="text-sm" />
            {uploading && <span>Uploading…</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Order (lowest first)
              <input type="number" min={0} max={9999} value={draft.position} onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })} className={inputCls} />
            </label>
            <label className="flex items-center gap-3 pt-6 text-base text-ink">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="size-5 accent-forest-900" />
              Visible to customers
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? "Saving…" : "Save place"}</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
