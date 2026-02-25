'use server'

import { fcm } from '@/lib/firebase';

export async function sendTestNotification(token: string) {
    if (!token) {
        return { success: false, error: 'Token is required' };
    }

    const trimmedToken = token.trim();
    console.log(`[sendTestNotification] Token length: ${trimmedToken.length}`);

    try {
        const response = await fcm.send({
            notification: {
                title: "Cafe App Test",
                body: "Hello Shereyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            },
            token: trimmedToken
        });

        console.log('Successfully sent message:', response);
        return { success: true, response };
    } catch (error: any) {
        console.error('Error sending message:', error);

        let errorMessage = error.message || 'Unknown error';

        // Specific handling for common FCM errors
        if (error.code === 'messaging/registration-token-not-registered') {
            errorMessage = 'The provided token is no longer valid (NotRegistered). The app might have been uninstalled or the token expired.';
        } else if (error.code === 'messaging/invalid-registration-token') {
            errorMessage = 'The provided token is invalid. Please check if you copied it correctly.';
        } else if (error.message && error.message.includes('NotRegistered')) {
            errorMessage = 'The provided token is not registered with FCM. Please ensure you are using a fresh token from a currently installed app.';
        }

        return { success: false, error: errorMessage };
    }
}
