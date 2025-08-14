import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface PageSettingsResponse {
    success: boolean
    data?: {
        venue_name?: string
        venue_address?: string
    }
}

interface LocationProps {
    pageId?: string
    style?: React.CSSProperties
}

export default function Location(props: LocationProps) {
    const { pageId = "default", style } = props

    const [venueName, setVenueName] = useState<string>("")
    const [venueAddress, setVenueAddress] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [showCopyMessage, setShowCopyMessage] = useState<boolean>(false)

    useEffect(() => {
        let mounted = true
        async function loadSettings() {
            setLoading(true)
            try {
                const res = await fetch(
                    `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(
                        pageId
                    )}`
                )
                const result = (await res.json()) as PageSettingsResponse
                if (mounted && result.success && result.data) {
                    setVenueName(result.data.venue_name || "")
                    setVenueAddress(result.data.venue_address || "")
                }
            } catch {
                // noop
            } finally {
                if (mounted) setLoading(false)
            }
        }
        loadSettings()
        return () => {
            mounted = false
        }
    }, [pageId])

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(venueAddress || "")
            setShowCopyMessage(true)
            setTimeout(() => setShowCopyMessage(false), 2000)
        } catch {
            // ignore
        }
    }

    return (
        <div
            style={{
                width: 384,
                paddingTop: 40,
                paddingBottom: 28,
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 10,
                overflow: "hidden",
                position: "relative",
                ...style,
            }}
        >
            <div
                style={{
                    alignSelf: "stretch",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 5,
                }}
            >
                {/* 장소 이름 */}
                <div
                    style={{
                        alignSelf: "stretch",
                        textAlign: "center",
                        color: "black",
                        fontSize: 18,
                        fontFamily: "Pretendard SemiBold",
                        lineHeight: "32px",
                    }}
                >
                    {loading ? "" : venueName || "장소이름"}
                </div>

                {/* 상세 주소 + 복사 */}
                <div
                    style={{
                        alignSelf: "stretch",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 5,
                    }}
                >
                    <div
                        style={{
                            alignSelf: "stretch",
                            textAlign: "center",
                            color: "black",
                            fontSize: 16,
                            fontFamily: "Pretendard Regular",
                            lineHeight: "32px",
                        }}
                    >
                        {loading ? "" : venueAddress || "장소 상세주소"}
                    </div>

                    <div
                        onClick={copyToClipboard}
                        style={{
                            display: "inline-flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: 5,
                            cursor: venueAddress ? "pointer" : "default",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="11"
                                height="13"
                                viewBox="0 0 11 13"
                                fill="none"
                                style={{ marginRight: 4 }}
                            >
                                <rect
                                    x="0.5"
                                    y="0.5"
                                    width="7.35989"
                                    height="9.41763"
                                    stroke="#7F7F7F"
                                />
                                <path
                                    d="M3.2998 12.5001H10.4997V3.23438"
                                    stroke="#7F7F7F"
                                />
                            </svg>
                            <div
                                style={{
                                    color: "#9ca3af",
                                    fontSize: 14,
                                    fontFamily: "Pretendard Regular",
                                }}
                            >
                                복사
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 복사 메시지 */}
            {showCopyMessage && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 200,
                        height: 40,
                        background: "#FFFFFF",
                        borderRadius: 5,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                        zIndex: 1000,
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            color: "#000000",
                            fontSize: 14,
                            fontFamily: "Pretendard Regular",
                            textAlign: "center",
                        }}
                    >
                        복사되었습니다
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(Location, {
    pageId: {
        type: ControlType.String,
        title: "page_id",
        defaultValue: "default",
        placeholder: "예: aeyong",
    },
})
