import { Payload } from 'payload';

interface ShippingAddress {
    emirates: string;
    [key: string]: any;
}

export const calculateTaxAndShipping = async (
    payload: Payload,
    deliveryOption: 'delivery' | 'pickup',
    shippingAddress?: ShippingAddress | null
) => {
    let taxAndShippingResult: any = null;

    try {
        taxAndShippingResult = await payload.findGlobal({
            slug: 'ship-and-tax',
            depth: 0,
            select: {
                tax: true,
                emirateCharges: true,
            }
        });
    } catch (error) {
        console.warn('[calculateTaxAndShipping] Falling back to zero tax/shipping because global config could not be loaded.', error);
    }

    const taxRate = taxAndShippingResult?.tax || 0;
    let shippingCharge = 0;

    if (deliveryOption === 'delivery') {
        const emirateKey = shippingAddress?.emirates;
        if (!emirateKey) {
            throw new Error('Shipping address must include an emirate for delivery');
        }

        if (taxAndShippingResult?.emirateCharges) {
            shippingCharge = taxAndShippingResult.emirateCharges?.[emirateKey] || 0;

            if (!(emirateKey in taxAndShippingResult.emirateCharges)) {
                console.warn(`[calculateTaxAndShipping] Unsupported emirate key "${emirateKey}". Falling back to 0 shipping.`);
            }
        }
    }

    return {
        taxRate,
        shippingCharge,
    };
};
