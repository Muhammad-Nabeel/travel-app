import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getEncryptionSecret(): string {
    const secret = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY?.trim() ?? "";
    if (!secret) {
        throw new Error("ADMIN_SETTINGS_ENCRYPTION_KEY is not configured.");
    }
    return secret;
}

function deriveEncryptionKey(secret: string): Buffer {
    return createHash("sha256").update(secret).digest();
}

export function encryptString(plaintext: string): string {
    const secret = getEncryptionSecret();
    const key = deriveEncryptionKey(secret);
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        tag.toString("base64"),
        encrypted.toString("base64"),
    ].join(".");
}

export function decryptString(payload: string): string {
    const [ivB64, tagB64, ciphertextB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !ciphertextB64) {
        throw new Error("Invalid encrypted payload format.");
    }

    const secret = getEncryptionSecret();
    const key = deriveEncryptionKey(secret);

    const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertextB64, "base64")),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}
