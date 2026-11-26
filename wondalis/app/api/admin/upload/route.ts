import { createHash } from "node:crypto";
import { getSession } from "@/lib/auth-guards";

// Photos go from the admin's browser straight to Cloudinary, so big phone photos are not limited by
// the server's request size. This route only hands out a short-lived SIGNATURE, and only to signed-in
// Staff or Admins. The API secret never leaves the server; anyone else gets a 401 and cannot upload.
const FOLDER = "wondalis/trips";
const FORMATS = "jpg,png,webp,avif";

export async function POST() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "staff" && role !== "owner") {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ error: "Photo storage is not set up yet." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signs the parameters in alphabetical order, then the secret is appended.
  const toSign = `allowed_formats=${FORMATS}&folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return Response.json({ cloudName, apiKey, timestamp, signature, folder: FOLDER, allowedFormats: FORMATS });
}
