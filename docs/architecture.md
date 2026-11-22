# Architecture (proposal)

This is the proposed shape of the system. Nothing here is built yet; confirm choices before scaffolding.

## Overview

One Next.js application serves the public site, the checkout, the customer account and the admin area.

| Area | Rendering | Indexed |
| --- | --- | --- |
| Home, Trips, Trip detail, landing pages, FAQ | SSG / ISR | Yes |
| Checkout, confirmation, account, "My bookings" | SSR / client | No (`noindex`) |
| Admin | SSR, auth required | No (`noindex`) |

## Data model

- **Trip:** title, slug, type (Ghana / Abroad), destination, description, itinerary days, gallery, USD and GHS price, deposit %, status (Draft / Published), SEO title and description.
- **Departure:** a dated run of a Trip, with seat count and seats booked.
- **Booking:** a customer's reservation on a Departure, with payment status and balance due date.
- **Traveller:** a person on a Booking.
- **Payment:** a transaction or instalment against a Booking (method: card, mobile money, bank; status: pending, paid, failed).
- **Customer:** contact details and origin (Diaspora / In Ghana).
- **User:** admin team member with a role (Owner or Staff).

## Payments

- Gateway: Paystack or Flutterwave, since both support cards and Ghana mobile money. Decision pending.
- Customers pay a 30% deposit or the full amount. The balance has a due date set in Settings.
- Confirm payments from the gateway's **webhook**, not from the browser redirect. Verify the signature and make handling idempotent.
- Store prices in both USD and GHS per trip. Convert display currencies (GBP, EUR, CAD) from the base rate in Settings.
- Bank transfer and manual payments are recorded by admin staff.

## Security

- Admin authentication and role checks are enforced **server-side** on every route and action. Never rely on hidden UI.
- Staff cannot reach Settings or payments configuration.
- Secrets live in environment variables only (see `.env.example`); never commit them.
- Keep card data off our servers; use the gateway's hosted fields or checkout.
- Validate all input on the server. Rate-limit auth and booking endpoints.

## Performance

- `next/image` with explicit sizes, AVIF/WebP, and `priority` on the hero image.
- Self-host fonts through `next/font`.
- Target: LCP under 2.5s on mobile.

## Open decisions

- Database and ORM (for example PostgreSQL with Prisma).
- Auth library for customers and admin.
- Payment gateway: Paystack or Flutterwave.
- Transactional email and SMS provider for confirmations and reminders.
- Hosting and region.
