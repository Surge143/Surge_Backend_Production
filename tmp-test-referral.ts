
import { getPayload } from './src/utilities/getPayload';
import { awardReferralCoins } from './src/utilities/awardReferralCoins';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function test() {
    const payload = await getPayload();

    console.log('--- Referral System Test ---');

    // 1. Find a test user with referralStatus 'pending'
    const users = await payload.find({
        collection: 'users',
        where: {
            referralStatus: { equals: 'pending' }
        },
        limit: 1,
        depth: 1,
    });

    if (users.docs.length === 0) {
        console.log('No pending referral users found to test with.');
        return;
    }

    const testUser = users.docs[0];
    const referredById = typeof testUser.referredBy === 'object' ? testUser.referredBy.id : testUser.referredBy;

    console.log(`Testing with user: ${testUser.id} (${testUser.email})`);
    console.log(`Referred by: ${referredById}`);

    // 2. Trigger awardReferralCoins
    // Note: This will actually update the database if successful!
    // We use a fake order ID and 'web-orders' collection
    console.log('Calling awardReferralCoins...');
    await awardReferralCoins(payload, testUser.id, 'test-order-id', 'web-orders');

    // 3. Check results
    const updatedUser = await payload.findByID({
        collection: 'users',
        id: testUser.id,
        depth: 0,
    });

    console.log(`Updated referralStatus: ${updatedUser.referralStatus}`);

    const userCoins = await payload.find({
        collection: 'user-wt-coins',
        where: { user: { equals: testUser.id } },
    });

    console.log(`User coins docs count: ${userCoins.docs.length}`);
    if (userCoins.docs.length > 0) {
        console.log(`User total balance: ${userCoins.docs[0].totalBalance}`);
        console.log('Last earning entry:', JSON.stringify(userCoins.docs[0].coinEarningHistory?.slice(-1), null, 2));
    }

    const referrerCoins = await payload.find({
        collection: 'user-wt-coins',
        where: { user: { equals: referredById } },
    });

    console.log(`Referrer coins docs count: ${referrerCoins.docs.length}`);
    if (referrerCoins.docs.length > 0) {
        console.log(`Referrer total balance: ${referrerCoins.docs[0].totalBalance}`);
    }
}

test().catch(console.error);
