"use client";

export function Switch({
  checked,
  onChange,
  labelId,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#2e7d4f]" : "bg-border"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-[22px] rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : ""
        }`}
      />
    </button>
  );
}