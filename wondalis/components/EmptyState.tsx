import Image from "next/image";
import { Button } from "./Button";

/** Full-width centred empty state: star badge, big serif title, one button. */
export function EmptyState({
  title,
  actionLabel,
  actionHref,
  actionVariant = "primary",
}: {
  title: string;
  actionLabel: string;
  actionHref: string;
  actionVariant?: "primary" | "secondary";
}) {
  return (
    <section className="flex flex-col items-center gap-8 px-5 pb-24 pt-20 text-center md:px-12 lg:px-24 lg:pb-40 lg:pt-[140px]">
      <div className="flex size-24 items-center justify-center rounded-full bg-gold-100">
        <Image src="/icons/star-nav.svg" alt="" width={40} height={40} />
      </div>
      <h1 className="animate-fade-up font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 lg:text-[56px] lg:leading-[64px]">
        {title}
      </h1>
      <Button href={actionHref} variant={actionVariant}>
        {actionLabel}
      </Button>
    </section>
  );
}
