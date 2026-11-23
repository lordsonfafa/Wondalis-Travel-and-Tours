"use client";

import { Button } from "./Button";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

/** Downloads an .ics file that opens in Apple, Google or Outlook calendar. */
export function AddToCalendarButton({
  title,
  startsOn,
  nights,
  reference,
  location,
}: {
  title: string;
  startsOn: string; // ISO date, e.g. 2026-12-18
  nights: number;
  reference: string;
  location: string;
}) {
  function download() {
    const start = new Date(`${startsOn}T00:00:00Z`);
    // All-day events end the day after the last day (exclusive end date).
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + nights + 1);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Wondalis Travel & Tour//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${reference}@wondalis.com`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${esc(title)}`,
      `DTSTART;VALUE=DATE:${ymd(start)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `LOCATION:${esc(location)}`,
      `DESCRIPTION:${esc(`Wondalis booking ${reference}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reference}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={download}>
      Add to calendar
    </Button>
  );
}
