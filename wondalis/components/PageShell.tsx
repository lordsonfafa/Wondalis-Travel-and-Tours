import { Footer } from "./Footer";
import { Nav } from "./Nav";

export const gutter = "px-5 md:px-12 lg:px-24";

/** Standard public page: nav, sand title band (one H1 + one short line), content, footer. */
export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>
        <header className="bg-sand">
          <div
            className={`animate-fade-up mx-auto flex max-w-[1440px] flex-col gap-4 py-14 lg:py-[72px] ${gutter}`}
          >
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 lg:text-[56px] lg:leading-[64px]">
              {title}
            </h1>
            {intro && <p className="max-w-2xl text-lg leading-7 text-ink-secondary">{intro}</p>}
          </div>
        </header>
        {children}
      </main>
      <Footer />
    </>
  );
}

/** Content block with the site gutters and vertical rhythm. */
export function Section({
  children,
  className = "",
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <section className={`mx-auto max-w-[1440px] py-14 lg:py-20 ${gutter} ${className}`}>
      <div className={narrow ? "max-w-3xl" : ""}>{children}</div>
    </section>
  );
}
