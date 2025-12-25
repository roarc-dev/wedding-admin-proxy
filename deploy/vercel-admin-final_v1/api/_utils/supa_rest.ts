type SupaConfig = {
  url: string
  serviceKey: string
}

function getConfig(): SupaConfig {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
  }
  return { url, serviceKey }
}

function headers(serviceKey: string): HeadersInit {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  }
}

export async function supaGet<T>(path: string): Promise<T> {
  const { url, serviceKey } = getConfig()
  const res = await fetch(`${url}${path}`, { headers: headers(serviceKey) })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase GET failed ${res.status}: ${text}`)
  return JSON.parse(text) as T
}

export async function supaPost<T>(path: string, body: unknown, prefer = "return=representation"): Promise<T> {
  const { url, serviceKey } = getConfig()
  const res = await fetch(`${url}${path}`, {
    method: "POST",
    headers: { ...headers(serviceKey), Prefer: prefer },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase POST failed ${res.status}: ${text}`)
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export async function supaPatch<T>(
  path: string,
  body: unknown,
  prefer = "return=representation",
): Promise<T> {
  const { url, serviceKey } = getConfig()
  const res = await fetch(`${url}${path}`, {
    method: "PATCH",
    headers: { ...headers(serviceKey), Prefer: prefer },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase PATCH failed ${res.status}: ${text}`)
  return text ? (JSON.parse(text) as T) : (undefined as T)
}



