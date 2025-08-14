import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface TransportItem {
  id?: string
  title: string
  description: string
  display_order: number
}

interface LocationDetailProps {
  pageId?: string
  style?: React.CSSProperties
}

// 텍스트 강조 처리: { } → 폰트 크기 13px, * * → Pretendard SemiBold
function renderStyledText(text: string): JSX.Element[] {
  const segments: JSX.Element[] = []
  let index = 0
  const regex = /(\{([^}]*)\})|(\*([^*]+)\*)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (start > index) {
      segments.push(<span key={`t-${index}`}>{text.slice(index, start)}</span>)
    }
    if (match[1]) {
      const inner = match[2] || ""
      segments.push(
        <span key={`q-${start}`} style={{ fontSize: 13 }}>{inner}</span>
      )
    } else if (match[3]) {
      const inner = match[4] || ""
      segments.push(
        <span key={`b-${start}`} style={{ fontFamily: "Pretendard SemiBold" }}>{inner}</span>
      )
    }
    index = end
  }
  if (index < text.length) segments.push(<span key={`t-${index}`}>{text.slice(index)}</span>)
  return segments
}

export default function LocationDetail(props: LocationDetailProps) {
  const { pageId = "default", style } = props
  const [items, setItems] = useState<TransportItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const bases = [typeof window !== 'undefined' ? window.location.origin : '', PROXY_BASE_URL].filter(Boolean)
        let res: Response | null = null
        for (const base of bases) {
          try {
            const tryRes = await fetch(`${base}/api/router?transport&pageId=${encodeURIComponent(pageId)}`)
            res = tryRes
            if (tryRes.ok) break
          } catch {}
        }
        if (!res) throw new Error('network error')
        const result = await res.json()
        if (mounted && result?.success && Array.isArray(result.data)) {
          setItems(result.data)
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [pageId])

  const safeItems = items.length > 0 ? items : [
    { title: "교통편", description: "상세 항목", display_order: 1 },
    { title: "교통편", description: "상세 항목", display_order: 2 },
  ]

  return (
    <div
      style={{
        width: 439,
        paddingTop: 30,
        paddingBottom: 30,
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 15,
        display: 'inline-flex',
        ...style,
      }}
    >
      {safeItems
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((it, idx) => (
          <div key={idx}
            style={{
              alignSelf: 'stretch',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              display: 'inline-flex',
              gap: 10,
            }}
          >
            <div style={{ width: 52, color: 'black', fontSize: 15, fontFamily: 'Pretendard SemiBold', lineHeight: '24px', wordWrap: 'break-word' }}>
              {it.title || ''}
            </div>
            <div style={{ flex: '1 1 0', color: 'black', fontSize: 15, fontFamily: 'Pretendard Regular', lineHeight: '24px', wordWrap: 'break-word' }}>
              {renderStyledText(it.description || '')}
            </div>
          </div>
        ))}
    </div>
  )
}

addPropertyControls(LocationDetail, {
  pageId: {
    type: ControlType.String,
    title: 'page_id',
    defaultValue: 'default',
    placeholder: '예: aeyong',
  },
})


