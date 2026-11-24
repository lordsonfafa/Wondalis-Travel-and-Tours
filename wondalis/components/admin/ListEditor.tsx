"use client";

const iconBtn =
  "flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-white text-base text-forest-900 transition-colors hover:border-forest-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border";

/** A short list of text lines the admin can add to, edit, reorder (with buttons, so it works on keyboard and touch) and remove. */
export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const copy = [...items];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    onChange(copy);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && <p className="text-base text-ink-secondary">Nothing here yet.</p>}
      <ul className="flex flex-col gap-2.5">
        {items.map((value, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              aria-label={`${label} ${i + 1}`}
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
              className="min-w-0 flex-1 rounded-[12px] border border-border bg-ivory px-4 py-3 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500"
            />
            <button type="button" aria-label={`Move ${label.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)} className={iconBtn}>
              ↑
            </button>
            <button type="button" aria-label={`Move ${label.toLowerCase()} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)} className={iconBtn}>
              ↓
            </button>
            <button type="button" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))} className={`${iconBtn} text-kente-red`}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="w-fit text-[15px] font-semibold text-forest-900 hover:underline"
      >
        + {addLabel}
      </button>
    </div>
  );
}
