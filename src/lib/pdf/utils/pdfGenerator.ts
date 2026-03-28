import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { InvoiceData } from '../types/invoice.types';

/**
 * Generate PDF buffer from invoice data
 * @param invoiceData - Formatted invoice data
 * @returns Promise<Uint8Array> - PDF buffer ready to send as response
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Uint8Array> {
    try {
        // Render the React PDF document to a stream
        const doc = React.createElement(InvoiceDocument, { data: invoiceData });
        const stream = await ReactPDF.renderToStream(doc as any);

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            stream.on('error', reject);
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF invoice');
    }
}

/**
 * Generate filename for the invoice PDF
 * @param invoiceNumber - Invoice number
 * @param type - Type of invoice (order or subscription)
 * @returns string - Formatted filename
 */
export function generateInvoiceFilename(invoiceNumber: string, type: 'order' | 'subscription'): string {
    const sanitizedNumber = invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${type}_invoice_${sanitizedNumber}_${timestamp}.pdf`;
}
