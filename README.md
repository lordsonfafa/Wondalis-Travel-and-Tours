# Wondalis Travel & Tour

Booking and payment platform for **Wondalis Travel & Tour**: trips across Ghana and abroad, built for diaspora travellers visiting for Detty December and for clients living in Ghana.

> **Status:** design phase. Designs are in Figma; application code has not been scaffolded yet. See [Roadmap](#roadmap).

## What it does

- **Customer site:** browse trips, filter by *All / In Ghana / Abroad*, view a trip, reserve, pay a 30% deposit or in full, and get a confirmation.
- **Admin side:** manage trips, bookings, customers, payments and settings, with Owner and Staff roles.
- **Payments:** card for the diaspora, mobile money for Ghana (MTN MoMo, Telecel Cash, AirtelTigo), and bank transfer. Every trip is priced in USD and GHS, with GBP / EUR / CAD shown for display.
- **Search-first:** every trip has its own indexable page, structured data, and landing pages for both audiences.

## Design

- Figma: <https://www.figma.com/design/1vqiU0jenwrRl70bDPuLzD> (pages: Design System, Desktop, Mobile)
- Look: warm, elegant, celebratory. Forest green and gold on ivory, serif headlines, real photography, minimal copy.
- Full details: [docs/design-spec.md](docs/design-spec.md)

## Planned stack

| Area | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript, SSR/SSG for public pages |
| Styling | Tailwind CSS using the design tokens in the spec |
| Fonts | Playfair Display (headlines), DM Sans (UI and body) |
| Payments | Paystack or Flutterwave (cards plus Ghana mobile money) |
| Data | Trip, Departure, Booking, Traveller, Payment (instalments), Customer, User |

The stack is a proposal and can change before the first scaffold. See [docs/architecture.md](docs/architecture.md).

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/design-spec.md](docs/design-spec.md) | Scope, design rules, tokens, screens, booking flow, admin side |
| [docs/architecture.md](docs/architecture.md) | Proposed architecture, data model, payments, security |
| [docs/seo.md](docs/seo.md) | URL structure, metadata, structured data, performance targets |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching, commits, and how to work on the project |

## Getting started

There is nothing to run yet. Once the app is scaffolded, setup will look like this:

```bash
git clone https://github.com/lordsonfafa/Wondalis-Travel-and-Tours.git
cd Wondalis-Travel-and-Tours
cp .env.example .env.local   # fill in values
npm install
npm run dev
```

## Roadmap

- [x] Design system, customer screens, admin screens and mobile screens in Figma
- [ ] Remaining designs: sign-in / account, "My bookings", FAQ, admin login, empty and error states, mobile admin
- [ ] Scaffold Next.js app and design tokens
- [ ] Public pages: Home, Trips, Trip detail, landing pages, FAQ
- [ ] Booking flow and payment gateway integration
- [ ] Admin: trips, bookings, customers, payments, settings
- [ ] SEO pass: metadata, JSON-LD, sitemap, performance (LCP under 2.5s on mobile)
- [ ] Replace placeholder content and AI-generated photos with real content

## Placeholder content

Trip names, prices, dates, itineraries, admin sample data, contact details and the AI-generated photos in the designs are placeholders. Replace them with the client's real content before launch.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).
