import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended for GCM
const TAG_LENGTH = 16;

// ENCRYPTION_KEY must be 32 bytes (64 hex chars)
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

if (KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
}

/**
 * Encrypts a JS object into a base64 string
 */
export function encrypt(payload: object): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY as Uint8Array, iv as Uint8Array);

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), "utf8") as any as Uint8Array,
        cipher.final() as any as Uint8Array,
    ]);

    const tag = cipher.getAuthTag();

    // Layout: [iv][tag][encrypted]
    return Buffer.concat([
        iv as any as Uint8Array,
        tag as any as Uint8Array,
        encrypted as any as Uint8Array,
    ]).toString("base64");
}

/**
 * Decrypts a base64 string back into original object
 */
export function decrypt<T = any>(token: string): T {
    const buffer = Buffer.from(token, "base64");

    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY as Uint8Array, iv as Uint8Array);
    decipher.setAuthTag(tag as any as Uint8Array);

    const decrypted = Buffer.concat([
        decipher.update(encrypted as any as Uint8Array) as any as Uint8Array,
        decipher.final() as any as Uint8Array,
    ]);

    return JSON.parse(decrypted.toString("utf8")) as T;
}
