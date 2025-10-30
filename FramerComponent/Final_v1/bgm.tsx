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
    style?: React.CSSProperties
}

export default function MusicPlayer(props: MusicPlayerProps) {
    const { pageId, style } = props

    // 고정된 아이콘 URL
    const playIcon = "https://cdn.roarc.kr/framer/bgmIcon/bgmPlay.png"
    const pauseIcon = "https://cdn.roarc.kr/framer/bgmIcon/bgmPause.png"
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [supabaseAutoplay, setSupabaseAutoplay] = useState<boolean>(false)
    const [supabaseVolume, setSupabaseVolume] = useState<number>(10)
    const [bgmType, setBgmType] = useState<string>("")
    const [showNotification, setShowNotification] = useState<boolean>(false)
    const [notificationPhase, setNotificationPhase] = useState<
        "entering" | "waiting" | "exiting"
    >("entering")

    // Pretendard 폰트 동적 로드
    useEffect(() => {
        const link = document.createElement("link")
        link.href =
            "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"
        link.rel = "stylesheet"
        document.head.appendChild(link)

        return () => {
            document.head.removeChild(link)
        }
    }, [])

    // page_id로 R2 음원 정보 및 Supabase 설정 가져오기
    useEffect(() => {
        if (!pageId) {
            console.log(`[BGM-Supabase] pageId가 없음:`, pageId)
            return
        }

        const fetchAudio = async () => {
            try {
                setLoading(true)
                console.log(
                    `[BGM-Supabase] R2 음원 및 Supabase 설정 로딩 시작: pageId="${pageId}" (타입: ${typeof pageId})`
                )

                const apiUrl = `${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`
                console.log(`[BGM-Supabase] API 호출 URL:`, apiUrl)

                const response = await fetch(apiUrl)
                console.log(`[BGM-Supabase] API 응답 상태: ${response.status}`)

                if (response.ok) {
                    const result = await response.json()
                    console.log(`[BGM-Supabase] API 전체 응답:`, result)

                    // API 응답 구조 확인 (result.data 또는 result 직접)
                    const data = result.success ? result.data : result
                    console.log(`[BGM-Supabase] 페이지 설정 데이터:`, data)

                    if (data && data.bgm_url && data.bgm_url.trim() !== "") {
                        setAudioUrl(data.bgm_url.trim())
                        console.log(
                            `[BGM-Supabase] R2 음원 URL 설정: ${data.bgm_url}`
                        )
                        console.log(`[BGM-Supabase] BGM 타입: ${data.type}`)

                        // BGM 타입 설정 (page_settings.type에서 읽어옴)
                        if (data.type) {
                            setBgmType(data.type)
                        }

                        // 배경음악 준비 알림 표시
                        setShowNotification(true)

                        // Supabase bgm_autoplay 설정 적용
                        if (data.bgm_autoplay !== undefined) {
                            setSupabaseAutoplay(data.bgm_autoplay)
                            console.log(
                                `[BGM-Supabase] Supabase 자동재생 설정: ${data.bgm_autoplay}`
                            )
                        }

                        // Supabase bgm_vol 설정 적용
                        if (
                            data.bgm_vol !== undefined &&
                            data.bgm_vol >= 1 &&
                            data.bgm_vol <= 10
                        ) {
                            setSupabaseVolume(data.bgm_vol)
                            console.log(
                                `[BGM-Supabase] Supabase 볼륨 설정: ${data.bgm_vol}`
                            )
                        } else {
                            console.log(
                                `[BGM-Supabase] bgm_vol 값이 유효하지 않음: ${data.bgm_vol}, 기본값 10 사용`
                            )
                            setSupabaseVolume(10)
                        }
                    } else {
                        console.log(`[BGM-Supabase] bgm_url이 없거나 비어있음`)
                        console.log(
                            `[BGM-Supabase] data.bgm_url 원본 값:`,
                            JSON.stringify(data?.bgm_url)
                        )
                        console.log(
                            `[BGM-Supabase] data.bgm_type 값:`,
                            JSON.stringify(data?.bgm_type)
                        )
                        console.log(`[BGM-Supabase] 전체 BGM 관련 필드:`, {
                            bgm_url: data?.bgm_url,
                            bgm_type: data?.bgm_type,
                            bgm_autoplay: data?.bgm_autoplay,
                            bgm_vol: data?.bgm_vol,
                        })

                        // 테스트용: pageId가 'test'인 경우 테스트 음원 사용
                        if (pageId === "test") {
                            // 실제 동작하는 테스트 음원 (공개 도메인)
                            const testUrl =
                                "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"
                            console.log(
                                `[BGM-Supabase] 테스트 모드: 테스트 음원 사용 - ${testUrl}`
                            )
                            setAudioUrl(testUrl)
                            setSupabaseAutoplay(true)
                            setSupabaseVolume(8)
                        }
                    }
                } else {
                    const errorText = await response.text()
                    console.error(
                        `[BGM-Supabase] 페이지 설정 로드 실패: ${response.status}`,
                        errorText
                    )
                }
            } catch (error) {
                console.error(
                    "[BGM-Supabase] R2 음원 및 Supabase 설정 로딩 실패:",
                    error
                )
            } finally {
                setLoading(false)
            }
        }

        fetchAudio()
    }, [pageId])

    // Supabase bgm_vol 설정에 따른 볼륨 조절: 1~10 단계, 1은 10%, 10은 100%
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = supabaseVolume / 10
            console.log(
                `[BGM-Supabase] 볼륨 설정: ${supabaseVolume}/10 = ${supabaseVolume / 10}`
            )
        }
    }, [supabaseVolume])

    // Supabase bgm_autoplay 설정에 따른 자동 재생 처리
    useEffect(() => {
        if (supabaseAutoplay && audioRef.current && audioUrl) {
            console.log(`[BGM-Supabase] Supabase 자동 재생 시도: ${audioUrl}`)
            // 브라우저 정책으로 인해 사용자 인터랙션 없이는 자동재생이 제한될 수 있음
            audioRef.current
                .play()
                .then(() => {
                    console.log(`[BGM-Supabase] Supabase 자동 재생 성공`)
                    setIsPlaying(true)
                })
                .catch((error) => {
                    console.warn(
                        `[BGM-Supabase] Supabase 자동 재생 실패 (브라우저 정책):`,
                        error
                    )
                    setIsPlaying(false)
                })
        }
    }, [supabaseAutoplay, audioUrl])

    // 배경음악 준비 알림 타이머 처리
    useEffect(() => {
        if (showNotification) {
            // 1초 후 waiting 상태로 변경
            const enterTimer = setTimeout(() => {
                setNotificationPhase("waiting")
            }, 1000)

            // 3초 후 exiting 상태로 변경
            const exitTimer = setTimeout(() => {
                setNotificationPhase("exiting")
            }, 3000)

            // 3.5초 후 완전히 숨김
            const hideTimer = setTimeout(() => {
                setShowNotification(false)
            }, 3500)

            return () => {
                clearTimeout(enterTimer)
                clearTimeout(exitTimer)
                clearTimeout(hideTimer)
            }
        }
    }, [showNotification])

    const togglePlayback = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            console.log(`[BGM-Supabase] 재생 일시정지`)
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            console.log(`[BGM-Supabase] 재생 시작: ${audioUrl}`)
            audioRef.current
                .play()
                .then(() => {
                    console.log(`[BGM-Supabase] 재생 성공`)
                    setIsPlaying(true)
                })
                .catch((error) => {
                    console.error(`[BGM-Supabase] 재생 실패:`, error)
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
        // BGM이 없는 경우 처리
        if (bgmType === "papillon") {
            // papillon 타입일 때는 43px 높이의 투명한 영역 표시
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "6px",
                        gap: "10px",
                        width: "100%",
                        height: "43px",
                        minHeight: "43px",
                        backgroundColor: "transparent",
                        ...style,
                    }}
                />
            )
        } else {
            // 다른 타입일 때는 완전히 숨김
            return (
                <div style={{ display: "none" }}>
                    <audio
                        src={audioUrl}
                        ref={audioRef}
                        loop
                        preload="metadata"
                        style={{ display: "none" }}
                    />
                </div>
            )
        }
    }

    // 이퀄라이저 애니메이션 컴포넌트
    const EqualizerBars = () => {
        const [heights, setHeights] = useState([6, 12, 3, 9])

        useEffect(() => {
            if (!isPlaying) return

            const interval = setInterval(() => {
                setHeights([
                    Math.random() * 9 + 3, // 3-12px (11px 컨테이너 내에서)
                    Math.random() * 9 + 3,
                    Math.random() * 9 + 3,
                    Math.random() * 9 + 3,
                ])
            }, 300) // 더 느리게 변경

            return () => clearInterval(interval)
        }, [isPlaying])

        return (
            <div
                style={{
                    display: "flex",
                    gap: "1px",
                    alignItems: "end",
                    width: "11px",
                    height: "12px",
                    position: "relative",
                }}
            >
                {heights.map((height, index) => (
                    <motion.div
                        key={index}
                        style={{
                            backgroundColor: "transparent",
                            width: "2px",
                            height: "12px", // 고정 높이
                            position: "absolute",
                            bottom: 0,
                            left: `${index * 3}px`, // 2px width + 1px gap
                            transformOrigin: "bottom center",
                        }}
                        animate={{
                            scaleY: height / 12, // 높이 비율로 스케일 조정
                        }}
                        transition={{
                            duration: 0.6,
                            ease: [0.4, 0.0, 0.2, 1], // 더 부드러운 easing
                            bounce: 0.2,
                        }}
                    />
                ))}
            </div>
        )
    }

    // papillon 조건에 따른 컨테이너 스타일 결정
    const containerStyle = {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "6px",
        gap: "10px",
        width: "100%",
        height: audioUrl ? (bgmType === "papillon" ? "43px" : "auto") : (bgmType === "papillon" ? "43px" : "0px"),
        minHeight: audioUrl ? (bgmType === "papillon" ? "43px" : "0px") : (bgmType === "papillon" ? "43px" : "0px"),
        backgroundColor: audioUrl ? (bgmType === "papillon" ? "#FAFAFA" : "transparent") : "transparent",
        ...style,
    }

    // BGM이 없고 papillon이 아닐 때 전체 숨김 처리
    if (!audioUrl && bgmType !== "papillon") {
        return (
            <div style={{ display: "none" }}>
                <audio
                    src={audioUrl}
                    ref={audioRef}
                    loop
                    preload="metadata"
                    style={{ display: "none" }}
                />
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            {/* R2 음원을 위한 오디오 태그 (화면에 노출되지 않음) */}
            <audio
                src={audioUrl}
                ref={audioRef}
                loop
                preload="metadata"
                style={{ display: "none" }}
                onLoadStart={() =>
                    console.log(`[BGM-Supabase] R2 음원 로드 시작: ${audioUrl}`)
                }
                onLoadedData={() =>
                    console.log(`[BGM-Supabase] R2 음원 로드 완료`)
                }
                onError={(e) =>
                    console.error(`[BGM-Supabase] R2 음원 로드 에러:`, e)
                }
            />

            {/* 배경음악 준비 알림 */}
            {showNotification && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={
                        notificationPhase === "entering"
                            ? { y: 0, opacity: 1 }
                            : notificationPhase === "waiting"
                              ? { y: 0, opacity: 1 }
                              : { y: -100, opacity: 0 }
                    }
                    transition={{
                        duration:
                            notificationPhase === "entering"
                                ? 1
                                : notificationPhase === "exiting"
                                  ? 0.5
                                  : 0,
                        ease:
                            notificationPhase === "entering"
                                ? "easeOut"
                                : "easeIn",
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        color: "white",
                        fontSize: "12px",
                        fontFamily:
                            "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif",
                        fontWeight: 500,
                        textAlign: "center",
                    }}
                >
                    배경음악이 준비되었습니다
                </motion.div>
            )}

            {/* 이퀄라이저와 플레이어 컨테이너 */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {/* 이퀄라이저 애니메이션 (재생 중일 때만 표시) */}
                {isPlaying && audioUrl && (
                    <div
                        style={{
                            display: "flex",
                            gap: "1px",
                            alignItems: "end",
                        }}
                    >
                        <EqualizerBars />
                    </div>
                )}

                {/* 플레이어 버튼 */}
                {audioUrl && (
                    <motion.button
                        onTap={togglePlayback}
                        style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            padding: 0,
                            width: "22px",
                            height: "24px",
                        }}
                    >
                        <img
                            src={isPlaying ? pauseIcon : playIcon}
                            alt={isPlaying ? "일시정지" : "재생"}
                            style={{ width: "22px", height: "22px" }}
                        />
                    </motion.button>
                )}
            </div>
        </div>
    )
}

MusicPlayer.defaultProps = {
    pageId: "",
    style: {},
}

addPropertyControls(MusicPlayer, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "페이지 ID를 입력하세요",
    },
})
