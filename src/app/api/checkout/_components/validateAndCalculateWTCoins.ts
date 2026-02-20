import { Payload } from 'payload';

interface WTCoinsResult {
    discount: number;
    pointsUsed: number;
    remainingBalance: number;
}

export const calculateWTCoinsDiscount = async (
    payload: Payload,
    userId: string | number,
    currentOrderTotal: number
): Promise<WTCoinsResult | { error: string; status: number }> => {

    // 1. FETCH USER BALANCE
    const userRewards = await payload.find({
        collection: 'user-wt-coins',
        where: { user: { equals: userId } },
        depth: 0,
        limit: 1,
        select: { totalBalance: true }
    });

    const userTotalWTCoins = userRewards.docs.length === 0 ? 0 : userRewards.docs[0].totalBalance || 0;

    // 2. FETCH GLOBAL CONFIGURATION
    const WTCoinsConfiguration: any = await payload.findGlobal({
        slug: 'wt-coins',
        depth: 0,
        select: {
            minPointsPerOrder: true,
            maxPointsPerOrder: true,
            pointsToAed: true,
        }
    });

    if (!WTCoinsConfiguration) {
        return { error: 'WT Coins configuration not found', status: 404 };
    }

    // 3. CHECK MINIMUM REQUIREMENTS
    if (WTCoinsConfiguration.minPointsPerOrder > 0 && userTotalWTCoins < WTCoinsConfiguration.minPointsPerOrder) {
        return {
            error: `Minimum ${WTCoinsConfiguration.minPointsPerOrder} points required to redeem.`,
            status: 400
        };
    }

    // 4. DETERMINE POINTS TO SPEND (APPLY MAX LIMIT)
    let pointsToSpend = userTotalWTCoins;
    if (WTCoinsConfiguration.maxPointsPerOrder > 0 && userTotalWTCoins > WTCoinsConfiguration.maxPointsPerOrder) {
        pointsToSpend = WTCoinsConfiguration.maxPointsPerOrder;
    }

    // 5. CALCULATE AED DISCOUNT
    const pointsToAedRate = WTCoinsConfiguration.pointsToAed || 1;
    const potentialDiscount = pointsToSpend / pointsToAedRate;

    // 6. FINAL VALIDATION (ENSURE DISCOUNT DOESN'T EXCEED ORDER TOTAL)
    const WTCoinsDiscount = Math.min(potentialDiscount, currentOrderTotal);
    const finalPointsUsed = WTCoinsDiscount * pointsToAedRate;

    return {
        discount: WTCoinsDiscount,
        pointsUsed: finalPointsUsed,
        remainingBalance: userTotalWTCoins - finalPointsUsed
    };
};