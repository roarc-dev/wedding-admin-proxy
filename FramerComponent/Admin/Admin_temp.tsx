import React, { useState, useEffect, SetStateAction } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
// 프레이머 단독 실행 환경을 고려하여 미리보기용 컴포넌트를 파일 내부에 정의합니다
function InlineNameSection({
    groomName,
    brideName,
    style,
}: {
    groomName: string
    brideName: string
    style?: React.CSSProperties
}) {
    const getFontSize = (a: string, b: string): number => {
        const len = Math.max(a?.length || 0, b?.length || 0)
        if (len <= 8) return 48
        if (len <= 12) return 40
        if (len <= 16) return 34
        return 28
    }
    const fontSize = getFontSize(groomName, brideName)
    return (
        <div
            style={{
                width: "100%",
                height: 240,
                minWidth: 320,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 12,
                boxSizing: "border-box",
                ...style,
            }}
        >
            <div
                style={{
                    fontFamily: "P22LateNovemberW01-Regular Regular",
                    fontSize,
                    textAlign: "center",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                }}
            >
                {(groomName || "GROOM").toUpperCase()}
            </div>
            <div style={{ margin: 12, height: 42 }}>
                <svg
                    width="42"
                    height="42"
                    viewBox="0 0 42 42"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M21 3L24.1 13.3L35 13.3L26.45 20.2L29.55 30.5L21 23.6L12.45 30.5L15.55 20.2L7 13.3L17.9 13.3L21 3Z"
                        fill="#E0C48B"
                    />
                </svg>
            </div>
            <div
                style={{
                    fontFamily: "P22LateNovemberW01-Regular Regular",
                    fontSize,
                    textAlign: "center",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                }}
            >
                {(brideName || "BRIDE").toUpperCase()}
            </div>
        </div>
    )
}

function InlinePhotoSection({
    imageUrl,
    displayDateTime,
    location,
    overlayPosition = "bottom",
    overlayTextColor = "#ffffff",
    style,
}: {
    imageUrl?: string
    displayDateTime?: string
    location?: string
    overlayPosition?: "top" | "bottom"
    overlayTextColor?: "#ffffff" | "#000000"
    style?: React.CSSProperties
}) {
    const displayOverlayPosition = overlayPosition || "bottom"
    const displayOverlayTextColor = overlayTextColor || "#ffffff"

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: 400,
                backgroundColor: "#f5f5f5",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt="포토섹션"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : (
                <div
                    style={{
                        fontSize: "16px",
                        color: "#999",
                        textAlign: "center",
                    }}
                >
                    이미지를 업로드해주세요
                </div>
            )}
            {(displayDateTime || location) && (
                <div
                    style={{
                        position: "absolute",
                        left: 20,
                        right: 20,
                        ...(displayOverlayPosition === "top"
                            ? { top: 20 }
                            : { bottom: 20 }),
                        background: "rgba(0, 0, 0, 0.5)",
                        padding: "12px 16px",
                        borderRadius: 8,
                        textAlign: "center",
                    }}
                >
                    {displayDateTime && (
                        <div
                            style={{
                                color: displayOverlayTextColor,
                                fontSize: 14,
                                fontWeight: 500,
                                marginBottom: location ? 4 : 0,
                            }}
                        >
                            {displayDateTime}
                        </div>
                    )}
                    {location && (
                        <div
                            style={{
                                color: displayOverlayTextColor,
                                fontSize: 12,
                                opacity: 0.9,
                            }}
                        >
                            {location}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// 기타 필요한 함수들만 유지...

export default function UnifiedWeddingAdmin2({ style, maxSizeKB = 1024 }: any) {
    // 컴포넌트의 기본 로직들...
    
    return (
        <div style={style}>
            <p>Admin component is being repaired. Please wait...</p>
        </div>
    )
}

// Property Controls
addPropertyControls(UnifiedWeddingAdmin2, {
    maxSizeKB: {
        type: ControlType.Number,
        title: "목표 파일 크기",
        min: 100,
        max: 5000,
        step: 100,
        unit: "KB",
        defaultValue: 1024,
    },
});

