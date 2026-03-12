'use client';

import React, { useState } from 'react';
import styles from './login.module.css';
import { useRouter } from 'next/navigation';

export default function OfflineSystemLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/offline-system/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard or home page after successful login
        router.push('/offline-system/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <img
          src="/images/latte-art.jpg"
          alt="Latte Art"
          className={styles.latteImage}
        />
        <div className={styles.craftText}>
          <h2>PURE CRAFT. UNCOMPROMISING QUALITY.</h2>
          <p>
            Dedicated to the master transformation of green coffee<br />
            into world-class specialty beans for you
          </p>
        </div>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.portalBox}>
          <div className={styles.logo} />
          <h2>STORE MANAGER PORTAL</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="email">Email ID</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              className={styles.signInButton}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
