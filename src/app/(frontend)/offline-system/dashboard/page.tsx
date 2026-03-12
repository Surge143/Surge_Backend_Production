'use client';

import React from 'react';

export default function OfflineSystemDashboard() {
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Offline System Dashboard</h1>
            <p>Welcome to the Store Manager Portal!</p>
            <button
                onClick={() => window.location.href = '/offline-system/login'}
                style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
            >
                Logout
            </button>
        </div>
    );
}
