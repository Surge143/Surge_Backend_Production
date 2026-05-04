'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blogs?sort=-createdAt')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.docs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        Loading Stories...
      </div>
    )

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <header style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '900', marginBottom: '16px' }}>
          The Surge Journal
        </h1>
        <p style={{ opacity: 0.6, fontSize: '20px' }}>
          Stories of coffee, craftsmanship, and culture.
        </p>
      </header>

      <div className="grid-auto">
        {posts.map((post) => (
          <article key={post.id} className="glass glass-hover" style={styles.postCard}>
            <div style={styles.imgContainer}>
              {post.featuredImage?.url ? (
                <img src={post.featuredImage.url} alt={post.title} style={styles.postImg} />
              ) : (
                <div style={styles.placeholderImg}>☕</div>
              )}
            </div>
            <div style={{ padding: '32px' }}>
              <h2 style={styles.postTitle}>{post.title}</h2>
              <p style={styles.excerpt}>
                {post.shortDescription ||
                  'Dive into the world of specialty coffee with our latest insights and stories.'}
              </p>
              <div style={styles.footer}>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-gradient"
                  style={{ fontWeight: '800' }}
                >
                  Read More →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="flex-center" style={{ opacity: 0.5, height: '40vh' }}>
          No stories published yet. Stay tuned!
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  postCard: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  imgContainer: {
    aspectRatio: '16/9',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.02)',
  },
  postImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderImg: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '48px',
  },
  postTitle: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '12px 0 16px',
    lineHeight: '1.2',
  },
  excerpt: {
    fontSize: '15px',
    opacity: 0.6,
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '20px',
  },
}
