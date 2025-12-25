'use client'

import React, { useEffect, useRef, useState, useMemo } from "react"
import { motion, type MotionStyle } from "framer-motion"

import { PROXY_BASE_URL } from "@/lib/supabase"

interface BGMPlayerProps {
    pageId: string
    style?: MotionStyle
}

export default function BGMPlayer({ pageId, style }: BGMPlayerProps) {
    // 고정된 아이콘 URL
    const playIcon = "https://cdn.roarc.kr/framer/bgmIcon/bgmPlay.png"
    const pauseIcon = "https://cdn.roarc.kr/framer/bgmIcon/bgmPause.png"

    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [bgmEnabled, setBgmEnabled] = useState<boolean>(false)
    const [showNotification, setShowNotification] = useState<boolean>(false)
    const [notificationPhase, setNotificationPhase] = useState<"entering" | "waiting" | "exiting">("entering")

    // Typography 폰트 스택 (typography.js에서 가져온 값들)
const FONT_STACKS = {
    pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    p22: '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    goldenbook: '"goldenbook", "Goldenbook", serif',
    sloopScriptPro: '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif',
}

    // 폰트 패밀리 설정 (typography.js에서 가져온 폰트 스택 사용)
    const pretendardFontFamily = FONT_STACKS.pretendardVariable

    // 로컬 개발에서는 더미 데이터 사용
    const isDevelopment = process.env.NODE_ENV === 'development'

    // page_id로 BGM 설정 가져오기
    useEffect(() => {
        if (isDevelopment) {
            // 로컬 개발용 더미 데이터
            setAudioUrl("")
            setBgmEnabled(false)
            setLoading(false)
            return
        }

        if (!pageId) {
            setLoading(false)
            return
        }

        const fetchBGMSettings = async () => {
            try {
                setLoading(true)

                const apiUrl = `${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`
                const response = await fetch(apiUrl)

                if (response.ok) {
                    const result = await response.json()
                    const data = result.success ? result.data : result

                    // BGM 활성화 설정 확인
                    const bgmEnabledFromApi = data.bgm !== 'off'
                    setBgmEnabled(bgmEnabledFromApi)

                    if (bgmEnabledFromApi && data.bgm_url && data.bgm_url.trim() !== "") {
                        setAudioUrl(data.bgm_url.trim())

                        // 배경음악 준비 알림 표시
                        setShowNotification(true)
                    }
                }
            } catch (error) {
                console.error("[BGMPlayer] 설정 로딩 실패:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchBGMSettings()
    }, [pageId, isDevelopment])

    // 오디오 이벤트 핸들러
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleCanPlay = () => {
            if (showNotification) {
                // 2초 후 알림 사라짐
                setTimeout(() => {
                    setNotificationPhase("exiting")
                    setTimeout(() => setShowNotification(false), 500)
                }, 2000)
            }
        }

        const handleEnded = () => {
            setIsPlaying(false)
        }

        const handleError = () => {
            console.error("[BGMPlayer] 오디오 로딩 실패")
            setIsPlaying(false)
        }

        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        return () => {
            audio.removeEventListener('canplay', handleCanPlay)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
        }
    }, [showNotification])

    // 재생/일시정지 토글
    const togglePlay = async () => {
        const audio = audioRef.current
        if (!audio || !audioUrl) return

        try {
            if (isPlaying) {
                audio.pause()
                setIsPlaying(false)
            } else {
                // iOS Safari에서는 사용자 인터랙션이 필요함
                await audio.play()
                setIsPlaying(true)
            }
        } catch (error) {
            console.error("[BGMPlayer] 재생 실패:", error)
            // iOS Safari에서는 사용자 인터랙션 후 재생 가능
            alert("음악을 재생하려면 페이지와 상호작용해주세요.")
        }
    }

    // BGM이 활성화되지 않았거나 로딩 중일 때는 렌더링하지 않음
    if (!bgmEnabled || loading) {
        return null
    }

    return (
        <>
            {/* 오디오 엘리먼트 */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    loop
                    style={{ display: 'none' }}
                />
            )}

            {/* 플레이어 UI */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    ...style,
                }}
            >
                <motion.button
                    onClick={togglePlay}
                    disabled={!audioUrl}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isPlaying ? (
                        <img
                            src={pauseIcon}
                            alt="일시정지"
                            style={{
                                width: '24px',
                                height: '24px',
                                filter: 'brightness(0) invert(1)',
                            }}
                        />
                    ) : (
                        <img
                            src={playIcon}
                            alt="재생"
                            style={{
                                width: '24px',
                                height: '24px',
                                filter: 'brightness(0) invert(1)',
                            }}
                        />
                    )}
                </motion.button>
            </motion.div>

            {/* 준비 알림 */}
            {showNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: notificationPhase === "exiting" ? 0 : 1,
                        y: notificationPhase === "exiting" ? -20 : 0
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '16px 24px',
                        borderRadius: '8px',
                        fontFamily: pretendardFontFamily,
                        fontSize: '14px',
                        fontWeight: 500,
                        textAlign: 'center',
                        zIndex: 1001,
                        maxWidth: '300px',
                        wordBreak: 'keep-all',
                    }}
                >
                    🎵 배경음악이 준비되었습니다
                </motion.div>
            )}
        </>
    )
}