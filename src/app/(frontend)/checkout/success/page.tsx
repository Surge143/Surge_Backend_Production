'use client'

import Link from 'next/link'
import styles from './success.module.css'

export default function SuccessPage() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.icon}>✨</div>
                <h1 className={styles.title}>Order Confirmed!</h1>
                <p className={styles.message}>
                    Thank you for your purchase. We&apos;re getting your premium coffee ready for you.
                    You will receive a confirmation email shortly.
                </p>
                <div className={styles.actions}>
                    <Link href="/orders" className="btn btn-primary">
                        View Orders
                    </Link>
                    <Link href="/products" className="btn btn-secondary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}
