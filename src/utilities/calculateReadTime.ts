// Helper to extract text from Lexical JSON nodes
const extractTextFromLexical = (nodes: any[]): string => {
  return nodes
    .map((node) => {
      if (node.text) return node.text
      if (node.children) return extractTextFromLexical(node.children)
      return ''
    })
    .join(' ')
}

export const calculateReadTime = (content: any): number => {
  if (!content || !content.root || !content.root.children) return 0
  
  const allText = extractTextFromLexical(content.root.children)
  const wordsPerMinute = 225 // Average reading speed
  const wordCount = allText.trim().split(/\s+/).length
  
  return Math.ceil(wordCount / wordsPerMinute)
}