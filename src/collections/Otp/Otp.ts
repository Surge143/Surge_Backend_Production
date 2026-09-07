import type { CollectionConfig } from 'payload';
import { sendOtpApp } from './endpoints/sendOtpApp';
import { sendOtpWeb } from './endpoints/sendOtpWeb';
import { verifyOtpApp } from './endpoints/verifyOtpApp';
import { verifyOtpWeb } from './endpoints/verifyOtpWeb';

export const Otp: CollectionConfig = {
    slug: 'otp',
    admin: {
        useAsTitle: 'email',
        hidden: true
    },
    endpoints: [
        {
            path: '/send-app',
            method: 'post',
            handler: sendOtpApp,
        },
        {
            path: '/send-web',
            method: 'post',
            handler: sendOtpWeb,
        },
        {
            path: '/verify-app',
            method: 'post',
            handler: verifyOtpApp,
        },
        {
            path: '/verify-web',
            method: 'post',
            handler: verifyOtpWeb,
        }
    ],
    access: {
        read: () => false,
        update: () => false,
        create: () => false,
        delete: () => false,
    },
    fields: [
        { name: 'email', type: 'email', required: true, index: true },
        { name: 'otp', type: 'text', required: true },
        { name: 'isUsed', type: 'checkbox', defaultValue: false },
        { name: 'attempts', type: 'number', defaultValue: 0 }, // failed-guess counter, resets on a new code
        { name: 'expiresAt', type: 'date', required: true },
        { name: 'requestHistory', type: 'json' }, // Array of timestamps [number, number]
    ],
    timestamps: true,
}