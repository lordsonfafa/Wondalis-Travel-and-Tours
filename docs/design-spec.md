# Design spec

Figma: <https://www.figma.com/design/1vqiU0jenwrRl70bDPuLzD> (pages: Design System, Desktop, Mobile)

Last updated: 22 Nov 2026. Designs may still change.

## Scope

- Audiences: diaspora visiting Ghana for Detty December, and clients living in Ghana.
- Trips: inland (in Ghana) and outland (abroad). Trip type is a first-class filter: All / In Ghana / Abroad.
- Customer site plus admin side.

## Design rules

- Warm, elegant, celebratory. Forest green and gold on ivory, serif headlines, real photography.
- Minimal copy. No filler or add-on text: one headline, at most one short line of support, then the action. Trip cards show only location, title, nights, dates and price.

## Tokens

### Colours

| Token | Hex |
| --- | --- |
| forest-900 | `#0B2A24` |
| forest-700 | `#14463C` |
| forest-500 | `#1F6B5A` |
| gold-500 | `#D4A24C` |
| gold-300 | `#E8C98A` |
| gold-100 | `#F6EBD3` |
| kente-red | `#B83A26` |
| ivory | `#FBF7F0` |
| sand | `#F1E8D8` |
| border | `#E4DAC8` |
| text | `#1A1A17` |
| text-secondary | `#5E5A50` |

### Type

- Headlines: Playfair Display. UI and body: DM Sans.
- Display 72/56, H1 40, H2 28, H3 20, Body 18/16/14, Button 15, Eyebrow 12.

### Shape and spacing

- Radius: 8 / 14 / 24 / pill.
- Spacing: 4 to 96.

## Design status

- **Design System page:** tokens, text styles, Button set, Trip Card, Nav, Footer, Admin/Sidebar.
- **Desktop, customer (1440):** Home, Trips, Trip detail, Checkout, Confirmation.
- **Desktop, admin:** Dashboard, Trips, Trip editor, Bookings, Customers, Payments, Settings.
- **Mobile (390):** Home, Trips, Trip detail, Checkout, Confirmation.
- **Not yet designed:** sign-in / account, "My bookings" for customers, FAQ, admin login, empty and error states, mobile admin.

## Booking flow

Trip detail → Reserve → Traveller details → Payment (30% deposit or full) → Confirmation.

- Payment methods: card (diaspora), mobile money (Ghana: MTN MoMo, Telecel Cash, AirtelTigo), bank transfer.
- Currency: USD and GHS prices on every trip; GBP, EUR and CAD display for diaspora.

## Admin side

Roles: **Owner** (everything) and **Staff** (bookings and customers, no settings or payments config).

- **Dashboard:** revenue collected, bookings, outstanding balances, seats left, recent bookings, upcoming departures with seats booked.
- **Trips:** table with type (Ghana / Abroad), dates, price, seats, status (Draft / Published).
- **Trip editor:** title, type, destination, dates, seats, USD and GHS price, deposit %, itinerary days, gallery, publish toggle, URL slug and SEO title with search preview.
- **Bookings:** filter by payment status; detail panel with instalment schedule; record manual payment; send reminder; CSV export.
- **Customers:** searchable list, Diaspora / In Ghana filter, bookings, paid and balance, CSV export.
- **Payments:** collected / pending / failed totals; transaction table by method (card, mobile money, bank); status filter; CSV export for reconciliation.
- **Settings:** base currency and USD to GHS rate, display currencies, payment methods on/off, default deposit and balance due date, team users and roles, cancellation policy text.

## Accessibility

- Gold text on ivory fails contrast. Use gold for accents and large display only.
- Visible focus states on every interactive element.

## Placeholder content to replace

Trip names, prices, dates, itineraries, admin sample data, contact details, and the AI-generated photos (swap for real photography).
