// TODO: REMOVE after FE migration
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })

  try {
    const { pageId, fileName, contentType, key } = req.body || {}
    if (!pageId || !fileName || !contentType) {
      return res.status(400).json({ success: false, error: 'Missing pageId, fileName, contentType' })
    }

    // Map to unified route
    const resp = await fetch(`${process.env.PROXY_BASE_URL || 'https://wedding-admin-proxy.vercel.app'}/api/r2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': process.env.ADMIN_TOKEN || '' },
      body: JSON.stringify({ action: 'presignPut', key: key || `${pageId}/files/${Date.now()}-${fileName}`, contentType }),
    })
    const json = await resp.json()
    if (!json?.ok) {
      return res.status(resp.status).json({ success: false, error: json?.error?.message || 'Failed' })
    }
    const data = json.data || {}
    return res.status(200).json({ uploadUrl: data.uploadUrl, key: data.key, publicUrl: data.publicUrl })
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Internal error' })
  }
}


