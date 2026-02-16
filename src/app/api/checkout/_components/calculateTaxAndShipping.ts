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
    const taxAndShippingResult = await payload.findGlobal({
        slug: 'ship-and-tax',
        depth: 1,
    });

    if (!taxAndShippingResult) {
        throw new Error('Tax and shipping configuration not found');
    }

    const taxRate = taxAndShippingResult.tax || 0;
    let shippingCharge = 0;

    if (deliveryOption === 'delivery') {
        const emirateKey = shippingAddress?.emirates;
        if (!emirateKey) {
            throw new Error('Shipping address must include an emirate for delivery');
        }
        // Map the emirate key to the global configuration field
        shippingCharge = taxAndShippingResult.emirateCharges?.[emirateKey] || 0;

        // Optional: Validate that the emirate actually exists in your config
        if (taxAndShippingResult.emirateCharges && !(emirateKey in taxAndShippingResult.emirateCharges)) {
            throw new Error(`Invalid or unsupported emirate: ${emirateKey}`);
        }
    }

    return {
        taxRate,
        shippingCharge,
    };
};