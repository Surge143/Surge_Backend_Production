'use server'

import { getPayload } from 'payload';
import config from '@/payload.config';
import { headers as getNextHeaders } from 'next/headers';

export async function getUserPreferences() {
    try {
        const payloadConfig = await config;
        const payload = await getPayload({ config: payloadConfig });

        const { user } = await payload.auth({ headers: await getNextHeaders() });

        if (!user) {
            return { preferences: [] };
        }

        const result = await payload.find({
            collection: 'user-preferences',
            where: { user: { equals: user.id } },
            limit: 1,
            overrideAccess: true,
        });

        const prefDoc = result.docs[0];
        const allPrefs: any[] = prefDoc?.cafeProductPreferences ?? [];

        return { preferences: allPrefs };
    } catch (error: any) {
        console.error('[Action getUserPreferences] Error:', error);
        return { preferences: [] };
    }
}

export async function getProductPreference(productId: string | number) {
    try {
        const payloadConfig = await config;
        const payload = await getPayload({ config: payloadConfig });

        const { user } = await payload.auth({ headers: await getNextHeaders() });
        const pIdStr = String(productId);

        console.log(`[getProductPreference] productId=${pIdStr} user=${user?.id || 'none'}`);

        if (!user) return null;

        // Try targeted lookup first
        const result = await payload.find({
            collection: 'user-preferences',
            where: {
                user: { equals: user.id },
                'cafeProductPreferences.productId': { equals: pIdStr }
            },
            limit: 1,
            overrideAccess: true,
        });

        if (result.docs.length > 0) {
            const doc = result.docs[0];
            const match = doc.cafeProductPreferences?.find((p: any) => String(p.productId) === pIdStr);
            if (match) {
                console.log(`[getProductPreference] Match found in targeted query for ${pIdStr}`);
                return match;
            }
        }

        // Fallback: Just find by user and search manually
        const fbResult = await payload.find({
            collection: 'user-preferences',
            where: { user: { equals: user.id } },
            limit: 1,
            overrideAccess: true,
        });

        if (fbResult.docs.length > 0) {
            const doc = fbResult.docs[0];
            const match = doc.cafeProductPreferences?.find((p: any) => String(p.productId) === pIdStr);
            console.log(`[getProductPreference] Fallback lookup for ${pIdStr}: ${match ? 'Found' : 'Not Found'}`);
            return match || null;
        }

        console.log(`[getProductPreference] No preference document for user ${user.id}`);
        return null;
    } catch (error: any) {
        console.error('[Action getProductPreference] Error:', error);
        return null;
    }
}

export async function getBaristas() {
    try {
        const payloadConfig = await config;
        const payload = await getPayload({ config: payloadConfig });

        const result = await payload.find({
            collection: 'admins',
            where: {
                role: { equals: 'barista' },
            },
            limit: 100,
            depth: 0,
            overrideAccess: true,
        });

        return { baristas: result.docs };
    } catch (error: any) {
        console.error('[Action getBaristas] Error:', error);
        return { baristas: [] };
    }
}
