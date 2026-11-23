import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wondalis.com"), // TODO: replace with the real domain
  title: {
    default: "Wondalis Travel & Tour | Trips in Ghana and abroad",
    template: "%s | Wondalis Travel & Tour",
  },
  description:
    "Book curated trips in Ghana and abroad with Wondalis Travel & Tour, all year round. Pay in USD or GHS, by card or mobile money.",
  openGraph: {
    type: "website",
    siteName: "Wondalis Travel & Tour",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
