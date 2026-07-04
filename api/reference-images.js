// api/reference-images.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  const { query } = req.body
  if (!query) {
    return res.status(400).json({ error: 'query obbligatoria' })
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    )
    const data = await response.json()
    const image = data.results?.[0]

    return res.status(200).json({
      imageUrl: image?.urls?.regular || null,
      imageCredit: image ? `${image.user.name} / Unsplash` : null,
    })
  } catch (err) {
    console.error('reference-images error:', err)
    return res.status(200).json({ imageUrl: null, imageCredit: null })
  }
}
