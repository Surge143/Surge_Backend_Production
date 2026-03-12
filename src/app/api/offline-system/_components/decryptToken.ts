export const decryptUrlToken = async (urlSafeToken: string): Promise<string> => {
    // 1. Restore standard Base64 characters
    let base64 = urlSafeToken
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    // 2. Restore '=' padding based on string length
    const pad = base64.length % 4;
    if (pad !== 0) {
        base64 += '='.repeat(4 - pad);
    }

    // 3. Import your existing decrypt logic
    const { decrypt } = await import('@/lib/crypto');

    return decrypt(base64);
};