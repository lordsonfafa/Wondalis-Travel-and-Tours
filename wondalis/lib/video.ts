// Turns a pasted video link into something safe to show. YouTube and Vimeo become embeds (YouTube
// through its privacy-friendly domain); any other https link becomes a plain "Watch video" link.
// Only the parsed id ever reaches an iframe, never the pasted text.

export type Video = { kind: "embed"; src: string; title: string } | { kind: "link"; href: string };

export function parseVideo(raw: string): Video | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  let youtube: string | null = null;
  if (host === "youtu.be") youtube = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com") {
    youtube = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ?? null;
  }
  if (youtube && /^[\w-]{6,20}$/.test(youtube)) {
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${youtube}`, title: "Trip video" };
  }

  if (host === "vimeo.com") {
    const id = url.pathname.match(/^\/(\d{5,12})/)?.[1];
    if (id) return { kind: "embed", src: `https://player.vimeo.com/video/${id}`, title: "Trip video" };
  }
  return { kind: "link", href: url.toString() };
}
