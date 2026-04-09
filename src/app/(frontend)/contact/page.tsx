'use client'

import React, { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/contact-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ name: '', email: '', subject: '', message: '' })
      }
    } catch (err) {
      console.error('Contact submit failed', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container animate-up" style={{ padding: '80px 0' }}>
      <div style={styles.grid}>
        <div>
          <h1 style={{ fontSize: '56px', fontWeight: '900', marginBottom: '24px' }}>
            Get in Touch
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.6, marginBottom: '48px', lineHeight: '1.6' }}>
            Whether you have a question about our roasts, want to partner with us, or just want to
            chat about coffee, we&apos;re all ears.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h4 style={styles.label}>Email Us</h4>
              <p style={{ fontSize: '18px', fontWeight: '700' }}>hello@whitemantis.ae</p>
            </div>
            <div>
              <h4 style={styles.label}>Visit Us</h4>
              <p style={{ fontSize: '18px', fontWeight: '700' }}>Dubai, United Arab Emirates</p>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '48px' }}>
          {success ? (
            <div
              className="flex-center"
              style={{ height: '300px', flexDirection: 'column', textAlign: 'center' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Message Received</h2>
              <p style={{ opacity: 0.6, marginTop: '12px' }}>We&apos;ll get back to you shortly.</p>
              <button
                onClick={() => setSuccess(false)}
                className="btn-outline"
                style={{ marginTop: '32px' }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <input
                placeholder="Name"
                className="glass"
                style={styles.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="glass"
                style={styles.input}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                placeholder="Subject"
                className="glass"
                style={styles.input}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
              <textarea
                placeholder="Your Message"
                className="glass"
                style={{ ...styles.input, height: '150px', resize: 'none' }}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <button className="btn-primary" style={{ padding: '18px' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr',
    gap: '80px',
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    opacity: 0.4,
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
    outline: 'none',
    color: 'white',
  },
}
