import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from '@/utilities/getPayload'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'blogs',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const post = result.docs[0]
  if (!post) return {}
  return {
    title: (post.meta as any)?.title || post.title,
    description: (post.meta as any)?.description || post.shortDescription,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'blogs',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })

  const post = result.docs[0]
  if (!post) notFound()

  const featuredImage = post.featuredImage as any
  const relatedBlogs = (post.relatedBlogs as any[]) || []

  let contentHtml = ''
  if (post.content) {
    contentHtml = convertLexicalToHTML({ data: post.content as any })
  }

  return (
    <div className="animate-up" style={{ paddingBottom: '80px' }}>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          height: '480px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.02)',
          marginBottom: '60px',
        }}
      >
        {featuredImage?.url ? (
          <img
            src={featuredImage.url}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
            }}
          >
            ☕
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, var(--bg) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Back link */}
        <Link
          href="/blog"
          style={{ fontSize: '13px', opacity: 0.5, display: 'inline-block', marginBottom: '32px' }}
        >
          ← Back to Journal
        </Link>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '20px',
            fontSize: '13px',
            opacity: 0.6,
          }}
        >
          <span>{new Date(post.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
          {post.readTime ? <span>· {post.readTime} min read</span> : null}
        </div>

        <h1
          style={{
            fontSize: '48px',
            fontWeight: '900',
            lineHeight: '1.1',
            marginBottom: '24px',
          }}
        >
          {post.title}
        </h1>

        {post.shortDescription && (
          <p style={{ fontSize: '20px', opacity: 0.65, lineHeight: '1.6', marginBottom: '48px' }}>
            {post.shortDescription}
          </p>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '48px' }} />

        {/* Rich text content */}
        {contentHtml ? (
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            style={blogContentStyles}
          />
        ) : (
          <p style={{ opacity: 0.4 }}>No content available.</p>
        )}

        {/* Related blogs */}
        {relatedBlogs.length > 0 && (
          <div style={{ marginTop: '80px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '32px' }}>
              Keep Reading
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {relatedBlogs.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="glass glass-hover"
                  style={{
                    display: 'flex',
                    gap: '20px',
                    padding: '20px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    alignItems: 'center',
                  }}
                >
                  {(related.featuredImage as any)?.url && (
                    <img
                      src={(related.featuredImage as any).url}
                      alt={related.title}
                      style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <p style={{ fontWeight: '700', marginBottom: '4px' }}>{related.title}</p>
                    {related.shortDescription && (
                      <p style={{ fontSize: '13px', opacity: 0.55 }}>{related.shortDescription}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const blogContentStyles: React.CSSProperties = {
  fontSize: '17px',
  lineHeight: '1.8',
  color: 'inherit',
}
