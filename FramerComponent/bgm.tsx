/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

type MusicPlayerProps = {
    pageId: string // page_id로 음원 정보를 가져옴
    autoplay: boolean // 자동 재생 여부
    playIcon: string // 재생 아이콘 이미지 URL
    pauseIcon: string // 일시정지 아이콘 이미지 URL
    volumeLevel: number // 볼륨 조절 (1: 10% ~ 10: 100%)
    style?: React.CSSProperties
}

export default function MusicPlayer(props: MusicPlayerProps) {
    const { pageId, autoplay, playIcon, pauseIcon, volumeLevel, style } = props
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(autoplay)
    const [audioUrl, setAudioUrl] = useState<string>("")
    const [loading, setLoading] = useState(true)

    // page_id로 R2 음원 정보 가져오기
    useEffect(() => {
        if (!pageId) {
            console.log(`[BGM] pageId가 없음:`, pageId)
            return
        }

        const fetchAudio = async () => {
            try {
                setLoading(true)
                console.log(
                    `[BGM] R2 음원 로딩 시작: pageId="${pageId}" (타입: ${typeof pageId})`
                )

                const apiUrl = `${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`
                console.log(`[BGM] API 호출 URL:`, apiUrl)

                const response = await fetch(apiUrl)
                console.log(`[BGM] API 응답 상태: ${response.status}`)

                if (response.ok) {
                    const result = await response.json()
                    console.log(`[BGM] API 전체 응답:`, result)

                    // API 응답 구조 확인 (result.data 또는 result 직접)
                    const data = result.success ? result.data : result
                    console.log(`[BGM] 페이지 설정 데이터:`, data)

                    if (data && data.bgm_url && data.bgm_url.trim() !== "") {
                        setAudioUrl(data.bgm_url.trim())
                        console.log(`[BGM] R2 음원 URL 설정: ${data.bgm_url}`)
                        console.log(`[BGM] BGM 타입: ${data.bgm_type}`)
                        console.log(`[BGM] BGM 자동재생: ${data.bgm_autoplay}`)
                    } else {
                        console.log(`[BGM] bgm_url이 없거나 비어있음`)
                        console.log(
                            `[BGM] data.bgm_url 원본 값:`,
                            JSON.stringify(data?.bgm_url)
                        )
                        console.log(
                            `[BGM] data.bgm_type 값:`,
                            JSON.stringify(data?.bgm_type)
                        )
                        console.log(`[BGM] 전체 BGM 관련 필드:`, {
                            bgm_url: data?.bgm_url,
                            bgm_type: data?.bgm_type,
                            bgm_autoplay: data?.bgm_autoplay,
                        })

                        // 테스트용: pageId가 'test'인 경우 테스트 음원 사용
                        if (pageId === "test") {
                            // 실제 동작하는 테스트 음원 (공개 도메인)
                            const testUrl =
                                "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"
                            console.log(
                                `[BGM] 테스트 모드: 테스트 음원 사용 - ${testUrl}`
                            )
                            setAudioUrl(testUrl)
                        }
                    }
                } else {
                    const errorText = await response.text()
                    console.error(
                        `[BGM] 페이지 설정 로드 실패: ${response.status}`,
                        errorText
                    )
                }
            } catch (error) {
                console.error("[BGM] R2 음원 로딩 실패:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAudio()
    }, [pageId])

    // R2 음원 자동 재생 처리
    useEffect(() => {
        if (autoplay && audioRef.current && audioUrl) {
            console.log(`[BGM] 자동 재생 시도: ${audioUrl}`)
            // 브라우저 정책으로 인해 사용자 인터랙션 없이는 자동재생이 제한될 수 있음
            audioRef.current
                .play()
                .then(() => {
                    console.log(`[BGM] 자동 재생 성공`)
                    setIsPlaying(true)
                })
                .catch((error) => {
                    console.warn(`[BGM] 자동 재생 실패 (브라우저 정책):`, error)
                    setIsPlaying(false)
                })
        }
    }, [autoplay, audioUrl])

    // 볼륨 조절: 1~10 단계, 1은 10%, 10은 100%
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volumeLevel / 10
        }
    }, [volumeLevel])

    const togglePlayback = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            console.log(`[BGM] 재생 일시정지`)
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            console.log(`[BGM] 재생 시작: ${audioUrl}`)
            audioRef.current
                .play()
                .then(() => {
                    console.log(`[BGM] 재생 성공`)
                    setIsPlaying(true)
                })
                .catch((error) => {
                    console.error(`[BGM] 재생 실패:`, error)
                    setIsPlaying(false)
                })
        }
    }

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    ...style,
                }}
            >
                <div style={{ fontSize: "12px", color: "#999" }}>...</div>
            </div>
        )
    }

    if (!audioUrl) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    ...style,
                }}
            >
                <div style={{ fontSize: "12px", color: "#999" }}>x</div>
            </div>
        )
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                ...style,
            }}
        >
            {/* R2 음원을 위한 오디오 태그 (화면에 노출되지 않음) */}
            <audio
                src={audioUrl}
                ref={audioRef}
                loop
                preload="metadata"
                style={{ display: "none" }}
                onLoadStart={() =>
                    console.log(`[BGM] R2 음원 로드 시작: ${audioUrl}`)
                }
                onLoadedData={() => console.log(`[BGM] R2 음원 로드 완료`)}
                onError={(e) => console.error(`[BGM] R2 음원 로드 에러:`, e)}
            />
            {/* onTap 이벤트를 사용한 재생/일시정지 토글 버튼 */}
            <motion.button
                onTap={togglePlayback}
                style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                }}
            >
                <img
                    src={isPlaying ? pauseIcon : playIcon}
                    alt={isPlaying ? "일시정지" : "재생"}
                    style={{ width: "22px", height: "22px" }}
                />
            </motion.button>
        </div>
    )
}

MusicPlayer.defaultProps = {
    pageId: "",
    autoplay: false,
    playIcon: "https://path.to.default.play.icon.png",
    pauseIcon: "https://path.to.default.pause.icon.png",
    volumeLevel: 10, // 기본 볼륨 100%
    style: {},
}

addPropertyControls(MusicPlayer, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "페이지 ID를 입력하세요",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "자동 재생",
        defaultValue: false,
    },
    playIcon: {
        type: ControlType.File,
        title: "재생 아이콘",
        allowedFileTypes: ["image/*"],
    },
    pauseIcon: {
        type: ControlType.File,
        title: "일시정지 아이콘",
        allowedFileTypes: ["image/*"],
    },
    volumeLevel: {
        type: ControlType.Number,
        title: "볼륨 (1~10)",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 10,
    },
})
