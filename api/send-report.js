export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  const { sceneTitle, sceneSubtitle, annotationText, reasoning, proposals, lycheePrompt } = req.body

  if (!annotationText || !sceneTitle) {
    return res.status(400).json({ error: 'Dati mancanti' })
  }

  const proposalsHtml = (proposals || [])
    .map(p => `<li><strong>[${p.category}]</strong> ${p.text}</li>`)
    .join('')

  const html = `
    <h2>IEL — Nuova osservazione cliente</h2>
    <p><strong>Scena:</strong> ${sceneTitle} (${sceneSubtitle || ''})</p>
    <p><strong>Commento cliente:</strong> "${annotationText}"</p>
    <p><strong>Ragionamento:</strong> ${reasoning || ''}</p>
    <ul>${proposalsHtml}</ul>
    <hr />
    <p><strong>Prompt per Lychee Studio:</strong></p>
    <pre style="white-space: pre-wrap; font-family: monospace; background:#f4f1ea; padding:12px; border-radius:4px;">${lycheePrompt || ''}</pre>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'IEL Architecture <onboarding@resend.dev>',
        to: 'cianiraffaella@gmail.com',
        subject: `IEL — Nuova osservazione: ${sceneTitle}`,
        html,
      }),
    })

    if (!response.ok) {
      console.error('Resend error:', await response.text())
      return res.status(200).json({ sent: false })
    }
    return res.status(200).json({ sent: true })
  } catch (err) {
    console.error('send-report error:', err)
    return res.status(200).json({ sent: false })
  }
}
