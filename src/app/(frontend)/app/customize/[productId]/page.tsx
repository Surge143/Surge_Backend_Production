'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../../context/CartContext'

export default function CustomizePage() {
  const { productId } = useParams()
  const searchParams = useSearchParams()
  const shopId = searchParams.get('shopId')
  const router = useRouter()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<any>(null)
  const [customizations, setCustomizations] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/menu/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
  }, [productId])

  const calculateTotalPrice = () => {
    if (!product) return 0
    let price = product.regularPrice || 0
    Object.values(customizations).forEach((opts: any) => {
      opts.forEach((o: any) => {
        price += o.price || 0
      })
    })
    return price
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: calculateTotalPrice(),
      quantity: 1,
      customizations: customizations,
      type: 'app',
      variant: shopId || 'default', // Using shopId as a variant-like grouping for cafe orders
    })
    router.push(`/app/menu/${shopId}`)
  }

  if (loading)
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        Loading...
      </div>
    )

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <Link href={`/app/menu/${shopId}`} style={{ opacity: 0.6 }}>
        ← Back to Menu
      </Link>

      <div style={{ marginTop: '40px', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '8px' }}>{product.name}</h1>
        <p className="text-gradient" style={{ fontSize: '18px', marginBottom: '40px' }}>
          {product.tagline}
        </p>

        {product.customizations?.[0]?.sections?.map((section: any) => (
          <div key={section.title} style={{ marginBottom: '40px' }}>
            <h4 style={styles.sectionTitle}>
              {section.title} ({section.selectionType})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {section.options?.map((opt: any) => (
                <div
                  key={opt.label}
                  className={`selection-option ${customizations[section.title]?.find((o: any) => o.label === opt.label) ? 'selected' : ''}`}
                  onClick={() => {
                    const current = customizations[section.title] || []
                    if (section.selectionType === 'single') {
                      setCustomizations({ ...customizations, [section.title]: [opt] })
                    } else {
                      setCustomizations({
                        ...customizations,
                        [section.title]: current.find((o: any) => o.label === opt.label)
                          ? current.filter((o: any) => o.label !== opt.label)
                          : [...current, opt],
                      })
                    }
                  }}
                >
                  <span>{opt.label}</span>
                  <span>{opt.price > 0 ? `+AED ${opt.price}` : 'Free'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: '40px' }}
          onClick={handleAddToCart}
        >
          Add to Bag • AED {calculateTotalPrice()}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.5,
    marginBottom: '16px',
  },
}
