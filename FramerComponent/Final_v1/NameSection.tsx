import React, { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// API 호출 함수들
async function getInviteNamesByPageId(pageId: string) {
    if (!pageId) return { groom_name: "", bride_name: "" }
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(pageId)}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
        )
        if (!response.ok) {
            return { groom_name: "", bride_name: "" }
        }
        const result = await response.json()
        if (result && result.success && result.data) {
            return {
                groom_name: result.data.groom_name || "",
                bride_name: result.data.bride_name || "",
            }
        }
        return { groom_name: "", bride_name: "" }
    } catch {
        return { groom_name: "", bride_name: "" }
    }
}

async function getPageSettingsNames(pageId: string) {
    if (!pageId) return { groom_name_en: "", bride_name_en: "" }
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        )
        if (!res.ok) return { groom_name_en: "", bride_name_en: "" }
        const json = await res.json()
        const data = json && json.data ? json.data : {}
        return {
            groom_name_en: data.groom_name_en || "",
            bride_name_en: data.bride_name_en || "",
        }
    } catch {
        return { groom_name_en: "", bride_name_en: "" }
    }
}

interface NameSectionProps {
    groomName: string
    brideName: string
    pageId?: string
    style?: React.CSSProperties
}

export default function NameSection(props: NameSectionProps) {
    const { groomName, brideName, pageId, style } = props

    // 이름 상태 (props 우선, 없으면 페이지에서 로드)
    const [resolvedGroomName, setResolvedGroomName] = useState(groomName)
    const [resolvedBrideName, setResolvedBrideName] = useState(brideName)

    // 'and' SVG 컴포넌트
    const AndSvg = () => (
        <svg
            width="73"
            height="42"
            viewBox="0 0 73 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g clipPath="url(#clip0_146_51)">
                <path
                    d="M70.4 0C63.88 0 56.2 16.39 50.7 29.06C50.29 27.43 49.22 26.46 47.54 26.46C44.51 26.46 40.97 29.2 38.94 32.79C38.67 33.07 38.34 33.49 37.91 34.05C36.08 36.39 32.77 40.62 31.19 40.62C30.73 40.62 30.53 40.42 30.53 40.11C30.53 39.3 31.29 37.72 32.21 35.89C33.38 33.55 34.75 30.8 34.75 28.86C34.75 27.74 34.34 27.28 33.48 27.28C32.56 27.28 28.49 30.64 26.1 33.34C27.07 31.41 28.19 29.07 28.19 27.18C28.19 25.29 27.17 24.89 26.26 24.89C24.73 24.89 22.29 28.05 19.49 31.66L18.57 32.83C18.57 32.83 18.53 32.9 18.5 32.93C18.49 32.95 18.48 32.96 18.46 32.98C13.93 38.99 11.89 40.77 10.93 40.77C10.47 40.77 10.37 40.26 10.37 39.8C10.37 37.82 13.17 32.72 14.8 29.93C15 29.57 15.11 29.37 15.11 29.22C15.11 29.07 15.01 29.02 14.91 29.02C14.6 29.02 13.74 29.07 13.18 29.17C12.42 29.32 12.01 29.88 10.89 31.87C9.47 34.36 5.04 40.27 3.26 40.27C2.65 40.27 2.39 39.91 2.39 39.2C2.39 35.48 7.78 27.03 13.89 27.03C15.72 27.03 16.79 27.74 17.4 28.96C17.5 29.16 17.65 29.27 17.81 29.27C18.01 29.27 18.17 29.12 18.17 28.91C18.17 28.81 18.12 28.71 18.07 28.6C17.25 26.97 15.88 26.26 13.95 26.26C7.18 26.26 0 32.93 0 39.29C0 40.77 0.92 41.53 2.19 41.53C4.43 41.53 7.03 38.73 8.76 36.34C8.56 37.1 8.4 37.87 8.4 38.78C8.4 40 9.01 41.63 10.64 41.63C12.27 41.63 13.74 40.41 19.39 32.98C19.4 32.96 19.4 32.96 19.41 32.94C19.55 32.77 19.7 32.58 19.9 32.32C22.85 28.45 24.94 25.75 25.96 25.75C26.37 25.75 26.47 26.06 26.47 26.46C26.47 27.78 23.26 34.1 19.6 40.46C19.5 40.61 19.45 40.77 19.45 40.87C19.45 41.23 20.26 41.94 20.72 41.94C20.92 41.94 21.13 41.84 21.33 41.58C22.2 40.56 23.06 39.19 24.74 36.24C25.66 34.61 29.17 30.94 31.61 29.27C31.76 29.17 31.86 29.12 32.02 29.12C32.22 29.12 32.38 29.27 32.38 29.53C32.38 29.63 32.33 29.84 32.23 30.04C31.92 30.75 31.57 31.52 31.16 32.28C29.94 34.72 28.62 37.47 28.62 39.46C28.62 40.48 29.13 41.55 30.81 41.55C32.49 41.55 35.19 38.7 37.53 35.75L37.85 35.34C37.52 36.39 37.33 37.47 37.33 38.55C37.33 40.64 38.3 41.65 39.42 41.65C41.51 41.65 45.07 38.29 49.19 32.74C48.94 33.4 48.68 34.27 48.58 34.62C47.77 37.47 47.05 38.74 45.32 40.27C44.61 40.88 44.45 41.03 44.45 41.24C44.45 41.39 44.6 41.6 44.81 41.6C45.02 41.6 45.17 41.5 45.32 41.4C46.13 40.84 46.54 40.69 46.8 40.69C47.11 40.69 47.36 40.84 47.61 41C48.02 41.25 48.43 41.51 49.09 41.51C51.03 41.51 53.32 38.61 55.86 35.3L57.39 33.31C57.59 33.06 57.7 32.9 57.7 32.85C57.7 32.75 57.6 32.6 57.39 32.6C57.24 32.6 56.98 32.7 56.68 33.06C56.07 33.77 55.3 34.69 54.59 35.61C52.6 38.15 50.57 40.7 49.09 40.7C48.63 40.7 48.33 40.5 48.02 40.29L47.61 40.09C48.68 39.27 49.39 38.21 50.1 36.78C50.2 36.58 50.51 35.81 50.97 34.64C54.01 26.82 64.5 0.97 70.76 0.97C71.32 0.97 71.68 1.07 71.93 1.28C72.18 1.48 72.34 1.53 72.49 1.53C72.69 1.53 72.85 1.38 72.85 1.17C72.85 0.76 72.09 0 70.41 0H70.4ZM40.32 40.26C39.96 40.26 39.66 39.9 39.66 39.24C39.66 35.98 43.58 27.33 47.75 27.33C49.23 27.33 49.89 29.06 49.94 30.33C48.01 33.13 42.36 40.26 40.32 40.26Z"
                    fill="black"
                />
            </g>
            <defs>
                <clipPath id="clip0_146_51">
                    <rect width="72.85" height="41.94" fill="white" />
                </clipPath>
            </defs>
        </svg>
    )

    const nameContainerRef = useRef<HTMLDivElement | null>(null)
    const groomRef = useRef<HTMLDivElement | null>(null)
    const brideRef = useRef<HTMLDivElement | null>(null)
    const [nameFontSize, setNameFontSize] = useState(48)
    const [andSvgScale, setAndSvgScale] = useState(1)
    const [marginSize, setMarginSize] = useState(14)
    // 순차 애니메이션 제어: 0=대기, 1=신랑 완료, 2=SVG 완료
    const [sequence, setSequence] = useState(0)

    // 애니메이션 트리거를 위한 useInView
    const isInView = useInView(nameContainerRef, { once: true, amount: 0.3 })

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[NameSection] Typography loading failed:", error)
        }
    }, [])

    // 페이지에서 신랑/신부 이름 로드 (props 값이 비어있을 때만)
    useEffect(() => {
        let mounted = true
        ;(async () => {
            const hasCustomGroom = !!(groomName && groomName.trim() && groomName !== "GROOM")
            const hasCustomBride = !!(brideName && brideName.trim() && brideName !== "BRIDE")
            if (hasCustomGroom || hasCustomBride) {
                return // 사용자가 이름을 명시한 경우 API 호출 생략
            }
            
            // 1) page_settings에서 EN 이름 우선 사용
            const settingsNames = await getPageSettingsNames(pageId || "")
            if (!mounted) return
            let updated = false
            if (settingsNames.groom_name_en) {
                setResolvedGroomName(settingsNames.groom_name_en)
                updated = true
            }
            if (settingsNames.bride_name_en) {
                setResolvedBrideName(settingsNames.bride_name_en)
                updated = true
            }
            if (updated) return

            // 2) 폴백: invite에서 이름 사용
            const names = await getInviteNamesByPageId(pageId || "")
            if (!mounted) return
            if (names.groom_name && !groomName) setResolvedGroomName(names.groom_name)
            if (names.bride_name && !brideName) setResolvedBrideName(names.bride_name)
        })()
        return () => { mounted = false }
    }, [pageId, groomName, brideName])

    // 폰트 크기 자동 조정
    const adjustTextSize = (): void => {
        if (!nameContainerRef.current || !groomRef.current || !brideRef.current)
            return

        const containerWidth = (nameContainerRef.current as HTMLDivElement)
            .clientWidth

        // 모바일 브라우저 최적화: 최대 너비 430px
        const baseWidth = 390
        const minWidth = 280
        const maxWidth = 430

        // 현재 너비를 모바일 범위로 제한
        const clampedWidth = Math.max(
            minWidth,
            Math.min(maxWidth, containerWidth)
        )

        // 비례 계수 계산 (0.7 ~ 1.1 범위로 제한하여 모바일에서 극단적 변화 방지)
        const scale = Math.max(0.7, Math.min(1.1, clampedWidth / baseWidth))

        // 기본 크기들
        const baseFontSize = 48
        const baseMargin = 14
        const baseSvgHeight = 42

        // 스케일에 따른 크기 계산
        const targetFontSize = Math.round(baseFontSize * scale)
        const targetMargin = Math.round(baseMargin * scale)
        const targetSvgHeight = Math.round(baseSvgHeight * scale)

        // 모바일 최적화된 폰트 크기 제한
        const minFontSize = Math.max(20, Math.round(baseFontSize * 0.7))
        const maxFontSize = Math.min(56, Math.round(baseFontSize * 1.1))

        // SVG 스케일 계산 (높이 기준)
        const svgScale = targetSvgHeight / baseSvgHeight

        // 사용 가능한 너비 계산 (SVG와 여백 고려)
        const availableWidth = Math.max(
            0,
            containerWidth - targetMargin * 2 - 20
        )

        // 폰트 크기 테스트 및 조정
        const testFontSize = (size: number): boolean => {
            if (!groomRef.current || !brideRef.current) return false

            groomRef.current.style.fontSize = `${size}px`
            const groomOverflows = groomRef.current.scrollWidth > availableWidth

            brideRef.current.style.fontSize = `${size}px`
            const brideOverflows = brideRef.current.scrollWidth > availableWidth

            return groomOverflows || brideOverflows
        }

        // 최종 폰트 크기 결정
        let finalFontSize = Math.min(targetFontSize, maxFontSize)

        // 오버플로우 체크하면서 크기 조정
        while (testFontSize(finalFontSize) && finalFontSize > minFontSize) {
            finalFontSize -= 1
        }

        // 상태 업데이트
        setNameFontSize(finalFontSize)
        setMarginSize(targetMargin)
        setAndSvgScale(svgScale)

        // 디버깅용 로그 (개발 시 확인용)
        console.log(
            `Container: ${containerWidth}px, Scale: ${scale.toFixed(2)}, Font: ${finalFontSize}px, Margin: ${targetMargin}px`
        )
    }
    // P22 폰트 스택을 안전하게 가져오기
    const p22FontFamily = React.useMemo(() => {
        try {
            return typography?.helpers?.stacks?.p22 || '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        } catch {
            return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    useEffect(() => {
        // 초기 로드 시 즉시 실행
        adjustTextSize()

        // 리사이즈 이벤트 핸들러 개선
        const handleResize = () => {
            // 디바운싱 없이 즉시 실행하여 반응성 향상
            adjustTextSize()
        }

        window.addEventListener("resize", handleResize)

        // 컴포넌트 언마운트 시 정리
        return () => window.removeEventListener("resize", handleResize)
    }, [resolvedGroomName, resolvedBrideName])

    return (
        <div
            ref={nameContainerRef}
            style={{
                width: "100%",
                height: "240px",
                minWidth: "280px",
                maxWidth: "430px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: "40px",
                boxSizing: "border-box",
                position: "relative",
                ...style,
            }}
        >
            {/* 신랑 이름 */}
            <motion.div
                ref={groomRef}
                initial={{ opacity: 0 }}
                animate={isInView && !!(resolvedGroomName && resolvedGroomName.trim()) ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                    type: "spring",
                    duration: 0.8,
                    bounce: 0,
                }}
                onAnimationComplete={() => {
                    // 신랑 이름이 표시 완료되었을 때만 다음 단계로 진행
                    if (isInView && sequence < 1 && !!(resolvedGroomName && resolvedGroomName.trim())) {
                        setSequence(1)
                    }
                }}
                style={{
                    fontFamily: p22FontFamily,
                    fontSize: `${nameFontSize}px`,
                    textAlign: "center",
                    lineHeight: "1.2",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                }}
            >
                {resolvedGroomName.toUpperCase()}
            </motion.div>
            {/* and SVG */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView && sequence >= 1 ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                    type: "spring",
                    duration: 0.8,
                    bounce: 0,
                }}
                onAnimationComplete={() => {
                    if (isInView && sequence === 1) {
                        setSequence(2)
                    }
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: `${marginSize}px`,
                    height: `${Math.round(42 * (marginSize / 14))}px`,
                    transform: `scale(${andSvgScale})`,
                    transformOrigin: "center",
                }}
            >
                <AndSvg />
            </motion.div>
            {/* 신부 이름 */}
            <motion.div
                ref={brideRef}
                initial={{ opacity: 0 }}
                animate={isInView && sequence >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                    type: "spring",
                    duration: 0.8,
                    bounce: 0,
                }}
                style={{
                    fontFamily: p22FontFamily,
                    fontSize: `${nameFontSize}px`,
                    textAlign: "center",
                    lineHeight: "1.2",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                }}
            >
                {resolvedBrideName.toUpperCase()}
            </motion.div>
        </div>
    )
}

NameSection.defaultProps = {
    groomName: "GROOM",
    brideName: "BRIDE",
}

addPropertyControls(NameSection, {
    groomName: {
        type: ControlType.String,
        title: "신랑 이름",
        defaultValue: "GROOM",
        placeholder: "신랑 이름을 입력하세요 (자동 대문자 변환)",
    },
    brideName: {
        type: ControlType.String,
        title: "신부 이름",
        defaultValue: "BRIDE",
        placeholder: "신부 이름을 입력하세요 (자동 대문자 변환)",
    },
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "페이지 ID를 입력하세요 (API에서 이름을 가져옵니다)",
    },
})
