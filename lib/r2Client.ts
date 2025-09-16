import { S3Client, HeadObjectCommand, ListObjectsV2Command, _Object } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export function getPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL
    ? process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')
    : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`
  return `${base}/${key}`
}

export function slugifyName(name: string): string {
  const idx = name.lastIndexOf('.')
  const base = idx >= 0 ? name.slice(0, idx) : name
  const ext = idx >= 0 ? name.slice(idx) : ''
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') + ext.toLowerCase()
  )
}

export function safeKey(key: string): string {
  return key.replace(/\.{2,}/g, '.').replace(/\s+/g, '-')
}

export function makeKey({ prefix, pageId, fileName }: { prefix?: string; pageId: string; fileName: string }): string {
  const p = prefix ?? 'gallery'
  return `${p}/${pageId}/${Date.now()}-${slugifyName(fileName)}`
}

export async function headObject(key: string) {
  const res = await r2Client.send(
    new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }) as any
  )
  return res
}

export async function listPrefix(prefix: string, maxKeys = 50, continuationToken?: string) {
  const res = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    })
  )
  return res
}


