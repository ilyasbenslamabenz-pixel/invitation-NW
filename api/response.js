export default async function handler(req, res) {
  const allowedOrigin = 'https://ilyasbenslamabenz-pixel.github.io';
  const origin = req.headers.origin || '';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (origin && origin !== allowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { response, timestamp } = req.body || {};

    if (response !== 'Oui' && response !== 'Non') {
      return res.status(400).json({ error: 'Invalid response' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });
    }

    const subject = response === 'Oui'
      ? '❤️ Noa a répondu OUI !'
      : '🙈 Noa a répondu NON';

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>${subject}</h2>
        <p>Noa a terminé sa réponse sur ton invitation.</p>
        <p><strong>Réponse :</strong> ${response}</p>
        <p><strong>Date :</strong> ${timestamp || new Date().toISOString()}</p>
      </div>
    `;

    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['ilyas.benslamabenz@gmail.com'],
        subject,
        html
      })
    });

    const data = await resend.json();

    if (!resend.ok) {
      return res.status(502).json({ error: 'Resend error', details: data });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}