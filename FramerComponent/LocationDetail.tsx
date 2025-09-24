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
// 줄바꿈(\n)도 처리하여 <br> 태그로 변환
// 중첩 지원: {*버스* 20, 10} → "버스"는 작은 글씨+두꺼운 글씨, "20,10"은 작은 글씨
function renderStyledText(text: string): JSX.Element[] {
    const segments: JSX.Element[] = []
    let index = 0
    const regex = /(\{([^}]*)\})|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length

        // 매칭 전 일반 텍스트 추가
        if (start > index) {
            const beforeText = text.slice(index, start)
            segments.push(...processBoldAndLineBreak(beforeText, `t-${index}`))
        }

        if (match[1]) {
            // { } 처리 - 내부 텍스트에서 * * 처리와 줄바꿈 처리도 수행
            const inner = match[2] || ""
            const innerSegments = processBoldAndLineBreak(inner, `q-${start}`)
            segments.push(
                <span
                    key={`q-${start}`}
                    style={{ fontSize: 13, lineHeight: "20px" }}
                >
                    {innerSegments}
                </span>
            )
        } else if (match[3]) {
            // 두 번 줄바꿈 처리 (\n\n) - 0.6em 간격
            segments.push(
                <div key={`double-br-${start}`} style={{ height: "0.6em" }} />
            )
        } else if (match[4]) {
            // 한 번 줄바꿈 처리 (\n) - 일반 줄바꿈
            segments.push(<br key={`br-${start}`} />)
        }

        index = end
    }

    // 남은 텍스트 처리
    if (index < text.length) {
        const remainingText = text.slice(index)
        segments.push(...processBoldAndLineBreak(remainingText, `t-${index}`))
    }

    return segments
}

// * * 처리와 줄바꿈 처리를 모두 수행하는 함수
function processBoldAndLineBreak(
    text: string,
    keyPrefix: string
): JSX.Element[] {
    const segments: JSX.Element[] = []
    let index = 0
    const regex = /(\*([^*]+)\*)|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length

        // 매칭 전 일반 텍스트
        if (start > index) {
            const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
            segments.push(
                <span key={`${keyPrefix}-${index}`} style={{ lineHeight }}>
                    {text.slice(index, start)}
                </span>
            )
        }

        if (match[1]) {
            // * * 처리
            const inner = match[2] || ""
            const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
            segments.push(
                <span
                    key={`${keyPrefix}-b-${start}`}
                    style={{ fontFamily: "Pretendard SemiBold", lineHeight }}
                >
                    {inner}
                </span>
            )
        } else if (match[3]) {
            // 두 번 줄바꿈 처리 (\n\n) - 0.6em 간격
            segments.push(
                <div
                    key={`${keyPrefix}-double-br-${start}`}
                    style={{ height: "0.6em" }}
                />
            )
        } else if (match[4]) {
            // 한 번 줄바꿈 처리 (\n) - 일반 줄바꿈
            segments.push(<br key={`${keyPrefix}-br-${start}`} />)
        }

        index = end
    }

    // 남은 텍스트
    if (index < text.length) {
        const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
        segments.push(
            <span key={`${keyPrefix}-${index}`} style={{ lineHeight }}>
                {text.slice(index)}
            </span>
        )
    }

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
                const bases = [
                    typeof window !== "undefined" ? window.location.origin : "",
                    PROXY_BASE_URL,
                ].filter(Boolean)
                let res: Response | null = null
                for (const base of bases) {
                    try {
                        const tryRes = await fetch(
                            `${base}/api/page-settings?transport&pageId=${encodeURIComponent(pageId)}`
                        )
                        res = tryRes
                        if (tryRes.ok) break
                    } catch {}
                }
                if (!res) throw new Error("network error")
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
        return () => {
            mounted = false
        }
    }, [pageId])

    const safeItems =
        items.length > 0
            ? items
            : [
                  {
                      title: "교통편",
                      description: "상세 항목",
                      display_order: 1,
                  },
                  {
                      title: "교통편",
                      description: "상세 항목",
                      display_order: 2,
                  },
              ]

    return (
        <div
            style={{
                width: 439,
                paddingTop: 30,
                paddingBottom: 30,
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 15,
                display: "inline-flex",
                ...style,
            }}
        >
            {safeItems
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((it, idx) => (
                    <div
                        key={idx}
                        style={{
                            alignSelf: "stretch",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            display: "inline-flex",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 52,
                                color: "black",
                                fontSize: 15,
                                fontFamily: "Pretendard SemiBold",
                                lineHeight: "1.6em",
                                wordWrap: "break-word",
                            }}
                        >
                            {it.title || ""}
                        </div>
                        <div
                            style={{
                                flex: "1 1 0",
                                color: "black",
                                fontSize: 15,
                                fontFamily: "Pretendard Regular",
                                wordWrap: "break-word",
                            }}
                        >
                            {renderStyledText(it.description || "")}
                        </div>
                    </div>
                ))}
        </div>
    )
}

addPropertyControls(LocationDetail, {
    pageId: {
        type: ControlType.String,
        title: "page_id",
        defaultValue: "default",
        placeholder: "예: aeyong",
    },
})
