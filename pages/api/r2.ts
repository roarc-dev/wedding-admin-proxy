import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { r2Client, getPublicUrl, safeKey } from '../../lib/r2Client'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type Json = { ok: boolean; data?: any; error?: { code: string; message: string; details?: any } }

const BodySchema = z.object({
  action: z.enum(['presignPut', 'presignGet', 'deleteObject', 'headObject', 'list', 'test']),
  key: z.string().optional(),
  contentType: z.string().optional(),
  expiresSec: z.number().optional(),
  prefix: z.string().optional(),
  maxKeys: z.number().optional(),
  continuationToken: z.string().optional(),
})

const MUTATING_ACTIONS = new Set(['presignPut', 'deleteObject'])

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } })
  }

  const requestId = Math.random().toString(36).slice(2)

  try {
    const body = BodySchema.parse(req.body ?? {})

    // Admin token for mutating actions
    if (MUTATING_ACTIONS.has(body.action)) {
      const token = req.headers['x-admin-token'] as string | undefined
      if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin token' } })
      }
    }

    const expiresIn = body.expiresSec ?? 300

    switch (body.action) {
      case 'test': {
        return res.status(200).json({ ok: true, data: { status: 'ok', time: Date.now() } })
      }
      case 'presignPut': {
        if (!body.key || !body.contentType) {
          return res.status(400).json({ ok: false, error: { code: 'INVALID_INPUT', message: 'key and contentType required' } })
        }
        const Key = safeKey(body.key)
        const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key, ContentType: body.contentType })
        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn })
        const publicUrl = getPublicUrl(Key)
        return res.status(200).json({ ok: true, data: { uploadUrl, key: Key, publicUrl } })
      }
      case 'presignGet': {
        if (!body.key) {
          return res.status(400).json({ ok: false, error: { code: 'INVALID_INPUT', message: 'key required' } })
        }
        const Key = safeKey(body.key)
        const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key })
        const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn })
        return res.status(200).json({ ok: true, data: { downloadUrl, key: Key } })
      }
      case 'deleteObject': {
        if (!body.key) {
          return res.status(400).json({ ok: false, error: { code: 'INVALID_INPUT', message: 'key required' } })
        }
        const Key = safeKey(body.key)
        await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key }))
        return res.status(200).json({ ok: true, data: { deleted: true, key: Key } })
      }
      case 'headObject': {
        if (!body.key) {
          return res.status(400).json({ ok: false, error: { code: 'INVALID_INPUT', message: 'key required' } })
        }
        const Key = safeKey(body.key)
        try {
          const head = await r2Client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key }))
          return res.status(200).json({ ok: true, data: { exists: true, size: head.ContentLength, contentType: head.ContentType, etag: head.ETag } })
        } catch (e: any) {
          if (e?.$metadata?.httpStatusCode === 404) {
            return res.status(200).json({ ok: true, data: { exists: false } })
          }
          throw e
        }
      }
      case 'list': {
        const prefix = body.prefix ?? ''
        const maxKeys = body.maxKeys ?? 50
        const resp = await r2Client.send(new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET,
          Prefix: prefix,
          MaxKeys: maxKeys,
          ContinuationToken: body.continuationToken,
        }))
        return res.status(200).json({ ok: true, data: resp })
      }
    }

    return res.status(400).json({ ok: false, error: { code: 'UNKNOWN_ACTION', message: 'Unsupported action' } })
  } catch (err: any) {
    console.error('[api/r2] error', { requestId, err: err?.message, stack: err?.stack })
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Internal error', details: err?.message } })
  }
}


