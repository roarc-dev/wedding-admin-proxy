import React, { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

interface EternalNameSectionProps {
    groomName: string
    brideName: string
    groomFont?: any
    brideFont?: any
    style?: React.CSSProperties
}

export default function EternalNameSection(props: EternalNameSectionProps) {
    const { groomName, brideName, groomFont, brideFont, style } = props

    const nameContainerRef = useRef<HTMLDivElement | null>(null)
    const groomRef = useRef<HTMLDivElement | null>(null)
    const brideRef = useRef<HTMLDivElement | null>(null)
    const [nameFontSize, setNameFontSize] = useState(64)
    const [svgScale, setSvgScale] = useState(1)
    const [gapSize, setGapSize] = useState(18)

    // 폰트 크기 자동 조정 - 긴 이름에 맞춰 조정
    const adjustTextSize = (): void => {
        if (!nameContainerRef.current || !groomRef.current || !brideRef.current)
            return

        const containerWidth = (nameContainerRef.current as HTMLDivElement)
            .clientWidth
        const availableWidth = Math.max(0, containerWidth - 40) // 여백 고려
        
        // 화면 가로 너비에 비례한 크기 조정 (430px 기준)
        const scale = containerWidth / 430
        const targetFontSize = scale * 64 // 430px에서 64px (실제 32px로 보임)
        const minFontSize = scale * 32 // 최소 크기
        
        // 간격과 SVG도 비례 조정
        setGapSize(18 * scale)
        setSvgScale(scale)
        
        let fontSize = targetFontSize

        const testFontSize = (size: number): boolean => {
            if (!groomRef.current || !brideRef.current) return false

            // 폰트 크기만 설정 (폰트 패밀리는 제거)
            groomRef.current.style.fontSize = `${size}px`
            const groomOverflows = groomRef.current.scrollWidth > availableWidth

            brideRef.current.style.fontSize = `${size}px`
            const brideOverflows = brideRef.current.scrollWidth > availableWidth

            return groomOverflows || brideOverflows
        }

        while (testFontSize(fontSize) && fontSize > minFontSize) {
            fontSize -= 1
        }
        setNameFontSize(fontSize)
    }

    useEffect(() => {
        adjustTextSize()
        const handleResize = () => setTimeout(adjustTextSize, 100)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [groomName, brideName, groomFont, brideFont])

    return (
        <div
            ref={nameContainerRef}
            style={{
                width: "439px",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: `${gapSize}px`,
                display: "inline-flex",
                ...style,
            }}
        >
            {/* 신랑 이름 */}
            <div
                ref={groomRef}
                style={{
                    alignSelf: "stretch",
                    textAlign: "center",
                    color: "black",
                    fontSize: `${nameFontSize}px`,
                    ...groomFont,
                    lineHeight: "32px",
                    wordWrap: "break-word",
                    letterSpacing: "0.02em",
                    whiteSpace: "pre",
                    overflow: "hidden",
                }}
            >
                {groomName.toUpperCase().replace(/\s+/g, '  ')}
            </div>

            {/* 이름 and */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={17 * svgScale}
                height={18 * svgScale}
                viewBox="0 0 17 18"
                fill="none"
                style={{
                    transform: `scale(${svgScale})`,
                    transformOrigin: "center",
                }}
            >
                <path
                    d="M16.3789 8.87322C15.8298 9.56083 15.0131 10.523 13.2624 10.523C13.0793 10.523 12.9033 10.523 12.7039 10.4948C13.2624 10.9994 13.5909 12.1188 13.5909 12.7337C13.5909 14.9608 11.6314 17.5 7.52449 17.5C4.24133 17.5 0.620234 15.6742 0.620234 12.2737C0.620235 10.2391 2.13391 8.05655 5.51563 7.2516C3.894 6.71888 2.34276 5.62762 2.34276 3.776C2.34276 1.29075 4.82803 -3.1919e-07 6.96361 -1.32492e-07C8.86216 3.34845e-08 10.0801 0.476402 10.9696 1.26492L11.3005 3.39113L11.1526 3.44509C10.3383 1.7953 9.34792 1.00677 7.69813 1.00677C6.10231 1.00677 4.88435 2.05346 4.88435 3.87691C4.88435 5.82944 6.25016 7.04978 7.62303 7.04978L7.62303 7.68106C4.68251 7.81013 3.20637 9.43175 3.20637 12.0179C3.20637 15.0617 5.44287 16.4533 7.8718 16.4533C11.6853 16.4533 12.7203 14.2262 12.7203 12.7055C12.7203 11.3585 11.9881 10.4503 10.7677 10.4503C9.86186 10.4503 9.31977 10.9994 9.04519 11.3303L8.78941 11.1003C9.30101 10.1921 10.925 8.71834 12.7766 8.71834C13.5088 8.71834 14.2973 8.87322 15.0131 8.87322C15.5716 8.87322 15.8462 8.80046 16.1043 8.59864L16.3789 8.87322Z"
                    fill="black"
                />
            </svg>

            {/* 신부 이름 */}
            <div
                ref={brideRef}
                style={{
                    alignSelf: "stretch",
                    textAlign: "center",
                    color: "black",
                    fontSize: `${nameFontSize}px`,
                    ...brideFont,
                    lineHeight: "32px",
                    wordWrap: "break-word",
                    letterSpacing: "0.02em",
                    whiteSpace: "pre",
                    overflow: "hidden",
                }}
            >
                {brideName.toUpperCase().replace(/\s+/g, '  ')}
            </div>
        </div>
    )
}

EternalNameSection.defaultProps = {
    groomName: "GROOM NAME",
    brideName: "BRIDE NAME",
}

addPropertyControls(EternalNameSection, {
    groomName: {
        type: ControlType.String,
        title: "신랑 이름",
        defaultValue: "GROOM NAME",
        placeholder: "신랑 이름을 입력하세요 (자동 대문자 변환)",
    },
    brideName: {
        type: ControlType.String,
        title: "신부 이름",
        defaultValue: "BRIDE NAME",
        placeholder: "신부 이름을 입력하세요 (자동 대문자 변환)",
    },
    groomFont: {
        type: ControlType.Font,
        title: "신랑 폰트",
        controls: "extended",
    },
    brideFont: {
        type: ControlType.Font,
        title: "신부 폰트",
        controls: "extended",
    },
})
