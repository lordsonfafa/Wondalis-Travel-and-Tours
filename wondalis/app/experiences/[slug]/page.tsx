import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";
import { getPastTripBySlug } from "@/lib/db/trips";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getPastTripBySlug(slug);
  if (!trip) return {};
  const description = trip.note || trip.overview || `Photos and videos from ${trip.title}.`;
  return {
    title: `${trip.title}, ${trip.dates}`,
    description,
    alternates: { canonical: `/experiences/${slug}` },
    openGraph: { title: trip.title, description, images: [trip.cover] },
  };
}

async function Recap({ params }: Props) {
  const { slug } = await params;
  const trip = await getPastTripBySlug(slug);
  if (!trip) notFound();

  return (
    <PageShell title={trip.title} intro={`${trip.destination} · ${trip.dates}`}>
      <Section className="flex flex-col gap-12">
        {(trip.note || trip.overview) && (
          <div className="flex max-w-3xl flex-col gap-4">
            {trip.note && (
              <p className="font-serif text-2xl font-semibold leading-9 text-forest-900">{trip.note}</p>
            )}
            {trip.overview && <p className="text-lg leading-7 text-ink-secondary">{trip.overview}</p>}
          </div>
        )}

        {trip.videos.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {trip.videos.map((v, i) =>
              v.kind === "embed" ? (
                <div key={i} className="aspect-video overflow-hidden rounded-lg border border-border bg-sand">
                  <iframe
                    src={v.src}
                    title={`${trip.title}: ${v.title} ${i + 1}`}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="size-full"
                  />
                </div>
              ) : (
                <a
                  key={i}
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-video items-center justify-center rounded-lg border border-border bg-sand text-lg font-semibold text-forest-900 underline"
                >
                  Watch video {i + 1}
                </a>
              ),
            )}
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trip.gallery.map((src, i) => (
            <li key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={src}
                alt={`${trip.title}, photo ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-start gap-4 rounded-lg bg-sand p-8">
          <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">Want to be on the next one?</h2>
          <p className="text-base leading-6 text-ink-secondary">See what is coming up and book your seat.</p>
          <Button href="/trips">See upcoming trips</Button>
        </div>
      </Section>
    </PageShell>
  );
}

export default function PastTripPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Recap params={params} />
    </Suspense>
  );
}
