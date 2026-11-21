const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const getRemaningTimeForOtpReset = (period = 30) => {
    const now = Date.now() / 1000;
    return period - (now % period);
};

type GenerateOptions = {
  secret: string;
  period?: number;
  digits?: number;
  algorithm?: "sha1" | "sha256" | "sha512";
  epoch?: number;
};

const HASH = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha512: "SHA-512",
} as const;

function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();

  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 secret");

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export async function generate({
  secret,
  period = 30,
  digits = 6,
  algorithm = "sha1",
  epoch = Math.floor(Date.now() / 1000),
}: GenerateOptions): Promise<string> {
  const counter = Math.floor(epoch / period);

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret),
    { name: "HMAC", hash: HASH[algorithm] },
    false,
    ["sign"]
  );

  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer));

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];

  return (binary % 10 ** digits).toString().padStart(digits, "0");
}