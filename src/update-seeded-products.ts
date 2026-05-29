import 'dotenv/config'
import { getPayload } from './utilities/getPayload'

const targetProductNames = [
  'Sumatra Mandheling',
  'Kenya AA Nyeri',
  'Costa Rica Tarrazu',
  'Colombia Supremo Huila',
  'Ethiopian Sidamo',
  'Guatemala Huehuetenango',
  'Brazil Santos Mogiana',
  'Rwanda Gisenyi',
  'Yemen Mattari',
  'Panama Geisha Boquete'
]

// Concise 3-word highlights for each product
const conciseHighlightsMap: Record<string, any[]> = {
  'Sumatra Mandheling': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Low acidity' },
        { point: 'Earthy and rich' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium dark' },
        { point: 'Syrupy body' }
      ]
    }
  ],
  'Kenya AA Nyeri': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Bright berry sweetness' },
        { point: 'Grapefruit notes' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium light' },
        { point: 'Juicy cup' }
      ]
    }
  ],
  'Costa Rica Tarrazu': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Brown sugar sweet' },
        { point: 'Milk chocolate notes' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium roast' },
        { point: 'Silky body' }
      ]
    }
  ],
  'Colombia Supremo Huila': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Milk chocolate finish' },
        { point: 'Roasted hazelnut' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium roast' },
        { point: 'Perfectly balanced' }
      ]
    }
  ],
  'Ethiopian Sidamo': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Fragrant jasmine bloom' },
        { point: 'Stone fruit notes' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Light roast' },
        { point: 'Tea-like body' }
      ]
    }
  ],
  'Guatemala Huehuetenango': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Warm cinnamon spice' },
        { point: 'Dark caramel sweetness' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium dark' },
        { point: 'Velvety body' }
      ]
    }
  ],
  'Brazil Santos Mogiana': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Peanut butter notes' },
        { point: 'Very low acidity' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium roast' },
        { point: 'Creamy texture' }
      ]
    }
  ],
  'Rwanda Gisenyi': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Mandarin orange sweetness' },
        { point: 'Black tea finish' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium light' },
        { point: 'Crisp and clean' }
      ]
    }
  ],
  'Yemen Mattari': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Exotic mountain spice' },
        { point: 'Spiced dried fig' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Medium roast' },
        { point: 'Heavy complex body' }
      ]
    }
  ],
  'Panama Geisha Boquete': [
    {
      sectionTitle: 'Flavor',
      items: [
        { point: 'Bergamot citrus zest' },
        { point: 'White peach notes' }
      ]
    },
    {
      sectionTitle: 'Roast',
      items: [
        { point: 'Light roast' },
        { point: 'Ultra clean cup' }
      ]
    }
  ]
}

async function updateSeededProducts() {
  console.log('Connecting to Payload database...')
  const payload = await getPayload()
  console.log('Connected!')

  console.log('\nBeginning updates of target seeded coffee products...')

  for (const name of targetProductNames) {
    // Find the product by name
    const res = await payload.find({
      collection: 'web-products',
      where: {
        name: { equals: name }
      },
      limit: 1
    })

    if (res.docs.length === 0) {
      console.log(`Warning: Product "${name}" not found in database. Skipping.`)
      continue
    }

    const doc = res.docs[0]
    console.log(`\nUpdating product: ID=${doc.id}, name="${doc.name}"`)

    // 1. Process variants to remove trailing "g"
    let updatedVariants: any[] = []
    if (doc.variants && Array.isArray(doc.variants)) {
      updatedVariants = doc.variants.map((v: any) => {
        let cleanName = v.variantName
        if (cleanName.endsWith('g')) {
          cleanName = cleanName.slice(0, -1) // remove the trailing 'g'
        } else if (cleanName.endsWith('G')) {
          cleanName = cleanName.slice(0, -1) // remove trailing capital 'G'
        }
        return {
          ...v,
          variantName: cleanName
        }
      })
    }

    // 2. Grab concise highlights
    const conciseHighlights = conciseHighlightsMap[name] || []

    try {
      const updatedDoc = await payload.update({
        collection: 'web-products',
        id: doc.id,
        data: {
          variants: updatedVariants,
          productHighlights: conciseHighlights
        }
      })
      console.log(`Successfully updated: ID=${updatedDoc.id}, Name="${updatedDoc.name}"`)
      console.log(`- Variants: [${updatedVariants.map(v => v.variantName).join(', ')}]`)
      console.log(`- Highlights updated to max 3 words per item`)
    } catch (err: any) {
      console.error(`Error updating product "${name}":`, err.message || err)
    }
  }

  console.log('\nUpdates completed successfully!')
  process.exit(0)
}

updateSeededProducts().catch(err => {
  console.error('Update script crashed:', err)
  process.exit(1)
})
