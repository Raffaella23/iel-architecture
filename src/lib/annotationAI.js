// src/lib/annotationAI.js
import { getRuleBasedSuggestions } from './annotationRules'

export async function getDesignSuggestions(annotationText, scene) {
  const { reasoning, proposals } = getRuleBasedSuggestions(annotationText, scene)

  const enriched = await Promise.all(
    proposals.map(async (proposal) => {
      try {
        const res = await fetch('/api/reference-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: proposal.imageSearchQuery }),
        })
        const { imageUrl, imageCredit } = await res.json()
        return { ...proposal, imageUrl, imageCredit }
      } catch {
        return { ...proposal, imageUrl: null, imageCredit: null }
      }
    })
  )

  return { reasoning, proposals: enriched }
}
