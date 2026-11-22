# SEO plan

The client wants the site to rank well. These rules apply to every public page.

## Page structure

- One `<h1>` per page.
- Trip pages: H1 is the trip name; H2s are Overview, Itinerary, What is included.
- Descriptive, keyword-aware headings; no stuffing.

## URLs and metadata

- Each trip has an indexable URL: `/trips/<slug>`.
- Every page has a unique `<title>` and meta description.
- Canonical URLs on all public pages.
- Open Graph and Twitter card tags with a real trip image.
- `sitemap.xml` generated from published trips; `robots.txt` allows public pages.

## Structured data (JSON-LD)

- Trip pages: `TouristTrip` plus `Offer` (price, currency, availability).
- FAQ: `FAQPage`.
- Site-wide: `Organization` (and `LocalBusiness` once contact details are final).

## Landing pages

Two audiences, two entry points:

- "Detty December trips" for diaspora searching for Ghana in December.
- "Trips from Ghana" for clients living in Ghana looking for domestic and international trips.

## Do not index

Checkout, confirmation, account, "My bookings" and all admin routes use `noindex`.

## Performance and accessibility

- LCP under 2.5s on mobile; `next/image` with explicit sizes and AVIF/WebP; `priority` on the hero.
- Gold on ivory fails contrast, so gold is for accents and large display text only.
- Visible focus states; meaningful `alt` text on all photography.

## Launch checklist

- [ ] Real photography with descriptive filenames and alt text
- [ ] Unique title and description for every trip
- [ ] Sitemap submitted to Google Search Console
- [ ] Structured data validated in Rich Results Test
- [ ] Core Web Vitals checked on mobile
- [ ] Google Business Profile set up with final contact details
