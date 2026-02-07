export interface Media {
    id: number
    alt: string
    caption: string | null
    prefix: string
    folder: any
    updatedAt: string
    createdAt: string
    url: string
    thumbnailURL: string | null
    filename: string
    mimeType: string
    filesize: number
    width: number | null
    height: number | null
    focalX: number | null
    focalY: number | null
    sizes: {
        thumbnail: {
            url: string
            width: number | null
            height: number | null
            mimeType: string | null
            filesize: number | null
            filename: string | null
        }
    }
}

export interface SubscriptionFrequency {
    id: string
    duration: number
    interval: 'year' | 'month' | 'week' | 'day'
    subscriptionDiscount: number
}

export interface ProductVariant {
    id: string
    variantName: string
    variantImage: Media
    hasVariantSub: boolean
    variantRegularPrice: number
    variantSalePrice?: number
    variantInStock: boolean
    variantStockQuantity: number
    subFreq: SubscriptionFrequency[]
}

export interface Category {
    id: number
    title: string
    slug: string
    updatedAt: string
    createdAt: string
}

export interface SubCategory {
    id: number
    title: string
    parentCategory: Category
    slug: string
    updatedAt: string
    createdAt: string
}

export interface RichTextContent {
    root: {
        type: string
        format: string
        indent: number
        version: number
        children: any[]
        direction: string | null
    }
}

export interface BrewGuide {
    filter: boolean
    espresso: boolean
    milk: boolean
}

export interface Product {
    id: number
    name: string
    tagline: string
    hasVariantOptions: boolean
    variants: ProductVariant[]
    regularPrice: number | null
    salePrice: number | null
    inStock: boolean
    stockQuantity: number | null
    hasSimpleSub: boolean
    subFreq: SubscriptionFrequency[]
    productImage: Media | null
    description: RichTextContent
    categories: Category[]
    subCategories: SubCategory[]
    farm: string
    tastingNotes: string
    variety: string
    process: string
    altitude: string
    body: string
    aroma: string
    roast: string
    finish: string
    farmDescription: RichTextContent
    videoBanner: Media
    brewGuide: BrewGuide
    meta: {
        title: string | null
        image: Media | null
        description: string | null
    }
    slug: string
    updatedAt: string
    createdAt: string
    _status: 'published' | 'draft'
}

export interface ProductsResponse {
    docs: Product[]
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
    nextPage: number | null
    page: number
    pagingCounter: number
    prevPage: number | null
    totalDocs: number
    totalPages: number
}
