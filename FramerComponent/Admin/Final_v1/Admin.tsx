import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import ReactDOM from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// 로고 URL 상수
const ROARC_LOGO_URL = "https://cdn.roarc.kr/framer/logo/roarc_logo.svg"

// 연락처용 토글 컴포넌트
interface ContactToggleProps {
    isOn: boolean
    onChange: (isOn: boolean) => void
}

const ContactToggleButton: React.FC<ContactToggleProps> = ({
    isOn,
    onChange,
}) => {
    return (
        <div
            style={{ width: "100%", height: "100%", position: "relative" }}
            onClick={() => onChange(!isOn)}
        >
            <div
                style={{
                    width: 26,
                    height: 16,
                    left: 0,
                    top: 0,
                    position: "absolute",
                    background: isOn ? "#3F3F3F" : "#C3C3C3",
                    borderRadius: 18,
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                }}
            />
            <div
                style={{
                    width: 10,
                    height: 10,
                    left: isOn ? 13.5 : 2.5,
                    top: 3,
                    position: "absolute",
                    background: "white",
                    borderRadius: 9999,
                    transition: "left 0.2s ease",
                }}
            />
        </div>
    )
}

// 공통 아이템 카드 컴포넌트
interface ItemCardProps {
    item: any
    index: number
    placeholder: string
    onTitleChange: (index: number, value: string) => void
    onDescriptionChange: (index: number, value: string) => void
    onDelete: (index: number) => void
    onOrderChange: (index: number, targetIndex: number) => void
    onFormatInsert: (index: number, format: "bold" | "small") => void
    itemsLength: number
}

const ItemCard: React.FC<ItemCardProps> = ({
    item,
    index,
    placeholder,
    onTitleChange,
    onDescriptionChange,
    onDelete,
    onOrderChange,
    onFormatInsert,
    itemsLength,
}) => {
    return (
        <div
            key={index}
            style={{
                width: "100%",
                display: "flex",
                padding: 12,
                flexDirection: "column",
                gap: theme.gap.xs,
                marginBottom: 12,
                alignItems: "flex-start",
                background: "#FAFAFA",
                borderRadius: 2,
            }}
        >
            {/* 제목 입력 필드 */}
            <div
                style={{
                    width: "calc(100% * 1.1429)",
                    transform: "scale(0.875)",
                    transformOrigin: "left center",
                    height: "calc(40px * 1.1429)",
                    display: "flex",
                    gap: 8,
                    marginBottom: -10,
                }}
            >
                <input
                    style={{
                        flex: 1,
                        height: "100%",
                        width: "70%",
                        padding: "calc(12px * 1.1429)",
                        paddingLeft: "calc(12px * 0.875)",
                        background: "white",
                        border: `1px solid ${theme.color.border}`,
                        borderRadius: 2,
                        outlineOffset: -0.25,
                        fontSize: 16,
                        fontFamily: theme.font.body,
                        color: item.title === "" ? "#ADADAD" : "black",
                    }}
                    placeholder={placeholder}
                    value={item.title}
                    onChange={(e) => onTitleChange(index, e.target.value)}
                />

                {/* 순서 선택 및 삭제 버튼 */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "30%",
                        height: "100%",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flex: "1",
                            width: "100%",
                            height: "100%",
                            alignItems: "stretch",
                        }}
                    >
                        <CustomOrderDropdown
                            value={index + 1}
                            onChange={(newPosition) => {
                                const targetIndex = (newPosition as number) - 1
                                if (
                                    targetIndex !== index &&
                                    targetIndex >= 0 &&
                                    targetIndex < itemsLength
                                ) {
                                    onOrderChange(index, targetIndex)
                                }
                            }}
                            options={Array.from(
                                { length: itemsLength },
                                (_, i) => ({
                                    value: i + 1,
                                    label: `${i + 1}번째`,
                                })
                            )}
                            placeholder="순서 선택"
                        />
                    </div>

                    {/* 삭제 버튼 */}
                    <div
                        data-svg-wrapper
                        style={{
                            position: "relative",
                            cursor: "pointer",
                            flex: "0 0 32px",
                            width: 32,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        onClick={() => {
                            if (window.confirm("정말 삭제하시겠어요?")) {
                                onDelete(index)
                            }
                        }}
                    >
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M14.625 24.5C14.1437 24.5 13.7319 24.3261 13.3895 23.9782C13.0471 23.6304 12.8756 23.2117 12.875 22.7222V11.1667H12V9.38889H16.375V8.5H21.625V9.38889H26V11.1667H25.125V22.7222C25.125 23.2111 24.9538 23.6298 24.6114 23.9782C24.269 24.3267 23.8568 24.5006 23.375 24.5H14.625ZM16.375 20.9444H18.125V12.9444H16.375V20.9444ZM19.875 20.9444H21.625V12.9444H19.875V20.9444Z"
                                fill="#AEAEAE"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* 마크다운 편집기 */}
            <MarkdownEditor
                value={item.description}
                onChange={(value) => onDescriptionChange(index, value)}
                placeholder="상세 항목을 입력해주세요"
                onFormatInsert={(format) => onFormatInsert(index, format)}
                theme={theme}
            />
        </div>
    )
}

// 마크다운 렌더링 컴포넌트
const MarkdownRenderer: React.FC<{ text: string; theme: any }> = ({
    text,
    theme,
}) => {
    const renderMarkdown = (text: string): React.ReactNode[] => {
        if (!text) return []

        const parts: React.ReactNode[] = []
        let lastIndex = 0

        // 볼드 텍스트 처리: *텍스트* 또는 **텍스트**
        const boldRegex = /\*{1,2}([^*]+)\*{1,2}/g
        let match: RegExpExecArray | null

        while ((match = boldRegex.exec(text)) !== null) {
            const start = match.index
            const end = start + match[0].length
            const content = match[1]

            // 이전 텍스트 추가
            if (start > lastIndex) {
                parts.push(...renderMarkdown(text.slice(lastIndex, start)))
            }

            // 볼드 텍스트 추가
            parts.push(
                <strong key={`bold-${start}`} style={{ fontWeight: "bold" }}>
                    {content}
                </strong>
            )

            lastIndex = end
        }

        // 작은 텍스트 처리: {텍스트}
        const smallRegex = /\{([^}]+)\}/g
        lastIndex = 0

        while ((match = smallRegex.exec(text)) !== null) {
            const start = match.index
            const end = start + match[0].length
            const content = match[1]

            // 이전 텍스트 추가
            if (start > lastIndex) {
                parts.push(...renderMarkdown(text.slice(lastIndex, start)))
            }

            // 작은 텍스트 추가 (줄바꿈 처리)
            const lines = content.split("\n")
            const smallParts: React.ReactNode[] = []

            lines.forEach((line, index) => {
                smallParts.push(
                    <span
                        key={`small-${start}-${index}`}
                        style={{ fontSize: "0.8em", lineHeight: "1.6em" }}
                    >
                        {line}
                    </span>
                )
                if (index < lines.length - 1) {
                    smallParts.push(<br key={`small-br-${start}-${index}`} />)
                }
            })

            parts.push(
                <span
                    key={`small-${start}`}
                    style={{ fontSize: "0.8em", lineHeight: "1.6em" }}
                >
                    {smallParts}
                </span>
            )

            lastIndex = end
        }

        // 남은 텍스트 추가
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex)
            const lines = remainingText.split("\n")

            lines.forEach((line, index) => {
                parts.push(
                    <span key={`text-${lastIndex}-${index}`}>{line}</span>
                )
                if (index < lines.length - 1) {
                    parts.push(<br key={`br-${lastIndex}-${index}`} />)
                }
            })
        }

        return parts
    }

    return (
        <div
            style={{
                fontSize: 16,
                lineHeight: "1.6em",
                fontFamily: theme.font.body,
                color: text === "" ? "#ADADAD" : "black",
                minHeight: "1.6em",
            }}
        >
            {renderMarkdown(text)}
        </div>
    )
}

// 마크다운 편집기 컴포넌트
interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onFormatInsert: (format: "bold" | "small") => void
    theme: any
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = "상세 항목을 입력해주세요",
    onFormatInsert,
    theme,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // 포맷팅 함수들
    const applyFormat = (format: "bold" | "small") => {
        if (textareaRef.current) {
            const textarea = textareaRef.current
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const selectedText = textarea.value.substring(start, end)
            const beforeText = textarea.value.substring(0, start)
            const afterText = textarea.value.substring(end)

            if (selectedText) {
                // 선택된 텍스트가 이미 해당 포맷인지 확인
                let isAlreadyFormatted = false

                if (format === "bold") {
                    isAlreadyFormatted = /^\*{1,2}.*?\*{1,2}$/.test(
                        selectedText
                    )
                } else {
                    isAlreadyFormatted = /^\{.*?\}$/.test(selectedText)
                }

                let newText = ""
                let cursorOffset = 0

                if (isAlreadyFormatted) {
                    // 이미 포맷팅된 경우 포맷팅 해제
                    if (format === "bold") {
                        newText = selectedText.replace(
                            /^\*{1,2}(.*?)\*{1,2}$/,
                            "$1"
                        )
                    } else {
                        newText = selectedText.replace(/^\{(.*?)\}$/, "$1")
                    }
                    cursorOffset = start + newText.length
                } else {
                    // 포맷팅 적용
                    if (format === "bold") {
                        newText = `*${selectedText}*`
                        cursorOffset = start + selectedText.length + 2
                    } else {
                        newText = `{${selectedText}}`
                        cursorOffset = start + selectedText.length + 2
                    }
                }

                // 값 업데이트
                const updatedValue = beforeText + newText + afterText
                onChange(updatedValue)

                // 커서 위치 복원
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus()
                        textareaRef.current.setSelectionRange(
                            cursorOffset,
                            cursorOffset
                        )
                    }
                }, 0)
            } else {
                // 선택된 텍스트가 없으면 포맷팅 버튼 클릭으로 처리
                onFormatInsert(format)
            }
        }
    }

    return (
        <div style={{ width: "100%" }}>
            {/* 마크다운 편집기 */}
            <textarea
                ref={textareaRef}
                style={{
                    width: "calc(100% * 1.1429)",
                    height: "calc(120px * 1.1429)",
                    padding: "calc(12px * 1.1429)",
                    paddingLeft: "calc(12px * 0.875)",
                    background: "white",
                    marginBottom: -6,
                    border: `1px solid ${theme.color.border}`,
                    borderRadius: 2,
                    outlineOffset: -0.25,
                    fontSize: 16,
                    lineHeight: "1.6em",
                    fontFamily: theme.font.body,
                    transform: "scale(0.875)",
                    transformOrigin: "left center",
                    color: value === "" ? "#ADADAD" : "black",
                    resize: "none",
                    overflow: "auto",
                    minHeight: "calc(120px * 1.1429)",
                }}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

            {/* 포맷팅 버튼들 */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 4,
                    alignItems: "center",
                }}
            >
                <button
                    type="button"
                    onClick={() => applyFormat("bold")}
                    style={{
                        padding: "4px 8px",
                        border: `1px solid ${theme.color.border}`,
                        borderRadius: 2,
                        outlineOffset: -0.5,
                        background: "white",
                        cursor: "pointer",
                        fontSize: 12,
                        ...theme.font.bodyBold,
                        color: "#7F7F7F",
                        lineHeight: "20px",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none",
                        WebkitTextStroke: "0px transparent",
                        minHeight: "32px",
                        minWidth: "48px",
                    }}
                    title="선택한 텍스트를 두껍게"
                >
                    볼드
                </button>
                <button
                    type="button"
                    onClick={() => applyFormat("small")}
                    style={{
                        padding: "4px 8px",
                        border: `1px solid ${theme.color.border}`,
                        borderRadius: 2,
                        outlineOffset: -0.5,
                        background: "white",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: theme.font.body,
                        color: "#7F7F7F",
                        lineHeight: "20px",
                        minHeight: "32px",
                        minWidth: "48px",
                    }}
                    title="선택한 텍스트를 작게"
                >
                    작게
                </button>
            </div>
        </div>
    )
}

// 커스텀 색상 선택기 컴포넌트
interface CustomColorPickerProps {
    value: string
    onChange: (color: string) => void
    theme: any
}

const CustomColorPicker: React.FC<CustomColorPickerProps> = ({
    value,
    onChange,
    theme,
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [hexValue, setHexValue] = useState(value)
    const pickerRef = useRef<HTMLDivElement>(null)

    // 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    // value 변경 시 hexValue 업데이트
    useEffect(() => {
        setHexValue(value)
    }, [value])

    // 미리 정의된 색상 팔레트
    const predefinedColors = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
        "#98D8C8",
        "#F7DC6F",
        "#BB8FCE",
        "#85C1E9",
        "#F8C471",
        "#82E0AA",
        "#F1948A",
        "#85C1E9",
        "#D7DBDD",
        "#E8DAEF",
        "#D5DBDB",
        "#FADBD8",
        "#D1F2EB",
        "#FCF3CF",
    ]

    // HEX 값을 RGB로 변환
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null
    }

    // RGB 값을 HEX로 변환
    const rgbToHex = (r: number, g: number, b: number) => {
        return (
            "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
        )
    }

    // 색상 변경 핸들러
    const handleColorChange = (color: string) => {
        setHexValue(color)
        onChange(color)
    }

    // HEX 입력 핸들러
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            setHexValue(hex)
            onChange(hex)
        } else {
            setHexValue(hex)
        }
    }

    // RGB 입력 핸들러
    const handleRgbChange = (type: "r" | "g" | "b", value: number) => {
        const rgb = hexToRgb(hexValue) || { r: 0, g: 0, b: 0 }
        const newRgb = { ...rgb, [type]: Math.max(0, Math.min(255, value)) }
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
        setHexValue(newHex)
        onChange(newHex)
    }

    const rgb = hexToRgb(hexValue) || { r: 0, g: 0, b: 0 }

    return (
        <div ref={pickerRef} style={{ position: "relative", width: "100%" }}>
            {/* 색상 표시 영역 */}
            <div
                style={{
                    width: "100%",
                    padding: 6,
                    border: `1px solid ${theme.color.border}`,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div
                    style={{
                        width: "100%",
                        height: 28,
                        backgroundColor: hexValue,
                    }}
                />
            </div>

            {/* 색상 선택 패널 */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: `1px solid ${theme.color.border}`,
                        borderRadius: 2,
                        padding: 16,
                        marginTop: 4,
                        zIndex: 1000,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    {/* 미리 정의된 색상 팔레트 */}
                    <div style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#666",
                                marginBottom: 8,
                                ...theme.font.bodyBold,
                            }}
                        >
                            색상 선택
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(5, 1fr)",
                                gap: 8,
                            }}
                        >
                            {predefinedColors.map((color, index) => (
                                <div
                                    key={index}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        backgroundColor: color,
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        border:
                                            hexValue === color
                                                ? `2px solid ${theme.color.primary}`
                                                : "1px solid #ddd",
                                    }}
                                    onClick={() => handleColorChange(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* HEX 입력 */}
                    <div style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#666",
                                marginBottom: 8,
                                ...theme.font.bodyBold,
                            }}
                        >
                            HEX 값
                        </div>
                        <input
                            type="text"
                            value={hexValue}
                            onChange={handleHexChange}
                            style={{
                                width: "100%",
                                padding: 8,
                                border: `1px solid ${theme.color.border}`,
                                borderRadius: 2,
                                fontSize: 14,
                                fontFamily: "monospace",
                            }}
                            placeholder="#000000"
                        />
                    </div>

                    {/* RGB 입력 */}
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#666",
                                marginBottom: 8,
                                ...theme.font.bodyBold,
                            }}
                        >
                            RGB 값
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {(["r", "g", "b"] as const).map((type) => (
                                <div key={type} style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "#999",
                                            marginBottom: 4,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {type}
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="255"
                                        value={rgb[type]}
                                        onChange={(e) =>
                                            handleRgbChange(
                                                type,
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            padding: 6,
                                            border: `1px solid ${theme.color.border}`,
                                            borderRadius: 2,
                                            fontSize: 12,
                                            textAlign: "center",
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 닫기 버튼 */}
                    <div
                        style={{
                            marginTop: 16,
                            textAlign: "center",
                        }}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: theme.color.primary,
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 12,
                                cursor: "pointer",
                                ...theme.font.bodyBold,
                            }}
                        >
                            완료
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Key generation utilities for R2
function slugifyName(name: string): string {
    const idx = name.lastIndexOf(".")
    const base = idx >= 0 ? name.slice(0, idx) : name
    const ext = idx >= 0 ? name.slice(idx) : ""
    return (
        base
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") + ext.toLowerCase()
    )
}

function makeGalleryKey(pageId: string, file: File): string {
    const name = slugifyName(file.name)
    const extMatch = name.match(/\.([a-z0-9]+)$/i)
    const ext = (extMatch ? extMatch[1].toLowerCase() : "").replace(
        "jpeg",
        "jpg"
    )
    let baseFolder = "files"
    if (["png", "jpg", "webp", "svg"].includes(ext)) baseFolder = "images"
    if (["mp3", "m4a"].includes(ext)) baseFolder = "audio"
    if (["woff2"].includes(ext)) baseFolder = "fonts"
    return `${baseFolder}/${pageId}/${Date.now()}-${name}`
}

function toTransformedUrl(
    publicUrl: string,
    opts: {
        width?: number
        height?: number
        quality?: number
        format?: "webp" | "jpg" | "png"
        resize?: "cover" | "contain" | "fill"
    }
): string {
    if (!publicUrl) return publicUrl
    try {
        const url = new URL(publicUrl)
        const split = url.pathname.split("/storage/v1/object/")
        if (split.length !== 2) return publicUrl
        url.pathname = `/storage/v1/render/image/${split[1]}`
        const params = url.searchParams
        if (opts.width) params.set("width", String(opts.width))
        if (opts.height) params.set("height", String(opts.height))
        if (opts.quality) params.set("quality", String(opts.quality))
        if (opts.format) params.set("format", opts.format)
        if (opts.resize) params.set("resize", opts.resize)
        return url.toString()
    } catch {
        return publicUrl
    }
}
function UiRadio({
    checked,
    onChange,
}: {
    checked: boolean
    onChange: () => void
}) {
    return (
        <div
            role="radio"
            aria-checked={checked}
            onClick={onChange}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: theme.space(2),
                cursor: "pointer",
            }}
        >
            <div
                style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    border: `1px solid ${theme.color.border}`,
                    background: "#fff",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <div
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: checked ? theme.color.text : "transparent",
                        transition: "all .15s ease",
                    }}
                />
            </div>
        </div>
    )
}
function UiGrid({
    children,
    columns = 2,
    gap = 12,
}: React.PropsWithChildren<{ columns?: number; gap?: number }>) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap,
            }}
        >
            {children}
        </div>
    )
}
function UiPhotoTile({
    src,
    name,
    index,
    totalCount,
    onDelete,
    onReplace,
    selected,
    onToggleSelection,
}: {
    src: string
    name: string
    index: number
    totalCount: number
    onDelete: () => void
    onReplace: (file: File) => Promise<void> | void
    selected?: boolean
    onToggleSelection?: () => void
}) {
    const [isReplacing, setIsReplacing] = React.useState(false)

    // Admin 썸네일은 작은 변환 이미지를 우선 사용 (가능한 경우)
    const thumbSrc = React.useMemo(() => {
        if (!src) return src

        try {
            const u = new URL(src)
            // Supabase URL인 경우 썸네일 변환 시도
            if (u.pathname.includes("/storage/v1/object/public/")) {
                return toTransformedUrl(src, {
                    width: 160,
                    quality: 75,
                    format: "jpg",
                    resize: "cover",
                })
            }
            // R2 URL인 경우 원본 이미지 사용 (변환 불가)
            return src
        } catch {
            // URL 파싱 실패 시 원본 사용
            return src
        }
    }, [src])

    const handleReplaceClick = () => {
        if (isReplacing) return

        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.multiple = false

        // 브라우저 호환성을 위한 스타일 설정
        input.style.position = "absolute"
        input.style.left = "-9999px"
        input.style.visibility = "hidden"

        // DOM에 추가
        if (typeof document !== "undefined") {
            document.body.appendChild(input)
        }

        const handleFileSelect = async (e: Event) => {
            const target = e.target as HTMLInputElement
            const file = target.files?.[0]

            // 정리 작업
            if (typeof document !== "undefined") {
                document.body.removeChild(input)
            }

            if (!file) return

            try {
                setIsReplacing(true)
                console.log("이미지 교체 시작:", file.name)

                const result = onReplace(file)
                if (result && typeof result === "object" && "then" in result) {
                    await result
                }

                console.log("이미지 교체 완료")
            } catch (err) {
                console.error("이미지 교체 처리 중 오류:", err)
                alert(
                    `이미지 교체 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`
                )
            } finally {
                setIsReplacing(false)
            }
        }

        // 이벤트 리스너 등록
        input.addEventListener("change", handleFileSelect, { once: true })

        // 취소 시 정리
        const handleCancel = () => {
            setTimeout(() => {
                if (
                    typeof document !== "undefined" &&
                    document.body.contains(input)
                ) {
                    document.body.removeChild(input)
                }
            }, 100)
        }

        input.addEventListener("cancel", handleCancel, { once: true })
        if (typeof window !== "undefined") {
            window.addEventListener("focus", handleCancel, { once: true })
        }

        // 파일 대화상자 열기
        try {
            input.click()
        } catch (err) {
            console.error("파일 대화상자 열기 실패:", err)
            if (typeof document !== "undefined") {
                document.body.removeChild(input)
            }
            if (typeof window !== "undefined") {
                alert("파일 선택 대화상자를 열 수 없습니다.")
            }
        }
    }

    const effectiveCount = Math.max(
        1,
        Number.isFinite(totalCount) ? totalCount : 1
    )
    const orderOptions = Array.from({ length: effectiveCount }, (_, i) => i + 1)
    return (
        <div
            style={{
                position: "relative",
                backgroundColor: "white",
                overflow: "visible",
                flexDirection: "column",
                borderRadius: 2,
                justifyContent: "flex-start",
                alignItems: "stretch",
                display: "flex",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "158px",
                    position: "relative",
                    overflow: "hidden",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 10,
                    display: "flex",
                    cursor: isReplacing ? "not-allowed" : "pointer",
                    borderTopLeftRadius: "2px",
                    borderTopRightRadius: "2px",
                }}
                onClick={!isReplacing ? handleReplaceClick : undefined}
            >
                {thumbSrc && (
                    <img
                        src={thumbSrc}
                        alt={name}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            zIndex: 0,
                            display: "block",
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement & {
                                dataset?: any
                            }
                            if (img.dataset?.fb === "1") return
                            if (!img.dataset) (img as any).dataset = {}
                            img.dataset.fb = "1"
                            if (src) img.src = src
                        }}
                    />
                )}
                {/* 상단 영역 - 인덱스와 edit 버튼 */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        alignSelf: "stretch",
                        display: "inline-flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    {/* 좌측 - 인덱스 번호 */}
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            paddingLeft: 7,
                            paddingRight: 7,
                            paddingTop: 4,
                            paddingBottom: 4,
                            background: "white",
                            borderTopLeftRadius: 2,
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 10,
                            display: "inline-flex",
                        }}
                    >
                        <div
                            style={{
                                color: "black",
                                fontSize: 14,
                                ...theme.typography.label,
                                wordWrap: "break-word",
                            }}
                        >
                            {index}
                        </div>
                    </div>

                    {/* 우측 - Edit 버튼 */}
                    <div
                        style={{
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            display: "inline-flex",
                        }}
                    >
                        <div
                            data-svg-wrapper
                            style={{
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: isReplacing ? 0.5 : 1,
                                pointerEvents: "none", // 클릭 이벤트를 부모로 전달
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="14"
                                viewBox="0 0 13 14"
                                fill="none"
                            >
                                <path
                                    d="M3.32867 10.8962H0.5V8.13421L8.12333 0.69059C8.24835 0.568555 8.41789 0.5 8.59467 0.5C8.77144 0.5 8.94098 0.568555 9.066 0.69059L10.952 2.53148C11.014 2.59193 11.0632 2.66373 11.0967 2.74275C11.1303 2.82177 11.1475 2.90648 11.1475 2.99203C11.1475 3.07757 11.1303 3.16228 11.0967 3.2413C11.0632 3.32033 11.014 3.39212 10.952 3.45257L3.32867 10.8962ZM0.5 12.1981H12.5V13.5H0.5V12.1981Z"
                                    fill="white"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* 이미지 순서 변경 함수 정의 */}

            {/* 하단 영역 - 파일명과 순서 드롭다운 */}
            <div
                style={{
                    width: "100%",
                    padding: 6,
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 8,
                    display: "flex",
                }}
            >
                {/* 파일명 */}
                <div
                    style={{
                        alignSelf: "stretch",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            color: "#757575",
                            fontSize: 12,
                            ...theme.typography.label,
                            wordWrap: "break-word",
                        }}
                    >
                        {name.length > 20
                            ? `${name.substring(0, 14)}...`
                            : name}
                    </div>
                </div>

                {/* 순서 드롭다운과 삭제 버튼 */}
                <div
                    style={{
                        alignSelf: "stretch",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        display: "inline-flex",
                    }}
                >
                    <div
                        style={{
                            flex: "1 1 0",
                            alignSelf: "stretch",
                            minWidth: 0,
                            display: "block",
                        }}
                    >
                        <CustomOrderDropdown
                            value={index}
                            onChange={(newPosition) => {
                                try {
                                    const moveImageToPosition = (window as any)
                                        .moveImageToPosition
                                    if (moveImageToPosition) {
                                        moveImageToPosition(
                                            index - 1,
                                            newPosition as number
                                        )
                                    }
                                } catch (error) {
                                    console.warn(
                                        "이미지 순서 변경 실패:",
                                        error
                                    )
                                }
                            }}
                            options={orderOptions.map((num) => ({
                                value: num,
                                label: `${num}번째`,
                            }))}
                            placeholder="순서 선택"
                        />
                    </div>
                    <div
                        data-svg-wrapper
                        style={{
                            position: "relative",
                            cursor: "pointer",
                            flex: "0 0 32px",
                            width: 32,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        onClick={onDelete}
                    >
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M14.625 24.5C14.1437 24.5 13.7319 24.3261 13.3895 23.9782C13.0471 23.6304 12.8756 23.2117 12.875 22.7222V11.1667H12V9.38889H16.375V8.5H21.625V9.38889H26V11.1667H25.125V22.7222C25.125 23.2111 24.9538 23.6298 24.6114 23.9782C24.269 24.3267 23.8568 24.5006 23.375 24.5H14.625ZM16.375 20.9444H18.125V12.9444H16.375V20.9444ZM19.875 20.9444H21.625V12.9444H19.875V20.9444Z"
                                fill="#AEAEAE"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}
function EmptyState({
    title,
    description,
    action,
    icon,
}: {
    title: string
    description?: string
    action?: React.ReactNode
    icon?: React.ReactNode
}) {
    return (
        <div style={{ textAlign: "center", padding: theme.space(2) }}>
            <div
                style={{
                    ...theme.font.bodyBold,
                    fontSize: theme.text.sm,
                    color: theme.color.text,
                    marginBottom: theme.space(2),
                }}
            >
                {title}
            </div>
            {description && (
                <div
                    style={{
                        fontFamily: theme.font.body,
                        fontSize: theme.text.sm,
                        color: theme.color.muted,
                        marginBottom: theme.space(1),
                    }}
                >
                    {description}
                </div>
            )}
        </div>
    )
}

/** =====================
 * Single-file UI tokens & primitives (Framer-friendly)
 * No external libraries; inline styles only.
 * ===================== */
// URL 유효성 검증 함수
const isValidUrl = (string: string) => {
    if (!string) return false
    try {
        const url = new URL(string)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch (_) {
        return false
    }
}

// 비디오 URL 저장용 검증 함수 (빈 문자열 허용)
const isValidVideoUrl = (string: string) => {
    if (string === "") return true // 빈 문자열은 유효함
    return isValidUrl(string)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const theme: any = {
    color: {
        bg: "#ffffff",
        text: "#111827",
        sub: "#374151",
        muted: "#6b7280",
        border: "#e5e7eb",
        overlay: "rgba(0,0,0,0.04)",
        primary: "#111827",
        primaryText: "#ffffff",
        danger: "#ef4444",
        success: "#10b981",
        surface: "#f9fafb",
        sectionColor: "#757575", // 섹션 헤더용
        labelColor: "black", // 라벨용
        // Roarc 디자인 시스템 색상
        roarc: {
            white: "var(--White, white)",
            grey600: "var(--roarc-grey-600, #757575)",
            greyBorder: "var(--Grey-Border, #E5E6E8)",
        },
    },
    font: {
        // Info.tsx와 동일하게 pretendardVariable 스택을 사용
        body:
            typography?.helpers?.stacks?.pretendardVariable ||
            '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
        // bodyBold는 pretendardVariable 스택 + weight:600 사용을 전제로 함
        bodyBold: {
            fontFamily:
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
            fontWeight: 600,
        },
        display:
            typography?.helpers?.stacks?.p22 ||
            "P22LateNovemberW01-Regular Regular, serif",
    },
    radius: { xs: 0, sm: 2, md: 0, lg: 0, xl: 24, pill: 999 },
    shadow: {
        card: "0 1px 3px rgba(0,0,0,0)",
        pop: "0 8px 24px rgba(0,0,0,0.12)",
    },
    space: (n: number) => n * 4,
    text: {
        xs: 12,
        sm: 14,
        base: 16,
        md: 17,
        lg: 20,
        xl: 24,
        display: 48,
    },
    // 공통 간격 정의
    gap: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
    },
    // 공통 타이포그래피 스타일 (Info.tsx와 동일: pretendardVariable + weight)
    typography: {
        label: {
            fontFamily:
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
            fontWeight: 600,
            fontSize: 14,
            color: "black",
        },
        body: {
            fontFamily:
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
            fontWeight: 400,
            fontSize: 14,
        },
        sectionHeader: {
            fontFamily:
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
            fontWeight: 400,
            fontSize: 14,
            color: "#757575",
        },
        preview: {
            fontSize: 12,
            color: "#7F7F7F",
            textAlign: "center" as const,
        },
    },
    // UI Primitives 테마 확장
    border: {
        width: 1, // 모든 컴포넌트가 참조할 전역 테두리 굵기
        radius: 0, // 기존 디자인 유지
    },
    formSpace: {
        fieldGroupGap: 6, // FormField 묶음 간 간격
        fieldLabelGap: 6, // 라벨과 입력 사이 간격
    },
} as const

function mergeStyles(
    ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties {
    return Object.assign({}, ...styles)
}

// UI Primitives 컴포넌트들
type FormFieldProps = {
    label: string
    htmlFor?: string
    helpText?: React.ReactNode
    required?: boolean
    gap?: number // 묶음 간격 override
    labelGap?: number // 라벨-입력 간격 override
    style?: React.CSSProperties
    labelStyle?: React.CSSProperties
    children: React.ReactNode
}

function FormField({
    label,
    htmlFor,
    helpText,
    required,
    gap,
    labelGap,
    style,
    labelStyle,
    children,
}: FormFieldProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                gap: labelGap ?? theme.formSpace.fieldLabelGap,
                marginBottom: gap ?? theme.formSpace.fieldGroupGap,
                ...style,
            }}
        >
            <label
                htmlFor={htmlFor}
                style={{
                    ...theme.typography.label,
                    color: theme.color.text,
                    fontSize: 14,
                    ...labelStyle,
                }}
            >
                {label}{" "}
                {required ? (
                    <span
                        aria-hidden="true"
                        style={{ color: theme.color.danger }}
                    >
                        *
                    </span>
                ) : null}
            </label>
            {children}
            {helpText ? (
                <div
                    style={{
                        color: theme.color.muted,
                        fontSize: 12,
                        marginTop: 4,
                    }}
                >
                    {helpText}
                </div>
            ) : null}
        </div>
    )
}

type InputBaseProps = React.InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean
}

const InputBase = React.forwardRef<HTMLInputElement, InputBaseProps>(
    function InputBase({ style, invalid, ...props }, ref) {
        return (
            <input
                ref={ref}
                {...props}
                style={{
                    width: "calc(100% * 1.1429)",
                    height: "calc(40px * 1.1429)",
                    padding: "calc(10px * 1.1429) calc(12px * 1.1429)",
                    paddingLeft: "calc(12px * 0.875)", // scale로 인한 좌측 여백 보정
                    borderStyle: "solid",
                    borderWidth: theme.border.width, // ✅ 1로 통일 (토큰)
                    borderColor: invalid
                        ? theme.color.danger
                        : theme.color.border,
                    borderRadius: 2,
                    outline: "none",
                    background: theme.color.surface,
                    color: theme.color.text,
                    fontFamily: theme.font.body,
                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                    transformOrigin: "left center",
                    marginBottom: "calc(40px - 40px * 0.875)", // 하단 여백 제거
                    ...style,
                }}
            />
        )
    }
)

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "default"
}
const ButtonBase: React.FC<ButtonBaseProps> = ({
    variant = "default",
    style,
    ...props
}) => {
    const isPrimary = variant === "primary"
    return (
        <button
            {...props}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 40,
                padding: "0 14px",
                borderStyle: "solid",
                borderWidth: theme.border.width, // ✅ 1로 통일 (토큰)
                borderColor: isPrimary
                    ? theme.color.primary
                    : theme.color.border,
                borderRadius: theme.border.radius,
                background: isPrimary ? theme.color.primary : theme.color.bg,
                color: isPrimary ? theme.color.primaryText : theme.color.text,
                cursor: "pointer",
                fontFamily: theme.font.body,
                fontSize: 14,
                ...style,
            }}
        />
    )
}

// Button
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

function Button({
    children,
    variant = "primary",
    size = "md",
    fullWidth,
    style,
    disabled,
    ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
}) {
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.space(1),
        border: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: theme.radius.lg,
        ...theme.font.bodyBold,
        transition: "transform .05s ease, opacity .2s ease",
        width: fullWidth ? "100%" : undefined,
        whiteSpace: "nowrap",
        userSelect: "none",
    }

    const sizes: Record<ButtonSize, React.CSSProperties> = {
        sm: {
            padding: `${theme.space(2)}px ${theme.space(3)}px`,
            fontSize: theme.text.sm,
        },
        md: {
            padding: `${theme.space(2.5)}px ${theme.space(3.5)}px`,
            fontSize: theme.text.base,
        },
        lg: {
            padding: `${theme.space(3)}px ${theme.space(4.5)}px`,
            fontSize: theme.text.lg,
        },
    }

    const variants: Record<ButtonVariant, React.CSSProperties> = {
        primary: {
            background: theme.color.primary,
            color: theme.color.primaryText,
        },
        secondary: {
            background: theme.color.surface,
            color: theme.color.text,
            border: `1px solid ${theme.color.border}`,
        },
        ghost: {
            background: "transparent",
            color: theme.color.text,
            border: `1px solid ${theme.color.border}`,
        },
        danger: {
            background: theme.color.danger,
            color: theme.color.primaryText,
        },
    }

    return (
        <button
            {...rest}
            disabled={disabled}
            style={mergeStyles(base, sizes[size], variants[variant], style)}
            onMouseDown={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(0.99)"
            }}
            onMouseUp={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)"
            }}
        >
            {children}
        </button>
    )
}

// Card
function Card({
    children,
    style,
}: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
    return (
        <div
            style={mergeStyles(
                {
                    background: theme.color.bg,
                    border: `1px solid ${theme.color.border}`,
                    borderRadius: theme.radius.sm,
                    boxShadow: theme.shadow.card,
                    padding: theme.space(5),
                },
                style
            )}
        >
            {children}
        </div>
    )
}

// Admin Footer (reusable)
function AdminFooter() {
    return (
        <div
            style={{
                width: "100%",
                height: "108px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 40,
                paddingBottom: 30,
                gap: 10,
            }}
        >
            <div
                style={{
                    overflow: "hidden",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: 0.3,
                    gap: 10,
                }}
            >
                <div data-svg-wrapper>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="57"
                        height="13"
                        viewBox="0 0 57 13"
                        fill="none"
                    >
                        <path
                            d="M20.0771 0.908438C19.2193 0.322116 18.1965 0.0300293 17.0106 0.0300293C15.4195 0.0300293 14.045 0.57984 12.8913 1.67731C11.7355 2.77693 11.1587 4.38556 11.1587 6.50534C11.1587 7.92067 11.4375 9.11909 11.995 10.0941C12.5525 11.0713 13.2709 11.7994 14.1479 12.2783C15.025 12.7573 15.9556 12.9957 16.9399 12.9957C17.9863 12.9957 18.947 12.7358 19.824 12.2118C20.7011 11.6899 21.398 10.9339 21.9126 9.9481C22.4273 8.9623 22.6846 7.80469 22.6846 6.47527C22.6846 5.3241 22.4637 4.25455 22.0241 3.26661C21.5824 2.28082 20.9327 1.49261 20.0749 0.908438H20.0771ZM19.5774 9.24795C19.4595 10.0898 19.1936 10.7943 18.7797 11.3634C18.3659 11.9326 17.7612 12.2182 16.9677 12.2182C15.7648 12.2182 14.9842 11.7028 14.6261 10.6719C14.268 9.64098 14.09 8.29007 14.09 6.61702C14.09 5.25967 14.1715 4.15576 14.3323 3.30312C14.4932 2.45263 14.7784 1.82121 15.1836 1.41315C15.5889 1.00723 16.1529 0.8032 16.8777 0.8032C18.012 0.8032 18.7754 1.26925 19.1679 2.2035C19.5603 3.13775 19.7576 4.52731 19.7576 6.37218C19.7576 7.44603 19.6975 8.40605 19.5817 9.2458L19.5774 9.24795Z"
                            fill="black"
                        />
                        <path
                            d="M34.9243 11.5696C34.8171 11.7221 34.6756 11.7973 34.4954 11.7973C34.3003 11.7973 34.1481 11.7458 34.043 11.6405C33.9358 11.5353 33.8607 11.4021 33.8114 11.241C33.7621 11.08 33.7299 10.9082 33.7149 10.7277C33.6977 10.5473 33.6892 10.382 33.6892 10.2295V3.98827C33.6892 3.20866 33.5626 2.56435 33.3096 2.05105C33.0566 1.53775 32.7263 1.12969 32.3189 0.826863C31.9115 0.524038 31.4376 0.309268 30.8994 0.184702C30.3611 0.0622832 29.8143 0 29.2611 0C28.8858 0 28.4441 0.0322155 27.9401 0.0987941C27.4341 0.165373 26.958 0.287791 26.5099 0.468198C26.0617 0.648605 25.6821 0.899885 25.3712 1.22419C25.3519 1.24352 25.3369 1.27144 25.3197 1.29291C25.3069 1.3058 25.2897 1.31439 25.279 1.32728C24.9059 1.71601 24.61 2.40757 24.715 2.92087C24.9059 3.85941 25.9909 3.81646 26.5849 3.44705C27.3183 2.98959 26.8723 2.41186 26.8851 1.78688C26.8916 1.52057 26.8937 1.20056 27.3633 0.936396C27.3955 0.92351 27.4191 0.908476 27.4534 0.89559C27.6807 0.809682 27.9316 0.749546 28.1996 0.710888C28.4677 0.672229 28.725 0.6529 28.9694 0.6529C29.4734 0.6529 29.8658 0.762433 30.1445 0.981498C30.4212 1.20056 30.6249 1.46688 30.7557 1.78044C30.8865 2.094 30.9637 2.41616 30.9873 2.74905C31.013 3.08195 31.0237 3.36115 31.0237 3.5888V4.41567C31.0237 4.58748 30.9036 4.74856 30.6678 4.90105C30.4319 5.05353 30.0931 5.24253 29.6535 5.47019C29.2461 5.68066 28.7571 5.90832 28.1867 6.1553C27.6163 6.40229 27.0695 6.70082 26.5485 7.05304C26.0252 7.40526 25.5814 7.82621 25.2147 8.32018C24.848 8.81415 24.6636 9.40262 24.6636 10.0877C24.6636 10.5817 24.7408 11.0091 24.8973 11.3699C25.0517 11.7307 25.2597 12.0293 25.5213 12.2676C25.7829 12.506 26.0788 12.68 26.4134 12.7938C26.7479 12.9077 27.0931 12.9656 27.4534 12.9656C28.2189 12.9656 28.8794 12.8132 29.4348 12.5103C29.9902 12.2075 30.552 11.7801 31.1224 11.2282C31.3025 11.7973 31.5663 12.2311 31.9179 12.5254C32.2675 12.8196 32.7542 12.9678 33.3739 12.9678C33.717 12.9678 34.0172 12.8969 34.2789 12.7552C34.5405 12.6113 34.7571 12.4523 34.9265 12.2698C35.098 12.0894 35.231 11.909 35.3296 11.7286C35.4282 11.5482 35.4926 11.4107 35.5247 11.3162L35.2052 11.1165C35.1237 11.269 35.0294 11.4215 34.9243 11.5718V11.5696ZM31.0216 10.4228C30.7278 10.7857 30.3804 11.0907 29.9816 11.3377C29.5806 11.5868 29.1539 11.7092 28.6971 11.7092C28.4677 11.7092 28.2682 11.647 28.0967 11.5224C27.9251 11.3978 27.7815 11.2368 27.6678 11.0349C27.5542 10.8351 27.4684 10.6161 27.4105 10.3777C27.3526 10.1393 27.3247 9.89659 27.3247 9.64746C27.3247 8.97952 27.4298 8.44045 27.6421 8.03024C27.8544 7.62003 28.131 7.2721 28.4741 6.98431C28.8172 6.69867 29.2075 6.44524 29.6492 6.22617C30.0888 6.00711 30.5455 5.75368 31.0194 5.46804V10.4206L31.0216 10.4228Z"
                            fill="black"
                        />
                        <path
                            d="M55.3281 10.9855C55.133 11.1852 54.8992 11.3699 54.6312 11.5417C54.3631 11.7136 54.0608 11.851 53.7263 11.9562C53.3917 12.0615 53.0294 12.113 52.6391 12.113C51.7084 12.113 50.9708 11.6341 50.4261 10.6741C49.8793 9.71405 49.607 8.34167 49.607 6.55693C49.607 5.83531 49.6563 5.12227 49.7549 4.41997C49.8514 3.71768 50.0187 3.09055 50.2567 2.53859C50.4926 1.98878 50.8035 1.54206 51.1874 1.20057C51.569 0.85909 52.0472 0.687274 52.6176 0.687274C52.7635 0.687274 52.9157 0.706604 53.0701 0.743114C53.2202 0.779625 53.3596 0.826875 53.4882 0.882715C53.812 1.11681 53.9278 1.45615 53.9321 1.69669C53.945 2.32167 53.499 2.8994 54.2323 3.35686C54.8285 3.72841 55.9114 3.77137 56.1022 2.83068C56.2073 2.31738 55.9114 1.62367 55.5382 1.23708C55.4182 1.11037 55.2595 0.979361 55.1008 0.852647C55.0257 0.790364 54.9485 0.732376 54.8671 0.678684C54.8542 0.670093 54.837 0.655059 54.8242 0.646468C54.8242 0.646468 54.8242 0.648616 54.822 0.650763C54.7255 0.58848 54.6333 0.521902 54.5283 0.472505C54.1852 0.311427 53.8356 0.197599 53.4754 0.131021C53.1173 0.064442 52.8321 0.0322266 52.6198 0.0322266C51.7878 0.0322266 51.0137 0.201895 50.2953 0.545526C49.5769 0.88701 48.9529 1.35736 48.4233 1.95656C47.8936 2.55577 47.4733 3.26666 47.1624 4.09352C46.8536 4.92039 46.6992 5.80739 46.6992 6.75882C46.6992 7.76609 46.8407 8.65308 47.1281 9.42411C47.4133 10.193 47.7971 10.8437 48.2775 11.3764C48.7578 11.909 49.3175 12.3128 49.9522 12.5877C50.5891 12.8626 51.2646 13 51.9829 13C52.7013 13 53.4582 12.8153 54.2087 12.4438C54.9593 12.0744 55.5961 11.4902 56.1172 10.6912L55.8492 10.4056C55.7034 10.5968 55.5318 10.79 55.3345 10.9898L55.3281 10.9855Z"
                            fill="black"
                        />
                        <path
                            d="M10.1143 0.927777C10.1143 0.927777 10.1101 0.923482 10.1079 0.921334C10.1058 0.917039 10.1036 0.912743 10.1015 0.908448C10.0993 0.908448 10.0972 0.9063 10.095 0.9063C9.95995 0.708712 9.80127 0.549782 9.61256 0.431659C9.41743 0.30924 9.20943 0.227628 8.98856 0.188969C8.76983 0.150311 8.57684 0.130981 8.41387 0.130981C7.72982 0.130981 7.09724 0.377967 6.51826 0.871937C5.93929 1.36591 5.45466 2.07894 5.06224 3.0089C5.04509 2.51493 5.00864 2.01666 4.95288 1.51195C4.89498 1.00939 4.81779 0.547635 4.71915 0.130981C4.45754 0.264139 4.1659 0.388705 3.83782 0.500385C3.51188 0.614213 3.17736 0.715155 2.83426 0.798915C2.49116 0.884823 2.14807 0.959993 1.80711 1.02657C1.46402 1.09315 1.15309 1.14469 0.876465 1.18335V1.69665C1.35037 1.69665 1.74064 1.80189 2.05157 2.01022C2.36036 2.21854 2.5169 2.69318 2.5169 3.43414V10.7578C2.5169 11.1379 2.47615 11.4322 2.39467 11.6405C2.31318 11.851 2.19953 12.0099 2.05157 12.1259C1.90575 12.2397 1.73421 12.3106 1.53693 12.3406C1.34179 12.3686 1.12092 12.3836 0.876465 12.3836V12.8969H6.82061V12.3836C6.57616 12.3836 6.35744 12.3686 6.16015 12.3406C5.96502 12.3127 5.79347 12.2418 5.64551 12.128C5.49969 12.0142 5.3839 11.8531 5.30241 11.6448C5.22093 11.4365 5.18018 11.1422 5.18018 10.7642V5.67634C5.18018 5.25968 5.24451 4.79148 5.37532 4.26959C5.50613 3.7477 5.6884 3.26018 5.92642 2.80487C6.1623 2.34955 6.43034 1.96726 6.7327 1.6537C7.03505 1.34014 7.3567 1.18335 7.69766 1.18335C7.78557 1.18335 7.86492 1.19839 7.93997 1.22201C8.05147 1.26282 8.10937 1.35517 8.09436 1.4647C8.07292 1.62363 7.75341 2.15626 8.48678 2.61157C9.08291 2.98312 10.1658 3.02608 10.3567 2.08753C10.4124 1.80833 10.3502 1.47974 10.2216 1.17261C10.1894 1.08456 10.1529 1.0008 10.1058 0.927777H10.1143Z"
                            fill="black"
                        />
                        <path
                            d="M45.8181 0.927777C45.8181 0.927777 45.8138 0.923482 45.8116 0.921334C45.8095 0.917039 45.8073 0.912743 45.8052 0.908448C45.8031 0.908448 45.8009 0.9063 45.7988 0.9063C45.6637 0.708712 45.505 0.549782 45.3163 0.431659C45.1211 0.30924 44.9131 0.227628 44.6923 0.188969C44.4714 0.150311 44.2806 0.130981 44.1176 0.130981C43.4335 0.130981 42.801 0.377967 42.222 0.871937C41.643 1.36591 41.1584 2.07894 40.766 3.0089C40.7488 2.51493 40.7124 2.01666 40.6566 1.51195C40.5987 1.00939 40.5215 0.547635 40.425 0.130981C40.1634 0.264139 39.8696 0.388705 39.5437 0.500385C39.2177 0.614213 38.8832 0.715155 38.5423 0.798915C38.1992 0.884823 37.8561 0.959993 37.5151 1.02657C37.172 1.09315 36.8632 1.14469 36.5845 1.18335V1.69665C37.0584 1.69665 37.4486 1.80189 37.7596 2.01022C38.0684 2.21854 38.2249 2.69318 38.2249 3.43414V10.7578C38.2249 11.1379 38.1842 11.4322 38.1027 11.6405C38.0212 11.851 37.9075 12.0099 37.7596 12.1259C37.6138 12.2397 37.4422 12.3106 37.2449 12.3406C37.0498 12.3686 36.8289 12.3836 36.5845 12.3836V12.8969H42.5286V12.3836C42.2842 12.3836 42.0633 12.3686 41.8682 12.3406C41.673 12.3127 41.5015 12.2418 41.3535 12.128C41.2077 12.0142 41.0919 11.8531 41.0126 11.6448C40.9311 11.4365 40.8903 11.1422 40.8903 10.7642V5.67634C40.8903 5.25968 40.9547 4.79148 41.0855 4.26959C41.2163 3.7477 41.4007 3.26018 41.6366 2.80487C41.8725 2.34955 42.1426 1.96726 42.4428 1.6537C42.7452 1.34014 43.0669 1.18335 43.4078 1.18335C43.4957 1.18335 43.5751 1.19839 43.6501 1.22201C43.7616 1.26282 43.8195 1.35517 43.8045 1.4647C43.7831 1.62363 43.4636 2.15626 44.1969 2.61157C44.7909 2.98312 45.876 3.02608 46.0668 2.08753C46.1226 1.80833 46.0604 1.47974 45.9317 1.17261C45.8996 1.08456 45.8631 1.0008 45.8159 0.927777H45.8181Z"
                            fill="black"
                        />
                    </svg>
                </div>
            </div>
            <span
                style={{
                    color: "#BABABA",
                    fontSize: 12,
                    fontFamily: theme.font.body,
                    wordWrap: "break-word",
                }}
            >
                © roarc. all rights reseved.
            </span>
        </div>
    )
}

// Row
function Row({
    children,
    gap = 2,
    align = "stretch",
    justify = "flex-start",
    wrap,
    style,
}: React.PropsWithChildren<{
    gap?: number
    align?: React.CSSProperties["alignItems"]
    justify?: React.CSSProperties["justifyContent"]
    wrap?: boolean
    style?: React.CSSProperties
}>) {
    return (
        <div
            style={mergeStyles(
                {
                    display: "flex",
                    gap: theme.space(gap),
                    alignItems: align,
                    justifyContent: justify,
                    flexWrap: wrap ? "wrap" : "nowrap",
                    width: "100%",
                },
                style
            )}
        >
            {children}
        </div>
    )
}

// Section (Accordion-ready)
function Section({
    title,
    right,
    isOpen = true,
    onToggle,
    children,
    style,
    sectionKey,
    toggleButton,
}: React.PropsWithChildren<{
    title: string
    right?: React.ReactNode
    isOpen?: boolean
    onToggle?: () => void
    style?: React.CSSProperties
    sectionKey?: string
    toggleButton?: React.ReactNode
}>) {
    const headerRef = React.useRef<HTMLDivElement>(null)

    return (
        <div
            style={mergeStyles({
                background: theme.color.roarc.white,
                border: `0.50px solid ${theme.color.roarc.greyBorder}`,
                borderRadius: theme.radius.md,
                overflow: "hidden",
                ...style,
            })}
        >
            {/* 헤더 영역 - Roarc 디자인 시스템 */}
            <div
                ref={headerRef}
                style={{
                    alignSelf: "stretch",
                    padding: "14px 16px",
                    background: theme.color.roarc.white,
                    overflow: "hidden",
                    borderBottom: isOpen
                        ? `0.50px solid ${theme.color.roarc.greyBorder}`
                        : "none",
                    justifyContent: "center",
                    alignItems: "center",
                    display: "inline-flex",
                    width: "100%",
                    cursor: onToggle ? "pointer" : "default",
                }}
                onClick={onToggle}
            >
                <div
                    style={{
                        flex: "1 1 0",
                        justifyContent: "space-between",
                        alignItems: "center",
                        display: "flex",
                        width: "100%",
                    }}
                >
                    {/* 제목 - Roarc 타이포그래피 */}
                    <div
                        style={{
                            color: theme.color.roarc.grey600,
                            fontSize: "16px",
                            fontFamily: theme.font.body,
                            wordWrap: "break-word",
                            flex: "1 1 0",
                        }}
                    >
                        {title}
                    </div>

                    {/* 우측 영역 - 토글 버튼과 화살표 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        {/* 토글 버튼 */}
                        {toggleButton && (
                            <div style={{ flexShrink: 0 }}>{toggleButton}</div>
                        )}

                        {/* 토글 버튼 - Roarc 화살표 아이콘 */}
                        {onToggle && (
                            <div
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                {/* 화살표 아이콘 - SVG */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="9"
                                    viewBox="0 0 24 12"
                                    fill="none"
                                    style={{
                                        transform: `rotate(${isOpen ? 0 : 180}deg)`,
                                        transformOrigin: "center",
                                    }}
                                >
                                    <path
                                        d="M22 2L12 10L2 2"
                                        stroke="#757575"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* 우측 추가 요소 */}
                        {right && <div>{right}</div>}
                    </div>
                </div>
            </div>

            {/* 콘텐츠 영역 */}
            {isOpen && (
                <div
                    style={{
                        padding: theme.space(4),
                        background: theme.color.roarc.white,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

// Toggle Button Component
function ToggleButton({
    isOn,
    onToggle,
    disabled = false,
}: {
    isOn: boolean
    onToggle: () => void
    disabled?: boolean
}) {
    return (
        <div
            style={{
                width: 32,
                height: 20,
                position: "relative",
                background: disabled ? "#c3c3c3" : isOn ? "#3F3F3F" : "#c3c3c3",
                borderRadius: 18,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease",
            }}
            onClick={(e) => {
                e.stopPropagation() // 이벤트 버블링 방지
                if (!disabled) {
                    onToggle()
                }
            }}
        >
            <div
                style={{
                    width: 12,
                    height: 12,
                    left: isOn ? 16 : 4,
                    top: 4,
                    position: "absolute",
                    background: "white",
                    borderRadius: 9999,
                    transition: "left 0.2s ease",
                }}
            />
        </div>
    )
}

// Label
function Label({
    children,
    hint,
}: {
    children: React.ReactNode
    hint?: string
}) {
    return (
        <div
            style={{
                ...theme.typography.label,
                marginBottom: theme.space(1),
            }}
        >
            {children}
            {hint && (
                <span
                    style={{
                        marginLeft: theme.space(2),
                        fontFamily: theme.font.body,
                        color: theme.color.muted,
                    }}
                >
                    ({hint})
                </span>
            )}
        </div>
    )
}

// Inputs
const getInputBase = (): React.CSSProperties => ({
    width: "100%",
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.color.border}`,
    padding: `${theme.space(2.5)}px ${theme.space(2)}px`,
    fontFamily: theme.font.body,
    fontSize: theme.text.base,
    outline: "none",
    background: "#fff",
})

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} style={mergeStyles(getInputBase(), props.style)} />
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            style={mergeStyles(
                getInputBase(),
                { resize: "vertical", minHeight: theme.space(30) },
                props.style
            )}
        />
    )
}

// SaveBar
function SaveBar({
    onSave,
    loading,
    label,
}: {
    onSave: () => void
    loading?: boolean
    label?: string
}) {
    return (
        <Row
            gap={2}
            style={{ marginTop: theme.space(2), width: "100%", height: 44 }}
        >
            <Button
                onClick={onSave}
                disabled={!!loading}
                fullWidth
                style={{
                    ...theme.font.bodyBold,
                    fontSize: 14,
                }}
            >
                {loading ? "저장 중..." : (label ?? "저장")}
            </Button>
        </Row>
    )
}

// Transport 스타일의 공용 섹션 저장 버튼
function SaveSectionButton({
    onSave,
    saving,
    label = "저장",
}: {
    onSave: () => Promise<void> | void
    saving?: boolean
    label?: string
}) {
    const [internalSaving, setInternalSaving] = useState(false)
    const isSaving = saving || internalSaving

    const handleSave = async () => {
        setInternalSaving(true)
        try {
            await onSave()
        } finally {
            setInternalSaving(false)
        }
    }

    return (
        <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
                width: "100%",
                height: 50,
                background: isSaving ? "#B3B3B3" : "#000000",
                color: "white",
                border: "none",
                borderRadius: 2,
                fontSize: 14,
                ...theme.font.bodyBold,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {isSaving ? "저장 중..." : label}
        </button>
    )
}

type FieldProps = {
    label?: React.ReactNode
    hint?: React.ReactNode
    error?: React.ReactNode
    right?: React.ReactNode
    required?: boolean
    style?: React.CSSProperties
    children: React.ReactNode
}
function Field({
    label,
    hint,
    error,
    right,
    required,
    style,
    children,
}: FieldProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: theme.space(1.5),
                ...style,
            }}
        >
            {(label || hint) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            ...theme.typography.label,
                            // 기존 UX 유지: 색상과 크기는 현행 유지
                            color: theme.color.sub,
                            fontSize: theme.text.sm,
                        }}
                    >
                        {label}
                        {required && (
                            <span
                                aria-hidden="true"
                                style={{
                                    color: theme.color.danger,
                                    marginLeft: theme.space(1),
                                }}
                            >
                                *
                            </span>
                        )}
                        {hint && (
                            <span
                                style={{
                                    marginLeft: theme.space(2),
                                    fontFamily: theme.font.body,
                                    color: theme.color.muted,
                                }}
                            >
                                ({hint})
                            </span>
                        )}
                    </div>
                    {right && <div>{right}</div>}
                </div>
            )}
            {children}
            {error && (
                <div
                    role="alert"
                    style={{
                        fontFamily: theme.font.body,
                        fontSize: theme.text.sm,
                        color: theme.color.danger,
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    fullWidth?: boolean
}
function Select({ style, fullWidth, ...rest }: SelectProps) {
    return (
        <div
            style={{
                width: fullWidth ? "100%" : undefined,
                border: `1px solid ${theme.color.border}`,
                borderRadius: 2,
                padding: `0 ${theme.space(2.5)}px`,
                background: "#fff",
                height: theme.space(10),
                display: "flex",
                alignItems: "center",
                position: "relative",
            }}
        >
            <select
                {...rest}
                style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    background: "transparent",
                    fontFamily: theme.font.body,
                    fontSize: 14,
                    color: "#333",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                    paddingRight: theme.space(6),
                    cursor: "pointer",
                    ...style,
                }}
            />
            {/* 커스텀 드롭다운 화살표 */}
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: "absolute",
                    right: theme.space(2.5),
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    flexShrink: 0,
                }}
            >
                <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="#757575"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )
}

type SwitchProps = {
    checked: boolean
    onChange: (next: boolean) => void
    label?: React.ReactNode
    disabled?: boolean
    id?: string
    style?: React.CSSProperties
}
function Switch({
    checked,
    onChange,
    label,
    disabled,
    id,
    style,
}: SwitchProps) {
    return (
        <label
            htmlFor={id}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: theme.space(2),
                cursor: disabled ? "not-allowed" : "pointer",
                ...style,
            }}
        >
            {/* 체크박스 스타일 */}
            <div
                style={{
                    position: "relative",
                    width: theme.space(4),
                    height: theme.space(4),
                    border: `${theme.border.width}px solid ${checked ? theme.color.primary : theme.color.border}`,
                    borderRadius: theme.radius.sm,
                    background: checked ? theme.color.primary : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    opacity: disabled ? 0.5 : 1,
                }}
            >
                {checked && (
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{
                            color: "white",
                            stroke: "white",
                            strokeWidth: 2,
                        }}
                    >
                        <path
                            d="M2 6L5 9L10 3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>

            {/* 실제 체크박스 입력 */}
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
                style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                }}
            />

            {/* 라벨 */}
            {label && (
                <span
                    style={{
                        fontFamily: theme.font.body,
                        fontSize: theme.text.sub,
                        color: disabled ? theme.color.muted : theme.color.text,
                        userSelect: "none",
                    }}
                >
                    {label}
                </span>
            )}
        </label>
    )
}

function FieldRow({
    left,
    right,
    gap = 2,
    align = "center",
    style,
}: {
    left: React.ReactNode
    right: React.ReactNode
    gap?: number
    align?: React.CSSProperties["alignItems"]
    style?: React.CSSProperties
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: align,
                gap: theme.space(gap),
                width: "100%",
                justifyContent: "space-between",
                ...style,
            }}
        >
            <div style={{ flex: 1 }}>{left}</div>
            <div style={{}}>{right}</div>
        </div>
    )
}

// Accordion wrapper
function AccordionSection({
    title,
    sectionKey,
    isOpen,
    onToggle,
    children,
    toggleButton,
}: {
    title: string
    sectionKey: string
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
    toggleButton?: React.ReactNode
}) {
    return (
        <Section
            title={title}
            isOpen={isOpen}
            onToggle={onToggle}
            sectionKey={sectionKey}
            toggleButton={toggleButton}
        >
            {children}
        </Section>
    )
}

// Display heading
function DisplayHeading({
    children,
    style,
}: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
    return (
        <div
            style={mergeStyles(
                {
                    fontFamily: theme.font.display,
                    fontSize: theme.text.display,
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                },
                style
            )}
        >
            {children}
        </div>
    )
}

// NameDisplay - 이름 표시를 위한 전용 컴포넌트
function NameDisplay({
    name,
    placeholder,
}: {
    name?: string
    placeholder: string
}) {
    return (
        <div
            style={{
                width: "100%",
                height: 40,
                padding: 12,
                background: "#F8F9FA",
                border: `1px solid ${theme.color.border}`,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                fontFamily: theme.font.body,
                color: name ? "black" : "#ADADAD",
            }}
        >
            {name || placeholder}
        </div>
    )
}
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

    // 모바일 미리보기 영역에 최적화된 반응형 크기 계산
    const getResponsiveSize = (baseSize: number): number => {
        // 미리보기 영역의 일반적인 너비를 고려하여 스케일 조정
        const previewScale = 0.85 // 미리보기에서는 약간 작게
        return Math.round(baseSize * previewScale)
    }

    const baseFontSize = getFontSize(groomName, brideName)
    const responsiveFontSize = getResponsiveSize(baseFontSize)
    const responsiveMargin = getResponsiveSize(12)
    const responsiveSvgHeight = getResponsiveSize(42)

    return (
        <div
            style={{
                width: "100%",
                height: 240,
                minWidth: 280,
                maxWidth: 430,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 2,
                justifyContent: "center",
                paddingBottom: 12,
                boxSizing: "border-box",
                ...style,
            }}
        >
            <div
                style={{
                    fontFamily: theme.font.display,
                    fontSize: responsiveFontSize,
                    textAlign: "center",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                }}
            >
                {(groomName || "GROOM").toUpperCase()}
            </div>
            <div
                style={{
                    margin: responsiveMargin,
                    height: responsiveSvgHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg
                    width={Math.round(73 * (responsiveSvgHeight / 42))}
                    height={responsiveSvgHeight}
                    viewBox="0 0 73 42"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g clipPath="url(#clip0_preview_inline_and)">
                        <path
                            d="M70.4 0C63.88 0 56.2 16.39 50.7 29.06C50.29 27.43 49.22 26.46 47.54 26.46C44.51 26.46 40.97 29.2 38.94 32.79C38.67 33.07 38.34 33.49 37.91 34.05C36.08 36.39 32.77 40.62 31.19 40.62C30.73 40.62 30.53 40.42 30.53 40.11C30.53 39.3 31.29 37.72 32.21 35.89C33.38 33.55 34.75 30.8 34.75 28.86C34.75 27.74 34.34 27.28 33.48 27.28C32.56 27.28 28.49 30.64 26.1 33.34C27.07 31.41 28.19 29.07 28.19 27.18C28.19 25.29 27.17 24.89 26.26 24.89C24.73 24.89 22.29 28.05 19.49 31.66L18.57 32.83C18.57 32.83 18.53 32.9 18.5 32.93C18.49 32.95 18.48 32.96 18.46 32.98C13.93 38.99 11.89 40.77 10.93 40.77C10.47 40.77 10.37 40.26 10.37 39.8C10.37 37.82 13.17 32.72 14.8 29.93C15 29.57 15.11 29.37 15.11 29.22C15.11 29.07 15.01 29.02 14.91 29.02C14.6 29.02 13.74 29.07 13.18 29.17C12.42 29.32 12.01 29.88 10.89 31.87C9.47 34.36 5.04 40.27 3.26 40.27C2.65 40.27 2.39 39.91 2.39 39.2C2.39 35.48 7.78 27.03 13.89 27.03C15.72 27.03 16.79 27.74 17.4 28.96C17.5 29.16 17.65 29.27 17.81 29.27C18.01 29.27 18.17 29.12 18.17 28.91C18.17 28.81 18.12 28.71 18.07 28.6C17.25 26.97 15.88 26.26 13.95 26.26C7.18 26.26 0 32.93 0 39.29C0 40.77 0.92 41.53 2.19 41.53C4.43 41.53 7.03 38.73 8.76 36.34C8.56 37.1 8.4 37.87 8.4 38.78C8.4 40 9.01 41.63 10.64 41.63C12.27 41.63 13.74 40.41 19.39 32.98C19.4 32.96 19.4 32.96 19.41 32.94C19.55 32.77 19.7 32.58 19.9 32.32C22.85 28.45 24.94 25.75 25.96 25.75C26.37 25.75 26.47 26.06 26.47 26.46C26.47 27.78 23.26 34.1 19.6 40.46C19.5 40.61 19.45 40.77 19.45 40.87C19.45 41.23 20.26 41.94 20.72 41.94C20.92 41.94 21.13 41.84 21.33 41.58C22.2 40.56 23.06 39.19 24.74 36.24C25.66 34.61 29.17 30.94 31.61 29.27C31.76 29.17 31.86 29.12 32.02 29.12C32.22 29.12 32.38 29.27 32.38 29.53C32.38 29.63 32.33 29.84 32.23 30.04C31.92 30.75 31.57 31.52 31.16 32.28C29.94 34.72 28.62 37.47 28.62 39.46C28.62 40.48 29.13 41.55 30.81 41.55C32.49 41.55 35.19 38.7 37.53 35.75L37.85 35.34C37.52 36.39 37.33 37.47 37.33 38.55C37.33 40.64 38.3 41.65 39.42 41.65C41.51 41.65 45.07 38.29 49.19 32.74C48.94 33.4 48.68 34.27 48.58 34.62C47.77 37.47 47.05 38.74 45.32 40.27C44.61 40.88 44.45 41.03 44.45 41.24C44.45 41.39 44.6 41.6 44.81 41.6C45.02 41.6 45.17 41.5 45.32 41.4C46.13 40.84 46.54 40.69 46.8 40.69C47.11 40.69 47.36 40.84 47.61 41C48.02 41.25 48.43 41.51 49.09 41.51C51.03 41.51 53.32 38.61 55.86 35.3L57.39 33.31C57.59 33.06 57.7 32.9 57.7 32.85C57.7 32.75 57.6 32.6 57.39 32.6C57.24 32.6 56.98 32.7 56.68 33.06C56.07 33.77 55.3 34.69 54.59 35.61C52.6 38.15 50.57 40.7 49.09 40.7C48.63 40.7 48.33 40.5 48.02 40.29L47.61 40.09C48.68 39.27 49.39 38.21 50.1 36.78C50.2 36.58 50.51 35.81 50.97 34.64C54.01 26.82 64.5 0.97 70.76 0.97C71.32 0.97 71.68 1.07 71.93 1.28C72.18 1.48 72.34 1.53 72.49 1.53C72.69 1.53 72.85 1.38 72.85 1.17C72.85 0.76 72.09 0 70.41 0H70.4ZM40.32 40.26C39.96 40.26 39.66 39.9 39.66 39.24C39.66 35.98 43.58 27.33 47.75 27.33C49.23 27.33 49.89 29.06 49.94 30.33C48.01 33.13 42.36 40.26 40.32 40.26Z"
                            fill="black"
                        />
                    </g>
                    <defs>
                        <clipPath id="clip0_preview_inline_and">
                            <rect width="72.85" height="41.94" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            </div>
            <div
                style={{
                    fontFamily: theme.font.display,
                    fontSize: responsiveFontSize,
                    textAlign: "center",
                    lineHeight: 1.2,
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
    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: 640,
        position: "relative",
        overflow: "hidden",
        ...style,
    }

    if (!imageUrl) {
        return (
            <div style={containerStyle}>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: theme.color.surface,
                        color: theme.color.muted,
                        fontFamily: theme.font.body,
                        fontSize: theme.text.sm,
                        letterSpacing: 0.2,
                    }}
                >
                    사진을 업로드 해주세요
                </div>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <img
                src={imageUrl}
                alt="Wedding couple"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                }}
            />
            {(displayDateTime || location) && (
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        textAlign: "center",
                        color: overlayTextColor,
                        fontFamily: theme.font.body,
                        fontSize: theme.text.md,
                        lineHeight: 1.4,
                        zIndex: 10,
                        textShadow:
                            overlayTextColor === "#ffffff"
                                ? "0px 1px 4px rgba(0,0,0,0.25)"
                                : "none",
                        ...(overlayPosition === "top"
                            ? { top: theme.space(10) }
                            : { bottom: theme.space(10) }),
                    }}
                >
                    {displayDateTime && (
                        <div style={{ marginBottom: theme.space(1.25) }}>
                            {displayDateTime}
                        </div>
                    )}
                    {location && <div>{location}</div>}
                </div>
            )}
        </div>
    )
}

// 캘린더 미리보기 (단독 미리보기용, 외부 의존 없음)
function InlineCalendarPreview({
    date,
    hour,
    minute,
    groomName,
    brideName,
    highlightColor = "#e0e0e0",
    highlightShape = "circle",
    highlightTextColor = "black",
}: {
    date?: string
    hour?: string
    minute?: string
    groomName?: string
    brideName?: string
    highlightColor?: string
    highlightShape?: "circle" | "heart"
    highlightTextColor?: "black" | "white" | "#000000" | "#ffffff"
}) {
    const parseDate = () => {
        if (!date) return null
        try {
            const d = new Date(date)
            if (isNaN(d.getTime())) return null
            return d
        } catch {
            return null
        }
    }

    const targetDate = parseDate()
    const year = targetDate
        ? targetDate.getFullYear()
        : new Date().getFullYear()
    const monthIndex = targetDate
        ? targetDate.getMonth()
        : new Date().getMonth()
    const day = targetDate ? targetDate.getDate() : null

    const getDaysInMonth = (y: number, m: number) =>
        new Date(y, m + 1, 0).getDate()
    const getFirstDayOfMonth = (y: number, m: number) =>
        new Date(y, m, 1).getDay()

    const daysInMonth = getDaysInMonth(year, monthIndex)
    const firstDay = getFirstDayOfMonth(year, monthIndex)
    const totalCells = daysInMonth + firstDay
    const actualWeeks = Math.ceil(totalCells / 7)

    const weeks: (number | null)[][] = []
    for (let col = 0; col < 7; col++) {
        const colDays: (number | null)[] = []
        let startDate = col - firstDay + 1
        for (let w = 0; w < actualWeeks; w++) {
            if (startDate > 0 && startDate <= daysInMonth) {
                colDays.push(startDate)
            } else {
                colDays.push(null)
            }
            startDate += 7
        }
        weeks.push(colDays)
    }

    const formatDateTime = (): string => {
        // pageSettings에서 값 가져오기 (캘린더 미리보기용)
        const weddingDate = pageSettings?.wedding_date
        const weddingHour = pageSettings?.wedding_hour || "14"
        const weddingMinute = pageSettings?.wedding_minute || "0"

        if (!weddingDate) return ""

        try {
            const d = new Date(weddingDate)
            const h24 = parseInt(weddingHour)
            const mm = parseInt(weddingMinute)
            d.setHours(h24, mm)
            const dayNames = [
                "일요일",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
            ]
            const ampm = h24 < 12 ? "오전" : "오후"
            const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
            const minuteText = mm !== 0 ? ` ${mm}분` : ""
            return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]} ${ampm} ${h12}시${minuteText}`
        } catch (error) {
            return ""
        }
    }

    const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"]

    const isHighlighted = (d: number | null) => {
        if (!targetDate || d === null) return false
        return d === day
    }

    const calculateDday = () => {
        try {
            if (!date) return "D-00일"
            const today = new Date()
            const target = new Date(date)
            today.setHours(0, 0, 0, 0)
            target.setHours(0, 0, 0, 0)
            const diff = target.getTime() - today.getTime()
            const days = Math.ceil(diff / (1000 * 3600 * 24))
            if (days > 0) return `D-${days.toString().padStart(2, "0")}일`
            if (days === 0) return "D-DAY"
            return `D+${Math.abs(days).toString().padStart(2, "0")}일`
        } catch {
            return "D-00일"
        }
    }

    const textColorCss =
        highlightTextColor === "white" || highlightTextColor === "#ffffff"
            ? "#ffffff"
            : "#000000"

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    fontSize: 16,
                    lineHeight: "1.8em",
                    fontFamily: theme.font.body,
                    textAlign: "center",
                    marginBottom: 20,
                }}
            >
                {formatDateTime()}
            </div>
            <div
                style={{
                    fontSize: theme.text.display,
                    lineHeight: "1.8em",
                    fontFamily: theme.font.display,
                    textAlign: "center",
                    marginBottom: theme.space(5),
                }}
            >
                {monthIndex + 1}
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: theme.space(2.75),
                    padding: `0 ${theme.space(5)}px 0 ${theme.space(5)}px`,
                    alignItems: "flex-start",
                    justifyContent: "center",
                }}
            >
                {weeks.map((col, colIdx) => (
                    <div
                        key={colIdx}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: theme.text.md,
                                lineHeight: "2.6em",
                                ...theme.font.bodyBold,
                                marginBottom: theme.space(1.25),
                            }}
                        >
                            {dayNamesShort[colIdx]}
                        </div>
                        {col.map((d, idx) => (
                            <div
                                key={idx}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: theme.space(7.75),
                                    height: theme.space(7.75),
                                    marginBottom: theme.space(0.5),
                                }}
                            >
                                {d !== null ? (
                                    <>
                                        {isHighlighted(d) &&
                                            (highlightShape === "heart" ? (
                                                <motion.div
                                                    style={{
                                                        position: "absolute",
                                                        zIndex: 0,
                                                    }}
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        opacity: [1, 0.8, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width={30}
                                                        height={26}
                                                        viewBox="0 0 16 14"
                                                        fill="none"
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: "50%",
                                                            left: "50%",
                                                            transform:
                                                                "translate(-50%, -42%)",
                                                        }}
                                                    >
                                                        <g clipPath="url(#clip0_calendar_preview)">
                                                            <g
                                                                style={{
                                                                    mixBlendMode:
                                                                        "multiply" as const,
                                                                }}
                                                            >
                                                                <path
                                                                    d="M8.21957 1.47997C8.08957 1.59997 7.99957 1.73997 7.87957 1.85997C7.75957 1.73997 7.66957 1.59997 7.53957 1.47997C3.08957 -2.76003 -2.51043 2.94997 1.21957 7.84997C2.91957 10.08 5.58957 11.84 7.86957 13.43C10.1596 11.83 12.8196 10.08 14.5196 7.84997C18.2596 2.94997 12.6596 -2.76003 8.19957 1.47997H8.21957Z"
                                                                    fill={
                                                                        highlightColor
                                                                    }
                                                                />
                                                            </g>
                                                        </g>
                                                        <defs>
                                                            <clipPath id="clip0_calendar_preview">
                                                                <rect
                                                                    width="15.76"
                                                                    height="13.44"
                                                                    fill="white"
                                                                />
                                                            </clipPath>
                                                        </defs>
                                                    </svg>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    style={{
                                                        position: "absolute",
                                                        width: 31,
                                                        height: 31,
                                                        borderRadius: "50%",
                                                        backgroundColor:
                                                            highlightColor,
                                                        zIndex: 0,
                                                    }}
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        opacity: [1, 0.8, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                />
                                            ))}
                                        <div
                                            style={{
                                                fontSize: 15,
                                                lineHeight: "2.6em",
                                                color: isHighlighted(d)
                                                    ? textColorCss
                                                    : undefined,
                                                // 기본 폰트는 body, 하이라이트 시 bodyBold 객체를 전개하여 굵기 등 포함
                                                fontFamily: theme.font.body,
                                                ...(isHighlighted(d)
                                                    ? theme.font.bodyBold
                                                    : {}),
                                                zIndex: 1,
                                                position: "relative",
                                            }}
                                        >
                                            {d}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ width: 31, height: 31 }} />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 40,
                }}
            >
                <div
                    style={{
                        fontSize: 17,
                        lineHeight: "1em",
                        fontFamily: theme.font.body,
                        textAlign: "center",
                        marginBottom: 10,
                    }}
                >
                    {groomName || ""} ♥ {brideName || ""}의 결혼식
                </div>
                <div
                    style={{
                        fontSize: 17,
                        lineHeight: "1em",
                        ...theme.font.bodyBold,
                        textAlign: "center",
                    }}
                >
                    {calculateDday()}
                </div>
            </div>
        </div>
    )
}

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 전역 헬퍼 함수 - 이미지 순서 변경
function reorderImages(
    existingImages: any[],
    setExistingImages: (images: any[]) => void,
    setHasUnsavedChanges?: (value: boolean) => void
) {
    return (fromIndex: number, toIndex: number) => {
        const newImages = [...existingImages]
        const [movedImage] = newImages.splice(fromIndex, 1)
        newImages.splice(toIndex, 0, movedImage)

        // 로컬 상태만 업데이트 (서버 저장은 별도)
        setExistingImages(newImages)

        // 변경사항 표시
        if (setHasUnsavedChanges) {
            setHasUnsavedChanges(true)
        }

        console.log("로컬 순서 변경:", {
            fromIndex,
            toIndex,
            newLength: newImages.length,
        })
    }
}

// 세션 토큰 관리
function getAuthToken() {
    if (typeof window === "undefined") return null
    try {
        return localStorage.getItem("admin_session")
    } catch {
        return null
    }
}

function setAuthToken(token: string): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem("admin_session", token)
    } catch {
        // localStorage 사용 불가 시 무시
    }
}

function removeAuthToken() {
    if (typeof window === "undefined") return
    try {
        localStorage.removeItem("admin_session")
    } catch {
        // localStorage 사용 불가 시 무시
    }
}
// 인증 관련 함수들
async function authenticateAdmin(
    username: string,
    password: string
): Promise<any> {
    console.log("Login attempt:", {
        username,
        url: `${PROXY_BASE_URL}/api/user-management`,
    })

    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "loginGeneral",
                username,
                password,
            }),
        })

        console.log("Response status:", response.status)
        console.log("Response headers:", response.headers)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Response data:", result)

        if (result.success) {
            setAuthToken(result.token)
            return {
                success: true,
                user: result.user,
            }
        } else {
            return {
                success: false,
                error: result.error,
            }
        }
    } catch (error: any) {
        console.error("Login error details:", error)
        return {
            success: false,
            error: `네트워크 오류: ${error.message}`,
        }
    }
}

function generateSessionToken(user: {
    id: string
    username: string
    page_id?: string
    wedding_date?: string
}): string {
    return btoa(
        JSON.stringify({
            userId: user.id,
            username: user.username,
            page_id: user.page_id,
            wedding_date: user.wedding_date,
            expires: Date.now() + 24 * 60 * 60 * 1000,
        })
    )
}

function validateSessionToken(token: string): {
    userId: string
    username: string
    expires: number
    page_id?: string
    wedding_date?: string
} | null {
    try {
        const data = JSON.parse(atob(token))
        return Date.now() < data.expires ? data : null
    } catch {
        return null
    }
}

// 이미지 관련 함수들
async function getAllPages(): Promise<any> {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/images?action=getAllPages`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            }
        )

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get pages error:", error)
        return []
    }
}

async function getImagesByPageId(pageId: string): Promise<any> {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/images?action=getByPageId&pageId=${pageId}`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            }
        )

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get images error:", error)
        return []
    }
}

// 이미지 삭제 함수
async function deleteImage(imageId: string, fileName: string): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                imageId,
                fileName,
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Delete image error:", error)
        return {
            success: false,
            error: "이미지 삭제 중 오류가 발생했습니다",
        }
    }
}

// Supabase display_order 업데이트 함수
async function updateImageOrder(
    imageId: string,
    newOrder: number
): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                imageId,
                newOrder,
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Update image order error:", error)
        return {
            success: false,
            error: "이미지 순서 업데이트 중 오류가 발생했습니다",
        }
    }
}

// 연락처 관련 함수들
async function getAllContacts(pageId: string | null = null): Promise<any> {
    try {
        let url = `${PROXY_BASE_URL}/api/contacts`
        if (pageId) {
            url += `?pageId=${pageId}`
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        })

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get contacts error:", error)
        return []
    }
}

async function saveContact(contactData: any): Promise<any> {
    try {
        const isUpdate = !!contactData.id
        const method = isUpdate ? "PUT" : "POST"

        const response = await fetch(`${PROXY_BASE_URL}/api/contacts`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(contactData),
        })

        return await response.json()
    } catch (error) {
        console.error("Save contact error:", error)
        return {
            success: false,
            error: "연락처 저장 중 오류가 발생했습니다",
        }
    }
}

async function deleteContact(id: string): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/contacts`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ id }),
        })

        return await response.json()
    } catch (error) {
        console.error("Delete contact error:", error)
        return {
            success: false,
            error: "연락처 삭제 중 오류가 발생했습니다",
        }
    }
}

// 타입 선언
interface PageInfo {
    page_id: string
    image_count: number
}

// 날짜 포맷 변환 함수 (YYYY-MM-DD -> YYMMDD)
function formatDateForUrl(dateStr: string): string {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length !== 3) return ""
    const year = parts[0].slice(-2) // 뒤 2자리
    const month = parts[1].padStart(2, "0")
    const day = parts[2].padStart(2, "0")
    return `${year}${month}${day}`
}
interface ImageInfo {
    id: string
    filename: string
    public_url: string
    original_name: string
    display_order?: number
    file_size?: number
}
interface ContactInfo {
    id?: string
    page_id: string
    groom_name: string
    groom_phone: string
    groom_account: string
    groom_bank: string
    groom_bank_name: string
    groom_father_name: string
    groom_father_phone: string
    groom_father_account: string
    groom_father_bank: string
    groom_father_bank_name: string
    groom_mother_name: string
    groom_mother_phone: string
    groom_mother_account: string
    groom_mother_bank: string
    groom_mother_bank_name: string
    bride_name: string
    bride_phone: string
    bride_account: string
    bride_bank: string
    bride_bank_name: string
    bride_father_name: string
    bride_father_phone: string
    bride_father_account: string
    bride_father_bank: string
    bride_father_bank_name: string
    bride_mother_name: string
    bride_mother_phone: string
    bride_mother_account: string
    bride_mother_bank: string
    bride_mother_bank_name: string
    created_at?: string
    updated_at?: string
}

// presigned URL 관련 함수들
async function getPresignedUrl(fileName: string, pageId: string): Promise<any> {
    try {
        const requestBody = {
            action: "getPresignedUrl",
            fileName,
            pageId,
        }

        // 디버깅을 위한 로그 추가
        console.log("=== getPresignedUrl Debug ===")
        console.log("requestBody:", requestBody)
        console.log("PROXY_BASE_URL:", PROXY_BASE_URL)
        console.log("============================")

        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(requestBody),
        })

        console.log("Response status:", response.status)
        console.log("Response headers:", response.headers)

        const result = await response.json()
        console.log("Response result:", result)

        if (!result.success) throw new Error(result.error)
        return result
    } catch (error: unknown) {
        console.error("Get presigned URL error:", error)
        const message = error instanceof Error ? error.message : String(error)
        throw new Error("presigned URL 요청 실패: " + message)
    }
}

async function uploadToPresignedUrl(url: string, file: File): Promise<void> {
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        })

        if (!response.ok) {
            throw new Error(`Storage 업로드 실패: ${response.status}`)
        }
    } catch (error: unknown) {
        console.error("Upload to presigned URL error:", error)
        const message = error instanceof Error ? error.message : String(error)
        throw new Error("파일 업로드 실패: " + message)
    }
}

// 파일을 Base64 Data URL로 변환
async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

// 프록시(API) 업로드 (Base64) - 갤러리/교체용
async function uploadViaProxy(
    pageId: string,
    file: File,
    displayOrder: number
): Promise<any> {
    const fileData = await fileToDataUrl(file)
    const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
            action: "upload",
            pageId,
            fileData,
            originalName: file.name,
            fileSize: file.size,
            displayOrder,
        }),
    })
    const result = await response.json()
    if (!result.success) {
        throw new Error(result.error || "프록시 업로드 실패")
    }
    return result.data
}

async function saveImageMeta(
    pageId: string,
    fileName: string,
    order: number,
    storagePath: string,
    fileSize: number
): Promise<any> {
    try {
        const token = getAuthToken()
        console.log(
            `saveImageMeta 시작: pageId=${pageId}, fileName=${fileName}, order=${order}, storagePath=${storagePath}, hasToken=${!!token}`
        )

        const requestBody = {
            action: "saveMeta",
            pageId,
            fileName,
            displayOrder: order,
            storagePath,
            fileSize,
        }
        console.log("saveImageMeta 요청 body:", requestBody)

        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
        })

        console.log(`saveImageMeta 응답 status: ${response.status}`)

        if (!response.ok) {
            const errorText = await response.text()
            console.error("saveImageMeta HTTP 오류:", errorText)
            throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log("saveImageMeta 응답 result:", result)

        if (!result.success) throw new Error(result.error)
        return result.data
    } catch (error: unknown) {
        console.error("Save image meta error:", error)
        const message = error instanceof Error ? error.message : String(error)
        throw new Error("메타데이터 저장 실패: " + message)
    }
}

// 이미지 압축 관련 함수들 추가
function validateImageFileSize(file: File): void {
    const MAX_ORIGINAL_SIZE = 100 * 1024 * 1024 // 100MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

    if (file.size > MAX_ORIGINAL_SIZE) {
        throw new Error(
            `원본 파일이 너무 큽니다. 최대 ${MAX_ORIGINAL_SIZE / (1024 * 1024)}MB까지 지원합니다.`
        )
    }

    if (!allowedTypes.includes(file.type)) {
        throw new Error(
            "지원되지 않는 파일 형식입니다 (JPEG, PNG, GIF, WebP만 허용)"
        )
    }
}
// 기본 이미지 압축 함수 (품질 우선 + 이진 탐색)
async function compressImage(
    file: File,
    maxSizeKB = 1024,
    quality = 0.9
): Promise<File> {
    return new Promise((resolve, reject) => {
        if (typeof document === "undefined") {
            reject(new Error("Document not available"))
            return
        }
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = async () => {
            try {
                let { width, height } = img

                // 긴 변 기준 리사이징 (과도한 축소 방지)
                const MAX_LONG_EDGE = 2560
                const longEdge = Math.max(width, height)
                const scale =
                    longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1
                width = Math.round(width * scale)
                height = Math.round(height * scale)

                canvas.width = width
                canvas.height = height

                if (ctx) {
                    ctx.imageSmoothingEnabled = true
                    ctx.imageSmoothingQuality = "high"
                    ctx.clearRect(0, 0, width, height)
                    ctx.drawImage(img, 0, 0, width, height)
                }

                // 포맷 선택: PNG/WebP -> WebP(알파 유지), 그 외 JPEG
                const targetFormat =
                    file.type === "image/png" || file.type === "image/webp"
                        ? "image/webp"
                        : "image/jpeg"

                // JPEG의 경우 배경을 흰색으로 채워 투명 픽셀 방지
                if (ctx && targetFormat === "image/jpeg") {
                    // 다시 그려 배경 처리
                    ctx.globalCompositeOperation = "destination-over"
                    ctx.fillStyle = "white"
                    ctx.fillRect(0, 0, width, height)
                    ctx.globalCompositeOperation = "source-over"
                }

                const toBlobPromise = (q: number): Promise<Blob> =>
                    new Promise((res, rej) => {
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) return rej(new Error("toBlob 실패"))
                                res(blob)
                            },
                            targetFormat,
                            q
                        )
                    })

                const startQ = Math.min(0.92, quality || 0.9)
                const minQ = targetFormat === "image/jpeg" ? 0.7 : 0.75

                // 1차 시도 (높은 품질)
                let blob = await toBlobPromise(startQ)
                if (blob.size / 1024 <= maxSizeKB) {
                    resolve(
                        new File([blob], file.name, {
                            type: targetFormat,
                            lastModified: Date.now(),
                        })
                    )
                    return
                }

                // 2차: 이진 탐색으로 목표 용량에 맞추되 가능한 높은 품질 유지
                let low = minQ
                let high = startQ
                let best: Blob | null = null
                for (let i = 0; i < 8; i++) {
                    const mid = Math.max(minQ, Math.min(high, (low + high) / 2))
                    const testBlob = await toBlobPromise(mid)
                    const kb = testBlob.size / 1024
                    if (kb <= maxSizeKB) {
                        best = testBlob
                        low = mid + 0.02 // 더 높은 품질을 시도
                    } else {
                        high = mid - 0.02 // 더 낮은 품질로
                    }
                    if (high - low < 0.01) break
                }
                const finalBlob = best || blob
                resolve(
                    new File([finalBlob], file.name, {
                        type: targetFormat,
                        lastModified: Date.now(),
                    })
                )
            } catch (e) {
                reject(e)
            } finally {
                URL.revokeObjectURL(objectUrl)
            }
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error("이미지 로드 실패"))
        }
        img.src = objectUrl
    })
}

// 단계적 압축 함수 (대용량 파일용)
async function progressiveCompress(
    file: File,
    targetSizeKB = 1024,
    onProgress?: (progress: number) => void
): Promise<any> {
    const originalSize = file.size

    try {
        // 파일이 이미 작으면 압축하지 않음
        if (originalSize / 1024 <= targetSizeKB) {
            return {
                compressedFile: file,
                originalSize,
                compressedSize: originalSize,
                compressionRatio: 1,
                method: "no_compression",
            }
        }

        onProgress?.(10)

        // 1단계: 큰 파일의 경우 사전 리사이징 (고품질 유지)
        let processedFile = file
        if (originalSize > 10 * 1024 * 1024) {
            // 10MB 이상 - 높은 품질에서 1차 축소
            processedFile = await compressImage(file, targetSizeKB, 0.92)
            onProgress?.(40)
        } else if (originalSize > 5 * 1024 * 1024) {
            // 5MB 이상 - 가벼운 축소
            processedFile = await compressImage(file, targetSizeKB, 0.9)
            onProgress?.(35)
        }

        // 2단계: 기본 압축
        onProgress?.(50)
        let compressedFile = await compressImage(
            processedFile,
            targetSizeKB,
            0.9
        )

        // 3단계: 여전히 크면 추가 압축
        if (compressedFile.size / 1024 > targetSizeKB) {
            onProgress?.(70)
            compressedFile = await compressImage(
                processedFile,
                targetSizeKB,
                0.82
            )
        }

        // 4단계: 최종 압축 (최소 품질 유지)
        if (compressedFile.size / 1024 > targetSizeKB) {
            onProgress?.(90)
            compressedFile = await compressImage(
                processedFile,
                targetSizeKB,
                0.78
            )
        }

        onProgress?.(100)
        const compressedSize = compressedFile.size
        const compressionRatio = originalSize / compressedSize

        return {
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
            method: "progressive_compression",
        }
    } catch (error: unknown) {
        console.error("압축 실패:", error)
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`이미지 압축에 실패했습니다: ${message}`)
    }
}

// 음원 압축 함수
async function compressAudio(
    file: File,
    maxSizeKB = 5120, // 5MB
    onProgress?: (progress: number) => void
): Promise<File> {
    return new Promise((resolve, reject) => {
        try {
            const originalSize = file.size / 1024 // KB

            onProgress?.(10)

            // 파일이 이미 충분히 작다면 압축하지 않음
            if (originalSize <= maxSizeKB) {
                onProgress?.(100)
                resolve(file)
                return
            }

            onProgress?.(30)

            // 실제 음원 압축은 복잡하므로, 여기서는 파일 크기 체크만 수행
            // 실제 환경에서는 FFmpeg 등을 사용해야 함
            console.log(`음원 파일 크기: ${originalSize.toFixed(2)}KB`)

            if (originalSize > maxSizeKB) {
                console.warn(
                    `음원 파일이 ${maxSizeKB}KB를 초과합니다. 실제 압축이 필요합니다.`
                )
            }

            onProgress?.(100)
            resolve(file)
        } catch (error) {
            reject(error)
        }
    })
}

// 무료 음원 데이터
const FREE_BGM_LIST = [
    { id: "1", name: "01", url: "https://cdn.roarc.kr/bgm/free/01.m4a" },
    { id: "2", name: "02", url: "https://cdn.roarc.kr/bgm/free/02.m4a" },
    { id: "3", name: "03", url: "https://cdn.roarc.kr/bgm/free/03.m4a" },
    { id: "4", name: "04", url: "https://cdn.roarc.kr/bgm/free/04.m4a" },
    { id: "5", name: "05", url: "https://cdn.roarc.kr/bgm/free/05.m4a" },
    { id: "6", name: "06", url: "https://cdn.roarc.kr/bgm/free/06.m4a" },
    { id: "7", name: "07", url: "https://cdn.roarc.kr/bgm/free/07.m4a" },
    { id: "8", name: "08", url: "https://cdn.roarc.kr/bgm/free/08.m4a" },
    { id: "9", name: "09", url: "https://cdn.roarc.kr/bgm/free/09.m4a" },
    { id: "10", name: "10", url: "https://cdn.roarc.kr/bgm/free/10.m4a" },
]

const DEFAULT_INVITATION_TEXT =
    "저희 두 사람이 하나 되는 약속의 시간에\n마음을 담아 소중한 분들을 모십니다.\n귀한 걸음으로 축복해 주시면 감사하겠습니다."

const createInitialInviteData = () => ({
    invitationText: DEFAULT_INVITATION_TEXT,
    groomFatherName: "",
    groomMotherName: "",
    groomName: "",
    brideFatherName: "",
    brideMotherName: "",
    brideName: "",
    showGroomFatherChrysanthemum: false,
    showGroomMotherChrysanthemum: false,
    showBrideFatherChrysanthemum: false,
    showBrideMotherChrysanthemum: false,
    sonLabel: "아들",
    daughterLabel: "딸",
})

type InviteDataState = ReturnType<typeof createInitialInviteData>

const createInitialPageSettings = () => ({
    groomName: "",
    groom_name_kr: "",
    groom_name_en: "",
    last_groom_name_kr: "",
    last_groom_name_en: "",
    brideName: "",
    bride_name_kr: "",
    bride_name_en: "",
    last_bride_name_kr: "",
    last_bride_name_en: "",
    wedding_date: "",
    wedding_hour: "14",
    wedding_minute: "00",
    venue_name: "",
    venue_name_kr: "",
    transport_location_name: "",
    venue_address: "",
    venue_lat: null,
    venue_lng: null,
    photo_section_image_url: "",
    photo_section_image_path: "",
    photo_section_location: "",
    photo_section_overlay_position: "bottom",
    photo_section_overlay_color: "#ffffff",
    photo_section_locale: "en",
    highlight_shape: "circle",
    highlight_color: "#e0e0e0",
    highlight_text_color: "black",
    gallery_type: "thumbnail",
    info: "off",
    account: "off",
    bgm: "off",
    rsvp: "off",
    comments: "off",
    kko_img: "",
    kko_title: "",
    kko_date: "",
    bgm_url: "",
    bgm_type: "",
    bgm_autoplay: false,
    bgm_vol: 3,
    type: "papillon",
    vid_url: "",
    cal_txt: "",
})

type PageSettingsState = ReturnType<typeof createInitialPageSettings>

// 메인 Admin 컴포넌트 (내부 로직)
function AdminMainContent(props: any) {
    const {
        maxSizeKB = 1024,
        style,
        updateSaveState,
        showCopyPopup,
        setShowCopyPopup,
        currentUser,
        setCurrentUser,
        isAuthenticated: propIsAuthenticated,
        setIsAuthenticated: propSetIsAuthenticated,
    } = props

    // 갤러리 저장 액션바를 위한 지역 변수 선언
    let currentHasUnsavedChanges = false
    let currentSaveImageOrder: (() => Promise<void>) | null = null
    let currentIsSavingOrder = false

    // TransportTab save 함수 참조
    const transportTabSaveRef = React.useRef<(() => Promise<void>) | null>(null)

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[Admin] Typography loading failed:", error)
        }
    }, [])

    // Pretendard 폰트 스택을 안전하게 가져오기
    const pretendardFontFamily = React.useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // Pretendard Regular 스타일 (weight: 400)
    const pretendardRegularStyle: React.CSSProperties = React.useMemo(() => {
        try {
            return (
                typography?.helpers?.fontPretendard?.(400) || {
                    fontFamily: pretendardFontFamily,
                    fontWeight: 400,
                }
            )
        } catch {
            return {
                fontFamily: pretendardFontFamily,
                fontWeight: 400,
            }
        }
    }, [pretendardFontFamily])

    // Pretendard SemiBold 스타일 (weight: 600)
    const pretendardSemiBoldStyle: React.CSSProperties = React.useMemo(() => {
        try {
            return (
                typography?.helpers?.fontPretendard?.(600) || {
                    fontFamily: pretendardFontFamily,
                    fontWeight: 600,
                }
            )
        } catch {
            return {
                fontFamily: pretendardFontFamily,
                fontWeight: 600,
            }
        }
    }, [pretendardFontFamily])

    // 공통 상태 (isAuthenticated는 props로 받음)
    const isAuthenticated = propIsAuthenticated
    const setIsAuthenticated = propSetIsAuthenticated
    const [loginForm, setLoginForm] = useState({ username: "", password: "" })
    const [loginError, setLoginError] = useState("")
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<"basic" | "gallery">("basic")

    // 아코디언 상태 관리 (한 번에 하나의 섹션만 열림)
    const [currentOpenSection, setCurrentOpenSection] = useState<string | null>(
        "name"
    ) // "성함" 섹션은 기본적으로 열림
    const [currentPageId, setCurrentPageId] = useState("")
    // 페이지 선택/리스트 관련 로직 제거 (사전 부여된 page_id만 사용)
    const [assignedPageId, setAssignedPageId] = useState<string | null>(null)

    // 이미지 관련 상태
    const [existingImages, setExistingImages] = useState<ImageInfo[]>([])
    const [showImageManager, setShowImageManager] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadSuccess, setUploadSuccess] = useState(0)
    const [imagesVersion, setImagesVersion] = useState<number>(0)

    // 청첩장 상태 및 업데이트 함수
    const [inviteData, setInviteData] = useState<InviteDataState>(
        createInitialInviteData
    )

    const updateInviteField = (
        field: keyof typeof inviteData,
        value: string | boolean
    ) => {
        setInviteData((prev) => ({ ...prev, [field]: value }))
    }

    // 청첩장 API 연동 상태/함수
    const [inviteSaving, setInviteSaving] = useState(false)

    const loadInviteData = async (): Promise<void> => {
        if (!currentPageId) return
        try {
            const res = await fetch(
                `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(currentPageId)}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            )
            if (!res.ok) return
            const result = await res.json()
            if (result?.success && result?.data) {
                const d = result.data
                setInviteData((prev) => ({
                    invitationText: d.invitation_text ?? prev.invitationText,
                    groomFatherName:
                        d.groom_father_name ?? prev.groomFatherName,
                    groomMotherName:
                        d.groom_mother_name ?? prev.groomMotherName,
                    groomName:
                        d.groom_name ||
                        pageSettings.groomName ||
                        prev.groomName, // invite_cards.groom_name 우선 사용
                    brideFatherName:
                        d.bride_father_name ?? prev.brideFatherName,
                    brideMotherName:
                        d.bride_mother_name ?? prev.brideMotherName,
                    brideName:
                        d.bride_name ||
                        pageSettings.brideName ||
                        prev.brideName, // invite_cards.bride_name 우선 사용
                    showGroomFatherChrysanthemum:
                        !!d.show_groom_father_chrysanthemum,
                    showGroomMotherChrysanthemum:
                        !!d.show_groom_mother_chrysanthemum,
                    showBrideFatherChrysanthemum:
                        !!d.show_bride_father_chrysanthemum,
                    showBrideMotherChrysanthemum:
                        !!d.show_bride_mother_chrysanthemum,
                    sonLabel: d.son_label ?? prev.sonLabel,
                    daughterLabel: d.daughter_label ?? prev.daughterLabel,
                }))
            } else {
                setInviteData((prev) => ({
                    ...prev,
                    groomName: pageSettings.groomName || prev.groomName, // invite_cards 데이터 없을 때 page_settings에서 가져옴
                    brideName: pageSettings.brideName || prev.brideName, // invite_cards 데이터 없을 때 page_settings에서 가져옴
                }))
            }
        } catch (_err) {
            // noop
        }
    }

    const saveInviteData = async (): Promise<void> => {
        try {
            setInviteSaving(true)
            // 자동 저장 토스트 노출
            broadcastAutoSaveToast()
            const body = {
                invite: {
                    invitation_text: inviteData.invitationText,
                    groom_father_name: inviteData.groomFatherName,
                    groom_mother_name: inviteData.groomMotherName,
                    groom_name: inviteData.groomName, // invite_cards에 저장하고 Trigger로 동기화
                    bride_father_name: inviteData.brideFatherName,
                    bride_mother_name: inviteData.brideMotherName,
                    bride_name: inviteData.brideName, // invite_cards에 저장하고 Trigger로 동기화
                    show_groom_father_chrysanthemum:
                        inviteData.showGroomFatherChrysanthemum,
                    show_groom_mother_chrysanthemum:
                        inviteData.showGroomMotherChrysanthemum,
                    show_bride_father_chrysanthemum:
                        inviteData.showBrideFatherChrysanthemum,
                    show_bride_mother_chrysanthemum:
                        inviteData.showBrideMotherChrysanthemum,
                    son_label: inviteData.sonLabel,
                    daughter_label: inviteData.daughterLabel,
                },
            }
            const res = await fetch(`${PROXY_BASE_URL}/api/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify(body),
            })
            const text = await res.text()
            let result: any = {}
            try {
                result = JSON.parse(text)
            } catch {
                result = { raw: text }
            }
            if (!res.ok || !result?.success) {
                const msg =
                    result?.message ||
                    result?.error ||
                    text ||
                    "초대장 저장 실패"
                const code = result?.code ? ` (code: ${result.code})` : ""
                console.error(`청첩장 저장 중 오류: ${msg}${code}`)
            } else {
                // 저장 후 재로드로 동기화
                await loadInviteData()
            }
        } catch (_e) {
            console.error("청첩장 저장 중 오류가 발생했습니다.")
        } finally {
            setInviteSaving(false)
        }
    }

    useEffect(() => {
        loadInviteData() // 아코디언에서는 항상 로드
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageId])

    // 연락처 관련 상태
    const [contactList, setContactList] = useState<ContactInfo[]>([])
    const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(
        null
    )
    const [isEditingContact, setIsEditingContact] = useState(false)

    // 연락처 섹션 토글 상태
    const [contactToggles, setContactToggles] = useState({
        groom: true,
        groomFather: true,
        groomMother: true,
        bride: true,
        brideFather: true,
        brideMother: true,
    })

    // 계좌 안내 섹션 토글 상태
    const [accountToggles, setAccountToggles] = useState({
        groom: true,
        groomFather: true,
        groomMother: true,
        bride: true,
        brideFather: true,
        brideMother: true,
    })

    // 연락처 토글 핸들러 함수
    const handleContactToggleChange = (
        section: keyof typeof contactToggles,
        isOn: boolean
    ): void => {
        setContactToggles((prev) => ({ ...prev, [section]: isOn }))

        // 토글이 꺼지면 해당 섹션의 데이터 삭제
        if (!isOn && selectedContact) {
            const fieldsToClear: { [key: string]: string } = {}

            switch (section) {
                case "groom":
                    fieldsToClear.groom_name = ""
                    fieldsToClear.groom_phone = ""
                    break
                case "groomFather":
                    fieldsToClear.groom_father_name = ""
                    fieldsToClear.groom_father_phone = ""
                    break
                case "groomMother":
                    fieldsToClear.groom_mother_name = ""
                    fieldsToClear.groom_mother_phone = ""
                    break
                case "bride":
                    fieldsToClear.bride_name = ""
                    fieldsToClear.bride_phone = ""
                    break
                case "brideFather":
                    fieldsToClear.bride_father_name = ""
                    fieldsToClear.bride_father_phone = ""
                    break
                case "brideMother":
                    fieldsToClear.bride_mother_name = ""
                    fieldsToClear.bride_mother_phone = ""
                    break
            }

            setSelectedContact((prev) =>
                prev ? { ...prev, ...fieldsToClear } : null
            )
        }
    }

    // 계좌 안내 토글 핸들러 함수
    const handleAccountToggleChange = (
        section: keyof typeof accountToggles,
        isOn: boolean
    ): void => {
        setAccountToggles((prev) => ({ ...prev, [section]: isOn }))

        // 토글이 꺼지면 해당 섹션의 계좌 데이터 삭제
        if (!isOn && selectedContact) {
            const fieldsToClear: { [key: string]: string } = {}

            switch (section) {
                case "groom":
                    fieldsToClear.groom_bank_name = ""
                    fieldsToClear.groom_bank = ""
                    fieldsToClear.groom_account = ""
                    break
                case "groomFather":
                    fieldsToClear.groom_father_bank_name = ""
                    fieldsToClear.groom_father_bank = ""
                    fieldsToClear.groom_father_account = ""
                    break
                case "groomMother":
                    fieldsToClear.groom_mother_bank_name = ""
                    fieldsToClear.groom_mother_bank = ""
                    fieldsToClear.groom_mother_account = ""
                    break
                case "bride":
                    fieldsToClear.bride_bank_name = ""
                    fieldsToClear.bride_bank = ""
                    fieldsToClear.bride_account = ""
                    break
                case "brideFather":
                    fieldsToClear.bride_father_bank_name = ""
                    fieldsToClear.bride_father_bank = ""
                    fieldsToClear.bride_father_account = ""
                    break
                case "brideMother":
                    fieldsToClear.bride_mother_bank_name = ""
                    fieldsToClear.bride_mother_bank = ""
                    fieldsToClear.bride_mother_account = ""
                    break
            }

            setSelectedContact((prev) =>
                prev ? { ...prev, ...fieldsToClear } : null
            )
        }
    }
    const [loading, setLoading] = useState(false)

    // 페이지 설정 관련 상태
    const [pageSettings, setPageSettings] = useState<PageSettingsState>(
        createInitialPageSettings
    )
    const [originalPageSettings, setOriginalPageSettings] =
        useState<PageSettingsState>(createInitialPageSettings)
    const [settingsLoading, setSettingsLoading] = useState(false)
    const [hasLoadedSettings, setHasLoadedSettings] = useState(false)
    const [compressProgress, setCompressProgress] = useState<number | null>(
        null
    )
    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const currentPlayingAudioRef = React.useRef<HTMLAudioElement | null>(null) // 현재 재생 중인 오디오 추적
    const [selectedBgmId, setSelectedBgmId] = useState<string | null>(null)
    const [playingBgmId, setPlayingBgmId] = useState<string | null>(null)
    const [previewBgmId, setPreviewBgmId] = useState<string | null>(null) // 미리듣기용 상태
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(
        null
    ) // 업로드된 파일명
    const kakaoImageInputRef = useRef<HTMLInputElement | null>(null)
    const [kakaoUploadLoading, setKakaoUploadLoading] = useState(false)
    const addressLayerCleanupRef = React.useRef<(() => void) | null>(null)

    React.useEffect(() => {
        const match = FREE_BGM_LIST.find((b) => b.url === pageSettings.bgm_url)
        setSelectedBgmId(match ? match.id : null)
    }, [pageSettings.bgm_url])

    // 비디오 URL 변경 시 섹션 자동 열기/닫기
    React.useEffect(() => {
        // 비디오 URL이 있으면 섹션을 자동으로 열기 (이미 열려있지 않은 경우에만)
        if (pageSettings.vid_url && currentOpenSection !== "video") {
            // 섹션을 열기 위해 상태를 업데이트하지 않음 - 토글 버튼의 isOn 상태만 변경
        }
    }, [pageSettings.vid_url, currentOpenSection])

    React.useEffect(() => {
        const el = audioRef.current
        if (!el) return

        const onEnded = () => {
            console.log(`[BGM] 재생 완료`)
            setPlayingBgmId(null)
        }

        const onError = (e: Event) => {
            console.error(`[BGM] 오디오 재생 오류:`, e)
            setPlayingBgmId(null)
            setPreviewBgmId(null)
        }

        const onLoadStart = () => {
            console.log(`[BGM] 오디오 로딩 시작`)
        }

        const onCanPlay = () => {
            console.log(`[BGM] 오디오 재생 준비 완료`)
        }

        el.addEventListener("ended", onEnded)
        el.addEventListener("error", onError)
        el.addEventListener("loadstart", onLoadStart)
        el.addEventListener("canplay", onCanPlay)

        return () => {
            el.removeEventListener("ended", onEnded)
            el.removeEventListener("error", onError)
            el.removeEventListener("loadstart", onLoadStart)
            el.removeEventListener("canplay", onCanPlay)
        }
    }, [])

    useEffect(() => {
        setHasLoadedSettings(false)
    }, [currentPageId])
    React.useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                addressLayerCleanupRef.current?.()
                addressLayerCleanupRef.current = null
            }
        }
    }, [])
    // 미리보기용 포맷터 및 프롭 빌더
    const formatPhotoDisplayDateTime = (): string => {
        const locale =
            (pageSettings.photo_section_locale as "en" | "kr") || "kr"
        const dateStr = pageSettings.wedding_date
        if (!dateStr) return ""
        try {
            // 안전한 날짜 파싱 (UTC 오프셋 문제 방지)
            const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10))
            if (!y || !m || !d) return ""
            const dt = new Date(y, m - 1, d)
            const year = y.toString()
            const mm = m.toString().padStart(2, "0")
            const dd = d.toString().padStart(2, "0")

            const weekdayIdx = dt.getDay()
            const weekdayEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
                weekdayIdx
            ]
            const weekdayKr = [
                "일요일",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
            ][weekdayIdx]

            const hour24 = parseInt(pageSettings.wedding_hour || "0", 10)
            const periodEn = hour24 < 12 ? "AM" : "PM"
            const periodKr = hour24 < 12 ? "오전" : "오후"
            const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

            if (locale === "en") {
                // 2025. 10. 25. SAT. 12 PM
                return `${year}. ${mm}. ${dd}. ${weekdayEn}. ${hour12} ${periodEn}`
            }
            // 2025. 10. 25. 토요일 오후 12시
            return `${year}. ${mm}. ${dd}. ${weekdayKr} ${periodKr} ${hour12}시`
        } catch {
            return ""
        }
    }

    const buildNameSectionProps = () => ({
        groomName:
            pageSettings.groom_name_en || pageSettings.groomName || "GROOM",
        brideName:
            pageSettings.bride_name_en || pageSettings.brideName || "BRIDE",
    })

    const [photoSectionPreviewUrl, setPhotoSectionPreviewUrl] = React.useState<
        string | null
    >(null)
    const [photoSectionImageVersion, setPhotoSectionImageVersion] =
        React.useState<number>(0)

    const addPhotoVersionParam = (url?: string): string | undefined => {
        if (!url) return url
        const sep = url.includes("?") ? "&" : "?"
        return `${url}${sep}v=${photoSectionImageVersion}`
    }

    const getPhotoSectionDisplayUrl = (): string | undefined => {
        const constructedUrl = pageSettings.photo_section_image_path
            ? `https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/${pageSettings.photo_section_image_path}`
            : undefined
        const derivedPublicUrl = (pageSettings as any)
            .photo_section_image_public_url as string | undefined
        const serverUrl =
            derivedPublicUrl ||
            pageSettings.photo_section_image_url ||
            constructedUrl

        // objectURL 최우선, 그 다음 파생 URL, 그 외는 버전 파라미터 부여
        if (photoSectionPreviewUrl) return photoSectionPreviewUrl
        if (derivedPublicUrl) return derivedPublicUrl
        return addPhotoVersionParam(serverUrl)
    }

    // 갤러리 방식과 동일한 썸네일 최적화
    const photoSectionThumbSrc = React.useMemo(() => {
        const src = getPhotoSectionDisplayUrl()
        if (!src) return src

        try {
            const u = new URL(src)
            // Supabase URL인 경우 썸네일 변환 시도
            if (u.pathname.includes("/storage/v1/object/public/")) {
                return toTransformedUrl(src, {
                    width: 160,
                    quality: 75,
                    format: "jpg",
                    resize: "cover",
                })
            }
            // R2 URL인 경우 원본 이미지 사용 (변환 불가)
            return src
        } catch {
            // URL 파싱 실패 시 원본 사용
            return src
        }
    }, [getPhotoSectionDisplayUrl])

    const buildPhotoSectionProps = () => {
        return {
            imageUrl: getPhotoSectionDisplayUrl(),
            displayDateTime: formatPhotoDisplayDateTime(),
            location: pageSettings.venue_name || undefined,
            overlayPosition:
                (pageSettings.photo_section_overlay_position as
                    | "top"
                    | "bottom") || "bottom",
            overlayTextColor:
                (pageSettings.photo_section_overlay_color as
                    | "#ffffff"
                    | "#000000") || "#ffffff",
        }
    }

    const getKakaoShareNames = useCallback(() => {
        const groom =
            pageSettings.groom_name_kr ||
            pageSettings.groomName ||
            inviteData.groomName ||
            ""
        const bride =
            pageSettings.bride_name_kr ||
            pageSettings.brideName ||
            inviteData.brideName ||
            ""
        return { groom, bride }
    }, [
        pageSettings.groom_name_kr,
        pageSettings.groomName,
        pageSettings.bride_name_kr,
        pageSettings.brideName,
        inviteData.groomName,
        inviteData.brideName,
    ])





    // 초대글 텍스트 포맷팅(볼드/인용) 삽입
    const insertInviteFormat = (format: "bold" | "quote") => {
        if (typeof document === "undefined") return
        const textarea = document.getElementById(
            "inviteTextArea"
        ) as HTMLTextAreaElement | null
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selected = inviteData.invitationText.substring(start, end)
        const before = inviteData.invitationText.substring(0, start)
        const after = inviteData.invitationText.substring(end)

        if (format === "bold") {
            const newText = selected
                ? `${before}*${selected}*${after}`
                : `${before}*텍스트*${after}`
            updateInviteField("invitationText", newText)
            const cursor = selected ? start + selected.length + 2 : start + 1
            setTimeout(() => {
                textarea.focus()
                textarea.setSelectionRange(cursor, cursor)
            }, 0)
            return
        }
        if (format === "quote") {
            const newText = selected
                ? `${before}{${selected}}${after}`
                : `${before}{텍스트}${after}`
            updateInviteField("invitationText", newText)
            const cursor = selected ? start + selected.length + 2 : start + 1
            setTimeout(() => {
                textarea.focus()
                textarea.setSelectionRange(cursor, cursor)
            }, 0)
        }
    }

    // 초대글 미리보기: InviteName.tsx 렌더링 로직과 동일한 스타일 구현
    const renderBoldSegmentsPreview = (
        text: string,
        baseStyle?: React.CSSProperties,
        pretendardSemiBoldStyle?: React.CSSProperties
    ): JSX.Element[] => {
        const out: JSX.Element[] = []
        let last = 0
        let key = 0
        const re = /\*([^*]+)\*/g
        let m: RegExpExecArray | null
        while ((m = re.exec(text)) !== null) {
            const start = m.index
            const end = start + m[0].length
            if (start > last) {
                const chunk = text.slice(last, start)
                if (chunk)
                    out.push(
                        <span key={`nb-${key++}`} style={baseStyle}>
                            {chunk}
                        </span>
                    )
            }
            const boldText = m[1]
            out.push(
                <span
                    key={`b-${key++}`}
                    style={{
                        ...(baseStyle || {}),
                        ...(pretendardSemiBoldStyle || {}),
                    }}
                >
                    {boldText}
                </span>
            )
            last = end
        }
        if (last < text.length) {
            const rest = text.slice(last)
            if (rest)
                out.push(
                    <span key={`nb-${key++}`} style={baseStyle}>
                        {rest}
                    </span>
                )
        }
        return out
    }

    const renderInvitationSegmentsPreview = (
        text: string,
        pretendardSemiBoldStyle?: React.CSSProperties
    ): JSX.Element[] => {
        const out: JSX.Element[] = []
        let last = 0
        let key = 0

        // 보라색 인용: 줄바꿈 포함 허용
        const quoteRe = /\{([\s\S]*?)\}/g
        let m: RegExpExecArray | null

        // 공통: 줄바꿈 보존하면서 굵기 처리
        const renderWithLineBreaks = (
            value: string,
            baseStyle?: React.CSSProperties
        ): JSX.Element[] => {
            const lines = value.split("\n")
            const parts: JSX.Element[] = []
            for (let i = 0; i < lines.length; i++) {
                parts.push(
                    <span key={`lw-${key++}`}>
                        {renderBoldSegmentsPreview(
                            lines[i],
                            baseStyle,
                            pretendardSemiBoldStyle
                        )}
                    </span>
                )
                if (i !== lines.length - 1)
                    parts.push(<br key={`br-${key++}`} />)
            }
            return parts
        }

        while ((m = quoteRe.exec(text)) !== null) {
            const start = m.index
            const end = start + m[0].length
            if (start > last) {
                const chunk = text.slice(last, start)
                if (chunk) out.push(...renderWithLineBreaks(chunk))
            }
            const inner = m[1]
            if (inner) {
                const muted: React.CSSProperties = {
                    fontSize: 14,
                    lineHeight: "1.8em",
                    color: "#6e6e6e",
                    display: "inline-block",
                }
                out.push(
                    <span key={`q-${key++}`} style={muted}>
                        {renderWithLineBreaks(inner, muted)}
                    </span>
                )
            }
            last = end
        }

        if (last < (text || "").length) {
            const rest = text.slice(last)
            if (rest) out.push(...renderWithLineBreaks(rest))
        }

        return out
    }

    function InlineChrysanthemumIcon() {
        return (
            <div
                style={{
                    width: 13,
                    height: 19,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="20"
                    viewBox="0 0 13 20"
                    fill="none"
                >
                    <path
                        d="M8.13164 1.0899C8.27511 0.760965 8.52941 0.404781 8.89141 0.522519C9.37558 0.6834 9.59449 1.15577 9.66973 1.68268C9.89531 1.75563 9.99814 2.01813 10.0174 2.31158C10.229 2.09849 10.4358 1.93762 10.6404 1.85162C10.852 1.76379 11.2472 1.71843 11.4188 1.90143C11.7126 2.20801 11.4463 2.93957 11.2889 3.31158C11.5476 3.17333 11.8016 3.07789 12.0271 3.04791C12.279 3.01987 12.6975 3.12835 12.785 3.35455C12.8879 3.6406 12.6692 4.10757 12.4979 4.3692C12.6622 4.4215 12.9417 4.58788 12.991 4.77838C13.0715 5.1503 12.6158 5.6257 12.3289 5.85943C12.5133 6.20282 12.3054 6.49529 11.9314 6.73541C12.2043 7.62814 12.3261 8.56591 11.8328 9.00689C11.4026 8.96195 11.0141 8.75024 10.6854 8.3858C10.5087 9.37846 9.71434 8.87405 9.20879 8.39361C9.08635 8.77305 8.90331 9.12311 8.59551 9.27643C8.36285 9.1007 8.1841 8.89651 8.04766 8.61236C7.86841 8.87682 7.59335 9.15184 7.29961 9.05475C6.13161 11.374 5.21645 13.5711 4.51738 15.8467C4.64714 15.6993 4.78105 15.5601 4.91973 15.4317C4.97571 15.3364 5.08425 15.1911 5.13848 15.1182C5.70524 14.3518 6.37492 13.482 7.15508 12.9268C7.52417 12.6501 7.93391 12.417 8.35723 12.2188C8.38508 12.2058 8.42496 12.2054 8.45293 12.2256C8.51416 12.2556 8.5426 12.3292 8.50762 12.3946L8.31719 12.8184C8.93116 12.3214 9.7448 12.1685 10.3797 12.4395C10.4005 12.4397 10.4146 12.4526 10.4285 12.46C10.4546 12.4899 10.4753 12.5331 10.4822 12.5704C10.4891 12.6207 10.468 12.6654 10.4471 12.6934C10.428 12.7158 10.4216 12.7381 10.4285 12.753C10.4355 12.781 10.4759 12.8184 10.5301 12.8389C11.1248 13.0595 11.6844 13.3869 12.2039 13.8038C12.2179 13.8187 12.2251 13.8337 12.2391 13.8467C12.253 13.8766 12.2529 13.9144 12.2459 13.9424C12.2388 13.9796 12.2175 14.0076 12.1844 14.0225C11.5967 14.3664 10.9599 14.5547 10.4002 14.5547C10.5103 14.665 10.6049 14.8037 10.6609 14.9942C10.6662 15.0297 10.6728 15.0602 10.6658 15.0958C10.6465 15.1833 10.5787 15.2483 10.5037 15.2559H10.4402L8.92363 14.9424L8.93828 15.1026L8.93047 15.1407C8.92346 15.1704 8.91135 15.1912 8.89043 15.2061C8.86258 15.2209 8.84139 15.2204 8.81524 15.2129L8.61113 15.1631C7.74348 14.9295 7.0517 14.7967 6.15606 14.9874C5.53607 15.4061 4.74301 16.1078 4.21758 16.8809C3.98195 17.7357 3.77429 18.6052 3.59453 19.5001C3.41789 19.4496 3.34921 19.4632 3.16387 19.4053C3.32378 17.9507 3.61474 16.4362 4.01934 14.9346C4.03998 14.1363 3.92715 13.3055 3.7791 12.6866C3.25256 11.8996 2.66415 11.4899 1.87871 11.0225L1.69414 10.9122C1.6749 10.8972 1.66028 10.877 1.64629 10.8546C1.63931 10.8247 1.64699 10.7969 1.66094 10.7745L1.67461 10.7442L1.78984 10.6358L0.485157 9.75104C0.471172 9.73612 0.452098 9.72112 0.445118 9.70807C0.389194 9.64077 0.381665 9.54721 0.423634 9.46686C0.444571 9.44447 0.464067 9.42194 0.491993 9.40143C0.65634 9.30618 0.813922 9.26862 0.969532 9.26861C0.560309 8.86109 0.212243 8.26118 0.00761836 7.57525C-0.00630065 7.54546 0.00056894 7.51036 0.0144543 7.48053C0.0266994 7.45249 0.0548249 7.42258 0.0828137 7.4151C0.0949872 7.40766 0.115656 7.40728 0.136525 7.40729C0.778518 7.48019 1.40178 7.65575 1.96856 7.92682C2.02974 7.95483 2.0773 7.96227 2.10527 7.94732C2.11909 7.93239 2.12578 7.91162 2.12578 7.88189C2.13104 7.83893 2.1455 7.80144 2.18047 7.77154C2.20673 7.7437 2.24878 7.72857 2.28887 7.72857C2.30965 7.72865 2.32371 7.7358 2.34453 7.74322C2.97253 8.01242 3.47094 8.7216 3.60039 9.52545L3.73125 9.08014C3.75053 9.01476 3.81947 8.9773 3.88067 8.99225C3.90864 9.00721 3.94301 9.03561 3.95 9.06549C4.13368 9.51789 4.27746 9.99267 4.38067 10.46C4.5776 11.4286 4.51712 12.5474 4.43535 13.5245C5.02805 11.6658 5.7898 9.8626 6.6834 8.25396C6.64679 8.0852 6.63418 7.90435 6.64141 7.72076C6.43499 7.61234 6.381 7.32587 6.40899 7.03424C6.16934 7.20248 5.93623 7.31847 5.71758 7.36334C5.49192 7.41381 5.10321 7.37137 4.95977 7.15826C4.74786 6.83305 5.04871 6.2589 5.27422 5.90045C5.24042 5.88056 5.21022 5.86126 5.1834 5.84186C4.96039 5.89966 4.75449 5.92755 4.57012 5.90924C4.31122 5.88867 3.91406 5.70508 3.87383 5.46393C3.81817 5.16485 4.11928 4.74863 4.33086 4.52252C4.17351 4.43471 3.92797 4.21579 3.9207 4.01959C3.90567 3.74787 4.1754 3.47883 4.44707 3.28424C4.14649 2.58832 4.00703 1.89122 4.34649 1.44928C4.77664 1.41193 5.19286 1.53712 5.58281 1.836C5.583 0.821311 6.45133 1.15585 7.03203 1.53717C7.09326 1.13527 7.21033 0.748652 7.4832 0.543027C7.74353 0.668191 7.95511 0.836021 8.13164 1.0899Z"
                        fill="black"
                    />
                </svg>
            </div>
        )
    }

    const dotNeededLocal = (a?: string, b?: string) => !!(a && b)

    const formatDateForUrl = (dateString: string) => {
        const date = new Date(dateString)
        const year = String(date.getFullYear()).slice(-2) // 뒤 2자리만 (2025 -> 25)
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}${month}${day}`
    }

    const handleCopyLink = async () => {
        if (currentUser?.wedding_date && currentUser?.page_id) {
            const formattedDate = formatDateForUrl(currentUser.wedding_date)
            const invitationUrl = `https://mcard.roarc.kr/${formattedDate}/${currentUser.page_id}`

            try {
                await navigator.clipboard.writeText(invitationUrl)
                setShowCopyPopup(true)
                setTimeout(() => {
                    setShowCopyPopup(false)
                }, 2000)
            } catch (error) {
                console.error("클립보드 복사 실패:", error)
                // 폴백: 텍스트 영역을 사용한 복사
                const textArea = document.createElement("textarea")
                textArea.value = invitationUrl
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand("copy")
                document.body.removeChild(textArea)

                setShowCopyPopup(true)
                setTimeout(() => {
                    setShowCopyPopup(false)
                }, 2000)
            }
        } else {
            alert(
                "사용자 정보가 불완전합니다. wedding_date와 page_id가 필요합니다."
            )
        }
    }

    // 섹션별 저장 함수들
    const saveNameSection = async () => {
        await savePageSettings({
            groomName: pageSettings.groomName,
            groom_name_kr: pageSettings.groom_name_kr,
            groom_name_en: pageSettings.groom_name_en,
            brideName: pageSettings.brideName,
            bride_name_kr: pageSettings.bride_name_kr,
            bride_name_en: pageSettings.bride_name_en,
        })
    }

    const savePhotoSection = async () => {
        await savePageSettings({
            photo_section_image_path: pageSettings.photo_section_image_path,
            photo_section_image_url: pageSettings.photo_section_image_url,
            wedding_date: pageSettings.wedding_date,
            wedding_hour: pageSettings.wedding_hour,
            wedding_minute: pageSettings.wedding_minute,
            venue_name: pageSettings.venue_name,
            venue_address: pageSettings.venue_address,
            photo_section_overlay_position:
                pageSettings.photo_section_overlay_position,
            photo_section_overlay_color:
                pageSettings.photo_section_overlay_color,
            photo_section_locale: pageSettings.photo_section_locale,
            highlight_shape: pageSettings.highlight_shape,
            highlight_color: pageSettings.highlight_color,
            highlight_text_color: pageSettings.highlight_text_color,
        })
    }

    const saveInviteSection = async () => {
        await saveInviteData()
    }

    const saveTransportSection = async () => {
        await savePageSettings({
            venue_name: pageSettings.venue_name,
            venue_name_kr: pageSettings.venue_name_kr,
            venue_address: pageSettings.venue_address,
            venue_lat: pageSettings.venue_lat,
            venue_lng: pageSettings.venue_lng,
        })
    }

    const saveCalendarSection = async () => {
        await savePageSettings({
            wedding_date: pageSettings.wedding_date,
            wedding_hour: pageSettings.wedding_hour,
            wedding_minute: pageSettings.wedding_minute,
            highlight_shape: pageSettings.highlight_shape,
            highlight_color: pageSettings.highlight_color,
            highlight_text_color: pageSettings.highlight_text_color,
        })
    }

    const saveContactsSection = async () => {
        await handleSaveContactInline()
    }

    const saveAccountSection = async () => {
        await handleSaveContactInline()
    }

    const saveBgmSection = async () => {
        await savePageSettings({
            bgm_url: pageSettings.bgm_url,
            bgm_type: pageSettings.bgm_type,
            bgm_autoplay: pageSettings.bgm_autoplay,
        })
    }

    const saveRsvpSection = async () => {
        await savePageSettings({
            rsvp: pageSettings.rsvp,
        })
    }

    const saveCommentsSection = async () => {
        await savePageSettings({
            comments: pageSettings.comments,
        })
    }

    const saveKakaoShareSection = async () => {
        await savePageSettings({
            kko_img: pageSettings.kko_img,
            kko_title: pageSettings.kko_title,
            kko_date: pageSettings.kko_date,
        })
    }

    const saveInfoSection = async () => {
        // 안내사항 섹션은 별도 API를 사용하므로 InfoTab의 save 함수를 호출
        // 이 함수는 InfoTab 컴포넌트 내부에서 정의되어야 함
    }

    const saveTransportSectionInfo = async () => {
        // 교통안내 섹션은 별도 API를 사용하므로 TransportTab의 save 함수를 호출
        // 이 함수는 TransportTab 컴포넌트 내부에서 정의되어야 함
    }

    // 아코디언 토글 함수 (한 번에 하나의 섹션만 열림)
    const toggleSection = async (sectionName: string) => {
        // 현재 열려있는 섹션이 있다면 데이터를 저장
        if (currentOpenSection) {
            try {
                // 각 섹션별 저장 로직
                switch (currentOpenSection) {
                    case "name":
                        // 성함 섹션 저장 (페이지 설정 저장)
                        await savePageSettings(
                            {
                                groomName: pageSettings.groomName,
                                groom_name_en: pageSettings.groom_name_en,
                                brideName: pageSettings.brideName,
                                bride_name_en: pageSettings.bride_name_en,
                            },
                            { silent: false }
                        )
                        break
                    case "photo":
                        // 메인 사진 섹션 저장 (페이지 설정 저장)
                        await savePageSettings(
                            {
                                photo_section_image_path:
                                    pageSettings.photo_section_image_path,
                                photo_section_image_url:
                                    pageSettings.photo_section_image_url,
                                wedding_date: pageSettings.wedding_date,
                                wedding_hour: pageSettings.wedding_hour,
                                wedding_minute: pageSettings.wedding_minute,
                                venue_name: pageSettings.venue_name,
                                venue_address: pageSettings.venue_address,
                                photo_section_overlay_position:
                                    pageSettings.photo_section_overlay_position,
                                photo_section_overlay_color:
                                    pageSettings.photo_section_overlay_color,
                                photo_section_locale:
                                    pageSettings.photo_section_locale,
                                highlight_shape: pageSettings.highlight_shape,
                                highlight_color: pageSettings.highlight_color,
                                highlight_text_color:
                                    pageSettings.highlight_text_color,
                            },
                            { silent: false }
                        )
                        break
                    case "invite":
                        // 초대글 섹션 저장
                        await saveInviteData()
                        break
                    case "transport":
                        // 교통안내 섹션 저장 (페이지 설정 저장)
                        if (transportTabSaveRef.current) {
                            await transportTabSaveRef.current()
                            await savePageSettings(
                                {
                                    venue_name: pageSettings.venue_name,
                                    venue_name_kr: pageSettings.venue_name_kr,
                                    transport_location_name:
                                        pageSettings.transport_location_name,
                                    venue_address: pageSettings.venue_address,
                                },
                                { silent: true }
                            )
                        } else {
                            await savePageSettings(
                                {
                                    venue_name: pageSettings.venue_name,
                                    venue_name_kr: pageSettings.venue_name_kr,
                                    transport_location_name:
                                        pageSettings.transport_location_name,
                                    venue_address: pageSettings.venue_address,
                                },
                                { silent: false }
                            )
                        }
                        break
                    case "calendar":
                        // 캘린더 섹션 저장 (페이지 설정 저장)
                        await savePageSettings(
                            {
                                wedding_date: pageSettings.wedding_date,
                                wedding_hour: pageSettings.wedding_hour,
                                wedding_minute: pageSettings.wedding_minute,
                                highlight_shape: pageSettings.highlight_shape,
                                highlight_color: pageSettings.highlight_color,
                                highlight_text_color:
                                    pageSettings.highlight_text_color,
                            },
                            { silent: false }
                        )
                        break
                    case "contacts":
                        // 연락처 섹션 저장
                        await handleSaveContactInline()
                        break
                    case "account":
                        // 계좌안내 섹션 저장 (전체 연락처 정보 저장)
                        await handleSaveContactInline()
                        break
                    case "info":
                        // 안내 사항 섹션 저장
                        await savePageSettings(
                            {
                                info: pageSettings.info,
                            },
                            { silent: false }
                        )
                        break
                    case "bgm":
                        // 배경음악 섹션 저장
                        await savePageSettings(
                            {
                                bgm_url: pageSettings.bgm_url,
                                bgm_type: pageSettings.bgm_type,
                                bgm_autoplay: pageSettings.bgm_autoplay,
                            },
                            { silent: false }
                        )
                        break
                    case "rsvp":
                        // RSVP 섹션 저장
                        await savePageSettings(
                            {
                                rsvp: pageSettings.rsvp,
                            },
                            { silent: false }
                        )
                        break
                    case "comments":
                        // 방명록 섹션 저장
                        await savePageSettings(
                            {
                                comments: pageSettings.comments,
                            },
                            { silent: false }
                        )
                        break
                    case "kakaoShare":
                        // 카카오톡 공유 섹션 저장
                        await savePageSettings(
                            {
                                kko_img: pageSettings.kko_img,
                                kko_title: pageSettings.kko_title,
                                kko_date: pageSettings.kko_date,
                            },
                            { silent: false }
                        )
                        break
                }
            } catch (error) {
                console.error(`섹션 ${currentOpenSection} 저장 실패:`, error)
                // 저장 실패 시에도 섹션을 변경 (변경사항이 없으면 조용히 넘어감)
                // alert 제거 - savePageSettings에서 이미 변경사항 없으면 조용히 넘어가도록 처리됨
            }
        }

        // 새 섹션으로 전환
        setCurrentOpenSection(
            currentOpenSection === sectionName ? null : sectionName
        )

        // 초대글 섹션을 최초로 열 때 page_settings에서 기본값 설정
        if (sectionName === "invite" && currentOpenSection !== "invite") {
            // inviteData에 값이 없고 page_settings에 값이 있으면 초기화
            if (!inviteData.groomName && pageSettings.groom_name_kr) {
                setInviteData((prev) => ({
                    ...prev,
                    groomName: pageSettings.groom_name_kr,
                }))
            }
            if (!inviteData.brideName && pageSettings.bride_name_kr) {
                setInviteData((prev) => ({
                    ...prev,
                    brideName: pageSettings.bride_name_kr,
                }))
            }
        }
    }

    const initialContactData = {
        page_id: "",
        groom_name: "",
        groom_phone: "",
        groom_account: "",
        groom_bank: "",
        groom_bank_name: "",
        groom_father_name: "",
        groom_father_phone: "",
        groom_father_account: "",
        groom_father_bank: "",
        groom_father_bank_name: "",
        groom_mother_name: "",
        groom_mother_phone: "",
        groom_mother_account: "",
        groom_mother_bank: "",
        groom_mother_bank_name: "",
        bride_name: "",
        bride_phone: "",
        bride_account: "",
        bride_bank: "",
        bride_bank_name: "",
        bride_father_name: "",
        bride_father_phone: "",
        bride_father_account: "",
        bride_father_bank: "",
        bride_father_bank_name: "",
        bride_mother_name: "",
        bride_mother_phone: "",
        bride_mother_account: "",
        bride_mother_bank: "",
        bride_mother_bank_name: "",
    }

    // 임시 테스트 함수 (디버깅용)
    // 이미지 순서 테스트용 함수 제거됨

    // 이미지 순서 변경 함수는 위쪽으로 이동됨

    // 서버에 순서 변경사항 저장
    const saveImageOrder = async () => {
        // 갤러리 액션바에서 사용할 함수 참조 업데이트
        currentSaveImageOrder = saveImageOrder
        if (!hasUnsavedChanges) {
            alert("변경사항이 없습니다.")
            return
        }

        try {
            setIsSavingOrder(true)

            // 순서 변경 API 호출
            const requestBody = {
                action: "updateAllOrders",
                pageId: currentPageId,
                imageOrders: existingImages
                    .map((img, idx) => ({
                        id: img.id,
                        order: idx + 1,
                    }))
                    .filter((item) => item.id), // id가 있는 것만 필터링
            }

            // 안전 검사
            if (requestBody.imageOrders.length === 0) {
                throw new Error("유효한 이미지 ID가 없습니다")
            }

            console.log("순서 저장 API 요청:", requestBody)

            const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify(requestBody),
            })

            console.log("API 응답 상태:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("HTTP 오류:", response.status, errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()
            console.log("순서 저장 API 응답:", result)

            if (!result.success) {
                throw new Error(result.error || "순서 저장에 실패했습니다")
            }

            // 성공 시 상태 초기화
            setHasUnsavedChanges(false)
            setOriginalOrder([...existingImages])

            alert("이미지 순서가 성공적으로 저장되었습니다!")
        } catch (err) {
            console.error("순서 저장 실패:", err)
            alert(
                "순서 저장에 실패했습니다: " +
                    (err instanceof Error ? err.message : "알 수 없는 오류")
            )
        } finally {
            setIsSavingOrder(false)
        }
    }

    // 변경사항 취소 (원래 순서로 복원)

    const moveImageUp = (index: number) => {
        if (index > 0) handleReorderImages(index, index - 1)
    }

    const moveImageDown = (index: number) => {
        if (index < existingImages.length - 1)
            handleReorderImages(index, index + 1)
    }

    // moveImageToPosition 함수는 이제 필요 없음 - 직접 로직 사용
    // 특정 위치의 이미지 교체 함수
    const handleReplaceImage = async (index: number, newFile: File) => {
        console.log(`이미지 교체 시작: index=${index}, file=${newFile.name}`)

        if (!currentPageId) {
            console.error("페이지 ID가 없음")
            alert("페이지 ID를 확인할 수 없습니다. 로그인 상태를 확인해주세요.")
            return
        }

        const token = getAuthToken()
        if (!token) {
            console.error("인증 토큰이 없음")
            alert(
                "로그인이 필요합니다. 우측 상단에서 로그인 후 다시 시도해주세요."
            )
            return
        }

        // 기존 이미지 정보 확인
        const oldImage = existingImages[index]
        if (!oldImage) {
            console.error(`기존 이미지를 찾을 수 없음: index=${index}`)
            alert("교체할 사진을 찾을 수 없습니다.")
            return
        }

        try {
            console.log("기존 이미지 정보:", oldImage)

            // 1. 파일 유효성 검사
            try {
                validateImageFileSize(newFile)
                console.log("파일 유효성 검사 통과")
            } catch (validationError) {
                console.error("파일 유효성 검사 실패:", validationError)
                throw validationError
            }

            // 2. 이미지 압축 (필요한 경우)
            let processedFile = newFile
            console.log(
                `파일 크기: ${newFile.size / 1024}KB, 최대 크기: ${maxSizeKB}KB`
            )

            if (newFile.size / 1024 > maxSizeKB) {
                console.log("이미지 압축 시작...")
                const compressionResult = await progressiveCompress(
                    newFile,
                    maxSizeKB,
                    (progress) => {
                        console.log(`압축 진행률: ${progress}%`)
                    }
                )
                processedFile = compressionResult.compressedFile
                console.log(`압축 완료: ${processedFile.size / 1024}KB`)
            }

            // 3. 이미지 업로드 (R2 사용)
            const fileName = processedFile.name || oldImage.filename
            let saved: any = null

            console.log("이미지 업로드 시작... (R2)")
            try {
                // R2 업로드 시도
                console.log("[R2] REPLACE_START", {
                    name: processedFile.name,
                    type: processedFile.type,
                    size: processedFile.size,
                })
                const key = makeGalleryKey(currentPageId, processedFile)
                console.log("[R2] PRESIGN_REQ", { key })

                const uploadRes = await uploadToR2(
                    processedFile,
                    currentPageId,
                    key
                )
                console.log("[R2] PUBLIC_URL", uploadRes.publicUrl)
                console.log("R2 업로드 완료:", {
                    key: uploadRes.key,
                    publicUrl: uploadRes.publicUrl,
                })

                // 메타데이터 저장 (R2 public URL을 path로 저장)
                saved = await saveImageMeta(
                    currentPageId,
                    processedFile.name,
                    oldImage.display_order ?? index + 1,
                    uploadRes.publicUrl,
                    processedFile.size
                )
                console.log("이미지 메타데이터 저장 완료:", saved)
            } catch (e) {
                console.error("R2 업로드 실패:", e)
                throw new Error(
                    `이미지 업로드 실패: ${e instanceof Error ? e.message : String(e)}`
                )
            }

            // 4. 기존 이미지 삭제 (스토리지 + DB)
            console.log("기존 이미지 삭제 시작...")
            try {
                if (oldImage?.id) {
                    await deleteImage(oldImage.id, oldImage.filename)
                    console.log("기존 이미지 삭제 완료")
                }
            } catch (delErr) {
                console.warn("기존 이미지 삭제 중 경고 (계속 진행):", delErr)
            }

            // 5. 로컬 상태 업데이트 (신규 레코드로 교체)
            console.log("로컬 상태 업데이트 시작...")
            const updatedImages = [...existingImages]
            updatedImages[index] = {
                id: saved.id || oldImage.id,
                filename:
                    saved.filename || saved.storage_path || saved.path || "",
                original_name: saved.original_name || processedFile.name,
                public_url: saved.public_url, // Use R2 public URL from saved metadata
                display_order: oldImage.display_order ?? index + 1,
                page_id: currentPageId as any,
                mime_type: saved.mime_type || processedFile.type,
                file_size: saved.file_size || processedFile.size,
                created_at: saved.created_at || new Date().toISOString(),
            } as any

            setExistingImages(updatedImages)
            console.log("로컬 상태 업데이트 완료")

            // 성공 알림
            alert(`이미지가 성공적으로 교체되었어요.: ${processedFile.name}`)
            console.log(
                `이미지 교체 완료: ${oldImage.original_name} -> ${processedFile.name}`
            )
        } catch (error) {
            console.error("이미지 교체 실패:", error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "알 수 없는 오류가 발생했습니다."
            alert(
                `이미지가 교체되지 않았습니다. 다시 시도해주세요.: ${errorMessage}`
            )
        }
    }

    // handleReplaceImage 함수는 UiPhotoTile의 onReplace props를 통해 직접 전달되므로 window 객체 설정 불필요

    // 선택된 이미지들 상태 추가
    const [selectedImages, setSelectedImages] = useState<Set<string>>(
        new Set<string>()
    )

    // 순서 변경 관련 상태
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isSavingOrder, setIsSavingOrder] = useState(false)
    const [originalOrder, setOriginalOrder] = useState<ImageInfo[]>([])

    // 이미지 순서 변경 함수
    const handleReorderImages = useCallback(
        reorderImages(existingImages, setExistingImages, setHasUnsavedChanges),
        [existingImages, setHasUnsavedChanges]
    )

    // moveImageToPosition 함수 - AdminOld.tsx 방식으로 window 객체에 저장
    const moveImageToPosition = useCallback(
        (fromIndex: number, toPosition: number) => {
            if (
                toPosition >= 1 &&
                toPosition <= existingImages.length &&
                toPosition !== fromIndex + 1
            ) {
                handleReorderImages(fromIndex, toPosition - 1)
            }
        },
        [existingImages.length, handleReorderImages]
    )

    // window 객체에 함수 저장 (클라이언트 사이드에서만)
    useEffect(() => {
        if (typeof window !== "undefined") {
            ;(window as any).moveImageToPosition = moveImageToPosition
        }
    }, [moveImageToPosition])

    // 갤러리 액션바 컴포넌트
    const GallerySaveActionBar = ({
        hasUnsavedChanges: hasChanges,
        onSave: onSaveAction,
        isSaving: isCurrentlySaving,
    }: {
        hasUnsavedChanges: boolean
        onSave: () => Promise<void>
        isSaving: boolean
    }) => {
        if (!hasChanges) return null

        return (
            <div
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "white",
                    borderTop: `1px solid ${theme.color.border}`,
                    padding: "16px",
                    paddingBottom:
                        "calc(env(safe-area-inset-bottom, 0px) + 16px)",
                    zIndex: 1000,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <button
                    onClick={onSaveAction}
                    disabled={isCurrentlySaving}
                    style={{
                        width: "100%",
                        maxWidth: "400px",
                        height: "48px",
                        backgroundColor: isCurrentlySaving
                            ? "#b3b3b3"
                            : "#000000",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        ...theme.font.bodyBold,
                        cursor: isCurrentlySaving ? "not-allowed" : "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        opacity: isCurrentlySaving ? 0.6 : 1,
                    }}
                >
                    {isCurrentlySaving ? "저장 중..." : "저장하기"}
                </button>
            </div>
        )
    }

    // 갤러리 액션바를 위한 상태 동기화
    useEffect(() => {
        currentHasUnsavedChanges = hasUnsavedChanges
        currentIsSavingOrder = isSavingOrder
        // wrapper 컴포넌트에 상태 전달 (항상 최신 saveImageOrder 전달)
        if (updateSaveState) {
            updateSaveState(
                currentHasUnsavedChanges,
                currentIsSavingOrder,
                saveImageOrder
            )
        }
    }, [hasUnsavedChanges, isSavingOrder, updateSaveState, existingImages])

    const handleDeleteImage = async (imageId: string, fileName: string) => {
        if (!confirm("정말로 이 이미지를 삭제하시겠습니까?")) return

        try {
            // 낙관적 업데이트 - 즉시 UI에서 제거
            const imageToDelete = existingImages.find(
                (img) => img.id === imageId
            )
            setExistingImages((prev) =>
                prev.filter((img) => img.id !== imageId)
            )

            const result = await deleteImage(imageId, fileName)

            if (!result.success) {
                // 실패 시 원래 상태로 복원
                if (imageToDelete) {
                    setExistingImages((prev) => [...prev, imageToDelete])
                }
                alert("이미지 삭제에 실패했습니다: " + result.error)
            } else {
                // 성공 시 페이지 목록만 업데이트 (이미지 목록은 이미 업데이트됨)
                loadAllPages()
            }
        } catch (err) {
            console.error("이미지 삭제 실패:", err)
            // 실패 시 원래 상태로 복원
            const imageToDelete = existingImages.find(
                (img) => img.id === imageId
            )
            if (imageToDelete) {
                setExistingImages((prev) => [...prev, imageToDelete])
            }
            alert(
                "이미지 삭제에 실패했습니다: " +
                    (err instanceof Error ? err.message : "알 수 없는 오류")
            )
        }
    }

    // 여러 이미지 삭제 함수
    const handleDeleteMultipleImages = async () => {
        if (selectedImages.size === 0) {
            alert("삭제할 이미지를 선택해주세요.")
            return
        }

        const confirmMessage =
            selectedImages.size === 1
                ? "정말로 이 이미지를 삭제하시겠습니까?"
                : `정말로 선택된 ${selectedImages.size}개의 이미지를 삭제하시겠습니까?`

        if (!confirm(confirmMessage)) return

        try {
            // 선택된 이미지들 찾기
            const imagesToDelete = existingImages.filter((img) =>
                selectedImages.has(img.id)
            )

            // 낙관적 업데이트 - 즉시 UI에서 제거
            setExistingImages((prev) =>
                prev.filter((img) => !selectedImages.has(img.id))
            )

            // 모든 이미지 삭제 요청
            const deletePromises = imagesToDelete.map((img) =>
                deleteImage(img.id, img.filename)
            )

            const results = await Promise.all(deletePromises)
            const allSuccess = results.every((result) => result.success)

            if (allSuccess) {
                // 성공 시 페이지 목록만 업데이트
                loadAllPages()
                setSelectedImages(new Set()) // 선택 초기화
            } else {
                // 실패 시 원래 상태로 복원
                setExistingImages((prev) => [...prev, ...imagesToDelete])
                alert("일부 이미지 삭제에 실패했습니다.")
            }
        } catch (err) {
            console.error("다중 이미지 삭제 실패:", err)
            // 실패 시 원래 상태로 복원
            const imagesToDelete = existingImages.filter((img) =>
                selectedImages.has(img.id)
            )
            setExistingImages((prev) => [...prev, ...imagesToDelete])
            alert(
                "이미지 삭제에 실패했습니다: " +
                    (err instanceof Error ? err.message : "알 수 없는 오류")
            )
        }
    }

    // 전체 이미지 삭제 핸들러
    const handleDeleteAllImages = async () => {
        if (!currentPageId) return

        if (existingImages.length === 0) {
            alert("삭제할 이미지가 없습니다.")
            return
        }

        if (!confirm("정말 모든 이미지를 삭제하시겠습니까?")) return

        try {
            setUploading(true) // 로딩 상태 표시

            // 낙관적 업데이트 - 즉시 UI에서 제거
            const imagesToDelete = [...existingImages]
            setExistingImages([])

            // 모든 이미지 삭제 요청
            const deletePromises = imagesToDelete.map((img) =>
                deleteImage(img.id, img.filename)
            )

            const results = await Promise.all(deletePromises)
            const allSuccess = results.every((result) => result.success)

            if (allSuccess) {
                // 성공 시 페이지 목록만 업데이트
                loadAllPages()
                alert("모든 이미지가 삭제되었습니다.")
            } else {
                // 실패 시 원래 상태로 복원
                setExistingImages(imagesToDelete)
                alert("일부 이미지 삭제에 실패했습니다.")
            }
        } catch (err) {
            console.error("전체 이미지 삭제 실패:", err)
            // 실패 시 원래 상태로 복원
            alert(
                "이미지 삭제에 실패했습니다: " +
                    (err instanceof Error ? err.message : "알 수 없는 오류")
            )
        } finally {
            setUploading(false) // 로딩 상태 해제
        }
    }

    // 이미지 선택 토글
    const toggleImageSelection = (imageId: string) => {
        setSelectedImages((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(imageId)) {
                newSet.delete(imageId)
            } else {
                newSet.add(imageId)
            }
            return newSet
        })
    }

    const resetAdminSessionState = () => {
        setActiveTab("basic")
        setCurrentOpenSection("name")
        setCurrentPageId("")
        setAssignedPageId(null)
        setExistingImages([])
        setOriginalOrder([])
        setSelectedImages(() => new Set<string>())
        setHasUnsavedChanges(false)
        setIsSavingOrder(false)
        setImagesVersion(0)
        setUploading(false)
        setProgress(0)
        setUploadSuccess(0)
        setInviteData(createInitialInviteData())
        setInviteSaving(false)
        setContactList([])
        setSelectedContact(null)
        setIsEditingContact(false)
        setLoading(false)
        setPageSettings(createInitialPageSettings())
        setSettingsLoading(false)
        setHasLoadedSettings(false)
        setCompressProgress(null)
        setPhotoSectionPreviewUrl((prev) => {
            if (prev) {
                try {
                    URL.revokeObjectURL(prev)
                } catch {
                    // ignore revoke failures
                }
            }
            return null
        })
        setPhotoSectionImageVersion(0)
        setSelectedBgmId(null)
        setPlayingBgmId(null)
        setKakaoUploadLoading(false)
        setLoginForm({ username: "", password: "" })
        setLoginError("")
    }

    // 세션 확인
    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const token = localStorage.getItem("admin_session")
            if (token) {
                const tokenData = validateSessionToken(token)
                if (tokenData) {
                    propSetIsAuthenticated(true)
                    setCurrentUser({
                        username: tokenData.username,
                        page_id: tokenData.page_id,
                        wedding_date: tokenData.wedding_date,
                    })
                    // 저장된 사전 할당 페이지 ID 적용 (관리자가 미리 설정한 경우)
                    const storedAssigned =
                        localStorage.getItem("assigned_page_id")
                    const normalizedStored =
                        storedAssigned && storedAssigned.trim().length > 0
                            ? storedAssigned
                            : null
                    if (normalizedStored) {
                        setAssignedPageId(normalizedStored)
                        setCurrentPageId(normalizedStored)
                    }
                    loadAllPages()
                    loadContactList(normalizedStored ?? undefined)
                    loadPageSettings(normalizedStored ?? undefined)
                } else {
                    localStorage.removeItem("admin_session")
                }
            }
        } catch (error) {
            console.warn("localStorage 접근 실패:", error)
        }
    }, [])
    // 로그인/로그아웃
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoggingIn(true)
        setLoginError("")

        const result = await authenticateAdmin(
            loginForm.username,
            loginForm.password
        )
        if (result.success) {
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem(
                        "admin_session",
                        generateSessionToken(result.user)
                    )
                } catch (error) {
                    console.warn("localStorage 저장 실패:", error)
                }
            }
            resetAdminSessionState()
            propSetIsAuthenticated(true)
            setCurrentUser(result.user)
            // 로그인 사용자에 page_id가 할당되어 있으면 강제 적용 (비관리자용)
            const assigned =
                (result.user && (result.user as any).page_id) || null
            const nextPageId =
                assigned &&
                typeof assigned === "string" &&
                assigned.trim().length > 0
                    ? assigned
                    : null
            if (nextPageId) {
                setAssignedPageId(nextPageId)
                setCurrentPageId(nextPageId)
                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem("assigned_page_id", nextPageId)
                    } catch (error) {
                        console.warn("localStorage 저장 실패:", error)
                    }
                }
            } else {
                setAssignedPageId(null)
                if (typeof window !== "undefined") {
                    try {
                        localStorage.removeItem("assigned_page_id")
                    } catch (error) {
                        console.warn("localStorage 삭제 실패:", error)
                    }
                }
            }
            setLoginForm({ username: "", password: "" })
            loadAllPages()
            loadContactList(nextPageId ?? undefined)
            loadPageSettings(nextPageId ?? undefined)
        } else {
            setLoginError(result.error)
        }
        setIsLoggingIn(false)
    }

    const handleLogout = () => {
        removeAuthToken()
        resetAdminSessionState()
        propSetIsAuthenticated(false)
        setCurrentUser(null)
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem("assigned_page_id")
            } catch (error) {
                console.warn("localStorage 삭제 실패:", error)
            }
        }
    }

    // 데이터 로드
    // 페이지 리스트는 더 이상 사용하지 않음
    const loadAllPages = async () => {
        return
    }

    const loadExistingImages = async () => {
        if (currentPageId) {
            try {
                const images = await getImagesByPageId(currentPageId)
                // 캐시 버스팅 제거: API가 최신 목록을 반환하며, 변경 시 파일 경로가 달라짐
                setExistingImages(images)
                setOriginalOrder([...images]) // 원본 순서 저장
            } catch (err) {
                console.error("이미지 목록 로드 실패:", err)
            }
        }
    }

    const loadContactList = async (pageId?: string | null) => {
        const targetPageId = pageId ?? currentPageId
        if (!targetPageId) {
            setContactList([])
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const contacts = await getAllContacts(targetPageId)
            setContactList(contacts)
        } catch (err) {
            console.error("연락처 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const loadPageSettings = async (pageId?: string | null) => {
        const targetPageId = pageId ?? currentPageId
        if (!targetPageId) return

        setSettingsLoading(true)
        try {
            const response = await fetch(
                `${PROXY_BASE_URL}/api/page-settings?pageId=${targetPageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            )

            const result = await response.json()
            if (result.success) {
                setPageSettings(result.data)
                setOriginalPageSettings(result.data)
                setHasLoadedSettings(true)

                // 커스텀 BGM이 업로드되어 있다면 파일명 표시
                if (result.data.bgm_type === "custom" && result.data.bgm_url) {
                    // URL에서 파일명 추출
                    try {
                        const url = new URL(result.data.bgm_url)
                        const pathParts = url.pathname.split("/")
                        const fileName = pathParts[pathParts.length - 1]
                        // 타임스탬프와 페이지ID 제거하여 원본 파일명 추출
                        const originalFileName = fileName
                            .replace(/^\d+-/, "")
                            .replace(/^[^-]+-/, "")
                        setUploadedFileName(originalFileName)
                    } catch (error) {
                        console.warn("파일명 추출 실패:", error)
                    }
                }
            }
        } catch (err) {
            console.error("페이지 설정 로드 실패:", err)
        } finally {
            setSettingsLoading(false)
        }
    }

    const allowedSettingKeys = [
        "groomName",
        "groom_name_kr",
        "groom_name_en",
        "last_groom_name_kr",
        "last_groom_name_en",
        "brideName",
        "bride_name_kr",
        "bride_name_en",
        "last_bride_name_kr",
        "last_bride_name_en",
        "wedding_date",
        "wedding_hour",
        "wedding_minute",
        "venue_name",
        "transport_location_name",
        "venue_address",
        "photo_section_image_url",
        "photo_section_image_path",
        "photo_section_location",
        "photo_section_overlay_position",
        "photo_section_overlay_color",
        "photo_section_locale",
        "highlight_shape",
        "highlight_color",
        "highlight_text_color",
        "rsvp",
        "comments",
        "kko_img",
        "kko_title",
        "kko_date",
        "gallery_type",
        "bgm_url",
        "bgm_type",
        "bgm_autoplay",
        "bgm_vol",
    ] as const

    type AllowedSettingKey = (typeof allowedSettingKeys)[number]

    function sanitizeSettingsForSave(input: any): Record<string, any> {
        const out: Record<string, any> = {}
        // 입력된 모든 키를 허용하되, allowedSettingKeys에 있는 키만 우선적으로 처리
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                out[key] = input[key]
            }
        }
        if (Object.prototype.hasOwnProperty.call(out, "wedding_date")) {
            if (out["wedding_date"] === "") {
                out["wedding_date"] = null
            }
        }
        return out
    }

    const savePageSettings = async (
        overrideSettings?: any,
        options?: { silent?: boolean }
    ) => {
        if (!currentPageId) return

        // 초기 로드 전에는 부분 저장 시 해당 키만 저장하여 공백 병합 방지
        const shouldPartialOnly = !!overrideSettings && !hasLoadedSettings
        const base = shouldPartialOnly
            ? overrideSettings
            : overrideSettings
              ? { ...pageSettings, ...overrideSettings }
              : pageSettings
        const settingsToSave = sanitizeSettingsForSave(base)

        // overrideSettings가 있으면 강제 저장 (사용자가 명시적으로 저장 버튼을 눌렀을 때)
        // overrideSettings가 없고 변경사항이 없으면 조용히 넘어감
        if (!overrideSettings && Object.keys(settingsToSave).length === 0) {
            console.log("No changes to save, skipping")
            return
        }

        setSettingsLoading(true)
        try {
            // 자동 저장 토스트 노출 (silent가 아닌 경우에만)
            if (!options?.silent) {
                broadcastAutoSaveToast()
            }
            console.log("Saving page settings:", {
                currentPageId,
                settings: settingsToSave,
            })

            const response = await fetch(
                `${PROXY_BASE_URL}/api/page-settings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        pageId: currentPageId,
                        settings: settingsToSave,
                    }),
                }
            )

            console.log("Save response status:", response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Save response error:", errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()
            console.log("Save response result:", result)

            if (result.success) {
                // 저장 성공 - 재로드하지 않음 (사용자 입력 유지)
                return result
            } else {
                throw new Error(result.error || "설정 저장 실패")
            }
        } catch (err) {
            console.error("Save page settings error:", err)
            const message = err instanceof Error ? err.message : String(err)
            console.error(`설정 저장 중 오류가 발생했습니다: ${message}`)
            throw err
        } finally {
            setSettingsLoading(false)
        }
    }

    // 포토섹션 메인 이미지 업로드
    const handlePhotoSectionImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file || !currentPageId) return

        setSettingsLoading(true)
        try {
            // 로컬 미리보기 즉시 반영 (갤러리 방식과 동일)
            try {
                const nextUrl = URL.createObjectURL(file)
                if (photoSectionPreviewUrl)
                    URL.revokeObjectURL(photoSectionPreviewUrl)
                setPhotoSectionPreviewUrl(nextUrl)
            } catch {}

            // 0. 기존 이미지가 있다면 먼저 삭제
            const existingImagePath = pageSettings.photo_section_image_path
            const existingImageUrl = pageSettings.photo_section_image_url

            if (existingImagePath || existingImageUrl) {
                try {
                    // 경로에서 파일명 추출 (path 방식이 우선)
                    let oldFileName = existingImagePath
                    if (!oldFileName && existingImageUrl) {
                        // URL -> 스토리지 경로 추출
                        const marker = "/storage/v1/object/public/images/"
                        const idx = existingImageUrl.indexOf(marker)
                        if (idx !== -1) {
                            oldFileName = existingImageUrl.substring(
                                idx + marker.length
                            )
                        } else {
                            // fallback: 마지막 세그먼트만 있는 경우는 삭제 정확도가 떨어질 수 있음
                            oldFileName = existingImageUrl
                                .split("/")
                                .slice(-2)
                                .join("/")
                        }
                    }

                    if (oldFileName) {
                        console.log(
                            `기존 포토섹션 이미지 삭제 시도: ${oldFileName}`
                        )

                        // Storage에서 기존 파일 삭제
                        const response = await fetch(
                            `${PROXY_BASE_URL}/api/images`,
                            {
                                method: "DELETE",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${getAuthToken()}`,
                                },
                                body: JSON.stringify({
                                    imageId: null, // 포토섹션은 images 테이블에 저장되지 않음
                                    fileName: oldFileName,
                                    storageOnly: true, // 스토리지에서만 삭제
                                }),
                            }
                        )

                        if (response.ok) {
                            console.log("기존 포토섹션 이미지 삭제 성공")
                        } else {
                            const errorText = await response.text()
                            console.warn(
                                "기존 포토섹션 이미지 삭제 실패:",
                                errorText
                            )
                        }
                    }
                } catch (deleteError) {
                    console.warn(
                        "기존 포토섹션 이미지 삭제 중 오류:",
                        deleteError
                    )
                }
            }

            // 1. 파일 크기 검증
            validateImageFileSize(file)

            // 2. 이미지 압축 (점진적)
            const compressionResult = await progressiveCompress(
                file,
                1024,
                (p) => setCompressProgress(p)
            )
            const finalFile: File =
                compressionResult && compressionResult.compressedFile
                    ? compressionResult.compressedFile
                    : file
            setCompressProgress(null)

            // 3~5. R2 업로드
            let imageUrl: string = ""
            let imagePath: string = ""
            try {
                const { publicUrl, key } = await uploadToR2(
                    finalFile,
                    currentPageId
                )
                imageUrl = publicUrl
                imagePath = key
            } catch (e) {
                console.error("포토섹션 R2 업로드 실패:", e)
                throw e
            }

            // 낙관적 반영: 업로드 완료 즉시 UI에 반영 (갤러리 방식과 동일)
            setPageSettings((prev: any) => ({
                ...prev,
                photo_section_image_path: imagePath,
                photo_section_image_url: imageUrl,
            }))

            // 로컬 미리보기 정리 (서버 이미지로 전환)
            if (photoSectionPreviewUrl) {
                URL.revokeObjectURL(photoSectionPreviewUrl)
                setPhotoSectionPreviewUrl(null)
            }

            // 버전 업데이트로 리렌더링 강제
            setPhotoSectionImageVersion((v) => v + 1)

            // 즉시 서버 저장: R2 public URL을 컬럼에 기록
            await savePageSettings({
                photo_section_image_path: imagePath,
                photo_section_image_url: imageUrl,
            })

            console.log("메인 사진이 업로드되었습니다.")
        } catch (error: unknown) {
            console.error("Photo section image upload error:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            console.error("메인 사진 업로드 중 오류가 발생했습니다: " + message)
        } finally {
            setSettingsLoading(false)
            // 파일 입력 초기화
            event.target.value = ""
        }
    }

    useEffect(() => {
        if (currentPageId) loadExistingImages()
    }, [currentPageId])
    // 이미지 업로드 (presigned URL 방식 + 압축)
    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!currentPageId) return alert("페이지 ID를 설정하세요")

        const files = Array.from(event.target.files ?? [])
        setUploading(true)
        setProgress(0)
        setUploadSuccess(0)

        try {
            let completed = 0
            const totalFiles = files.length

            // 각 파일 개별 처리 (압축 + 업로드)
            for (let i = 0; i < totalFiles; i++) {
                const file = files[i]

                try {
                    // 1. 파일 유효성 검사
                    validateImageFileSize(file)

                    // 2. 이미지 압축 (1024KB 이상인 경우)
                    let processedFile = file
                    if (file.size / 1024 > maxSizeKB) {
                        console.log(
                            `압축 시작: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`
                        )

                        const compressionResult = await progressiveCompress(
                            file,
                            maxSizeKB,
                            (fileProgress) => {
                                // 전체 진행률 계산 (압축 50% + 업로드 50%)
                                const totalProgress =
                                    (i / totalFiles) * 100 +
                                    (fileProgress * 0.5) / totalFiles
                                setProgress(Math.round(totalProgress))
                            }
                        )

                        processedFile = compressionResult.compressedFile
                        console.log(
                            `압축 완료: ${file.name} (${(processedFile.size / 1024).toFixed(2)}KB)`
                        )
                    }

                    // 3~5. R2 업로드
                    let saved: any = null
                    let publicUrl: string = ""
                    let key: string = ""

                    try {
                        // R2에 업로드
                        console.log("[R2] GALLERY_UPLOAD_START", {
                            name: processedFile.name,
                            type: processedFile.type,
                            size: processedFile.size,
                        })
                        const galleryKey = makeGalleryKey(
                            currentPageId,
                            processedFile
                        )
                        console.log("[R2] GALLERY_PRESIGN_REQ", {
                            key: galleryKey,
                        })
                        const uploadResult = await uploadToR2(
                            processedFile,
                            currentPageId,
                            galleryKey
                        )
                        publicUrl = uploadResult.publicUrl
                        key = uploadResult.key
                        console.log("[R2] PUBLIC_URL", publicUrl)
                        console.log(
                            `R2 업로드 성공: ${processedFile.name}, publicUrl: ${publicUrl}`
                        )

                        // 메타데이터 저장 (publicUrl을 path 대신 사용)
                        console.log(
                            `메타데이터 저장 시작: ${processedFile.name}`
                        )
                        saved = await saveImageMeta(
                            currentPageId,
                            processedFile.name,
                            existingImages.length + i + 1,
                            publicUrl, // R2 public URL을 path로 사용
                            processedFile.size
                        )
                        console.log(
                            `메타데이터 저장 성공: ${processedFile.name}, saved:`,
                            saved
                        )
                    } catch (e) {
                        console.error(
                            "업로드 또는 메타데이터 저장 실패:",
                            processedFile.name,
                            e
                        )
                        throw e // 업로드 또는 메타데이터 저장 실패 시 전체 업로드 중단
                    }

                    completed++
                    setProgress(Math.round((completed / totalFiles) * 100))

                    // 낙관적 반영: 방금 업로드한 이미지 그리드에 즉시 추가 (R2 URL 사용)
                    const newImg: ImageInfo = {
                        id: saved.id || saved?.id || `${Date.now()}_${i}`,
                        filename: saved.filename || key || processedFile.name,
                        public_url: publicUrl, // R2 public URL 직접 사용
                        original_name: saved.original_name || file.name,
                        display_order: existingImages.length + i + 1,
                    }
                    console.log("[GALLERY] 새 이미지 추가:", newImg)
                    setExistingImages((prev) => {
                        console.log("[GALLERY] 이전 이미지 수:", prev.length)
                        const updated = [...prev, newImg]
                        console.log(
                            "[GALLERY] 업데이트 후 이미지 수:",
                            updated.length
                        )
                        return updated
                    })
                    setImagesVersion((v) => v + 1)
                } catch (error) {
                    console.error(`파일 ${file.name} 처리 실패:`, error)
                    completed++
                    setProgress(Math.round((completed / totalFiles) * 100))
                    // 개별 파일 실패시에도 다른 파일은 계속 처리
                }
            }

            setUploading(false)
            setProgress(100)
            setUploadSuccess(files.length)
            // 최종 동기화 (짧은 지연 후 최신 정렬/데이터 일치)
            setTimeout(() => {
                loadExistingImages()
            }, 200)
            loadAllPages()
            setTimeout(() => setUploadSuccess(0), 3000)
        } catch (error: unknown) {
            console.error("Upload error:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            alert("업로드 중 오류가 발생했습니다: " + message)
            setUploading(false)
            setProgress(0)
        }
    }

    // R2 업로드 함수
    // R2에서 파일 삭제 함수
    const deleteFromR2 = async (publicUrl: string): Promise<void> => {
        try {
            // publicUrl에서 키 추출
            // 예: https://cdn.roarc.kr/bgm/kim4bun/1234567890-song.mp3 -> bgm/kim4bun/1234567890-song.mp3
            const url = new URL(publicUrl)
            const key = url.pathname.substring(1) // 첫 번째 '/' 제거

            console.log(`[BGM] R2 파일 삭제 시작: ${key}`)

            const response = await fetch(
                `${PROXY_BASE_URL}/api/r2?action=delete`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ key }),
                }
            )

            console.log(`[BGM] R2 삭제 응답: ${response.status}`)

            if (!response.ok) {
                const errorText = await response.text()
                console.warn(`[BGM] R2 파일 삭제 실패: ${errorText}`)
                // 삭제 실패해도 업로드는 계속 진행
            } else {
                console.log(`[BGM] R2 파일 삭제 완료: ${key}`)
            }
        } catch (error) {
            console.warn(`[BGM] R2 파일 삭제 중 오류:`, error)
            // 삭제 실패해도 업로드는 계속 진행
        }
    }

    const uploadToR2 = async (
        file: File,
        pageId: string,
        customKey?: string
    ): Promise<{ publicUrl: string; key: string; etag?: string }> => {
        try {
            console.log(
                `uploadToR2 시작: ${file.name}, pageId: ${pageId}, size: ${file.size}, type: ${file.type}`
            )

            // Use custom key if provided, otherwise generate one
            const key = customKey || makeGalleryKey(pageId, file)
            console.log("[R2] PRESIGN_REQ", { key })

            // 1. Get presigned URL (using unified r2 endpoint)
            const presignResponse = await fetch(
                `${PROXY_BASE_URL}/api/r2?action=simple`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        pageId,
                        fileName: file.name,
                        contentType: file.type,
                        key, // Pass the custom key to API
                    }),
                }
            )

            console.log(`[R2] PRESIGN_RES ${presignResponse.status}`)

            if (!presignResponse.ok) {
                const errorText = await presignResponse.text()
                console.error("Presigned URL 요청 실패:", errorText)
                throw new Error(`Failed to get presigned URL: ${errorText}`)
            }

            const presignData = await presignResponse.json()
            const { uploadUrl, key: serverKey, publicUrl } = presignData
            console.log(
                "[R2] PRESIGN_RES",
                presignData?.uploadUrl?.slice?.(0, 120)
            )

            // 2. Upload file to R2
            console.log(`R2 직접 업로드 시작: ${uploadUrl?.slice?.(0, 120)}...`)
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type,
                },
                body: file,
            })

            const putText = await uploadResponse.text().catch(() => "")
            console.log(
                "[R2] PUT_RES",
                uploadResponse.status,
                putText.slice(0, 200)
            )

            if (!uploadResponse.ok) {
                console.error("R2 업로드 실패:", putText)
                throw new Error(`Failed to upload file to R2: ${putText}`)
            }

            // ETag 추출 → 버전 파라미터로 사용
            let etag =
                uploadResponse.headers.get("ETag") ||
                uploadResponse.headers.get("etag") ||
                undefined
            if (etag) {
                etag = etag.replace(/\"/g, "").trim()
            }

            console.log("[R2] PUBLIC_URL", publicUrl)
            console.log(
                `uploadToR2 완료: publicUrl=${publicUrl}, key=${serverKey}`
            )
            const versionedUrl = etag
                ? `${publicUrl}?v=${encodeURIComponent(etag)}`
                : publicUrl
            return { publicUrl: versionedUrl, key: serverKey, etag }
        } catch (error) {
            console.error("R2 upload failed:", error)
            throw error
        }
    }

    // 음원 업로드 핸들러 (R2 사용)
    const handleAudioUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        console.log("[BGM] handleAudioUpload 함수 호출됨")
        console.log("[BGM] event:", event)
        console.log("[BGM] event.target:", event.target)
        console.log("[BGM] event.target.files:", event.target.files)

        const file = event.target.files?.[0]
        console.log("[BGM] 추출된 파일:", file)
        console.log("[BGM] currentPageId:", currentPageId)

        if (!file) {
            console.log("[BGM] 파일이 없어서 함수 종료")
            return
        }
        if (!currentPageId) {
            console.log("[BGM] currentPageId가 없어서 함수 종료")
            return
        }

        // 오디오 파일 타입 검증
        const allowedAudioTypes = [
            "audio/mpeg",
            "audio/mp3",
            "audio/m4a",
            "audio/aac",
            "audio/wav",
        ]
        if (
            !allowedAudioTypes.includes(file.type) &&
            !file.name.toLowerCase().match(/\.(mp3|m4a|aac|wav)$/)
        ) {
            alert("mp3, m4a, aac, wav 파일만 사용 가능합니다.")
            return
        }

        setSettingsLoading(true)

        // 직접 업로드 시 미리듣기 상태 초기화 및 무료 음원 선택 해제
        setPreviewBgmId(null)
        setPlayingBgmId(null)
        setSelectedBgmId(null) // 무료 음원 선택 해제
        stopAllAudio()

        try {
            console.log(
                `[BGM] 음원 업로드 시작: ${file.name}, 크기: ${(file.size / 1024).toFixed(2)}KB, 타입: ${file.type}`
            )
            console.log(`[BGM] currentPageId: ${currentPageId}`)

            // 1. 음원 압축 (5MB 이상인 경우)
            let processedFile = file
            if (file.size / 1024 > 5120) {
                // 5MB
                console.log(
                    `[BGM] 음원 압축 시작: ${(file.size / 1024).toFixed(2)}KB`
                )
                processedFile = await compressAudio(file, 5120)
                console.log(
                    `[BGM] 음원 압축 완료: ${(processedFile.size / 1024).toFixed(2)}KB`
                )
            } else {
                console.log(`[BGM] 음원 크기가 5MB 미만이므로 압축 생략`)
            }

            // 2. 기존 BGM 파일 삭제 (있다면)
            if (pageSettings.bgm_url && pageSettings.bgm_type === "custom") {
                console.log(
                    `[BGM] 기존 커스텀 BGM 파일 삭제 시작: ${pageSettings.bgm_url}`
                )
                await deleteFromR2(pageSettings.bgm_url)
            } else {
                console.log(`[BGM] 기존 커스텀 BGM 파일 없음, 삭제 생략`)
            }

            // 3. R2에 업로드
            const audioKey = `bgm/${currentPageId}/${Date.now()}-${slugifyName(processedFile.name)}`
            console.log(`[BGM] R2 업로드 시작, 키: ${audioKey}`)
            console.log(`[BGM] 파일 정보:`, {
                name: processedFile.name,
                type: processedFile.type,
                size: processedFile.size,
                lastModified: processedFile.lastModified,
            })

            const uploadResult = await uploadToR2(
                processedFile,
                currentPageId,
                audioKey
            )
            console.log(`[BGM] R2 업로드 결과:`, uploadResult)
            const { publicUrl } = uploadResult
            console.log(`[BGM] R2 업로드 완료, 공개 URL: ${publicUrl}`)

            // R2 업로드 검증: HEAD 요청으로 파일 존재 확인
            try {
                console.log(`[BGM] R2 파일 존재 확인 시작: ${publicUrl}`)
                const headResponse = await fetch(publicUrl, { method: "HEAD" })
                console.log(`[BGM] R2 파일 확인 응답: ${headResponse.status}`)
                if (headResponse.ok) {
                    console.log(`[BGM] R2 파일 존재 확인됨`)
                } else {
                    console.warn(
                        `[BGM] R2 파일 접근 불가: ${headResponse.status}`
                    )
                }
            } catch (headError) {
                console.warn(`[BGM] R2 파일 확인 중 오류:`, headError)
            }

            // 4. 페이지 설정에 저장
            const updatedSettings = {
                ...pageSettings,
                bgm_url: publicUrl,
                bgm_type: "custom",
            }

            console.log(`[BGM] 저장할 설정:`, updatedSettings)
            console.log(
                `[BGM] sanitized 설정:`,
                sanitizeSettingsForSave(updatedSettings)
            )
            console.log(`[BGM] 페이지 설정 저장 시작`)

            const saveResult = await savePageSettings(updatedSettings)
            console.log(`[BGM] 페이지 설정 저장 결과:`, saveResult)

            setPageSettings(updatedSettings)
            setUploadedFileName(file.name) // 업로드된 파일명 저장
            console.log(`[BGM] 로컬 상태 업데이트 완료`)

            console.log("음원이 성공적으로 업로드되었습니다!")
        } catch (error: unknown) {
            console.error("음원 업로드 실패:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            console.error(`음원 업로드에 실패했습니다: ${message}`)
        } finally {
            setSettingsLoading(false)
        }
    }

    // 모든 오디오 재생 중지 헬퍼 함수
    const stopAllAudio = () => {
        // 기존 audioRef 중지
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }

        // 현재 재생 중인 동적 오디오 중지
        if (currentPlayingAudioRef.current) {
            currentPlayingAudioRef.current.pause()
            currentPlayingAudioRef.current.currentTime = 0
            currentPlayingAudioRef.current = null
        }

        // DOM의 모든 오디오 요소 중지
        const audioElements = document.querySelectorAll("audio")
        audioElements.forEach((audio) => {
            if (audio.src.includes("cdn.roarc.kr/bgm/free/")) {
                audio.pause()
                audio.currentTime = 0
            }
        })
    }

    // 무료 음원 선택 핸들러 (미리듣기만)
    const handleFreeBgmSelect = async (bgmId: string) => {
        const selectedBgm = FREE_BGM_LIST.find((bgm) => bgm.id === bgmId)
        if (!selectedBgm) {
            console.error(`[BGM] 무료 음원을 찾을 수 없음: ${bgmId}`)
            return
        }

        // 이미 선택된 음원을 다시 클릭하면 미리듣기 중지
        if (previewBgmId === bgmId) {
            setPreviewBgmId(null)
            setPlayingBgmId(null)
            stopAllAudio()
            return
        }

        // 기존 재생 중인 음원이 있으면 먼저 중지
        stopAllAudio()

        // 미리듣기만 재생 (저장하지 않음)
        setPreviewBgmId(bgmId)
        setPlayingBgmId(bgmId)
        setUploadedFileName(null) // 무료 음원 선택 시 업로드된 파일명 초기화

        // 즉시 재생을 위한 새로운 오디오 요소 생성
        const audio = new Audio(selectedBgm.url)
        audio.volume = 0.5
        audio.loop = false

        // 현재 재생 중인 오디오로 설정
        currentPlayingAudioRef.current = audio

        try {
            // 사용자 상호작용 컨텍스트에서 즉시 재생
            await audio.play()
            console.log(`[BGM] 무료 음원 즉시 재생 시작: ${selectedBgm.id}`)

            // 기존 audioRef도 동기화
            if (audioRef.current) {
                audioRef.current.src = selectedBgm.url
                audioRef.current.currentTime = 0
                audioRef.current.volume = 0.5
            }

            // 재생 완료 시 정리
            audio.addEventListener("ended", () => {
                console.log(`[BGM] 무료 음원 재생 완료: ${selectedBgm.id}`)
                setPlayingBgmId(null)
                currentPlayingAudioRef.current = null
            })

            audio.addEventListener("error", (e) => {
                console.error(`[BGM] 무료 음원 재생 오류:`, e)
                setPreviewBgmId(null)
                setPlayingBgmId(null)
                currentPlayingAudioRef.current = null
            })
        } catch (error) {
            console.error(`[BGM] 무료 음원 재생 실패:`, error)
            // 재생 실패 시 상태 초기화
            setPreviewBgmId(null)
            setPlayingBgmId(null)
            currentPlayingAudioRef.current = null
        }
    }

    // 자동재생 설정 변경
    const handleAutoplayToggle = async (autoplay: boolean) => {
        setSettingsLoading(true)

        try {
            const updatedSettings = {
                ...pageSettings,
                bgm_autoplay: autoplay,
            }

            await savePageSettings(updatedSettings)
            setPageSettings(updatedSettings)
        } catch (error: unknown) {
            console.error("자동재생 설정 실패:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            console.error(`자동재생 설정에 실패했습니다: ${message}`)
        } finally {
            setSettingsLoading(false)
        }
    }

    const handleKakaoImageChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!currentPageId) {
            alert("페이지 ID가 설정되지 않았습니다.")
            event.target.value = ""
            return
        }

        try {
            validateImageFileSize(file)
        } catch (validationError) {
            const message =
                validationError instanceof Error
                    ? validationError.message
                    : String(validationError)
            alert(message)
            event.target.value = ""
            return
        }

        try {
            setKakaoUploadLoading(true)

            const key = makeGalleryKey(currentPageId, file)
            const { publicUrl } = await uploadToR2(file, currentPageId, key)

            if (pageSettings.kko_img) {
                try {
                    await deleteFromR2(pageSettings.kko_img)
                } catch (deleteError) {
                    console.warn(
                        "기존 카카오톡 공유 이미지 삭제 중 경고:",
                        deleteError
                    )
                }
            }

            setPageSettings((prev) => ({ ...prev, kko_img: publicUrl }))
            await savePageSettings({ kko_img: publicUrl })
        } catch (error: unknown) {
            console.error("카카오톡 공유 이미지 업로드 실패:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            alert(`카카오톡 공유 이미지를 업로드하지 못했습니다: ${message}`)
        } finally {
            setKakaoUploadLoading(false)
            event.target.value = ""
        }
    }

    const handleKakaoImageRemove = async () => {
        if (!pageSettings.kko_img) return
        if (
            typeof window !== "undefined" &&
            !window.confirm("등록된 카카오톡 공유 이미지를 삭제하시겠습니까?")
        ) {
            return
        }

        setKakaoUploadLoading(true)

        try {
            await deleteFromR2(pageSettings.kko_img)
        } catch (error) {
            console.warn("카카오톡 공유 이미지 삭제 중 경고:", error)
        }

        setPageSettings((prev) => ({ ...prev, kko_img: "" }))

        try {
            await savePageSettings({ kko_img: "" })
        } catch (error: unknown) {
            console.error("카카오톡 공유 이미지 상태 저장 실패:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            alert(`이미지 정보를 저장하지 못했습니다: ${message}`)
        } finally {
            setKakaoUploadLoading(false)
        }
    }

    // 연락처 관리
    const handleAddContact = () => {
        setSelectedContact({ ...initialContactData, page_id: currentPageId })
        setIsEditingContact(true)
    }

    const handleEditContact = (contact: any) => {
        setSelectedContact(contact)
        setIsEditingContact(true)
    }

    const handleDeleteContact = async (id: string) => {
        if (!confirm("정말로 이 연락처를 삭제하시겠습니까?")) return

        setLoading(true)

        // 낙관적 업데이트 - 즉시 UI에서 제거
        const contactToDelete = contactList.find((contact) => contact.id === id)
        setContactList((prev) => prev.filter((contact) => contact.id !== id))

        try {
            const result = await deleteContact(id)

            if (result.success) {
                console.log("연락처가 성공적으로 삭제되었습니다!")
            } else {
                // 실패 시 원래 상태로 복원
                if (contactToDelete) {
                    setContactList((prev) => [...prev, contactToDelete])
                }
                console.error("삭제에 실패했습니다: " + result.error)
            }
        } catch (err) {
            // 실패 시 원래 상태로 복원
            if (contactToDelete) {
                setContactList((prev) => [...prev, contactToDelete])
            }
            console.error("삭제에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }
    const handleSaveContact = async () => {
        if (!selectedContact) return

        if (!selectedContact.page_id.trim()) {
            console.warn("페이지 ID는 필수입니다.")
            return
        }
        if (selectedContact.page_id !== currentPageId) {
            console.warn("현재 선택된 페이지와 연락처의 페이지 ID가 다릅니다.")
            return
        }

        setLoading(true)

        // 낙관적 업데이트 - 즉시 UI 반영
        const isUpdate = !!selectedContact.id
        const updatedContact = { ...selectedContact }

        if (isUpdate) {
            // 수정: 기존 연락처를 업데이트된 정보로 교체
            setContactList((prev) =>
                prev.map((contact) =>
                    contact.id === selectedContact.id ? updatedContact : contact
                )
            )
        } else {
            // 추가: 새 연락처를 목록에 추가
            const newContact = {
                ...updatedContact,
                id: `temp_${Date.now()}`, // 임시 ID
            }
            setContactList((prev) => [...prev, newContact])
        }

        try {
            const result = await saveContact(selectedContact)

            if (result.success) {
                // 성공 시 실제 서버 데이터로 교체
                if (isUpdate) {
                    setContactList((prev) =>
                        prev.map((contact) =>
                            contact.id === selectedContact.id
                                ? { ...contact, ...result.data } // 서버에서 반환된 실제 데이터
                                : contact
                        )
                    )
                } else {
                    // 새로 추가된 경우 임시 ID를 실제 ID로 교체
                    setContactList((prev) =>
                        prev.map((contact) =>
                            contact.id === `temp_${Date.now() - 1000}` // 임시 ID
                                ? { ...contact, id: result.data.id } // 실제 ID
                                : contact
                        )
                    )
                }

                console.log(
                    isUpdate
                        ? "연락처가 성공적으로 수정되었습니다!"
                        : "연락처가 성공적으로 추가되었습니다!"
                )
                setIsEditingContact(false)
                setSelectedContact(null)
            } else {
                // 실패 시 원래 상태로 복원
                if (isUpdate) {
                    setContactList((prev) =>
                        prev.map((contact) =>
                            contact.id === selectedContact.id
                                ? contact // 원래 상태 유지
                                : contact
                        )
                    )
                } else {
                    // 새로 추가된 경우 제거
                    setContactList((prev) =>
                        prev.filter(
                            (contact) =>
                                contact.id !== `temp_${Date.now() - 1000}`
                        )
                    )
                }

                console.error(`저장에 실패했습니다: ${result.error}`)
            }
        } catch (err) {
            // 실패 시 원래 상태로 복원
            if (isUpdate) {
                setContactList((prev) =>
                    prev.map((contact) =>
                        contact.id === selectedContact.id
                            ? contact // 원래 상태 유지
                            : contact
                    )
                )
            } else {
                // 새로 추가된 경우 제거
                setContactList((prev) =>
                    prev.filter(
                        (contact) => contact.id !== `temp_${Date.now() - 1000}`
                    )
                )
            }

            console.error(
                `저장에 실패했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
            )
        } finally {
            setLoading(false)
        }
    }

    // 연락처 전화번호 필드 식별 및 정규화
    const PHONE_FIELDS = new Set<string>([
        "groom_phone",
        "groom_father_phone",
        "groom_mother_phone",
        "bride_phone",
        "bride_father_phone",
        "bride_mother_phone",
    ])

    const normalizePhoneInput = (raw: string): string => {
        const digitsOnly = String(raw).replace(/\D/g, "")
        return digitsOnly.slice(0, 11)
    }

    const handleContactInputChange = (field: string, value: string) => {
        if (selectedContact) {
            // page_id는 직접 수정 불가
            if (field === "page_id") return
            const nextValue = PHONE_FIELDS.has(field)
                ? normalizePhoneInput(value)
                : value
            setSelectedContact({ ...selectedContact, [field]: nextValue })

            // 입력값이 있을 때 해당 섹션의 토글 자동 활성화
            if (nextValue && nextValue.trim() !== "") {
                // 연락처 섹션 토글 활성화
                let contactSectionToEnable: keyof typeof contactToggles | null =
                    null

                switch (field) {
                    case "groom_name":
                    case "groom_phone":
                        contactSectionToEnable = "groom"
                        break
                    case "groom_father_name":
                    case "groom_father_phone":
                        contactSectionToEnable = "groomFather"
                        break
                    case "groom_mother_name":
                    case "groom_mother_phone":
                        contactSectionToEnable = "groomMother"
                        break
                    case "bride_name":
                    case "bride_phone":
                        contactSectionToEnable = "bride"
                        break
                    case "bride_father_name":
                    case "bride_father_phone":
                        contactSectionToEnable = "brideFather"
                        break
                    case "bride_mother_name":
                    case "bride_mother_phone":
                        contactSectionToEnable = "brideMother"
                        break
                }

                if (
                    contactSectionToEnable &&
                    !contactToggles[contactSectionToEnable]
                ) {
                    setContactToggles((prev) => ({
                        ...prev,
                        [contactSectionToEnable]: true,
                    }))
                }

                // 계좌안내 섹션 토글 활성화
                let accountSectionToEnable: keyof typeof accountToggles | null =
                    null

                switch (field) {
                    case "groom_bank_name":
                    case "groom_bank":
                    case "groom_account":
                        accountSectionToEnable = "groom"
                        break
                    case "groom_father_bank_name":
                    case "groom_father_bank":
                    case "groom_father_account":
                        accountSectionToEnable = "groomFather"
                        break
                    case "groom_mother_bank_name":
                    case "groom_mother_bank":
                    case "groom_mother_account":
                        accountSectionToEnable = "groomMother"
                        break
                    case "bride_bank_name":
                    case "bride_bank":
                    case "bride_account":
                        accountSectionToEnable = "bride"
                        break
                    case "bride_father_bank_name":
                    case "bride_father_bank":
                    case "bride_father_account":
                        accountSectionToEnable = "brideFather"
                        break
                    case "bride_mother_bank_name":
                    case "bride_mother_bank":
                    case "bride_mother_account":
                        accountSectionToEnable = "brideMother"
                        break
                }

                if (
                    accountSectionToEnable &&
                    !accountToggles[accountSectionToEnable]
                ) {
                    setAccountToggles((prev) => ({
                        ...prev,
                        [accountSectionToEnable]: true,
                    }))
                }
            }
        }
    }

    // 연락처 인라인 저장 (단일 레코드)
    const handleSaveContactInline = async () => {
        const base = selectedContact ?? {
            ...initialContactData,
            page_id: currentPageId,
        }

        const payload = { ...base, page_id: currentPageId }

        try {
            broadcastAutoSaveToast()
            setLoading(true)
            const result = await saveContact(payload)
            if (result.success) {
                // 페이지당 단일 항목으로 동기화
                const saved = result.data
                setSelectedContact(saved)
                setContactList((prev) => {
                    const others = prev.filter(
                        (c) => c.page_id !== currentPageId
                    )
                    return [...others, saved]
                })
                console.log("연락처가 저장되었습니다.")
            } else {
                console.error(result.error || "저장에 실패했습니다")
            }
        } catch (err) {
            console.error(
                err instanceof Error
                    ? err.message
                    : "알 수 없는 오류가 발생했습니다"
            )
        } finally {
            setLoading(false)
        }
    }

    // 연락처 준비 (아코디언에서는 항상 로드)
    useEffect(() => {
        const existing = contactList.find((c) => c.page_id === currentPageId)
        setSelectedContact(
            existing
                ? { ...existing }
                : { ...initialContactData, page_id: currentPageId }
        )
        setIsEditingContact(false)
    }, [contactList, currentPageId])

    // pageId 변경 시 연락처 목록 및 설정 자동 갱신
    useEffect(() => {
        if (propIsAuthenticated && currentPageId) {
            loadContactList()
            loadPageSettings()
            // 페이지 변경 시 선택된 이미지 초기화
            setSelectedImages(new Set())
        }
    }, [currentPageId])

    // 로그인 화면
    if (!propIsAuthenticated) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    maxWidth: "430px",
                    minWidth: "375px",
                    height: "100%",
                    minHeight:
                        "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    boxSizing: "border-box",
                }}
            >
                {/* 상단 간격 */}
                <div style={{ height: "16px", width: "100%" }} />

                {/* 로고 섹션 */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "48px 0",
                        gap: "48px",
                    }}
                >
                    <img
                        src={ROARC_LOGO_URL}
                        alt="Roarc Logo"
                        style={{
                            width: "178px",
                            height: "88px",
                            objectFit: "contain",
                        }}
                    />
                </div>

                {/* 중간 간격 */}
                <div style={{ height: "16px", width: "100%" }} />

                {/* 로그인 폼 */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "0 32px",
                        width: "100%",
                        gap: "24px",
                    }}
                >
                    <form onSubmit={handleLogin} style={{ width: "100%" }}>
                        {/* 아이디 입력 */}
                        <div style={{ marginBottom: "24px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    marginBottom: "12px",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "14px",
                                        color: "#000000",
                                        fontFamily: "Pretendard, sans-serif",
                                        lineHeight: "20px",
                                    }}
                                >
                                    아이디
                                </label>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#aeaeae",
                                        fontFamily: "Pretendard, sans-serif",
                                        lineHeight: "20px",
                                    }}
                                >
                                    네이버 스마트스토어 구매자 ID
                                </div>
                            </div>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    height: "49px",
                                    padding: "0 16px",
                                    border: "1px solid #e5e6e8",
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    backgroundColor: "white",
                                    color: "#000000",
                                    fontFamily: "Pretendard, sans-serif",
                                }}
                                required
                            />
                        </div>

                        {/* 비밀번호 입력 */}
                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    color: "#000000",
                                    fontFamily: "Pretendard, sans-serif",
                                    lineHeight: "normal",
                                    marginBottom: "12px",
                                }}
                            >
                                비밀번호
                            </label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    height: "49px",
                                    padding: "0 16px",
                                    border: "1px solid #e5e6e8",
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    backgroundColor: "white",
                                    color: "#000000",
                                    fontFamily: "Pretendard, sans-serif",
                                    marginBottom: "12px",
                                }}
                                required
                            />
                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "#aeaeae",
                                    fontFamily: "Pretendard, sans-serif",
                                    lineHeight: "20px",
                                    margin: 0,
                                }}
                            >
                                비밀번호를 잃어버리신 경우 카카오톡 채널로
                                문의바랍니다.
                            </p>
                        </div>

                        {/* 에러 메시지 */}
                        {loginError && (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    backgroundColor: "#f5f5f5",
                                    color: "#666666",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                    textAlign: "center",
                                    borderRadius: "2px",
                                }}
                            >
                                {loginError}
                            </div>
                        )}

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: "100%",
                                height: "50px",
                                backgroundColor: "#000000",
                                color: "white",
                                border: "none",
                                borderRadius: "0",
                                fontSize: "14px",
                                fontFamily: "Pretendard, sans-serif",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "12px",
                            }}
                        >
                            {isLoggingIn ? "로그인 중..." : "로그인"}
                        </button>
                    </form>
                </div>

                {/* 하단 간격 */}
                <div style={{ height: "16px", width: "100%" }} />
            </div>
        )
    }
    // 관리자 화면
    return (
        <div
            style={{
                ...style,
                width: "100%",
                maxWidth: "430px",
                minWidth: "375px",
                height: "100%", // 부모 요소의 높이 사용
                minHeight:
                    "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))", // 안전 영역 고려
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f5f5f5",
                overflow: "hidden", // 전체 스크롤 비활성화
                position: "relative", // 키보드 대응을 위한 위치 설정
            }}
        >
            {/* 헤더 */}
            <div
                style={{
                    width: "100%",
                    height: "62px",
                    padding: "24px 16px 24px 16px",
                    backgroundColor: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${theme.color.border}`,
                    position: "sticky",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                }}
            >
                {/* 왼쪽 영역 */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <button
                        onClick={handleCopyLink}
                        style={{
                            padding: "6px 8px",
                            backgroundColor: "#000",
                            color: "white",
                            border: "none",
                            fontSize: "10px",
                            fontFamily: theme.font.body,
                            cursor: "pointer",
                            borderRadius: "2px",
                        }}
                    >
                        내 링크 복사
                    </button>
                    {showCopyPopup && (
                        <span
                            style={{
                                fontSize: "12px",
                                color: "#3F3F3F",
                                fontFamily: theme.font.body,
                                fontWeight: 500,
                            }}
                        >
                            복사 완료!
                        </span>
                    )}
                </div>

                {/* 중앙 영역 */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            ...theme.typography.label,
                            color: "black",
                            fontSize: "16px",
                        }}
                    >
                        {pageSettings.groom_name_kr || "신랑"} ♥{" "}
                        {pageSettings.bride_name_kr || "신부"}
                    </span>
                </div>

                {/* 오른쪽 영역 */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "6px 8px",
                            backgroundColor: "white",
                            color: "#7F7F7F",
                            border: `1px solid ${theme.color.border}`,
                            fontSize: "10px",
                            fontFamily: theme.font.body,
                            cursor: "pointer",
                            borderRadius: "2px",
                        }}
                    >
                        로그아웃
                    </button>
                </div>
            </div>
            {/* 탭 버튼들 */}
            <div
                style={{
                    display: "flex",
                    height: "48px",
                    backgroundColor: "white",
                    borderBottom: `1px solid ${theme.color.border}`,
                    position: "sticky",
                    top: "62px", // 헤더 높이만큼 아래로
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => setActiveTab("basic")}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        backgroundColor:
                            activeTab === "basic" ? "#FFFFFF" : "#F3F4F6",
                        border: "none",
                        borderBottom:
                            activeTab === "basic"
                                ? "2px solid #000000"
                                : "2px solid transparent",
                        color: activeTab === "basic" ? "#000000" : "#666666",
                        fontSize: "14px",
                        fontFamily: theme.font.body,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                >
                    기본정보
                </button>
                <button
                    onClick={() => setActiveTab("gallery")}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        backgroundColor:
                            activeTab === "gallery" ? "#FFFFFF" : "#F3F4F6",
                        border: "none",
                        borderBottom:
                            activeTab === "gallery"
                                ? "2px solid #000000"
                                : "2px solid transparent",
                        color: activeTab === "gallery" ? "#000000" : "#666666",
                        fontSize: "14px",
                        fontFamily: theme.font.body,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                >
                    갤러리
                </button>
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === "basic" && (
                <div
                    style={{
                        backgroundColor: "#E6E6E6",
                        flex: 1,
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch", // iOS 부드러운 스크롤
                        minHeight: 0, // flex 아이템이 축소될 수 있도록
                        paddingBottom: "env(safe-area-inset-bottom)", // 하단 안전 영역
                        position: "relative", // 키보드 대응
                    }}
                >
                    {/* 성함 섹션 */}
                    <AccordionSection
                        title="성함"
                        sectionKey="name"
                        isOpen={currentOpenSection === "name"}
                        onToggle={async () => await toggleSection("name")}
                    >
                        <div
                            style={{
                                padding: `${theme.space(4)}px ${theme.space(4)}px`,
                                backgroundColor: "white",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: theme.space(2.5),
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    flexDirection: "column",
                                    display: "flex",
                                    gap: theme.gap.sm,
                                }}
                            >
                                {/* 미리보기 제거됨 */}

                                {/* 입력 필드들 */}
                                <div
                                    style={{
                                        flexDirection: "column",
                                        display: "flex",
                                        gap: 0,
                                    }}
                                >
                                    <FormField label="신랑 한글 성함">
                                        <div
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                                display: "flex",
                                                gap: 6,
                                                marginBottom: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "30%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.last_groom_name_kr ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            last_groom_name_kr:
                                                                (
                                                                    e.target as HTMLInputElement
                                                                ).value,
                                                        })
                                                    }
                                                    placeholder="박"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_groom_name_kr ||
                                                            pageSettings.groom_name_kr
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    width: "70%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.groom_name_kr ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            groom_name_kr: (
                                                                e.target as HTMLInputElement
                                                            ).value,
                                                        })
                                                    }
                                                    placeholder="민준"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_groom_name_kr ||
                                                            pageSettings.groom_name_kr
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormField>
                                    <FormField label="신랑 영문 성함">
                                        <div
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                                display: "flex",
                                                gap: 6,
                                                marginBottom: 24,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "30%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.last_groom_name_en ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            last_groom_name_en:
                                                                (
                                                                    e.target as HTMLInputElement
                                                                ).value,
                                                        })
                                                    }
                                                    placeholder="PARK"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_groom_name_en ||
                                                            pageSettings.groom_name_en
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    width: "70%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.groom_name_en ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            groom_name_en: (
                                                                e.target as HTMLInputElement
                                                            ).value,
                                                        })
                                                    }
                                                    placeholder="MIN JUN"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_groom_name_en ||
                                                            pageSettings.groom_name_en
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormField>

                                    <FormField label="신부 한글 성함">
                                        <div
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                                display: "flex",
                                                gap: 6,
                                                marginBottom: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "30%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.last_bride_name_kr ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            last_bride_name_kr:
                                                                (
                                                                    e.target as HTMLInputElement
                                                                ).value,
                                                        })
                                                    }
                                                    placeholder="최"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_bride_name_kr ||
                                                            pageSettings.bride_name_kr
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    width: "70%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.bride_name_kr ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            bride_name_kr: (
                                                                e.target as HTMLInputElement
                                                            ).value,
                                                        })
                                                    }
                                                    placeholder="서윤"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_bride_name_kr ||
                                                            pageSettings.bride_name_kr
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormField>

                                    <FormField label="신부 영문 성함">
                                        <div
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "30%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.last_bride_name_en ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            last_bride_name_en:
                                                                (
                                                                    e.target as HTMLInputElement
                                                                ).value,
                                                        })
                                                    }
                                                    placeholder="CHOI"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_bride_name_en ||
                                                            pageSettings.bride_name_en
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    width: "70%",
                                                    height: "calc(40px*1.1429)",
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        pageSettings.bride_name_en ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            bride_name_en: (
                                                                e.target as HTMLInputElement
                                                            ).value,
                                                        })
                                                    }
                                                    placeholder="SEO YUN"
                                                    style={{
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color:
                                                            pageSettings.last_bride_name_en ||
                                                            pageSettings.bride_name_en
                                                                ? "black"
                                                                : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormField>
                                </div>
                                {/* 오디오 프리뷰 요소 */}
                                <audio
                                    ref={audioRef}
                                    style={{ display: "none" }}
                                    preload="metadata"
                                    crossOrigin="anonymous"
                                />
                                <div style={{ width: "100%", marginTop: 12 }}>
                                    <SaveSectionButton
                                        onSave={async () => {
                                            await savePageSettings(
                                                {
                                                    groom_name_kr:
                                                        pageSettings.groom_name_kr,
                                                    groom_name_en:
                                                        pageSettings.groom_name_en,
                                                    bride_name_kr:
                                                        pageSettings.bride_name_kr,
                                                    bride_name_en:
                                                        pageSettings.bride_name_en,
                                                    last_groom_name_kr:
                                                        pageSettings.last_groom_name_kr,
                                                    last_bride_name_kr:
                                                        pageSettings.last_bride_name_kr,
                                                    last_groom_name_en:
                                                        pageSettings.last_groom_name_en,
                                                    last_bride_name_en:
                                                        pageSettings.last_bride_name_en,
                                                },
                                                { silent: true }
                                            )
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 메인 사진 */}
                    <AccordionSection
                        title="메인 사진"
                        sectionKey="photo"
                        isOpen={currentOpenSection === "photo"}
                        onToggle={async () => await toggleSection("photo")}
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: "10px",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.sm,
                                }}
                            >
                                {/* 메인 사진 업로드 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.md,
                                    }}
                                >
                                    <span style={theme.typography.label}>
                                        메인 사진
                                    </span>

                                    {/* 사진 썸네일 미리보기 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                            alignItems: "center",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    "photoSectionFileInput_acdn"
                                                )
                                                ?.click()
                                        }
                                    >
                                        <div
                                            style={{
                                                width: 80,
                                                height: 80,
                                                backgroundColor: "#fafafa",
                                                border: "1px solid #e5e6e8",
                                                borderRadius: 2,
                                                overflow: "hidden",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {photoSectionThumbSrc ? (
                                                <img
                                                    src={photoSectionThumbSrc}
                                                    alt="메인 사진 썸네일"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={(e) => {
                                                        // 갤러리 방식과 동일: 원본 URL로 폴백
                                                        const img =
                                                            e.currentTarget as HTMLImageElement & {
                                                                dataset?: any
                                                            }
                                                        if (
                                                            img.dataset?.fb ===
                                                            "1"
                                                        )
                                                            return
                                                        if (!img.dataset)
                                                            (
                                                                img as any
                                                            ).dataset = {}
                                                        img.dataset.fb = "1"
                                                        const originalUrl =
                                                            getPhotoSectionDisplayUrl()
                                                        if (originalUrl)
                                                            img.src =
                                                                originalUrl
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        color: "#999",
                                                        fontSize: 20,
                                                        fontFamily:
                                                            theme.font.body,
                                                        fontWeight: 200,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    +
                                                </div>
                                            )}
                                        </div>
                                        {getPhotoSectionDisplayUrl() && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontFamily: theme.font.body,
                                                    color: "#7f7f7f",
                                                    textAlign: "center",
                                                    maxWidth: 120,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {(() => {
                                                    // 갤러리 방식과 동일: 업로드한 파일의 원본 이름 표시
                                                    const fileName =
                                                        pageSettings.photo_section_image_path
                                                            ? pageSettings.photo_section_image_path
                                                                  .split("/")
                                                                  .pop() ||
                                                              "파일명"
                                                            : "파일명"

                                                    // 파일명에서 타임스탬프와 UUID 제거하여 원본 이름 추출
                                                    const originalName =
                                                        fileName
                                                            .replace(
                                                                /^\d+-/,
                                                                ""
                                                            )
                                                            .replace(
                                                                /^[a-f0-9-]+-/,
                                                                ""
                                                            )

                                                    return originalName.length >
                                                        15
                                                        ? originalName.substring(
                                                              0,
                                                              15
                                                          ) + "..."
                                                        : originalName
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: theme.gap.md,
                                            width: "100%",
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        "photoSectionFileInput_acdn"
                                                    )
                                                    ?.click()
                                            }
                                            style={{
                                                width: "100%",
                                                height: 50,
                                                paddingLeft: 12,
                                                paddingRight: 12,
                                                paddingTop: 8,
                                                paddingBottom: 8,
                                                background: "white",
                                                outline: `${theme.border.width}px #AEAEAE solid`,
                                                borderRadius: 2,
                                                outlineOffset: "-0.50px",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: 8,
                                                display: "flex",
                                                border: "none",
                                                cursor: "pointer",
                                                opacity: 1,
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="13"
                                                height="12"
                                                viewBox="0 0 13 12"
                                                fill="none"
                                                style={{
                                                    width: 13,
                                                    height: 12,
                                                }}
                                            >
                                                <path
                                                    d="M5.75 9V2.8875L3.8 4.8375L2.75 3.75L6.5 0L10.25 3.75L9.2 4.8375L7.25 2.8875V9H5.75ZM0.5 12V8.25H2V10.5H11V8.25H12.5V12H0.5Z"
                                                    fill="#818181"
                                                />
                                            </svg>
                                            <div
                                                style={{
                                                    color: "var(--Black, black)",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    wordWrap: "break-word",
                                                }}
                                            >
                                                사진 업로드
                                            </div>
                                        </button>
                                        <input
                                            id="photoSectionFileInput_acdn"
                                            type="file"
                                            accept="image/*"
                                            onChange={
                                                handlePhotoSectionImageUpload
                                            }
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                </div>

                                {/* 예식 일시 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                        marginTop: 14,
                                    }}
                                >
                                    <Field label="예식 일시">
                                        <Input
                                            type="date"
                                            value={pageSettings.wedding_date}
                                            onChange={(e) =>
                                                setPageSettings({
                                                    ...pageSettings,
                                                    wedding_date:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="연도. 월. 일."
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                backgroundColor: "#ffffff",
                                                border: "none",
                                                outline: `${theme.border.width}px #E5E6E8 solid`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                marginTop: 4,
                                                fontSize: 16,
                                                fontFamily: theme.font.body,
                                                color: "#000",
                                                cursor: "pointer",
                                                appearance: "none",
                                                WebkitAppearance: "none",
                                                MozAppearance: "none",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </Field>

                                    {/* AM/PM + 시간/분 선택 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "inline-flex",
                                            gap: 12,
                                            alignItems: "center",
                                        }}
                                    >
                                        {/* AM/PM */}
                                        <div
                                            style={{
                                                width: 85,
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            {(["AM", "PM"] as const).map(
                                                (ap) => {
                                                    const h = parseInt(
                                                        pageSettings.wedding_hour ||
                                                            "0",
                                                        10
                                                    )
                                                    const isPm = h >= 12
                                                    const selected =
                                                        ap === "PM"
                                                            ? isPm
                                                            : !isPm
                                                    return (
                                                        <button
                                                            key={ap}
                                                            onClick={() => {
                                                                const current =
                                                                    parseInt(
                                                                        pageSettings.wedding_hour ||
                                                                            "0",
                                                                        10
                                                                    )
                                                                let next =
                                                                    current
                                                                if (
                                                                    ap ===
                                                                        "AM" &&
                                                                    current >=
                                                                        12
                                                                )
                                                                    next =
                                                                        current -
                                                                        12
                                                                if (
                                                                    ap ===
                                                                        "PM" &&
                                                                    current < 12
                                                                )
                                                                    next =
                                                                        current +
                                                                        12
                                                                setPageSettings(
                                                                    {
                                                                        ...pageSettings,
                                                                        wedding_hour:
                                                                            String(
                                                                                next
                                                                            ).padStart(
                                                                                2,
                                                                                "0"
                                                                            ),
                                                                    }
                                                                )
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                height: 40,
                                                                padding: 12,
                                                                backgroundColor:
                                                                    selected
                                                                        ? "#ECECEC"
                                                                        : "white",
                                                                borderRadius: 2,
                                                                outline: `${theme.border.width}px solid ${selected ? "#757575" : "#E5E6E8"}`,
                                                                border: "none",
                                                                display: "flex",
                                                                justifyContent:
                                                                    "center",
                                                                alignItems:
                                                                    "center",
                                                                cursor: "pointer",
                                                                userSelect:
                                                                    "none",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: selected
                                                                        ? "black"
                                                                        : "#AEAEAE",
                                                                    fontFamily:
                                                                        theme
                                                                            .font
                                                                            .body,
                                                                }}
                                                            >
                                                                {ap}
                                                            </span>
                                                        </button>
                                                    )
                                                }
                                            )}
                                        </div>
                                        {/* 시간/분 */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                gap: 6,
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: "1 1 0%",
                                                    position: "relative",
                                                }}
                                            >
                                                <select
                                                    value={(() => {
                                                        const h = parseInt(
                                                            pageSettings.wedding_hour ||
                                                                "0",
                                                            10
                                                        )
                                                        const base =
                                                            h % 12 || 12
                                                        return String(
                                                            base
                                                        ).padStart(2, "0")
                                                    })()}
                                                    onChange={(e) => {
                                                        const h12 =
                                                            parseInt(
                                                                e.target.value,
                                                                10
                                                            ) % 12 || 12
                                                        const current =
                                                            parseInt(
                                                                pageSettings.wedding_hour ||
                                                                    "0",
                                                                10
                                                            )
                                                        const isPm =
                                                            current >= 12
                                                        const next =
                                                            (h12 % 12) +
                                                            (isPm ? 12 : 0)
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            wedding_hour:
                                                                String(
                                                                    next
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                ),
                                                        })
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        minHeight: 40,
                                                        padding: "10px 12px",
                                                        backgroundColor:
                                                            "#ffffff",
                                                        border: `1px solid ${theme.color.border}`,
                                                        borderRadius: 2,
                                                        fontSize: 12,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color: "#000",
                                                        cursor: "pointer",
                                                        appearance: "none",
                                                        WebkitAppearance:
                                                            "none",
                                                        MozAppearance: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                >
                                                    {Array.from(
                                                        { length: 12 },
                                                        (_, i) => i + 1
                                                    ).map((n) => (
                                                        <option
                                                            key={n}
                                                            value={String(
                                                                n
                                                            ).padStart(2, "0")}
                                                        >
                                                            {String(n).padStart(
                                                                2,
                                                                "0"
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        right: 12,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        pointerEvents: "none",
                                                    }}
                                                >
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 12 12"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path
                                                            d="M3 4.5L6 7.5L9 4.5"
                                                            stroke="#757575"
                                                            strokeWidth="1"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "black",
                                                }}
                                            >
                                                :
                                            </span>
                                            <div
                                                style={{
                                                    flex: "1 1 0%",
                                                    position: "relative",
                                                }}
                                            >
                                                <select
                                                    value={
                                                        pageSettings.wedding_minute
                                                    }
                                                    onChange={(e) =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            wedding_minute:
                                                                e.target.value,
                                                        })
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        minHeight: 40,
                                                        padding: "10px 12px",
                                                        backgroundColor:
                                                            "#ffffff",
                                                        border: `1px solid ${theme.color.border}`,
                                                        borderRadius: 2,
                                                        fontSize: 12,
                                                        fontFamily:
                                                            theme.font.body,
                                                        color: "#000",
                                                        cursor: "pointer",
                                                        appearance: "none",
                                                        WebkitAppearance:
                                                            "none",
                                                        MozAppearance: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                >
                                                    {[
                                                        "00",
                                                        "05",
                                                        "10",
                                                        "15",
                                                        "20",
                                                        "25",
                                                        "30",
                                                        "35",
                                                        "40",
                                                        "45",
                                                        "50",
                                                        "55",
                                                    ].map((m) => (
                                                        <option
                                                            key={m}
                                                            value={m}
                                                        >
                                                            {m}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        right: 12,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        pointerEvents: "none",
                                                    }}
                                                >
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 12 12"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path
                                                            d="M3 4.5L6 7.5L9 4.5"
                                                            stroke="#757575"
                                                            strokeWidth="1"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* 언어 토글 (영문/국문) */}
                                <div
                                    style={{
                                        width: "100%",
                                        display: "inline-flex",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    {(["en", "kr"] as const).map((loc) => (
                                        <button
                                            key={loc}
                                            onClick={() =>
                                                setPageSettings({
                                                    ...pageSettings,
                                                    photo_section_locale: loc,
                                                })
                                            }
                                            style={{
                                                flex: 1,
                                                height: 40,
                                                padding: 12,
                                                backgroundColor:
                                                    pageSettings.photo_section_locale ===
                                                    loc
                                                        ? "#ECECEC"
                                                        : "white",
                                                borderRadius: 2,
                                                outline: `${theme.border.width}px solid ${pageSettings.photo_section_locale === loc ? "#757575" : "#E5E6E8"}`,
                                                border: "none",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                cursor: "pointer",
                                                userSelect: "none",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color:
                                                        pageSettings.photo_section_locale ===
                                                        loc
                                                            ? "black"
                                                            : "#AEAEAE",
                                                    fontFamily: theme.font.body,
                                                }}
                                            >
                                                {loc === "en" ? "영문" : "국문"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                {/* 식장 이름 */}
                                <FormField
                                    label="식장 이름 (영문)"
                                    style={{ marginTop: 12 }}
                                >
                                    <InputBase
                                        type="text"
                                        value={pageSettings.venue_name || ""}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                venue_name: e.target.value,
                                            })
                                        }
                                        onBlur={(e) =>
                                            void savePageSettings({
                                                venue_name: e.target.value,
                                            })
                                        }
                                        placeholder="식장 이름을 영문으로 입력하세요"
                                    />
                                </FormField>

                                {/* 일시 표시 위치 / 텍스트 색상 - papillon 타입일 때만 표시 */}
                                {pageSettings.type === "papillon" && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <span style={theme.typography.label}>
                                            일시 표시 위치
                                        </span>
                                        {/* 상단/하단 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                marginTop: 4,
                                                display: "inline-flex",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            {(["top", "bottom"] as const).map(
                                                (pos) => (
                                                    <button
                                                        key={pos}
                                                        onClick={() =>
                                                            setPageSettings({
                                                                ...pageSettings,
                                                                photo_section_overlay_position:
                                                                    pos,
                                                            })
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            height: 40,
                                                            padding: 12,
                                                            backgroundColor:
                                                                pageSettings.photo_section_overlay_position ===
                                                                pos
                                                                    ? "#ECECEC"
                                                                    : "white",
                                                            borderRadius: 2,
                                                            outline: `${theme.border.width}px solid ${pageSettings.photo_section_overlay_position === pos ? "#757575" : "#E5E6E8"}`,
                                                            border: "none",
                                                            display: "flex",
                                                            justifyContent:
                                                                "center",
                                                            alignItems:
                                                                "center",
                                                            cursor: "pointer",
                                                            userSelect: "none",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                color:
                                                                    pageSettings.photo_section_overlay_position ===
                                                                    pos
                                                                        ? "black"
                                                                        : "#AEAEAE",
                                                                fontFamily:
                                                                    theme.font
                                                                        .body,
                                                            }}
                                                        >
                                                            {pos === "top"
                                                                ? "상단"
                                                                : "하단"}
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                        {/* 텍스트 색상 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                display: "inline-flex",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            {(
                                                ["#ffffff", "#000000"] as const
                                            ).map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() =>
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            photo_section_overlay_color:
                                                                color,
                                                        })
                                                    }
                                                    style={{
                                                        flex: 1,
                                                        height: 40,
                                                        padding: 12,
                                                        backgroundColor:
                                                            pageSettings.photo_section_overlay_color ===
                                                            color
                                                                ? "#ECECEC"
                                                                : "white",
                                                        borderRadius: 2,
                                                        outline: `${theme.border.width}px solid ${pageSettings.photo_section_overlay_color === color ? "#757575" : "#E5E6E8"}`,
                                                        border: "none",
                                                        display: "flex",
                                                        justifyContent:
                                                            "center",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            color:
                                                                pageSettings.photo_section_overlay_color ===
                                                                color
                                                                    ? "black"
                                                                    : "#AEAEAE",
                                                            fontFamily:
                                                                theme.font.body,
                                                        }}
                                                    >
                                                        {color === "#ffffff"
                                                            ? "흰색"
                                                            : "검정색"}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ width: "100%", marginTop: 12 }}>
                                <SaveSectionButton
                                    onSave={async () => {
                                        await savePageSettings(
                                            {
                                                wedding_date:
                                                    pageSettings.wedding_date,
                                                wedding_hour:
                                                    pageSettings.wedding_hour,
                                                wedding_minute:
                                                    pageSettings.wedding_minute,
                                                photo_section_locale:
                                                    pageSettings.photo_section_locale,
                                                venue_name:
                                                    pageSettings.venue_name,
                                                photo_section_overlay_position:
                                                    pageSettings.photo_section_overlay_position,
                                                photo_section_overlay_color:
                                                    pageSettings.photo_section_overlay_color,
                                            },
                                            { silent: true }
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 초대글 */}
                    <AccordionSection
                        title="초대글"
                        sectionKey="invite"
                        isOpen={currentOpenSection === "invite"}
                        onToggle={async () => await toggleSection("invite")}
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: "10px",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.sm,
                                }}
                            >
                                {/* 미리보기 */}
                                <div
                                    style={{
                                        width: "100%",
                                        padding: 20,
                                        background: "#FAFAFA",
                                        border: `1px solid ${theme.color.border}`,
                                        borderRadius: 2,
                                    }}
                                >
                                    {/* InviteName.tsx의 렌더링을 반영한 미리보기 */}
                                    <div
                                        style={{
                                            alignSelf: "stretch",
                                            textAlign: "center",
                                            color: "black",
                                            fontSize: 16,
                                            fontFamily: theme.font.body,
                                            lineHeight: "32px",
                                            wordWrap: "break-word",
                                        }}
                                    >
                                        {renderInvitationSegmentsPreview(
                                            inviteData.invitationText,
                                            { ...theme.font.bodyBold }
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            width: "fit-content",
                                            whiteSpace: "nowrap",
                                            display: "flex",
                                            alignSelf: "stretch",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 20,
                                            marginTop: 16,
                                            marginLeft: "auto",
                                            marginRight: "auto",
                                        }}
                                    >
                                        {/* 좌측 부모/호칭 컬럼 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                display: "inline-flex",
                                                flexDirection: "column",
                                                justifyContent: "flex-start",
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            {/* 신랑 부모 라인 */}
                                            <div
                                                style={{
                                                    display: "inline-flex",
                                                    justifyContent:
                                                        "flex-start",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        justifyContent:
                                                            "flex-start",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        display: "flex",
                                                        marginLeft:
                                                            inviteData.showGroomFatherChrysanthemum
                                                                ? -16
                                                                : 0,
                                                    }}
                                                >
                                                    {inviteData.showGroomFatherChrysanthemum && (
                                                        <InlineChrysanthemumIcon />
                                                    )}
                                                    <div
                                                        style={{
                                                            color: "black",
                                                            fontSize: 18,
                                                            fontFamily:
                                                                theme.font.body,
                                                            lineHeight: "32px",
                                                            wordWrap:
                                                                "break-word",
                                                        }}
                                                    >
                                                        {inviteData.groomFatherName ||
                                                            ""}
                                                    </div>
                                                    {dotNeededLocal(
                                                        inviteData.groomFatherName,
                                                        inviteData.groomMotherName
                                                    ) && (
                                                        <div
                                                            style={{
                                                                color: "black",
                                                                fontSize: 18,
                                                                fontFamily:
                                                                    theme.font
                                                                        .body,
                                                                lineHeight:
                                                                    "32px",
                                                                wordWrap:
                                                                    "break-word",
                                                            }}
                                                        >
                                                            ·
                                                        </div>
                                                    )}
                                                    {inviteData.showGroomMotherChrysanthemum && (
                                                        <InlineChrysanthemumIcon />
                                                    )}
                                                    <div
                                                        style={{
                                                            color: "black",
                                                            fontSize: 18,
                                                            fontFamily:
                                                                theme.font.body,
                                                            lineHeight: "32px",
                                                            wordWrap:
                                                                "break-word",
                                                        }}
                                                    >
                                                        {inviteData.groomMotherName ||
                                                            ""}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        color: "black",
                                                        fontSize: 18,
                                                        fontFamily:
                                                            theme.font.body,
                                                        lineHeight: "32px",
                                                        wordWrap: "break-word",
                                                    }}
                                                >
                                                    의
                                                </div>
                                                <div
                                                    style={{
                                                        color: "black",
                                                        fontSize: 18,
                                                        fontFamily:
                                                            theme.font.body,
                                                        lineHeight: "32px",
                                                        wordWrap: "break-word",
                                                    }}
                                                >
                                                    {inviteData.sonLabel ||
                                                        "아들"}
                                                </div>
                                            </div>
                                            {/* 신부 부모 라인 */}
                                            <div
                                                style={{
                                                    display: "inline-flex",
                                                    justifyContent:
                                                        "flex-start",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        justifyContent:
                                                            "flex-start",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        display: "flex",
                                                        marginLeft:
                                                            inviteData.showBrideFatherChrysanthemum
                                                                ? -16
                                                                : 0,
                                                    }}
                                                >
                                                    {inviteData.showBrideFatherChrysanthemum && (
                                                        <InlineChrysanthemumIcon />
                                                    )}
                                                    <div
                                                        style={{
                                                            color: "black",
                                                            fontSize: 18,
                                                            fontFamily:
                                                                theme.font.body,
                                                            lineHeight: "32px",
                                                            wordWrap:
                                                                "break-word",
                                                        }}
                                                    >
                                                        {inviteData.brideFatherName ||
                                                            ""}
                                                    </div>
                                                    {dotNeededLocal(
                                                        inviteData.brideFatherName,
                                                        inviteData.brideMotherName
                                                    ) && (
                                                        <div
                                                            style={{
                                                                color: "black",
                                                                fontSize: 18,
                                                                fontFamily:
                                                                    theme.font
                                                                        .body,
                                                                lineHeight:
                                                                    "32px",
                                                                wordWrap:
                                                                    "break-word",
                                                            }}
                                                        >
                                                            ·
                                                        </div>
                                                    )}
                                                    {inviteData.showBrideMotherChrysanthemum && (
                                                        <InlineChrysanthemumIcon />
                                                    )}
                                                    <div
                                                        style={{
                                                            color: "black",
                                                            fontSize: 18,
                                                            fontFamily:
                                                                theme.font.body,
                                                            lineHeight: "32px",
                                                            wordWrap:
                                                                "break-word",
                                                        }}
                                                    >
                                                        {inviteData.brideMotherName ||
                                                            ""}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        color: "black",
                                                        fontSize: 18,
                                                        fontFamily:
                                                            theme.font.body,
                                                        lineHeight: "32px",
                                                        wordWrap: "break-word",
                                                    }}
                                                >
                                                    의
                                                </div>
                                                <div
                                                    style={{
                                                        color: "black",
                                                        fontSize: 18,
                                                        fontFamily:
                                                            theme.font.body,
                                                        lineHeight: "32px",
                                                        wordWrap: "break-word",
                                                    }}
                                                >
                                                    {inviteData.daughterLabel ||
                                                        "딸"}
                                                </div>
                                            </div>
                                        </div>
                                        {/* 우측 이름 컬럼 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                flexDirection: "column",
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                                display: "inline-flex",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: "black",
                                                    fontSize: 18,
                                                    ...pretendardSemiBoldStyle,
                                                    lineHeight: "32px",
                                                    wordWrap: "break-word",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {inviteData.groomName || ""}
                                            </div>
                                            <div
                                                style={{
                                                    color: "black",
                                                    fontSize: 18,
                                                    ...pretendardSemiBoldStyle,
                                                    lineHeight: "32px",
                                                    wordWrap: "break-word",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {inviteData.brideName || ""}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        ...theme.typography.preview,
                                    }}
                                >
                                    미리보기
                                </div>

                                {/* 초대글 본문 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <Label>초대글</Label>
                                    <div
                                        style={{
                                            width: "100%",
                                            padding: 12,
                                            background: "#FAFAFA",
                                            border: `1px solid ${theme.color.border}`,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <textarea
                                            id="inviteTextArea"
                                            value={inviteData.invitationText}
                                            onChange={(e) =>
                                                updateInviteField(
                                                    "invitationText",
                                                    e.target.value
                                                )
                                            }
                                            rows={6}
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                height: "calc(120px * 1.1429)", // rows={6} * 20px lineHeight
                                                border: "none",
                                                outline: "none",
                                                background: "transparent",
                                                fontFamily: theme.font.body,
                                                fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                                marginTop: "-8px", // 상단 여백 줄이기
                                                marginBottom:
                                                    "calc(120px - 120px * 0.875)", // 하단 여백 제거
                                                lineHeight:
                                                    "calc(20px * 1.1429)",
                                                paddingLeft:
                                                    "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                color: inviteData.invitationText
                                                    ? "black"
                                                    : "#ADADAD",
                                                resize: "vertical",
                                            }}
                                            placeholder={
                                                "민준과 서윤 결혼합니다.\n저희 두 사람이 함께하는 새로운 시작에\n귀한 발걸음으로 축복해 주시면 감사하겠습니다."
                                            }
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 4,
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                insertInviteFormat("bold")
                                            }
                                            style={{
                                                padding: "4px 8px",
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                ...theme.font.bodyBold,
                                                fontSize: 12,
                                                cursor: "pointer",
                                                color: "#7F7F7F",
                                                lineHeight: "20px",
                                                WebkitAppearance: "none",
                                                MozAppearance: "none",
                                                appearance: "none",
                                                WebkitTextStroke:
                                                    "0px transparent",
                                                borderRadius: "2px",
                                            }}
                                        >
                                            볼드
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                insertInviteFormat("quote")
                                            }
                                            style={{
                                                padding: "4px 8px",
                                                background: "white",
                                                color: "#7f7f7f",
                                                border: `1px solid ${theme.color.border}`,
                                                fontFamily: theme.font.body,
                                                fontSize: 12,
                                                cursor: "pointer",
                                            }}
                                        >
                                            인용
                                        </button>
                                    </div>
                                </div>

                                {/* 신랑측 성함 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 14, // 특수 간격 유지
                                        marginTop: 12,
                                    }}
                                >
                                    <span style={theme.typography.label}>
                                        신랑측 성함
                                    </span>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "inline-flex",
                                            gap: theme.gap.sm,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 40,
                                                    padding: 12,
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        inviteData.groomFatherName
                                                    }
                                                    onChange={(e) =>
                                                        updateInviteField(
                                                            "groomFatherName",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="아버지 성함"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    }}
                                                />
                                            </div>
                                            <Switch
                                                checked={
                                                    !!inviteData.showGroomFatherChrysanthemum
                                                }
                                                onChange={(checked) =>
                                                    updateInviteField(
                                                        "showGroomFatherChrysanthemum",
                                                        checked
                                                    )
                                                }
                                                label="국화꽃 표시"
                                            />
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 40,
                                                    padding: 12,
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        inviteData.groomMotherName
                                                    }
                                                    onChange={(e) =>
                                                        updateInviteField(
                                                            "groomMotherName",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="어머니 성함"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    }}
                                                />
                                            </div>
                                            <Switch
                                                checked={
                                                    !!inviteData.showGroomMotherChrysanthemum
                                                }
                                                onChange={(checked) =>
                                                    updateInviteField(
                                                        "showGroomMotherChrysanthemum",
                                                        checked
                                                    )
                                                }
                                                label="국화꽃 표시"
                                            />
                                        </div>
                                        {/* 호칭 */}
                                        <Select
                                            value={inviteData.sonLabel}
                                            onChange={(e) =>
                                                updateInviteField(
                                                    "sonLabel",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {[
                                                "아들",
                                                "장남",
                                                "차남",
                                                "삼남",
                                            ].map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div
                                        style={{
                                            height: 40,
                                            padding: 12,
                                            border: `1px solid ${theme.color.border}`,
                                            borderRadius: 2,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={inviteData.groomName}
                                            onChange={(e) =>
                                                updateInviteField(
                                                    "groomName",
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                pageSettings.groom_name_kr ||
                                                "신랑 성함"
                                            }
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                border: "none",
                                                outline: "none",
                                                borderRadius: 2,
                                                paddingLeft:
                                                    "calc(0px * 0.875)",
                                                fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* 신부측 성함 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 14, // 특수 간격 유지
                                        padding: "14px 0px 0px 0px",
                                    }}
                                >
                                    <span style={theme.typography.label}>
                                        신부측 성함
                                    </span>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "inline-flex",
                                            gap: theme.gap.sm,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 40,
                                                    padding: 12,
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        inviteData.brideFatherName
                                                    }
                                                    onChange={(e) =>
                                                        updateInviteField(
                                                            "brideFatherName",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="아버지 성함"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    }}
                                                />
                                            </div>
                                            <Switch
                                                checked={
                                                    !!inviteData.showBrideFatherChrysanthemum
                                                }
                                                onChange={(checked) =>
                                                    updateInviteField(
                                                        "showBrideFatherChrysanthemum",
                                                        checked
                                                    )
                                                }
                                                label="국화꽃 표시"
                                            />
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 40,
                                                    padding: 12,
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        inviteData.brideMotherName
                                                    }
                                                    onChange={(e) =>
                                                        updateInviteField(
                                                            "brideMotherName",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="어머니 성함"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    }}
                                                />
                                            </div>
                                            <Switch
                                                checked={
                                                    !!inviteData.showBrideMotherChrysanthemum
                                                }
                                                onChange={(checked) =>
                                                    updateInviteField(
                                                        "showBrideMotherChrysanthemum",
                                                        checked
                                                    )
                                                }
                                                label="국화꽃 표시"
                                            />
                                        </div>
                                        {/* 호칭 */}
                                        <Select
                                            value={inviteData.daughterLabel}
                                            onChange={(e) =>
                                                updateInviteField(
                                                    "daughterLabel",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {["딸", "장녀", "차녀", "삼녀"].map(
                                                (opt) => (
                                                    <option
                                                        key={opt}
                                                        value={opt}
                                                    >
                                                        {opt}
                                                    </option>
                                                )
                                            )}
                                        </Select>
                                    </div>
                                    <div
                                        style={{
                                            height: 40,
                                            padding: 12,
                                            borderRadius: 2,
                                            border: `1px solid ${theme.color.border}`,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 10,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={inviteData.brideName}
                                            onChange={(e) =>
                                                updateInviteField(
                                                    "brideName",
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                pageSettings.bride_name_kr ||
                                                "신부 성함"
                                            }
                                            style={{
                                                width: "calc(100% * 1.1429)",
                                                border: "none",
                                                outline: "none",
                                                borderRadius: 2,
                                                paddingLeft:
                                                    "calc(0px * 0.875)",
                                                fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                transformOrigin: "left center",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ width: "100%", marginTop: 12 }}>
                                    <SaveSectionButton
                                        onSave={async () => {
                                            await saveInviteData()
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 연락처 */}
                    <AccordionSection
                        title="연락처"
                        sectionKey="contacts"
                        isOpen={currentOpenSection === "contacts"}
                        onToggle={async () => await toggleSection("contacts")}
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: "10px",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.sm,
                                }}
                            >
                                {/* 초대글에서 이름 불러오기 버튼 */}
                                {(inviteData.groomName ||
                                    inviteData.brideName ||
                                    inviteData.groomFatherName ||
                                    inviteData.groomMotherName ||
                                    inviteData.brideFatherName ||
                                    inviteData.brideMotherName) && (
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            marginBottom: theme.gap.sm,
                                        }}
                                    >
                                        <button
                                            onClick={() => {
                                                // 초대글의 이름들을 연락처 필드로 복사
                                                setSelectedContact(
                                                    (prev) =>
                                                        ({
                                                            ...(prev || {}),
                                                            page_id:
                                                                prev?.page_id ||
                                                                currentPageId,
                                                            groom_name:
                                                                inviteData.groomName ||
                                                                prev?.groom_name ||
                                                                "",
                                                            bride_name:
                                                                inviteData.brideName ||
                                                                prev?.bride_name ||
                                                                "",
                                                            groom_father_name:
                                                                inviteData.groomFatherName ||
                                                                prev?.groom_father_name ||
                                                                "",
                                                            groom_mother_name:
                                                                inviteData.groomMotherName ||
                                                                prev?.groom_mother_name ||
                                                                "",
                                                            bride_father_name:
                                                                inviteData.brideFatherName ||
                                                                prev?.bride_father_name ||
                                                                "",
                                                            bride_mother_name:
                                                                inviteData.brideMotherName ||
                                                                prev?.bride_mother_name ||
                                                                "",
                                                        }) as ContactInfo
                                                )
                                            }}
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor:
                                                    theme.color.surface,
                                                color: theme.color.text,
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: theme.radius.sm,
                                                fontSize: theme.text.sm,
                                                ...theme.font.bodyBold,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: theme.gap.sm,
                                            }}
                                        >
                                            앞에서 이름 불러오기
                                        </button>
                                    </div>
                                )}

                                {/* 신랑 */}
                                <div
                                    style={{
                                        display: "flex",
                                        marginTop: 16,
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...theme.typography.label,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>신랑</span>
                                        <div
                                            style={{ width: 22, height: 13.75 }}
                                        >
                                            <ContactToggleButton
                                                isOn={contactToggles.groom}
                                                onChange={(isOn) =>
                                                    handleContactToggleChange(
                                                        "groom",
                                                        isOn
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.groom_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="신랑 이름"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    color: selectedContact?.groom_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={(
                                                    selectedContact?.groom_phone ||
                                                    ""
                                                )
                                                    .replace(/\D/g, "")
                                                    .replace(
                                                        /^(\d{3})(\d{3,4})(\d{0,4}).*$/,
                                                        (m, a, b, c) =>
                                                            c
                                                                ? `${a}-${b}-${c}`
                                                                : b
                                                                  ? `${a}-${b}`
                                                                  : `${a}`
                                                    )}
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    color: selectedContact?.groom_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 신랑 아버지 */}
                                <div
                                    style={{
                                        display: "flex",
                                        marginTop: 16,
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...theme.typography.label,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>신랑 아버지</span>
                                        <div
                                            style={{ width: 22, height: 13.75 }}
                                        >
                                            <ContactToggleButton
                                                isOn={
                                                    contactToggles.groomFather
                                                }
                                                onChange={(isOn) =>
                                                    handleContactToggleChange(
                                                        "groomFather",
                                                        isOn
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.groom_father_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_father_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="신랑 아버지 이름"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.groom_father_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={(
                                                    selectedContact?.groom_father_phone ||
                                                    ""
                                                )
                                                    .replace(/\D/g, "")
                                                    .replace(
                                                        /^(\d{3})(\d{3,4})(\d{0,4}).*$/,
                                                        (m, a, b, c) =>
                                                            c
                                                                ? `${a}-${b}-${c}`
                                                                : b
                                                                  ? `${a}-${b}`
                                                                  : `${a}`
                                                    )}
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_father_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.groom_father_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 신랑 어머니 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        marginTop: 16,
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...theme.typography.label,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>신랑 어머니</span>
                                        <div
                                            style={{ width: 22, height: 13.75 }}
                                        >
                                            <ContactToggleButton
                                                isOn={
                                                    contactToggles.groomMother
                                                }
                                                onChange={(isOn) =>
                                                    handleContactToggleChange(
                                                        "groomMother",
                                                        isOn
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.groom_mother_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_mother_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="신랑 어머니 이름"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.groom_mother_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={(
                                                    selectedContact?.groom_mother_phone ||
                                                    ""
                                                )
                                                    .replace(/\D/g, "")
                                                    .replace(
                                                        /^(\d{3})(\d{3,4})(\d{0,4}).*$/,
                                                        (m, a, b, c) =>
                                                            c
                                                                ? `${a}-${b}-${c}`
                                                                : b
                                                                  ? `${a}-${b}`
                                                                  : `${a}`
                                                    )}
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_mother_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.groom_mother_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 신부 */}
                                <div
                                    style={{
                                        marginTop: 48,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...theme.typography.label,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>신부</span>
                                        <div
                                            style={{ width: 22, height: 13.75 }}
                                        >
                                            <ContactToggleButton
                                                isOn={contactToggles.bride}
                                                onChange={(isOn) =>
                                                    handleContactToggleChange(
                                                        "bride",
                                                        isOn
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.bride_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="신부 이름"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={(
                                                    selectedContact?.bride_phone ||
                                                    ""
                                                )
                                                    .replace(/\D/g, "")
                                                    .replace(
                                                        /^(\d{3})(\d{3,4})(\d{0,4}).*$/,
                                                        (m, a, b, c) =>
                                                            c
                                                                ? `${a}-${b}-${c}`
                                                                : b
                                                                  ? `${a}-${b}`
                                                                  : `${a}`
                                                    )}
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* 신부 아버지 */}
                                <div
                                    style={{
                                        display: "flex",
                                        marginTop: 16,
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...theme.typography.label,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>신부 아버지</span>
                                        <div
                                            style={{ width: 22, height: 13.75 }}
                                        >
                                            <ContactToggleButton
                                                isOn={
                                                    contactToggles.brideFather
                                                }
                                                onChange={(isOn) =>
                                                    handleContactToggleChange(
                                                        "brideFather",
                                                        isOn
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.bride_father_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_father_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="신부 아버지 이름"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_father_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={(
                                                    selectedContact?.bride_father_phone ||
                                                    ""
                                                )
                                                    .replace(/\D/g, "")
                                                    .replace(
                                                        /^(\d{3})(\d{3,4})(\d{0,4}).*$/,
                                                        (m, a, b, c) =>
                                                            c
                                                                ? `${a}-${b}-${c}`
                                                                : b
                                                                  ? `${a}-${b}`
                                                                  : `${a}`
                                                    )}
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_father_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_father_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 신부 어머니 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                        marginTop: 16,
                                        marginBottom: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...theme.typography.label,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>신부 어머니</span>
                                        <div
                                            style={{ width: 22, height: 13.75 }}
                                        >
                                            <ContactToggleButton
                                                isOn={
                                                    contactToggles.brideMother
                                                }
                                                onChange={(isOn) =>
                                                    handleContactToggleChange(
                                                        "brideMother",
                                                        isOn
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.bride_mother_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_mother_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="신부 어머니 이름"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_mother_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={(
                                                    selectedContact?.bride_mother_phone ||
                                                    ""
                                                )
                                                    .replace(/\D/g, "")
                                                    .replace(
                                                        /^(\d{3})(\d{3,4})(\d{0,4}).*$/,
                                                        (m, a, b, c) =>
                                                            c
                                                                ? `${a}-${b}-${c}`
                                                                : b
                                                                  ? `${a}-${b}`
                                                                  : `${a}`
                                                    )}
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_mother_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_mother_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: "100%", marginTop: 12 }}>
                                <SaveSectionButton
                                    onSave={async () => {
                                        await handleSaveContactInline()
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>
                    {/* 캘린더 */}
                    <AccordionSection
                        title="캘린더"
                        sectionKey="calendar"
                        isOpen={currentOpenSection === "calendar"}
                        onToggle={async () => await toggleSection("calendar")}
                    >
                        <div
                            style={{
                                padding: "32px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.sm,
                                    alignItems: "flex-start",
                                }}
                            >
                                {/* 미리보기 영역 */}
                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 520,
                                            background: "#FAFAFA",
                                            border: `1px solid ${theme.color.border}`,
                                            borderRadius: 2,
                                            outlineOffset: -0.25,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {/* 기존 캘린더 미리보기 */}
                                        <InlineCalendarPreview
                                            date={pageSettings.wedding_date}
                                            hour={pageSettings.wedding_hour}
                                            minute={pageSettings.wedding_minute}
                                            groomName={inviteData.groomName}
                                            brideName={inviteData.brideName}
                                            highlightColor={
                                                pageSettings.highlight_color ||
                                                "#e0e0e0"
                                            }
                                            highlightShape={
                                                (pageSettings.highlight_shape as
                                                    | "circle"
                                                    | "heart") || "circle"
                                            }
                                            highlightTextColor={
                                                (pageSettings.highlight_text_color as
                                                    | "black"
                                                    | "white"
                                                    | "#000000"
                                                    | "#ffffff") || "black"
                                            }
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            textAlign: "center",
                                            color: "#7F7F7F",
                                            fontSize: 14,
                                            fontFamily: theme.font.body,
                                        }}
                                    >
                                        미리보기
                                    </div>
                                </div>

                                {/* 설정 섹션들 */}
                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 16,
                                        alignItems: "stretch",
                                        marginTop: 12,
                                    }}
                                >
                                    {/* 예식일 표시 텍스트 */}
                                    <FormField
                                    label="캘린더 텍스트"
                                    style={{ marginTop: 12 }}
                                >
                                    <InputBase
                                        type="text"
                                        value={pageSettings.cal_txt || ""}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                cal_txt: e.target.value,
                                            })
                                        }
                                        onBlur={(e) =>
                                            void savePageSettings({
                                                cal_txt: e.target.value,
                                            })
                                        }
                                        placeholder={`${inviteData.groomName || ""} ♥ ${inviteData.brideName || ""}의 결혼식`}
                                    />
                                </FormField>

                                    {/* 예식일 표시 모양 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                textAlign: "center",
                                                ...theme.typography.label,
                                            }}
                                        >
                                            예식일 표시 모양
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 36,
                                                alignItems: "center",
                                                marginTop: 6,
                                            }}
                                        >
                                            {/* 원형 라디오 버튼 */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        highlight_shape:
                                                            "circle",
                                                    })
                                                }
                                            >
                                                <div
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        border: `1px solid ${theme.color.border}`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    {(pageSettings.highlight_shape ||
                                                        "circle") ===
                                                        "circle" && (
                                                        <div
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                backgroundColor:
                                                                    "black",
                                                                borderRadius:
                                                                    "50%",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "#757575",
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                    }}
                                                >
                                                    원형
                                                </div>
                                            </div>

                                            {/* 하트 라디오 버튼 */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        highlight_shape:
                                                            "heart",
                                                    })
                                                }
                                            >
                                                <div
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        border: `1px solid ${theme.color.border}`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    {pageSettings.highlight_shape ===
                                                        "heart" && (
                                                        <div
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                backgroundColor:
                                                                    "black",
                                                                borderRadius:
                                                                    "50%",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "#757575",
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                    }}
                                                >
                                                    하트
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 모양 색상 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 18,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                textAlign: "center",
                                                ...theme.typography.label,
                                                marginTop: 12,
                                            }}
                                        >
                                            모양 색상
                                        </div>
                                        <div
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 18,
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            {/* 색상 선택 버튼들 */}
                                            <div
                                                style={{
                                                    width: "100%",
                                                    padding: "0 20px",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {[
                                                    {
                                                        color: "#D9D9D9",
                                                        value: "#D9D9D9",
                                                    },
                                                    {
                                                        color: "black",
                                                        value: "black",
                                                    },
                                                    {
                                                        color: "#FF7A7A",
                                                        value: "#FF7A7A",
                                                    },
                                                    {
                                                        color: "#318947",
                                                        value: "#318947",
                                                    },
                                                ].map((item, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            padding: 0,
                                                            borderRadius: 20,
                                                            border:
                                                                (pageSettings.highlight_color ||
                                                                    "#e0e0e0") ===
                                                                item.value
                                                                    ? "1.5px solid #757575"
                                                                    : "1.5px solid #E5E6E8",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() =>
                                                            setPageSettings({
                                                                ...pageSettings,
                                                                highlight_color:
                                                                    item.value,
                                                            })
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                backgroundColor:
                                                                    item.color,
                                                                borderRadius:
                                                                    "50%",
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 커스텀 색상 선택기 */}
                                            <CustomColorPicker
                                                value={
                                                    pageSettings.highlight_color ||
                                                    "#e0e0e0"
                                                }
                                                onChange={(color) => {
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        highlight_color: color,
                                                    })
                                                }}
                                                theme={theme}
                                            />
                                        </div>
                                    </div>

                                    {/* 텍스트 색상 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                textAlign: "center",
                                                ...theme.typography.label,
                                                marginTop: 12,
                                            }}
                                        >
                                            텍스트 색상
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 32,
                                                alignItems: "center",
                                                marginTop: 6,
                                                marginBottom: 12,
                                            }}
                                        >
                                            {/* 검정 라디오 버튼 */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        highlight_text_color:
                                                            "black",
                                                    })
                                                }
                                            >
                                                <div
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        border: `1px solid ${theme.color.border}`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    {(pageSettings.highlight_text_color ||
                                                        "black") ===
                                                        "black" && (
                                                        <div
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                backgroundColor:
                                                                    "black",
                                                                borderRadius:
                                                                    "50%",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "#757575",
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                    }}
                                                >
                                                    검정
                                                </div>
                                            </div>

                                            {/* 흰색 라디오 버튼 */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        highlight_text_color:
                                                            "white",
                                                    })
                                                }
                                            >
                                                <div
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        border: `1px solid ${theme.color.border}`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    {pageSettings.highlight_text_color ===
                                                        "white" && (
                                                        <div
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                backgroundColor:
                                                                    "black",
                                                                borderRadius:
                                                                    "50%",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "#757575",
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                    }}
                                                >
                                                    흰색
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: "100%", marginTop: 12 }}>
                                <SaveSectionButton
                                    onSave={async () => {
                                        await savePageSettings(
                                            {
                                                highlight_shape:
                                                    pageSettings.highlight_shape,
                                                highlight_color:
                                                    pageSettings.highlight_color,
                                                highlight_text_color:
                                                    pageSettings.highlight_text_color,
                                            },
                                            { silent: true }
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 교통 안내 */}
                    <AccordionSection
                        title="교통 안내"
                        sectionKey="transport"
                        isOpen={currentOpenSection === "transport"}
                        onToggle={async () => await toggleSection("transport")}
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.sm,
                                    alignItems: "flex-start",
                                }}
                            >
                                <TransportTab
                                    pageId={currentPageId}
                                    tokenGetter={getAuthToken}
                                    hideSaveButton={true}
                                    onSaveRef={transportTabSaveRef}
                                    setPageSettings={setPageSettings}
                                />
                                <div style={{ width: "100%", marginTop: 12 }}>
                                    <SaveSectionButton
                                        onSave={async () => {
                                            // TransportTab의 save 함수를 직접 호출
                                            if (transportTabSaveRef.current) {
                                                await transportTabSaveRef.current()
                                            } else {
                                                throw new Error(
                                                    "TransportTab save 함수를 찾을 수 없습니다"
                                                )
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 비디오 */}
                    <AccordionSection
                        title="비디오"
                        sectionKey="video"
                        isOpen={currentOpenSection === "video"}
                        onToggle={async () => await toggleSection("video")}
                        toggleButton={
                            <ToggleButton
                                isOn={!!pageSettings.vid_url}
                                onToggle={async () => {
                                    // 토글 버튼은 단순히 섹션을 열고 닫는 역할만 함
                                    // 실제 토글 상태 변경은 필요 없음
                                }}
                            />
                        }
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                flexDirection: "column",
                                gap: theme.gap.lg,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color: "#666",
                                        fontSize: "14px",
                                        fontFamily: theme.font.body,
                                        wordWrap: "break-word",
                                        marginBottom: theme.space(4),
                                        lineHeight: "1.5em",
                                    }}
                                >
                                    비디오는 갤러리 하단에 추가됩니다. 유튜브에
                                    업로드 후 URL을 복사하여 추가해주세요.
                                </div>
                                <div
                                    style={{
                                        width: "calc(100% * 1.1429)",
                                        height: "calc(40px * 1.1429)",
                                        transform: "scale(0.875)",
                                        transformOrigin: "left center",
                                        display: "flex",
                                        gap: 6,
                                    }}
                                >
                                    <input
                                        style={{
                                            flex: 1,
                                            height: "100%",
                                            padding: "calc(12px * 1.1429)",
                                            paddingLeft: "calc(12px * 0.875)",
                                            background: "#f5f5f5",
                                            border: `1px solid ${theme.color.border}`,
                                            outlineOffset: -0.25,
                                            borderRadius: 2,
                                            fontSize: 16,
                                            fontFamily: theme.font.body,
                                            color: pageSettings.vid_url
                                                ? "black"
                                                : "#ADADAD",
                                            cursor: "pointer",
                                        }}
                                        placeholder="https://www.youtube.com/watch?v=roarc"
                                        value={pageSettings.vid_url || ""}
                                        onChange={(e) => {
                                            const newValue = e.target.value
                                            // 입력값은 제한 없이 상태에 저장 (검증은 저장 버튼 클릭 시)
                                            setPageSettings({
                                                ...pageSettings,
                                                vid_url: newValue,
                                            })
                                        }}
                                    />
                                    {pageSettings.vid_url ? (
                                        // URL이 입력되어 있을 때: 삭제 버튼
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setPageSettings({
                                                    ...pageSettings,
                                                    vid_url: "",
                                                })
                                                // 수동 저장
                                                await savePageSettings({
                                                    vid_url: "",
                                                })
                                            }}
                                            style={{
                                                width: 90,
                                                height: "100%",
                                                paddingLeft: 12,
                                                paddingRight: 12,
                                                paddingTop: 0,
                                                paddingBottom: 0,
                                                background: "white",
                                                border: "1px solid #f7b0b0",
                                                borderRadius: 2,
                                                cursor: "pointer",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                display: "flex",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: "#b12525",
                                                    fontSize: 14,
                                                    fontFamily: theme.font.body,
                                                    fontWeight: 600,
                                                    wordWrap: "break-word",
                                                }}
                                            >
                                                삭제
                                            </div>
                                        </button>
                                    ) : (
                                        // URL이 비어있을 때: 저장 버튼
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const currentUrl =
                                                    pageSettings.vid_url || ""
                                                if (
                                                    isValidVideoUrl(currentUrl)
                                                ) {
                                                    await savePageSettings({
                                                        vid_url: currentUrl,
                                                    })
                                                } else {
                                                    // 유효하지 않은 URL 메시지 표시
                                                    alert(
                                                        "URL 주소를 확인해주세요"
                                                    )
                                                }
                                            }}
                                            style={{
                                                width: 90,
                                                height: "100%",
                                                paddingLeft: 12,
                                                paddingRight: 12,
                                                paddingTop: 0,
                                                paddingBottom: 0,
                                                background: "#000000",
                                                border: "none",
                                                borderRadius: 2,
                                                cursor: "pointer",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                display: "flex",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: "#000000",
                                                    fontSize: 14,
                                                    fontFamily: theme.font.body,
                                                    fontWeight: 600,
                                                    wordWrap: "break-word",
                                                }}
                                            >
                                                저장
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 안내 사항 */}
                    <AccordionSection
                        title="안내 사항"
                        sectionKey="info"
                        isOpen={currentOpenSection === "info"}
                        onToggle={async () => await toggleSection("info")}
                        toggleButton={
                            <ToggleButton
                                isOn={pageSettings.info === "on"}
                                onToggle={async () => {
                                    const newInfo =
                                        pageSettings.info === "on"
                                            ? "off"
                                            : "on"
                                    setPageSettings((prev) => ({
                                        ...prev,
                                        info: newInfo,
                                    }))
                                    await savePageSettings(
                                        { info: newInfo },
                                        { silent: true }
                                    )
                                }}
                            />
                        }
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: "10px",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.sm,
                                    alignItems: "flex-start",
                                }}
                            >
                                <InfoTab
                                    pageId={currentPageId}
                                    tokenGetter={getAuthToken}
                                />
                                {/* 안내 사항: 저장 버튼 중복 방지 위해 기존 추가 버튼 제거 (아코디언 닫힘 저장 유지) */}
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 계좌 안내 */}
                    <AccordionSection
                        title="계좌 안내"
                        sectionKey="account"
                        isOpen={currentOpenSection === "account"}
                        onToggle={async () => await toggleSection("account")}
                        toggleButton={
                            <ToggleButton
                                isOn={pageSettings.account === "on"}
                                onToggle={async () => {
                                    const newAccount =
                                        pageSettings.account === "on"
                                            ? "off"
                                            : "on"
                                    setPageSettings((prev) => ({
                                        ...prev,
                                        account: newAccount,
                                    }))
                                    await savePageSettings(
                                        { account: newAccount },
                                        { silent: true }
                                    )
                                }}
                            />
                        }
                    >
                        <div
                            style={{
                                padding: "16px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: "10px",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "36px",
                                }}
                            >
                                {/* 계좌번호 입력 폼들 */}
                                {/* 신랑측 계좌 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    {/* 신랑 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...theme.typography.label,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>신랑</span>
                                            <div
                                                style={{
                                                    width: 22,
                                                    height: 13.75,
                                                }}
                                            >
                                                <ContactToggleButton
                                                    isOn={accountToggles.groom}
                                                    onChange={(isOn) =>
                                                        handleAccountToggleChange(
                                                            "groom",
                                                            isOn
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.groom_bank_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="예금주"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                    color: selectedContact?.groom_bank_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                                width: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 0.3,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.groom_bank ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "groom_bank",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="은행명"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                        color: selectedContact?.groom_bank
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.groom_account ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "groom_account",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="계좌번호"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)", // scale로 인한 좌측 여백 보정
                                                        color: selectedContact?.groom_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 신랑 아버지 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            marginTop: 16,
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...theme.typography.label,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>신랑 혼주 1</span>
                                            <div
                                                style={{
                                                    width: 22,
                                                    height: 13.75,
                                                }}
                                            >
                                                <ContactToggleButton
                                                    isOn={
                                                        accountToggles.groomFather
                                                    }
                                                    onChange={(isOn) =>
                                                        handleAccountToggleChange(
                                                            "groomFather",
                                                            isOn
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.groom_father_bank_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_father_bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="예금주"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.groom_father_bank_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                                width: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 0.3,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.groom_father_bank ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "groom_father_bank",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="은행명"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.groom_father_bank
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.groom_father_account ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "groom_father_account",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="계좌번호"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.groom_father_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 신랑 어머니 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            marginTop: 16,
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...theme.typography.label,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>신랑 혼주 2</span>
                                            <div
                                                style={{
                                                    width: 22,
                                                    height: 13.75,
                                                }}
                                            >
                                                <ContactToggleButton
                                                    isOn={
                                                        accountToggles.groomMother
                                                    }
                                                    onChange={(isOn) =>
                                                        handleAccountToggleChange(
                                                            "groomMother",
                                                            isOn
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.groom_mother_bank_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_mother_bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="예금주"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.groom_mother_bank_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                                width: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 0.3,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.groom_mother_bank ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "groom_mother_bank",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="은행명"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.groom_mother_bank
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.groom_mother_account ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "groom_mother_account",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="계좌번호"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.groom_mother_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 신부측 계좌 */}
                                <div
                                    style={{
                                        display: "flex",
                                        marginTop: 16,
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    {/* 신부 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...theme.typography.label,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>신부</span>
                                            <div
                                                style={{
                                                    width: 22,
                                                    height: 13.75,
                                                }}
                                            >
                                                <ContactToggleButton
                                                    isOn={accountToggles.bride}
                                                    onChange={(isOn) =>
                                                        handleAccountToggleChange(
                                                            "bride",
                                                            isOn
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.bride_bank_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="예금주"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_bank_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                                width: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 0.3,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.bride_bank ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "bride_bank",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="은행명"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.bride_bank
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.bride_account ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "bride_account",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="계좌번호"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.bride_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 신부 아버지 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            marginTop: 16,
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...theme.typography.label,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>신부 혼주 1</span>
                                            <div
                                                style={{
                                                    width: 22,
                                                    height: 13.75,
                                                }}
                                            >
                                                <ContactToggleButton
                                                    isOn={
                                                        accountToggles.brideFather
                                                    }
                                                    onChange={(isOn) =>
                                                        handleAccountToggleChange(
                                                            "brideFather",
                                                            isOn
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.bride_father_bank_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_father_bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="예금주"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_father_bank_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                                width: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 0.3,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.bride_father_bank ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "bride_father_bank",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="은행명"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.bride_father_bank
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.bride_father_account ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "bride_father_account",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="계좌번호"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.bride_father_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 신부 어머니 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            marginTop: 16,
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...theme.typography.label,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>신부 혼주 2</span>
                                            <div
                                                style={{
                                                    width: 22,
                                                    height: 13.75,
                                                }}
                                            >
                                                <ContactToggleButton
                                                    isOn={
                                                        accountToggles.brideMother
                                                    }
                                                    onChange={(isOn) =>
                                                        handleAccountToggleChange(
                                                            "brideMother",
                                                            isOn
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {/* 이름 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: `1px solid ${theme.color.border}`,
                                                borderRadius: 2,
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    selectedContact?.bride_mother_bank_name ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_mother_bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="예금주"
                                                style={{
                                                    width: "calc(100% * 1.1429)",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                    transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                    transformOrigin:
                                                        "left center",
                                                    paddingLeft:
                                                        "calc(0px * 0.875)",
                                                    color: selectedContact?.bride_mother_bank_name
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                                width: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 0.3,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.bride_mother_bank ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "bride_mother_bank",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="은행명"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.bride_mother_bank
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius: 2,
                                                    outlineOffset: -0.25,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={
                                                        selectedContact?.bride_mother_account ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleContactInputChange(
                                                            "bride_mother_account",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="계좌번호"
                                                    style={{
                                                        width: "calc(100% * 1.1429)",
                                                        border: "none",
                                                        outline: "none",
                                                        borderRadius: 2,
                                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                        fontFamily:
                                                            theme.font.body,
                                                        transform:
                                                            "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                                        transformOrigin:
                                                            "left center",
                                                        paddingLeft:
                                                            "calc(0px * 0.875)",
                                                        color: selectedContact?.bride_mother_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: "100%", marginTop: 12 }}>
                                <SaveSectionButton
                                    onSave={async () => {
                                        // 전체 연락처 정보 저장 (계좌 정보 포함)
                                        await handleSaveContactInline()
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* RSVP */}
                    <AccordionSection
                        title="참석여부 RSVP"
                        sectionKey="rsvp"
                        isOpen={currentOpenSection === "rsvp"}
                        onToggle={async () => await toggleSection("rsvp")}
                        toggleButton={
                            <ToggleButton
                                isOn={pageSettings.rsvp === "on"}
                                onToggle={async () => {
                                    const newRsvp =
                                        pageSettings.rsvp === "on"
                                            ? "off"
                                            : "on"
                                    setPageSettings((prev) => ({
                                        ...prev,
                                        rsvp: newRsvp,
                                    }))
                                    await savePageSettings(
                                        { rsvp: newRsvp },
                                        { silent: true }
                                    )
                                }}
                            />
                        }
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: theme.color.textSecondary,
                                    lineHeight: "1.4",
                                }}
                            >
                                청첩장 하단에 참석 여부 입력 폼이 표시됩니다.
                            </div>
                            {/* 참석 명단 확인 버튼 */}
                            <div
                                style={{
                                    marginTop: 0,
                                }}
                            >
                                <div
                                    style={{
                                        marginTop: 18,
                                        marginBottom: 6,
                                        width: "100%",
                                        height: "40px",
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <button
                                        type="button"
                                        role="link"
                                        aria-label="참석 명단 확인"
                                        onClick={() => {
                                            if (typeof window !== "undefined") {
                                                const targetUrl = `https://admin.roarc.kr/rsvp/${currentPageId}`
                                                window.open(
                                                    targetUrl,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                )
                                            }
                                        }}
                                        style={{
                                            width: "50%",
                                            height: "100%",
                                            paddingLeft: 12,
                                            paddingRight: 12,
                                            paddingTop: 8,
                                            paddingBottom: 8,
                                            backgroundColor: "#3f3f3f",
                                            color: "white",
                                            outlineOffset: "-0.50px",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            display: "flex",
                                            border: "none",
                                            borderRadius: "2px",
                                            cursor: "pointer",
                                            opacity: 1,
                                            fontSize: "16px",
                                            fontFamily: theme.font.body,
                                        }}
                                    >
                                        참석 명단 확인
                                    </button>
                                </div>
                            </div>
                            {/* RSVP: 저장 버튼 제거 */}
                        </div>
                    </AccordionSection>

                    {/* 방명록 */}
                    <AccordionSection
                        title="방명록"
                        sectionKey="comments"
                        isOpen={currentOpenSection === "comments"}
                        onToggle={async () => await toggleSection("comments")}
                        toggleButton={
                            <ToggleButton
                                isOn={pageSettings.comments === "on"}
                                onToggle={async () => {
                                    const newComments =
                                        pageSettings.comments === "on"
                                            ? "off"
                                            : "on"
                                    setPageSettings((prev) => ({
                                        ...prev,
                                        comments: newComments,
                                    }))
                                    await savePageSettings(
                                        { comments: newComments },
                                        { silent: true }
                                    )
                                }}
                            />
                        }
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: theme.color.textSecondary,
                                    lineHeight: "1.4",
                                }}
                            >
                                청첩장 하단에 방명록 댓글 기능이 표시됩니다.
                            </div>
                            {/* 방명록: 저장 버튼 제거 */}
                        </div>
                    </AccordionSection>

                    {/* 배경음악 */}
                    <AccordionSection
                        title="배경음악"
                        sectionKey="bgm"
                        isOpen={currentOpenSection === "bgm"}
                        onToggle={async () => await toggleSection("bgm")}
                        toggleButton={
                            <ToggleButton
                                isOn={pageSettings.bgm === "on"}
                                onToggle={async () => {
                                    const newBgm =
                                        pageSettings.bgm === "on" ? "off" : "on"
                                    setPageSettings((prev) => ({
                                        ...prev,
                                        bgm: newBgm,
                                    }))
                                    await savePageSettings(
                                        { bgm: newBgm },
                                        { silent: true }
                                    )
                                }}
                            />
                        }
                    >
                        <div
                            style={{
                                padding: "16px 16px 32px 16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "32px",
                            }}
                        >
                            {/* 무료 음원 섹션 */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 14,
                                        ...theme.font.bodyBold,
                                    }}
                                >
                                    무료 음원
                                </div>
                                <div
                                    style={{
                                        color: "#ADADAD",
                                        fontSize: 14,
                                        fontFamily: theme.font.body,
                                        lineHeight: "16px",
                                    }}
                                >
                                    선택하여 미리 들어보세요. 한 번 더 누르면
                                    선택이 해제됩니다.
                                </div>

                                {/* 첫 번째 행 (1-5) */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginTop: 8,
                                    }}
                                >
                                    {FREE_BGM_LIST.slice(0, 5).map((bgm) => (
                                        <button
                                            key={bgm.id}
                                            onClick={() =>
                                                handleFreeBgmSelect(bgm.id)
                                            }
                                            disabled={settingsLoading}
                                            style={{
                                                flex: "1 1 0",
                                                height: 40,
                                                padding: 12,
                                                backgroundColor:
                                                    previewBgmId === bgm.id ||
                                                    playingBgmId === bgm.id
                                                        ? "#ECECEC"
                                                        : "white",
                                                borderRadius: 2,
                                                border: "none",
                                                outline: `${theme.border.width}px solid ${previewBgmId === bgm.id || playingBgmId === bgm.id ? "black" : "#E5E6E8"}`,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: 10,
                                                cursor: settingsLoading
                                                    ? "not-allowed"
                                                    : "pointer",
                                                opacity: settingsLoading
                                                    ? 0.5
                                                    : 1,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        previewBgmId ===
                                                            bgm.id ||
                                                        playingBgmId === bgm.id
                                                            ? "black"
                                                            : "#AEAEAE",
                                                    fontSize: 12,
                                                    fontFamily: theme.font.body,
                                                }}
                                            >
                                                {bgm.id}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* 두 번째 행 (6-10) */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                    }}
                                >
                                    {FREE_BGM_LIST.slice(5, 10).map((bgm) => (
                                        <button
                                            key={bgm.id}
                                            onClick={() =>
                                                handleFreeBgmSelect(bgm.id)
                                            }
                                            disabled={settingsLoading}
                                            style={{
                                                flex: "1 1 0",
                                                height: 40,
                                                padding: 12,
                                                backgroundColor:
                                                    previewBgmId === bgm.id ||
                                                    playingBgmId === bgm.id
                                                        ? "#ECECEC"
                                                        : "white",
                                                borderRadius: 2,
                                                border: "none",
                                                outline: `${theme.border.width}px solid ${previewBgmId === bgm.id || playingBgmId === bgm.id ? "black" : "#E5E6E8"}`,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: 10,
                                                cursor: settingsLoading
                                                    ? "not-allowed"
                                                    : "pointer",
                                                opacity: settingsLoading
                                                    ? 0.5
                                                    : 1,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        previewBgmId ===
                                                            bgm.id ||
                                                        playingBgmId === bgm.id
                                                            ? "black"
                                                            : "#AEAEAE",
                                                    fontSize: 12,
                                                    fontFamily: theme.font.body,
                                                }}
                                            >
                                                {bgm.id}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 직접 업로드 섹션 */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 14,
                                        ...theme.font.bodyBold,
                                    }}
                                >
                                    직접 업로드 (선택)
                                </div>
                                <div
                                    style={{
                                        color: "#ADADAD",
                                        fontSize: 14,
                                        fontFamily: theme.font.body,
                                        lineHeight: "16px",
                                    }}
                                >
                                    직접 업로드 시 MP3 파일만 사용 가능하며,
                                    자동으로 압축됩니다.
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    {/* 업로드된 파일명 표시 */}
                                    {uploadedFileName && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px",
                                                marginTop: 6,
                                                marginBottom: 4,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard, sans-serif",
                                                    color: "#666666",
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {uploadedFileName.length > 20
                                                    ? `${uploadedFileName.substring(0, 20)}...`
                                                    : uploadedFileName}
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    // 삭제 확인 팝업
                                                    const confirmed =
                                                        window.confirm(
                                                            "정말 삭제하시겠어요?"
                                                        )
                                                    if (!confirmed) {
                                                        return
                                                    }

                                                    try {
                                                        // R2에서 파일 삭제
                                                        if (
                                                            pageSettings.bgm_url &&
                                                            pageSettings.bgm_type ===
                                                                "custom"
                                                        ) {
                                                            await deleteFromR2(
                                                                pageSettings.bgm_url
                                                            )
                                                        }

                                                        // 상태 초기화
                                                        setUploadedFileName(
                                                            null
                                                        )
                                                        const updatedSettings =
                                                            {
                                                                ...pageSettings,
                                                                bgm_url: "",
                                                                bgm_type: "",
                                                            }
                                                        setPageSettings(
                                                            updatedSettings
                                                        )

                                                        // 데이터베이스에도 저장
                                                        await savePageSettings({
                                                            bgm_url: "",
                                                            bgm_type: "",
                                                        })

                                                        console.log(
                                                            "[BGM] 업로드된 파일이 삭제되었습니다."
                                                        )
                                                    } catch (error) {
                                                        console.error(
                                                            "[BGM] 파일 삭제 중 오류:",
                                                            error
                                                        )
                                                        alert(
                                                            "파일 삭제 중 오류가 발생했습니다."
                                                        )
                                                    }
                                                }}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#b12525",
                                                    fontSize: 16,
                                                    cursor: "pointer",
                                                    padding: "2px",
                                                    borderRadius: "2px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "20px",
                                                    height: "20px",
                                                }}
                                                aria-label="업로드된 파일 삭제"
                                                title="업로드된 파일 삭제"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "12px",
                                        }}
                                    >
                                        <button
                                            onClick={() => {
                                                if (
                                                    typeof document !==
                                                    "undefined"
                                                ) {
                                                    const input =
                                                        document.createElement(
                                                            "input"
                                                        )
                                                    input.type = "file"
                                                    input.accept =
                                                        "audio/*,.mp3,.m4a,.aac,.wav"
                                                    input.style.display = "none"

                                                    // 이벤트 리스너 방식으로 변경
                                                    input.addEventListener(
                                                        "change",
                                                        (e) => {
                                                            const target =
                                                                e.target as HTMLInputElement

                                                            if (
                                                                target
                                                                    ?.files?.[0]
                                                            ) {
                                                                // React 이벤트 객체 생성
                                                                const syntheticEvent =
                                                                    {
                                                                        target: target,
                                                                        currentTarget:
                                                                            target,
                                                                    } as React.ChangeEvent<HTMLInputElement>
                                                                handleAudioUpload(
                                                                    syntheticEvent
                                                                )
                                                            }

                                                            // 사용 후 제거
                                                            try {
                                                                document.body.removeChild(
                                                                    input
                                                                )
                                                            } catch (removeError) {
                                                                // noop
                                                            }
                                                        }
                                                    )

                                                    // 취소 시에도 처리
                                                    input.addEventListener(
                                                        "cancel",
                                                        () => {
                                                            try {
                                                                document.body.removeChild(
                                                                    input
                                                                )
                                                            } catch (removeError) {
                                                                // noop
                                                            }
                                                        }
                                                    )

                                                    // DOM에 추가 후 클릭
                                                    document.body.appendChild(
                                                        input
                                                    )

                                                    // 다이얼로그 닫힘 감지를 위한 window focus 이벤트
                                                    const handleWindowFocus =
                                                        () => {
                                                            setTimeout(() => {
                                                                if (
                                                                    input.files
                                                                        ?.length ===
                                                                    0
                                                                ) {
                                                                    // noop
                                                                }
                                                            }, 100)
                                                            window.removeEventListener(
                                                                "focus",
                                                                handleWindowFocus
                                                            )
                                                        }

                                                    window.addEventListener(
                                                        "focus",
                                                        handleWindowFocus
                                                    )
                                                    input.click()
                                                } else {
                                                    // noop
                                                }
                                            }}
                                            disabled={settingsLoading}
                                            style={{
                                                flex: "1 1 0",
                                                height: 50,
                                                padding: "8px 12px",
                                                marginTop: 8,
                                                backgroundColor: "white",
                                                borderRadius: 2,
                                                outline: `1px #AEAEAE solid`,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                border: "none",
                                                gap: 8,
                                                cursor: settingsLoading
                                                    ? "not-allowed"
                                                    : "pointer",
                                                opacity: settingsLoading
                                                    ? 0.5
                                                    : 1,
                                            }}
                                        >
                                            <svg
                                                width="13"
                                                height="12"
                                                viewBox="0 0 13 12"
                                                fill="none"
                                            >
                                                <path
                                                    d="M5.75 9V2.8875L3.8 4.8375L2.75 3.75L6.5 0L10.25 3.75L9.2 4.8375L7.25 2.8875V9H5.75ZM0.5 12V8.25H2V10.5H11V8.25H12.5V12H0.5Z"
                                                    fill="#818181"
                                                />
                                            </svg>
                                            <span
                                                style={{
                                                    color: "black",
                                                    fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                                    fontFamily: theme.font.body,
                                                }}
                                            >
                                                {settingsLoading
                                                    ? "업로드 중..."
                                                    : "직접 업로드"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 자동 재생 섹션 */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 14,
                                        ...theme.font.bodyBold,
                                    }}
                                >
                                    자동 재생
                                </div>
                                <div
                                    style={{
                                        color: "#ADADAD",
                                        fontSize: 14,
                                        fontFamily: theme.font.body,
                                        lineHeight: "16px",
                                    }}
                                >
                                    자동 재생 기능은 브라우저 정책에 따라 제한될
                                    수 있습니다.
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            handleAutoplayToggle(true)
                                        }
                                        disabled={settingsLoading}
                                        style={{
                                            flex: "1 1 0",
                                            height: 40,
                                            padding: 12,
                                            marginTop: 8,
                                            border: "none",
                                            backgroundColor:
                                                pageSettings.bgm_autoplay
                                                    ? "#ECECEC"
                                                    : "white",
                                            borderRadius: 2,
                                            outline: `${theme.border.width}px solid ${pageSettings.bgm_autoplay ? "#757575" : "#E5E6E8"}`,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 10,
                                            cursor: settingsLoading
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity: settingsLoading ? 0.5 : 1,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: pageSettings.bgm_autoplay
                                                    ? "black"
                                                    : "#AEAEAE",
                                                fontSize: 12,
                                                fontFamily: theme.font.body,
                                            }}
                                        >
                                            자동 재생 켜기
                                        </span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleAutoplayToggle(false)
                                        }
                                        disabled={settingsLoading}
                                        style={{
                                            flex: "1 1 0",
                                            height: 40,
                                            padding: 12,
                                            marginTop: 8,
                                            backgroundColor:
                                                !pageSettings.bgm_autoplay
                                                    ? "#ECECEC"
                                                    : "white",
                                            borderRadius: 2,
                                            outline: `${theme.border.width}px solid ${!pageSettings.bgm_autoplay ? "#757575" : "#E5E6E8"}`,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 10,
                                            border: "none",
                                            cursor: settingsLoading
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity: settingsLoading ? 0.5 : 1,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: !pageSettings.bgm_autoplay
                                                    ? "black"
                                                    : "#AEAEAE",
                                                fontSize: 12,
                                                fontFamily: theme.font.body,
                                            }}
                                        >
                                            자동 재생 끄기
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* 볼륨 조정 섹션 */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 14,
                                        ...theme.font.bodyBold,
                                    }}
                                >
                                    볼륨 조정
                                </div>
                                <div
                                    style={{
                                        width: "100%",
                                        height: 18,
                                        position: "relative",
                                        cursor: "pointer",
                                        touchAction: "none", // 모바일 터치 제스처 방지
                                        WebkitTouchCallout: "none", // iOS 추가 터치 방지
                                        WebkitUserSelect: "none", // 텍스트 선택 방지
                                        userSelect: "none",
                                    }}
                                    onClick={(e) => {
                                        // 드래그 중이 아닐 때만 클릭 처리
                                        if (e.defaultPrevented) return

                                        const rect =
                                            e.currentTarget.getBoundingClientRect()
                                        const x = e.clientX - rect.left
                                        const percentage = Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                (x / rect.width) * 100
                                            )
                                        )
                                        const volume =
                                            Math.round((percentage / 100) * 9) +
                                            1

                                        const updatedSettings = {
                                            ...pageSettings,
                                            bgm_vol: volume,
                                        }
                                        setPageSettings(updatedSettings)

                                        // 자동 저장
                                        savePageSettings(updatedSettings).catch(
                                            (error) => {
                                                console.error(
                                                    "볼륨 저장 실패:",
                                                    error
                                                )
                                            }
                                        )
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 9,
                                            left: 0,
                                            top: 4,
                                            position: "absolute",
                                            background: "#ECECEC",
                                            borderRadius: 999,
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            left: `${((pageSettings.bgm_vol || 5) - 1) * (100 / 9)}%`,
                                            top: 0,
                                            position: "absolute",
                                            background: "#3F3F3F",
                                            borderRadius: 9999,
                                            cursor: "grab",
                                            transform: "translateX(-50%)",
                                            transition:
                                                "background-color 0.2s ease",
                                            touchAction: "none",
                                            WebkitTouchCallout: "none",
                                            WebkitUserSelect: "none",
                                            userSelect: "none",
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()

                                            // 이전에 등록된 마우스 리스너가 있다면 제거 (중복 방지)
                                            if (
                                                (window as any)
                                                    .__volumeMouseListeners
                                            ) {
                                                document.removeEventListener(
                                                    "mousemove",
                                                    (window as any)
                                                        .__volumeMouseListeners
                                                        .handleMouseMove
                                                )
                                                document.removeEventListener(
                                                    "mouseup",
                                                    (window as any)
                                                        .__volumeMouseListeners
                                                        .handleMouseUp
                                                )
                                                ;(
                                                    window as any
                                                ).__volumeMouseListeners = null
                                            }

                                            // 드래그 중 상태로 변경
                                            e.currentTarget.style.cursor =
                                                "grabbing"
                                            e.currentTarget.style.backgroundColor =
                                                "#1F1F1F"

                                            const handleMouseMove = (
                                                moveEvent: MouseEvent
                                            ) => {
                                                const sliderRect =
                                                    e.currentTarget.parentElement?.getBoundingClientRect()
                                                if (!sliderRect) return

                                                const x =
                                                    moveEvent.clientX -
                                                    sliderRect.left
                                                const percentage = Math.max(
                                                    0,
                                                    Math.min(
                                                        100,
                                                        (x / sliderRect.width) *
                                                            100
                                                    )
                                                )
                                                const volume =
                                                    Math.round(
                                                        (percentage / 100) * 9
                                                    ) + 1

                                                const updatedSettings = {
                                                    ...pageSettings,
                                                    bgm_vol: volume,
                                                }
                                                setPageSettings(updatedSettings)

                                                // 자동 저장
                                                savePageSettings(
                                                    updatedSettings
                                                ).catch((error) => {
                                                    console.error(
                                                        "볼륨 저장 실패:",
                                                        error
                                                    )
                                                })
                                            }

                                            const handleMouseUp = () => {
                                                // 드래그 종료 시 상태 복원
                                                e.currentTarget.style.cursor =
                                                    "grab"
                                                e.currentTarget.style.backgroundColor =
                                                    "#3F3F3F"

                                                // 등록된 마우스 리스너 제거
                                                document.removeEventListener(
                                                    "mousemove",
                                                    handleMouseMove
                                                )
                                                document.removeEventListener(
                                                    "mouseup",
                                                    handleMouseUp
                                                )
                                                ;(
                                                    window as any
                                                ).__volumeMouseListeners = null
                                            }

                                            // 마우스 이벤트 리스너 등록
                                            const mouseListeners = {
                                                handleMouseMove,
                                                handleMouseUp,
                                            }
                                            ;(
                                                window as any
                                            ).__volumeMouseListeners =
                                                mouseListeners

                                            document.addEventListener(
                                                "mousemove",
                                                handleMouseMove
                                            )
                                            document.addEventListener(
                                                "mouseup",
                                                handleMouseUp
                                            )
                                        }}
                                        onMouseEnter={(e) => {
                                            if (
                                                e.currentTarget.style.cursor !==
                                                "grabbing"
                                            ) {
                                                e.currentTarget.style.backgroundColor =
                                                    "#2F2F2F"
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (
                                                e.currentTarget.style.cursor !==
                                                "grabbing"
                                            ) {
                                                e.currentTarget.style.backgroundColor =
                                                    "#3F3F3F"
                                            }
                                        }}
                                        onTouchStart={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()

                                            // 이전에 등록된 리스너가 있다면 제거 (중복 방지)
                                            if (
                                                (window as any)
                                                    .__volumeTouchListeners
                                            ) {
                                                const oldListeners = (
                                                    window as any
                                                ).__volumeTouchListeners
                                                document.removeEventListener(
                                                    "touchmove",
                                                    oldListeners.handleTouchMove,
                                                    { capture: true } as any
                                                )
                                                document.removeEventListener(
                                                    "touchend",
                                                    oldListeners.handleTouchEnd,
                                                    { capture: true } as any
                                                )
                                                document.removeEventListener(
                                                    "touchcancel",
                                                    oldListeners.handleTouchCancel,
                                                    { capture: true } as any
                                                )
                                                ;(
                                                    window as any
                                                ).__volumeTouchListeners = null
                                            }

                                            // 터치 시작 시 상태 변경
                                            e.currentTarget.style.backgroundColor =
                                                "#1F1F1F"
                                            e.currentTarget.style.cursor =
                                                "grabbing"

                                            const sliderElement =
                                                e.currentTarget.parentElement
                                            if (!sliderElement) return

                                            let isDragging = true

                                            const cleanupListeners = () => {
                                                if (!isDragging) return
                                                isDragging = false

                                                // 터치 종료 시 상태 복원
                                                e.currentTarget.style.backgroundColor =
                                                    "#3F3F3F"
                                                e.currentTarget.style.cursor =
                                                    "grab"

                                                // 등록된 리스너 제거
                                                const listeners = (
                                                    window as any
                                                ).__volumeTouchListeners
                                                if (listeners) {
                                                    document.removeEventListener(
                                                        "touchmove",
                                                        listeners.handleTouchMove,
                                                        { capture: true } as any
                                                    )
                                                    document.removeEventListener(
                                                        "touchend",
                                                        listeners.handleTouchEnd,
                                                        { capture: true } as any
                                                    )
                                                    document.removeEventListener(
                                                        "touchcancel",
                                                        listeners.handleTouchCancel,
                                                        { capture: true } as any
                                                    )
                                                    ;(
                                                        window as any
                                                    ).__volumeTouchListeners =
                                                        null
                                                }
                                            }

                                            const handleTouchMove = (
                                                moveEvent: TouchEvent
                                            ) => {
                                                if (!isDragging) return

                                                moveEvent.preventDefault()
                                                moveEvent.stopPropagation()

                                                if (!moveEvent.touches[0])
                                                    return

                                                const sliderRect =
                                                    sliderElement.getBoundingClientRect()
                                                const x =
                                                    moveEvent.touches[0]
                                                        .clientX -
                                                    sliderRect.left
                                                const percentage = Math.max(
                                                    0,
                                                    Math.min(
                                                        100,
                                                        (x / sliderRect.width) *
                                                            100
                                                    )
                                                )
                                                const volume =
                                                    Math.round(
                                                        (percentage / 100) * 9
                                                    ) + 1

                                                const updatedSettings = {
                                                    ...pageSettings,
                                                    bgm_vol: volume,
                                                }
                                                setPageSettings(updatedSettings)

                                                // 자동 저장
                                                savePageSettings(
                                                    updatedSettings
                                                ).catch((error) => {
                                                    console.error(
                                                        "볼륨 저장 실패:",
                                                        error
                                                    )
                                                })
                                            }

                                            const handleTouchEnd = (
                                                endEvent: TouchEvent
                                            ) => {
                                                endEvent.preventDefault()
                                                endEvent.stopPropagation()
                                                cleanupListeners()
                                            }

                                            const handleTouchCancel = (
                                                cancelEvent: TouchEvent
                                            ) => {
                                                cancelEvent.preventDefault()
                                                cancelEvent.stopPropagation()
                                                cleanupListeners()
                                            }

                                            // 터치 이벤트 리스너 등록
                                            const listeners = {
                                                handleTouchMove,
                                                handleTouchEnd,
                                                handleTouchCancel,
                                            }
                                            ;(
                                                window as any
                                            ).__volumeTouchListeners = listeners

                                            document.addEventListener(
                                                "touchmove",
                                                handleTouchMove,
                                                {
                                                    passive: false,
                                                    capture: true,
                                                }
                                            )
                                            document.addEventListener(
                                                "touchend",
                                                handleTouchEnd,
                                                {
                                                    passive: false,
                                                    capture: true,
                                                }
                                            )
                                            document.addEventListener(
                                                "touchcancel",
                                                handleTouchCancel,
                                                {
                                                    passive: false,
                                                    capture: true,
                                                }
                                            )
                                        }}
                                        onContextMenu={(e) => {
                                            // 우클릭 방지
                                            e.preventDefault()
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ width: "100%" }}>
                                <SaveSectionButton
                                    onSave={async () => {
                                        // 무료 음원이 선택된 경우 저장
                                        if (previewBgmId) {
                                            const selectedBgm =
                                                FREE_BGM_LIST.find(
                                                    (bgm) =>
                                                        bgm.id === previewBgmId
                                                )
                                            if (selectedBgm) {
                                                const updatedSettings = {
                                                    ...pageSettings,
                                                    bgm_url: selectedBgm.url,
                                                    bgm_type: "free",
                                                }
                                                await savePageSettings(
                                                    updatedSettings
                                                )
                                                setPageSettings(updatedSettings)
                                                setSelectedBgmId(previewBgmId)
                                                setUploadedFileName(null) // 무료 음원 저장 시 업로드된 파일명 초기화
                                                console.log(
                                                    "무료 음원이 성공적으로 저장되었습니다!"
                                                )
                                                return
                                            }
                                        }

                                        // 일반 저장 (직접 업로드된 음원 또는 기존 설정)
                                        await savePageSettings(
                                            {
                                                bgm_url: pageSettings.bgm_url,
                                                bgm_type: pageSettings.bgm_type,
                                                bgm: pageSettings.bgm,
                                                bgm_vol: pageSettings.bgm_vol,
                                            },
                                            { silent: true }
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 카카오톡 공유 */}
                    <AccordionSection
                        title="카카오톡 공유"
                        sectionKey="kakaoShare"
                        isOpen={currentOpenSection === "kakaoShare"}
                        onToggle={async () => await toggleSection("kakaoShare")}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: theme.gap.lg,
                                padding: 16,
                                backgroundColor: "white",
                            }}
                        >
                            <FormField
                                label="카카오톡 공유 이미지"
                                helpText={
                                    <span
                                        style={{
                                            display: "block", // inline이면 textAlign 안먹을 수 있어서 block으로
                                            textAlign: "start",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        설정하지 않아도 메인 사진이 적용됩니다.
                                    </span>
                                }
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            maxWidth: 240,
                                            margin: "12px 0px 4px 0px",
                                            height: 360,
                                            border: `1px solid ${theme.color.border}`,
                                            borderRadius: 2,
                                            background: "#FAFAFA",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {pageSettings.kko_img ? (
                                            <img
                                                src={pageSettings.kko_img}
                                                alt="카카오톡 공유 미리보기"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    color: theme.color.muted,
                                                    fontSize: 13,
                                                    fontFamily: theme.font.body,
                                                    textAlign: "center",
                                                    lineHeight: 1.5,
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                이미지를 업로드해주세요.{"\n"}
                                                2:3 비율로 표시됩니다.
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            justifyContent: "center",
                                            width: "100%",
                                            maxWidth: 240,
                                        }}
                                    >
                                        <ButtonBase
                                            onClick={() =>
                                                kakaoImageInputRef.current?.click()
                                            }
                                            disabled={
                                                kakaoUploadLoading ||
                                                settingsLoading
                                            }
                                            style={{
                                                flex: pageSettings.kko_img
                                                    ? 1
                                                    : 1,
                                                height: 40,
                                                borderRadius: "2px",
                                            }}
                                        >
                                            {kakaoUploadLoading
                                                ? "업로드 중..."
                                                : pageSettings.kko_img
                                                  ? "이미지 변경"
                                                  : "이미지 업로드"}
                                        </ButtonBase>
                                        {pageSettings.kko_img ? (
                                            <button
                                                onClick={handleKakaoImageRemove}
                                                disabled={
                                                    kakaoUploadLoading ||
                                                    settingsLoading
                                                }
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    paddingLeft: 12,
                                                    paddingRight: 12,
                                                    paddingTop: 0,
                                                    paddingBottom: 0,
                                                    background: "white",
                                                    border: "1px solid #f7b0b0",
                                                    borderRadius: "2px",
                                                    cursor:
                                                        kakaoUploadLoading ||
                                                        settingsLoading
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    opacity:
                                                        kakaoUploadLoading ||
                                                        settingsLoading
                                                            ? 0.5
                                                            : 1,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    display: "flex",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        color: "#b12525",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            theme.font.body,
                                                        wordWrap: "break-word",
                                                    }}
                                                >
                                                    삭제
                                                </div>
                                            </button>
                                        ) : null}
                                    </div>
                                    <input
                                        ref={kakaoImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={handleKakaoImageChange}
                                        disabled={
                                            kakaoUploadLoading ||
                                            settingsLoading
                                        }
                                    />
                                </div>
                            </FormField>

                            <FormField
                                label="제목"
                                helpText="카카오톡 공유 카드에 굵은 글씨로 표시됩니다."
                            >
                                <InputBase
                                    value={pageSettings.kko_title || ""}
                                    onChange={(e) =>
                                        setPageSettings((prev) => ({
                                            ...prev,
                                            kko_title: e.target.value,
                                        }))
                                    }
                                    onBlur={(e) =>
                                        void savePageSettings({
                                            kko_title: e.target.value,
                                        })
                                    }
                                    placeholder={`${inviteData.groomName || ""} ♥ ${inviteData.brideName || ""}의 결혼식`}
                                    disabled={settingsLoading}
                                    style={{
                                        width: "calc(100% * 1.1429)",
                                        minHeight: "calc(40px * 1.1429)",
                                        padding:
                                            "calc(10px * 1.1429) calc(12px * 1.1429)",
                                        paddingLeft: "calc(12px * 0.875)", // scale로 인한 좌측 여백 보정
                                        borderStyle: "solid",
                                        borderWidth: theme.border.width,
                                        borderColor: theme.color.border,
                                        borderRadius: 2,
                                        background: theme.color.surface,
                                        color: theme.color.text,
                                        fontFamily: theme.font.body,
                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                        transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                        transformOrigin: "left center",
                                        marginBottom: -4,
                                        lineHeight: 1.5,
                                        resize: "vertical",
                                    }}
                                />
                            </FormField>

                            <FormField
                                label="본문"
                                helpText="카카오톡 공유 카드에 작은 글씨로 표시됩니다."
                            >
                                <textarea
                                    value={pageSettings.kko_date || ""}
                                    onChange={(e) =>
                                        setPageSettings((prev) => ({
                                            ...prev,
                                            kko_date: e.target.value,
                                        }))
                                    }
                                    onBlur={(e) =>
                                        void savePageSettings({
                                            kko_date: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    placeholder={formatDateTime() || "예: 2026년 1월 1일 토요일 12시 30분"}
                                    disabled={settingsLoading}
                                    style={{
                                        width: "calc(100% * 1.1429)",
                                        minHeight: "calc(96px * 1.1429)",
                                        padding:
                                            "calc(10px * 1.1429) calc(12px * 1.1429)",
                                        paddingLeft: "calc(12px * 0.875)", // scale로 인한 좌측 여백 보정
                                        borderStyle: "solid",
                                        borderWidth: theme.border.width,
                                        borderColor: theme.color.border,
                                        borderRadius: 2,
                                        background: theme.color.surface,
                                        color: theme.color.text,
                                        fontFamily: theme.font.body,
                                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                                        transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                                        transformOrigin: "left center",
                                        marginBottom: -6,
                                        marginTop: -4,
                                        lineHeight: 1.5,
                                        resize: "vertical",
                                    }}
                                />
                            </FormField>
                            <div style={{ width: "100%", marginTop: 12 }}>
                                <SaveSectionButton
                                    onSave={async () => {
                                        await savePageSettings(
                                            {
                                                kko_img: pageSettings.kko_img,
                                                kko_title:
                                                    pageSettings.kko_title,
                                                kko_date: pageSettings.kko_date,
                                            },
                                            { silent: true }
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* Footer at the end of basic tab */}
                    <AdminFooter />
                </div>
            )}

            {/* 갤러리 탭 */}
            {activeTab === "gallery" && (
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch", // iOS 부드러운 스크롤
                        minHeight: 0, // flex 아이템이 축소될 수 있도록
                        paddingBottom: "env(safe-area-inset-bottom)", // 하단 안전 영역
                        position: "relative", // 키보드 대응
                        backgroundColor: "#E6E6E6",
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.space(4),
                    }}
                >
                    {/* 갤러리 설정 */}
                    <div
                        style={{
                            backgroundColor: "white",
                            padding: theme.space(6),
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    color: "black",
                                    fontSize: "16px",
                                    ...theme.font.bodyBold,
                                    wordWrap: "break-word",
                                    marginBottom: theme.space(6),
                                }}
                            >
                                갤러리 타입
                            </div>
                        </div>
                        <div
                            style={{
                                color: "white",
                                marginBottom: theme.space(6),
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                    }}
                                >
                                    {[
                                        {
                                            value: "thumbnail",
                                            label: (
                                                <div>
                                                    <div
                                                        style={{
                                                            ...theme.font
                                                                .bodyBold,
                                                            fontSize:
                                                                theme.text.base,
                                                        }}
                                                    >
                                                        썸네일형
                                                    </div>
                                                </div>
                                            ),
                                            preview: (
                                                <div
                                                    style={{
                                                        width: 60,
                                                        height: 95,
                                                        position: "relative",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 60,
                                                            height: 79,
                                                            left: 0,
                                                            top: 0,
                                                            position:
                                                                "absolute",
                                                            background:
                                                                "#D9D9D9",
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            left: 0,
                                                            top: 83,
                                                            position:
                                                                "absolute",
                                                        }}
                                                    >
                                                        <svg
                                                            width="61"
                                                            height="12"
                                                            viewBox="0 0 61 12"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <rect
                                                                x="3.25"
                                                                width="12"
                                                                height="12"
                                                                rx="2"
                                                                fill="#D9D9D9"
                                                            />
                                                            <rect
                                                                x="17.25"
                                                                width="12"
                                                                height="12"
                                                                rx="2"
                                                                fill="#D9D9D9"
                                                            />
                                                            <rect
                                                                x="31.25"
                                                                width="12"
                                                                height="12"
                                                                rx="2"
                                                                fill="#D9D9D9"
                                                            />
                                                            <rect
                                                                x="45.25"
                                                                width="12"
                                                                height="12"
                                                                rx="2"
                                                                fill="#D9D9D9"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            value: "slide",
                                            label: (
                                                <div>
                                                    <div
                                                        style={{
                                                            ...theme.font
                                                                .bodyBold,
                                                            fontSize:
                                                                theme.text.base,
                                                        }}
                                                    >
                                                        베이직형
                                                    </div>
                                                </div>
                                            ),
                                            preview: (
                                                <svg
                                                    width="73"
                                                    height="95"
                                                    viewBox="0 0 73 95"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <rect
                                                        x="0.674072"
                                                        width="56.519"
                                                        height="95"
                                                        fill="#D9D9D9"
                                                    />
                                                    <rect
                                                        x="4.28149"
                                                        y="87.7849"
                                                        width="4.81013"
                                                        height="4.81013"
                                                        rx="2.40506"
                                                        fill="#BBBBBB"
                                                    />
                                                    <path
                                                        d="M7.28774 88.9873L6.08521 90.1898L7.28774 91.3924"
                                                        stroke="#D9D9D9"
                                                        stroke-width="0.481013"
                                                    />
                                                    <rect
                                                        x="10.2942"
                                                        y="87.7849"
                                                        width="4.81013"
                                                        height="4.81013"
                                                        rx="2.40506"
                                                        fill="#BBBBBB"
                                                    />
                                                    <path
                                                        d="M12.0982 88.9873L13.3008 90.1898L12.0982 91.3924"
                                                        stroke="#D9D9D9"
                                                        stroke-width="0.481013"
                                                    />
                                                    <rect
                                                        x="62.0032"
                                                        width="10.8228"
                                                        height="95"
                                                        fill="#D9D9D9"
                                                    />
                                                </svg>
                                            ),
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.value}
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            {/* 라디오 버튼과 텍스트 - 카드 위쪽 */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: theme.space(2),
                                                    marginBottom:
                                                        theme.space(2),
                                                    paddingLeft: theme.space(1),
                                                }}
                                            >
                                                <UiRadio
                                                    checked={
                                                        pageSettings.gallery_type ===
                                                        item.value
                                                    }
                                                    onChange={async () => {
                                                        // 로컬 상태 업데이트
                                                        setPageSettings({
                                                            ...pageSettings,
                                                            gallery_type:
                                                                item.value,
                                                        })
                                                        // 자동 저장 및 토스트 표시
                                                        broadcastAutoSaveToast()
                                                        await savePageSettings({
                                                            gallery_type:
                                                                item.value,
                                                        })
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        ...theme.font.bodyBold,
                                                        fontSize:
                                                            theme.text.base,
                                                        color: theme.color.text,
                                                    }}
                                                >
                                                    {item.label}
                                                </div>
                                            </div>

                                            {/* 프리뷰 카드 - 아래쪽 */}
                                            <div
                                                style={{
                                                    cursor: "pointer",
                                                }}
                                                onClick={async () => {
                                                    // 로컬 상태 업데이트
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        gallery_type:
                                                            item.value,
                                                    })
                                                    // 자동 저장 및 토스트 표시
                                                    broadcastAutoSaveToast()
                                                    await savePageSettings({
                                                        gallery_type:
                                                            item.value,
                                                    })
                                                }}
                                            >
                                                <Card
                                                    style={{
                                                        padding: theme.space(3),
                                                        border:
                                                            pageSettings.gallery_type ===
                                                            item.value
                                                                ? `1px solid ${theme.color.primary}`
                                                                : `1px solid ${theme.color.border}`,
                                                        backgroundColor:
                                                            pageSettings.gallery_type ===
                                                            item.value
                                                                ? theme.color
                                                                      .primary +
                                                                  "0"
                                                                : "white",
                                                    }}
                                                >
                                                    {/* 프리뷰 영역 */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "center",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        {item.preview}
                                                    </div>
                                                </Card>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 갤러리 관리 */}
                    <div>
                        <div
                            style={{
                                backgroundColor: "#E6E6E6",
                                padding: theme.space(6),
                            }}
                        >
                            {/* 사진 추가 버튼 */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    flexDirection: "column",
                                    justifyContent: "flex-start",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    display: "inline-flex",
                                }}
                            >
                                <div
                                    style={{
                                        alignSelf: "stretch",
                                        justifyContent: "flex-start",
                                        alignItems: "flex-start",
                                        gap: 8,
                                        display: "inline-flex",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            if (
                                                currentPageId &&
                                                typeof document !== "undefined"
                                            ) {
                                                const input =
                                                    document.getElementById(
                                                        "fileInput"
                                                    ) as HTMLInputElement | null
                                                input?.click()
                                            }
                                        }}
                                        disabled={!currentPageId}
                                        style={{
                                            flex: "1 1 0",
                                            height: 50,
                                            paddingLeft: 12,
                                            paddingRight: 12,
                                            paddingTop: 8,
                                            paddingBottom: 8,
                                            background: "white",
                                            outline:
                                                "1px var(--roarc-grey-500, #AEAEAE) solid",
                                            outlineOffset: "-0.50px",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 8,
                                            display: "flex",
                                            border: "none",
                                            borderRadius: "2px",
                                            cursor: currentPageId
                                                ? "pointer"
                                                : "not-allowed",
                                            opacity: currentPageId ? 1 : 0.5,
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="13"
                                            height="12"
                                            viewBox="0 0 13 12"
                                            fill="none"
                                            style={{
                                                width: 13,
                                                height: 12,
                                            }}
                                        >
                                            <path
                                                d="M5.75 9V2.8875L3.8 4.8375L2.75 3.75L6.5 0L10.25 3.75L9.2 4.8375L7.25 2.8875V9H5.75ZM0.5 12V8.25H2V10.5H11V8.25H12.5V12H0.5Z"
                                                fill="#818181"
                                            />
                                        </svg>
                                        <div
                                            style={{
                                                color: "var(--Black, black)",
                                                fontSize: 14,
                                                fontFamily: theme.font.body,
                                                wordWrap: "break-word",
                                            }}
                                        >
                                            사진 추가
                                        </div>
                                    </button>

                                    {/* 전체 삭제 버튼 */}
                                    {existingImages.length > 0 && (
                                        <button
                                            onClick={handleDeleteAllImages}
                                            disabled={uploading}
                                            style={{
                                                width: 90,
                                                height: 50,
                                                paddingLeft: 12,
                                                paddingRight: 12,
                                                paddingTop: 0,
                                                paddingBottom: 0,
                                                background: "white",
                                                border: "1px solid #f7b0b0",
                                                borderRadius: "2px",
                                                cursor: uploading
                                                    ? "not-allowed"
                                                    : "pointer",
                                                opacity: uploading ? 0.5 : 1,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                display: "flex",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: "#b12525",
                                                    fontSize: 14,
                                                    fontFamily: theme.font.body,
                                                    wordWrap: "break-word",
                                                }}
                                            >
                                                전체 삭제
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 순서 저장 버튼 */}
                            <AnimatePresence>
                                {hasUnsavedChanges && (
                                    <motion.div
                                        initial={{
                                            scale: 0.8,
                                        }}
                                        animate={{
                                            scale: 1,
                                        }}
                                        exit={{
                                            opacity: 0,
                                        }}
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeInOut",
                                        }}
                                        style={{
                                            width: "100%",
                                            marginTop: 8,
                                            transformOrigin: "center top",
                                        }}
                                    >
                                        <button
                                            onClick={saveImageOrder}
                                            disabled={isSavingOrder}
                                            style={{
                                                width: "100%",
                                                height: 50,
                                                paddingLeft: 12,
                                                paddingRight: 12,
                                                paddingTop: 8,
                                                paddingBottom: 8,
                                                background: "#3f3f3f",
                                                border: "none",
                                                borderRadius: "2px",
                                                cursor: isSavingOrder
                                                    ? "not-allowed"
                                                    : "pointer",
                                                opacity: isSavingOrder
                                                    ? 0.5
                                                    : 1,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                display: "flex",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: "white",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        theme.font.bodyBold,
                                                    wordWrap: "break-word",
                                                }}
                                            >
                                                {isSavingOrder
                                                    ? "저장 중..."
                                                    : "순서 저장"}
                                            </div>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 숨겨진 파일 입력 */}
                            <input
                                id="fileInput"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: "none" }}
                                disabled={!currentPageId}
                            />

                            {/* 업로드 성공 메시지 */}
                            <AnimatePresence>
                                {uploadSuccess > 0 && (
                                    <motion.div
                                        style={{
                                            padding: theme.space(4),
                                            color: theme.color.success,
                                            borderRadius: theme.radius.xs,
                                            fontSize: theme.text.sm,
                                            textAlign: "center",
                                            marginBottom: theme.space(4),
                                        }}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div
                                            style={{
                                                ...theme.font.bodyBold,
                                                marginBottom: theme.space(1),
                                            }}
                                        >
                                            {uploadSuccess}개의 이미지가
                                            성공적으로 업로드되었습니다
                                        </div>
                                        <div
                                            style={{
                                                fontSize: theme.text.xs,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {currentPageId}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* SaveActionBar는 컴포넌트 최하단에 고정 표시됨 */}

                            {/* 이미지 목록 */}
                            {currentPageId && (
                                <div>
                                    <Row
                                        justify="space-between"
                                        align="center"
                                        style={{ marginBottom: theme.space(3) }}
                                    >
                                        <Row gap={2}>
                                            {selectedImages.size > 0 && (
                                                <Button
                                                    variant="danger"
                                                    onClick={
                                                        handleDeleteMultipleImages
                                                    }
                                                >
                                                    선택 삭제 (
                                                    {selectedImages.size}
                                                    개)
                                                </Button>
                                            )}
                                        </Row>
                                    </Row>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "15px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                            }}
                                        >
                                            {selectedImages.size > 0 && (
                                                <button
                                                    onClick={
                                                        handleDeleteMultipleImages
                                                    }
                                                    style={{
                                                        padding: "6px 12px",
                                                        backgroundColor:
                                                            "#dc2626",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    선택 삭제 (
                                                    {selectedImages.size}
                                                    개)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {existingImages.length === 0 ? (
                                        <EmptyState
                                            title="아직 업로드된 사진이 없습니다"
                                            description="사진 추가 버튼으로 사진을 추가해보세요."
                                        />
                                    ) : (
                                        <UiGrid columns={2} gap={12}>
                                            <AnimatePresence>
                                                {existingImages.map(
                                                    (image, index) => (
                                                        <motion.div
                                                            key={image.id}
                                                            layout
                                                            initial={{
                                                                opacity: 0,
                                                                scale: 0.8,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.8,
                                                            }}
                                                            transition={{
                                                                duration: 0.3,
                                                                layout: {
                                                                    duration: 0.3,
                                                                },
                                                            }}
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                        >
                                                            <UiPhotoTile
                                                                src={
                                                                    image.public_url
                                                                }
                                                                name={
                                                                    image.original_name
                                                                }
                                                                index={
                                                                    index + 1
                                                                }
                                                                totalCount={
                                                                    existingImages.length
                                                                }
                                                                onToggleSelection={() =>
                                                                    toggleImageSelection(
                                                                        image.id
                                                                    )
                                                                }
                                                                onDelete={() =>
                                                                    handleDeleteImage(
                                                                        image.id,
                                                                        image.filename
                                                                    )
                                                                }
                                                                onReplace={(
                                                                    file
                                                                ) =>
                                                                    handleReplaceImage(
                                                                        index,
                                                                        file
                                                                    )
                                                                }
                                                            />
                                                        </motion.div>
                                                    )
                                                )}
                                            </AnimatePresence>
                                        </UiGrid>
                                    )}
                                </div>
                            )}
                            {/* Footer at the end of gallery tab */}
                            <AdminFooter />
                        </div>
                    </div>
                </div>
            )}
            {null}
        </div>
    )
}
// 안내 사항 입력 탭 컴포넌트
function InfoTab({
    pageId,
    tokenGetter,
}: {
    pageId: string
    tokenGetter: () => string | null
}): JSX.Element {
    type InfoItem = {
        id?: string
        title: string
        description: string
        display_order: number
    }

    const DEFAULT_ITEMS: InfoItem[] = [
        {
            title: "교통 안내",
            description:
                "주차 공간이 협소하오니,\n가급적 대중교통을 이용해 주시기 바랍니다.",
            display_order: 1,
        },
        {
            title: "화환 안내",
            description:
                "환경 보호에 동참하기 위하여, 축하 화환, 화분, 꽃바구니는 정중히 사양합니다.",
            display_order: 2,
        },
        {
            title: "대절버스 안내",
            description:
                "*출발시간* 2029년 0월 0일 오전 7시\n*출발 장소* 00공설운동장\n탑승인원 확인을 위해\n대절버스를 이용하실 하객분께서는\n신랑측에 미리 연락부탁드립니다.\n{연락처 | 010-1234-5678}",
            display_order: 3,
        },
    ]

    const [items, setItems] = React.useState<InfoItem[]>(DEFAULT_ITEMS)
    const [loading, setLoading] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    // 공용 알림 사용을 위해 setError/setSuccess로 변경

    // 교통안내와 동일한 패턴으로 구현
    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                title: "안내 사항 제목",
                description: "안내 사항 내용을 입력해주세요",
                display_order: prev.length + 1,
            },
        ])
    }

    const move = (index: number, dir: -1 | 1) => {
        setItems((prev) => {
            const next = [...prev]
            const ni = index + dir
            if (ni < 0 || ni >= next.length) return prev
            const temp = next[index]
            next[index] = next[ni]
            next[ni] = temp
            return next.map((it, i) => ({ ...it, display_order: i + 1 }))
        })
    }

    const change = (
        index: number,
        field: "title" | "description",
        value: string
    ) => {
        setItems((prev) =>
            prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
        )
    }

    // 텍스트 포맷팅 함수들 (교통안내와 동일)
    const insertFormat = (index: number, format: "bold" | "small") => {
        if (typeof document === "undefined") return
        const textareaId = `info-description-${index}`
        const textarea = document.getElementById(
            textareaId
        ) as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = textarea.value.substring(start, end)
        const beforeText = textarea.value.substring(0, start)
        const afterText = textarea.value.substring(end)

        let newText = ""
        let cursorOffset = 0

        if (format === "bold") {
            if (selectedText) {
                newText = `${beforeText}**${selectedText}**${afterText}`
                cursorOffset = start + selectedText.length + 4
            } else {
                newText = `${beforeText}**텍스트**${afterText}`
                cursorOffset = start + 2
            }
        } else if (format === "small") {
            if (selectedText) {
                newText = `${beforeText}{${selectedText}}${afterText}`
                cursorOffset = start + selectedText.length + 2
            } else {
                newText = `${beforeText}{텍스트}${afterText}`
                cursorOffset = start + 1
            }
        }

        // 값 업데이트
        change(index, "description", newText)

        // 커서 위치 복원 (다음 렌더링 이후)
        setTimeout(() => {
            if (typeof document !== "undefined") {
                const updatedTextarea = document.getElementById(
                    textareaId
                ) as HTMLTextAreaElement
                if (updatedTextarea) {
                    updatedTextarea.focus()
                    updatedTextarea.setSelectionRange(
                        cursorOffset,
                        cursorOffset
                    )
                }
            }
        }, 0)
    }

    const save = async () => {
        if (!pageId) {
            console.warn("페이지 ID가 필요합니다")
            return
        }
        setSaving(true)
        try {
            const token = tokenGetter?.() || ""
            const getApiBases = () => {
                const bases: string[] = []
                try {
                    if (
                        typeof window !== "undefined" &&
                        window.location?.origin
                    ) {
                        bases.push(window.location.origin)
                    }
                } catch {}
                bases.push(PROXY_BASE_URL)
                return Array.from(new Set(bases.filter(Boolean)))
            }
            const bases = getApiBases()
            let res: Response | null = null
            let text = ""
            for (const base of bases) {
                try {
                    const tryRes = await fetch(
                        `${base}/api/page-settings?info`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(token
                                    ? { Authorization: `Bearer ${token}` }
                                    : {}),
                            },
                            body: JSON.stringify({
                                pageId,
                                items,
                            }),
                        }
                    )
                    res = tryRes
                    text = await tryRes.text()
                    if (tryRes.ok) break
                } catch (e) {
                    // continue to next base
                }
            }
            if (!res) throw new Error("network error")
            let result: any = {}
            try {
                result = JSON.parse(text)
            } catch {
                result = { raw: text }
            }
            if (!res.ok || !result?.success) {
                throw new Error(
                    result?.message || result?.error || text || "저장 실패"
                )
            }
            console.log("안내 사항이 저장되었습니다.")
        } catch (e: any) {
            console.error(e?.message || "저장 중 오류가 발생했습니다")
        } finally {
            setSaving(false)
        }
    }

    React.useEffect(() => {
        let mounted = true
        const getApiBases = () => {
            const bases: string[] = []
            try {
                if (typeof window !== "undefined" && window.location?.origin) {
                    bases.push(window.location.origin)
                }
            } catch {
                // window.location 접근 실패 시 무시
            }
            bases.push(PROXY_BASE_URL)
            return Array.from(new Set(bases.filter(Boolean)))
        }
        const request = async (path: string, init?: RequestInit) => {
            const bases = getApiBases()
            let lastRes: Response | null = null
            let lastErr: any = null
            for (const base of bases) {
                try {
                    const res = await fetch(`${base}${path}`, init)
                    if (res.ok) return res
                    lastRes = res
                } catch (e) {
                    lastErr = e
                }
            }
            if (lastRes) return lastRes
            throw lastErr || new Error("Network error")
        }
        async function load() {
            if (!pageId) return
            setLoading(true)
            try {
                const res = await request(
                    `/api/page-settings?info&pageId=${encodeURIComponent(pageId)}`
                )
                if (!res.ok) throw new Error(`load failed: ${res.status}`)
                const result = await res.json()
                if (mounted && result?.success) {
                    if (Array.isArray(result.data)) {
                        const loaded: InfoItem[] = result.data.map(
                            (it: any, idx: number) => ({
                                id: it.id,
                                title: String(it.title ?? ""),
                                description: String(it.description ?? ""),
                                display_order: Number(
                                    it.display_order ?? idx + 1
                                ),
                            })
                        )
                        setItems(loaded.length > 0 ? loaded : DEFAULT_ITEMS)
                    }
                } else if (mounted) {
                    setItems(DEFAULT_ITEMS)
                }
            } catch (_e) {
                if (mounted) setItems(DEFAULT_ITEMS)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [pageId])

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                alignItems: "stretch",
                overflow: "hidden",
            }}
        >
            {loading ? (
                <div style={{ padding: 12, color: "#6b7280" }}>
                    불러오는 중...
                </div>
            ) : (
                <div>
                    {items.map((item, index) => (
                        <ItemCard
                            key={index}
                            item={item}
                            index={index}
                            placeholder="안내 사항 제목"
                            onTitleChange={(index, value) =>
                                change(index, "title", value)
                            }
                            onDescriptionChange={(index, value) =>
                                change(index, "description", value)
                            }
                            onDelete={(index) =>
                                setItems((prev) =>
                                    prev.filter((_, i) => i !== index)
                                )
                            }
                            onOrderChange={(index, targetIndex) => {
                                setItems((prev) => {
                                    const next = [...prev]
                                    const [movedItem] = next.splice(index, 1)
                                    next.splice(targetIndex, 0, movedItem)
                                    return next.map((it, i) => ({
                                        ...it,
                                        display_order: i + 1,
                                    }))
                                })
                            }}
                            onFormatInsert={insertFormat}
                            itemsLength={items.length}
                        />
                    ))}
                    <ButtonBase
                        onClick={addItem}
                        style={{
                            width: "100%",
                            height: 40,
                            borderRadius: "2px",
                        }}
                    >
                        + 안내 추가
                    </ButtonBase>
                </div>
            )}

            {/* 저장 버튼 */}
            <button
                onClick={save}
                disabled={saving}
                style={{
                    width: "100%",
                    height: 44,
                    background: saving ? "#b3b3b3" : "#000000",
                    color: "white",
                    border: "none",
                    borderRadius: 2,
                    fontSize: 14,
                    ...theme.font.bodyBold,
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {saving ? "저장 중..." : "저장"}
            </button>

            {/* 공용 알림으로 이동 */}
        </div>
    )
}

// 교통안내 입력 탭 컴포넌트
function TransportTab({
    pageId,
    tokenGetter,
    hideSaveButton = false,
    onSaveRef,
    setPageSettings,
}: {
    pageId: string
    tokenGetter: () => string | null
    hideSaveButton?: boolean
    onSaveRef?: React.MutableRefObject<(() => Promise<void>) | null>
    setPageSettings?: React.Dispatch<React.SetStateAction<PageSettingsState>>
}): JSX.Element {
    type TransportItem = {
        id?: string
        title: string
        description: string
        display_order: number
    }

    const addressLayerCleanupRef = React.useRef<(() => void) | null>(null)

    const DEFAULT_ITEMS: TransportItem[] = [
        {
            title: "지하철",
            description:
                "2호선 강남역 3번 출구 도보 5분\n{출구 뒤 셔틀버스 15분 간격 운행\n혹은 도보 15분}",
            display_order: 1,
        },
        {
            title: "버스",
            description:
                "국립극장 앞 하차\n{*일반* 30, 32, 100\n*간선* 420, 421}",
            display_order: 2,
        },
        {
            title: "주차",
            description:
                "국립극장 맞은편 로아크 옆 위치\n정문 및 후문 주차시설 800대 가능",
            display_order: 3,
        },
    ]

    const [items, setItems] = React.useState<TransportItem[]>(DEFAULT_ITEMS)
    const [locationName, setLocationName] = React.useState<string>("")
    const [venue_address, setVenue_address] = React.useState<string>("")
    const [baseAddress, setBaseAddress] = React.useState<string>("")
    const [detailAddress, setDetailAddress] = React.useState<string>("")
    const [addressInputUsed, setAddressInputUsed] =
        React.useState<boolean>(false)
    const [addressSearched, setAddressSearched] = React.useState<boolean>(false)
    const [loading, setLoading] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const autoSaveTimerRef = React.useRef<number | null>(null)
    const skipNextAutoSaveRef = React.useRef<boolean>(true)
    const latestSaveRef = React.useRef<() => Promise<void>>(async () => {})
    // 공용 알림 사용을 위해 setError/setSuccess로 변경

    // 다음 Postcode API와 Google Maps API 타입 정의
    interface DaumPostcodeData {
        address: string
        roadAddress: string
        jibunAddress: string
        zonecode: string
        addressType: string
        bname: string
        buildingName: string
    }

    interface GoogleGeocodeResult {
        geometry: {
            location: {
                lat: () => number
                lng: () => number
            }
        }
    }

    // 다음 Postcode API 스크립트 로드 (싱글톤 패턴 및 안전한 로딩)
    const loadDaumPostcodeScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            // 이미 로드된 경우 즉시 resolve
            if ((window as any).daum && (window as any).daum.Postcode) {
                resolve()
                return
            }

            // 글로벌 로딩 상태 확인 (싱글톤 패턴)
            if ((window as any).__daumPostcodeLoading) {
                // 이미 로딩 중이면 완료될 때까지 대기
                const checkDaumAPI = () => {
                    if ((window as any).daum && (window as any).daum.Postcode) {
                        resolve()
                    } else if ((window as any).__daumPostcodeLoading) {
                        setTimeout(checkDaumAPI, 100)
                    } else {
                        reject(new Error("다음 Postcode API 로드 실패"))
                    }
                }
                checkDaumAPI()
                return
            }

            // 기존 스크립트가 있는지 확인
            const existingScript = document.querySelector(
                'script[src*="mapjsapi/bundle/postcode"]'
            )
            if (existingScript) {
                // 기존 스크립트가 로드 완료될 때까지 대기
                const checkDaumAPI = () => {
                    if ((window as any).daum && (window as any).daum.Postcode) {
                        resolve()
                    } else {
                        setTimeout(checkDaumAPI, 100)
                    }
                }
                checkDaumAPI()
                return
            }

            // 로딩 시작 플래그 설정
            ;(window as any).__daumPostcodeLoading = true

            const script = document.createElement("script")
            script.src =
                "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
            script.async = true
            script.defer = true

            // 타임아웃 설정 (10초)
            const timeoutId = setTimeout(() => {
                ;(window as any).__daumPostcodeLoading = false
                reject(new Error("다음 Postcode API 로드 타임아웃"))
            }, 10000)

            script.onload = () => {
                clearTimeout(timeoutId)
                // API가 완전히 초기화될 때까지 잠시 대기
                setTimeout(() => {
                    ;(window as any).__daumPostcodeLoading = false
                    if ((window as any).daum && (window as any).daum.Postcode) {
                        resolve()
                    } else {
                        reject(new Error("다음 Postcode API 초기화 실패"))
                    }
                }, 200)
            }

            script.onerror = () => {
                clearTimeout(timeoutId)
                ;(window as any).__daumPostcodeLoading = false
                reject(new Error("다음 Postcode API 로드 실패"))
            }

            document.head.appendChild(script)
        })
    }

   // 주소를 좌표로 변환 (Naver 지오코딩 API 사용)
    const geocodeAddress = (
        address: string
    ): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            console.log("geocodeAddress 호출됨 - 주소:", address)

            if (!address.trim()) {
                reject(new Error("주소가 비어있습니다"))
                return
            }

            console.log("Naver 지오코딩 API 호출 중...")

            // 타임아웃 설정 (8초)
            const timeoutId = setTimeout(() => {
                console.error("주소 변환 타임아웃 (8초)")
                reject(new Error("주소 변환 타임아웃"))
            }, 8000)

            // 서버의 Naver 지오코딩 프록시 API 호출
            fetch("https://wedding-admin-proxy.vercel.app/api/map-config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: address }),
                signal: AbortSignal.timeout(8000),
            })
                .then((response) => {
                    clearTimeout(timeoutId)
                    console.log("Naver API 응답 상태:", response.status)

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                    }
                    return response.json()
                })
                .then((data) => {
                    console.log("Naver API 응답 데이터:", data)

                    if (!data.addresses || data.addresses.length === 0) {
                        console.error("Naver 지오코딩 결과 없음 - 주소:", address)
                        reject(new Error("검색 결과가 없습니다"))
                        return
                    }

                    const addr = data.addresses[0]
                    const coordinates = {
                        lat: parseFloat(addr.y),
                        lng: parseFloat(addr.x),
                    }

                    if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
                        console.error("좌표 파싱 실패:", addr)
                        reject(new Error("좌표 변환 실패"))
                        return
                    }

                    console.log("좌표 변환 성공:", coordinates)
                    resolve(coordinates)
                })
                .catch((error) => {
                    clearTimeout(timeoutId)
                    console.error("Naver 지오코딩 API 호출 실패:", error)
                    reject(new Error(`주소 변환 실패: ${error.message}`))
                })
        })
    }

    // 다음 주소 검색 레이어 닫기
    const closeDaumPostcode = () => {
        if (typeof document === "undefined") return
        const element_layer = document.getElementById("addressLayer")
        if (element_layer) {
            element_layer.style.display = "none"
        }
        if (typeof window !== "undefined") {
            addressLayerCleanupRef.current?.()
            addressLayerCleanupRef.current = null
        }
    }

    // 레이어 위치 초기화
    const initLayerPosition = () => {
        const width = 300
        const height = 400
        const borderWidth = 5

        const element_layer = document.getElementById("addressLayer")
        if (element_layer) {
            element_layer.style.width = width + "px"
            element_layer.style.height = height + "px"
            element_layer.style.border = borderWidth + "px solid"

            // 모바일 환경에서 화면 크기 제한
            const maxWidth = Math.min(width, window.innerWidth * 0.9)
            const maxHeight = Math.min(height, window.innerHeight * 0.7)

            element_layer.style.width = Math.max(maxWidth, 280) + "px"
            element_layer.style.height = Math.max(maxHeight, 350) + "px"

            // 화면 중앙에 위치
            const left = Math.max(10, (window.innerWidth - maxWidth) / 2)
            const top = Math.max(10, (window.innerHeight - maxHeight) / 2)

            element_layer.style.left = left + "px"
            element_layer.style.top = top + "px"
            element_layer.style.transform = "none"
        }
    }

    // 다음 Postcode API 레이어 열기 (안전한 에러 처리)
    const openDaumPostcode = async () => {
        try {
            // 타임아웃 설정 (전체 작업 30초 제한)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error("주소 검색 초기화 타임아웃")),
                    30000
                )
            })

            const initPromise = Promise.all([
                loadDaumPostcodeScript(),
            ]).then(() => {
                // API 로드 완료 후 충분한 대기 시간 (안정성 확보)
                return new Promise((resolve) => setTimeout(resolve, 1500))
            })

            await Promise.race([initPromise, timeoutPromise])

            console.log("주소 검색 API 로드 완료 확인됨")

            const element_layer = document.getElementById("addressLayer")
            if (!element_layer) {
                console.error("주소 검색 레이어를 찾을 수 없습니다.")
                return
            }

            new (window as any).daum.Postcode({
                oncomplete: async (data: DaumPostcodeData) => {
                    const newBaseAddress = data.roadAddress || data.jibunAddress
                    setBaseAddress(newBaseAddress)
                    // 상세주소는 사용자가 별도 입력 (state 유지)
                    const fullAddress = detailAddress
                        ? `${newBaseAddress} ${detailAddress}`.trim()
                        : newBaseAddress
                    setVenue_address(fullAddress)
                    // 도로명 주소 검색 완료 시 입력 버튼 사용 가능하도록 초기화
                    setAddressInputUsed(false)
                    // 도로명 주소 검색 완료 표시
                    setAddressSearched(true)

                    try {
                        // 주소를 좌표로 변환 (타임아웃 10초)
                        console.log("좌표 변환 시작 - 주소:", newBaseAddress)
                        const coordinatesPromise = geocodeAddress(newBaseAddress)
                        const timeoutPromise = new Promise<never>(
                            (_, reject) => {
                                setTimeout(
                                    () =>
                                        reject(new Error("좌표 변환 타임아웃")),
                                    10000
                                )
                            }
                        )

                        const coordinates = await Promise.race([
                            coordinatesPromise,
                            timeoutPromise,
                        ])
                        console.log("좌표 변환 성공:", coordinates)

                        // 페이지 설정에 좌표 저장
                        await saveCoordinatesToServer(
                            coordinates.lat,
                            coordinates.lng,
                            fullAddress
                        )

                        console.log(
                            `주소와 좌표가 모두 설정되었습니다: ${fullAddress}`
                        )
                    } catch (error) {
                        // 좌표 변환 실패해도 주소는 저장
                        console.warn("좌표 변환 실패:", error)
                        try {
                            await saveCoordinatesToServer(0, 0, fullAddress)
                            console.log(
                                `주소가 설정되었습니다: ${fullAddress} (좌표 변환 실패)`
                            )
                        } catch (saveError) {
                            console.error(
                                "주소 설정에 실패했습니다. 다시 시도해주세요.",
                                saveError
                            )
                        }
                    }

                    // 레이어 닫기
                    closeDaumPostcode()
                },
                width: "100%",
                height: "100%",
                maxSuggestItems: 5,
                theme: {
                    // 가이드 권장 테마 적용 (검색창/테두리 등)
                    borderColor: "#AEAEAE",
                    emphTextColor: "#111827",
                    pageBgColor: "#FFFFFF",
                    bgColor: "#FFFFFF",
                    queryTextColor: "#111827",
                    outlineColor: "#AEAEAE",
                },
            }).embed(element_layer)

            // 레이어 보이기
            element_layer.style.display = "block"

            // 레이어 위치 초기화
            initLayerPosition()

            // 브라우저 크기 변경 시 레이어 위치 재조정
            const handleResize = () => {
                initLayerPosition()
            }

            // 기존 리스너가 있다면 먼저 정리
            addressLayerCleanupRef.current?.()

            window.addEventListener("resize", handleResize)
            window.addEventListener("orientationchange", handleResize)
            addressLayerCleanupRef.current = () => {
                window.removeEventListener("resize", handleResize)
                window.removeEventListener("orientationchange", handleResize)
            }
        } catch (error) {
            // Google Maps API 실패 시 주소만 저장하는 폴백
            try {
                const fallbackAddress = prompt(
                    "지도 API 로드에 실패했습니다. 주소를 직접 입력해주세요:"
                )
                if (fallbackAddress && fallbackAddress.trim()) {
                    setVenue_address(fallbackAddress.trim())
                    await saveCoordinatesToServer(0, 0, fallbackAddress.trim())
                    console.log(
                        `주소가 설정되었습니다: ${fallbackAddress} (수동 입력)`
                    )
                } else {
                    console.warn("주소가 입력되지 않았습니다.")
                }
            } catch (fallbackError) {
                console.error("주소 검색 및 입력에 실패했습니다.")
            }
        }
    }
 

    // 서버에 좌표 저장
    const saveCoordinatesToServer = async (
        lat: number,
        lng: number,
        address: string
    ) => {
        const token = tokenGetter()
        if (!token) {
            throw new Error("로그인이 필요합니다")
        }

        const requestBody = {
            settings: {
                venue_address: address,
                venue_lat: lat,
                venue_lng: lng,
                bgm: "off", // NOT NULL 제약조건 해결
            },
        }

        const response = await fetch(
            `https://wedding-admin-proxy.vercel.app/api/page-settings`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`서버 오류: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        if (!result.success) {
            throw new Error(result.error || "저장 실패")
        }

        // 로컬 상태 업데이트
        if (setPageSettings) {
            setPageSettings((prev: PageSettingsState) => ({
                ...prev,
                venue_address: address,
                venue_lat: lat,
                venue_lng: lng,
            }))
        }
    }

    React.useEffect(() => {
        if (!setPageSettings) return
        setPageSettings((prev: PageSettingsState) => {
            const sameTransport =
                prev.transport_location_name === locationName &&
                prev.venue_name_kr === locationName
            if (sameTransport) {
                return prev
            }
            return {
                ...prev,
                transport_location_name: locationName,
                venue_name_kr: locationName,
            }
        })
    }, [locationName, setPageSettings])

    React.useEffect(() => {
        if (!setPageSettings) return
        setPageSettings((prev: PageSettingsState) =>
            prev.venue_address === venue_address
                ? prev
                : {
                      ...prev,
                      venue_address,
                  }
        )
    }, [venue_address, setPageSettings])

    React.useEffect(() => {
        let mounted = true
        const getApiBases = () => {
            const bases: string[] = []
            try {
                if (typeof window !== "undefined" && window.location?.origin) {
                    bases.push(window.location.origin)
                }
            } catch {
                // window.location 접근 실패 시 무시
            }
            bases.push(PROXY_BASE_URL)
            return Array.from(new Set(bases.filter(Boolean)))
        }
        const request = async (path: string, init?: RequestInit) => {
            const bases = getApiBases()
            let lastRes: Response | null = null
            let lastErr: any = null
            for (const base of bases) {
                try {
                    const res = await fetch(`${base}${path}`, init)
                    if (res.ok) return res
                    lastRes = res
                } catch (e) {
                    lastErr = e
                }
            }
            if (lastRes) return lastRes
            throw lastErr || new Error("Network error")
        }
        async function load() {
            if (!pageId) return
            setLoading(true)
            try {
                const res = await request(
                    `/api/page-settings?transport&pageId=${encodeURIComponent(pageId)}`
                )
                if (!res.ok) throw new Error(`load failed: ${res.status}`)
                const result = await res.json()
                if (mounted && result?.success) {
                    if (Array.isArray(result.data)) {
                        const loaded: TransportItem[] = result.data.map(
                            (it: any, idx: number) => ({
                                id: it.id,
                                title: String(it.title ?? ""),
                                description: String(it.description ?? ""),
                                display_order: Number(
                                    it.display_order ?? idx + 1
                                ),
                            })
                        )
                        setItems(loaded.length > 0 ? loaded : DEFAULT_ITEMS)
                    }
                    // locationName이 비어있으면 venue_name 값으로 보정
                    let fetchedLocationName =
                        result.locationName !== undefined
                            ? result.locationName
                            : undefined
                    if (
                        (fetchedLocationName === undefined ||
                            fetchedLocationName === null ||
                            fetchedLocationName === "") &&
                        result.venue_name !== undefined
                    ) {
                        fetchedLocationName = result.venue_name
                    }
                    if (fetchedLocationName !== undefined) {
                        skipNextAutoSaveRef.current = true
                        setLocationName(String(fetchedLocationName || ""))
                    }
                    if (result.venue_address !== undefined) {
                        console.log(
                            "TransportTab 로드 - venue_address:",
                            result.venue_address
                        )
                        const fullAddress = String(result.venue_address || "")
                        setVenue_address(fullAddress)
                        
                        // 주소를 기본 주소와 상세 주소로 분리
                        // 마지막 공백을 기준으로 분리 (일반적인 한국 주소 패턴)
                        const addressParts = fullAddress.split(' ')
                        if (addressParts.length > 1) {
                            const lastPart = addressParts[addressParts.length - 1]
                            // 마지막 부분이 숫자나 특수문자로 시작하면 상세 주소로 간주
                            if (/^[0-9\-]/.test(lastPart)) {
                                setBaseAddress(addressParts.slice(0, -1).join(' '))
                                setDetailAddress(lastPart)
                            } else {
                                setBaseAddress(fullAddress)
                                setDetailAddress("")
                            }
                        } else {
                            setBaseAddress(fullAddress)
                            setDetailAddress("")
                        }
                    }
                } else if (mounted) {
                    setItems(DEFAULT_ITEMS)
                }
            } catch (error) {
                console.warn("TransportTab 로드 실패:", error)
                if (mounted) setItems(DEFAULT_ITEMS)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [pageId])

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                title: "교통편",
                description: "상세 항목",
                display_order: prev.length + 1,
            },
        ])
    }

    const move = (index: number, dir: -1 | 1) => {
        setItems((prev) => {
            const next = [...prev]
            const ni = index + dir
            if (ni < 0 || ni >= next.length) return prev
            const temp = next[index]
            next[index] = next[ni]
            next[ni] = temp
            return next.map((it, i) => ({ ...it, display_order: i + 1 }))
        })
    }

    const change = (
        index: number,
        field: "title" | "description",
        value: string
    ) => {
        setItems((prev) =>
            prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
        )
    }

    // 텍스트 포맷팅 함수들
    const insertFormat = (index: number, format: "bold" | "small") => {
        if (typeof document === "undefined") return
        const textareaId = `description-${index}`
        const textarea = document.getElementById(
            textareaId
        ) as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = textarea.value.substring(start, end)
        const beforeText = textarea.value.substring(0, start)
        const afterText = textarea.value.substring(end)

        let newText = ""
        let cursorOffset = 0

        if (format === "bold") {
            if (selectedText) {
                newText = `${beforeText}*${selectedText}*${afterText}`
                cursorOffset = start + selectedText.length + 2
            } else {
                newText = `${beforeText}*텍스트*${afterText}`
                cursorOffset = start + 1
            }
        } else if (format === "small") {
            if (selectedText) {
                newText = `${beforeText}{${selectedText}}${afterText}`
                cursorOffset = start + selectedText.length + 2
            } else {
                newText = `${beforeText}{텍스트}${afterText}`
                cursorOffset = start + 1
            }
        }

        // 값 업데이트
        change(index, "description", newText)

        // 커서 위치 복원 (다음 렌더링 이후)
        setTimeout(() => {
            if (typeof document !== "undefined") {
                const updatedTextarea = document.getElementById(
                    textareaId
                ) as HTMLTextAreaElement
                if (updatedTextarea) {
                    updatedTextarea.focus()
                    updatedTextarea.setSelectionRange(
                        cursorOffset,
                        cursorOffset
                    )
                }
            }
        }, 0)
    }

    const save = React.useCallback(async () => {
        if (!pageId) {
            console.warn("페이지 ID가 필요합니다")
            return
        }
        setSaving(true)
        try {
            broadcastAutoSaveToast()
            const token = tokenGetter?.() || ""
            const getApiBases = () => {
                const bases: string[] = []
                try {
                    if (
                        typeof window !== "undefined" &&
                        window.location?.origin
                    ) {
                        bases.push(window.location.origin)
                    }
                } catch {}
                bases.push(PROXY_BASE_URL)
                return Array.from(new Set(bases.filter(Boolean)))
            }
            const bases = getApiBases()
            let res: Response | null = null
            let text = ""
            for (const base of bases) {
                try {
                    const tryRes = await fetch(
                        `${base}/api/page-settings?transport`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(token
                                    ? { Authorization: `Bearer ${token}` }
                                    : {}),
                            },
                            body: JSON.stringify({
                                pageId,
                                items,
                                locationName,
                                venue_address,
                                venue_name_kr: locationName,
                                transport_location_name: locationName,
                                bgm: "off", // NOT NULL 제약조건 해결
                            }),
                        }
                    )
                    console.log(
                        "TransportTab 저장 - venue_address:",
                        venue_address
                    )
                    res = tryRes
                    text = await tryRes.text()
                    if (tryRes.ok) break
                } catch (e) {
                    // continue to next base
                }
            }
            if (!res) throw new Error("network error")
            let result: any = {}
            try {
                result = JSON.parse(text)
            } catch {
                result = { raw: text }
            }
            if (!res.ok || !result?.success) {
                throw new Error(
                    result?.message || result?.error || text || "저장 실패"
                )
            }
            console.log("교통안내가 저장되었습니다.")
        } catch (e: any) {
            console.error(e?.message || "저장 중 오류가 발생했습니다")
        } finally {
            setSaving(false)
        }
    }, [pageId, tokenGetter, items, locationName, venue_address])

    React.useEffect(() => {
        latestSaveRef.current = save
    }, [save])

    React.useEffect(() => {
        if (skipNextAutoSaveRef.current) {
            skipNextAutoSaveRef.current = false
            return
        }

        if (autoSaveTimerRef.current) {
            window.clearTimeout(autoSaveTimerRef.current)
        }

        autoSaveTimerRef.current = window.setTimeout(() => {
            latestSaveRef.current().catch((error) => {
                console.error("교통 안내 자동 저장 실패:", error)
            })
            autoSaveTimerRef.current = null
        }, 800)

        return () => {
            if (autoSaveTimerRef.current) {
                window.clearTimeout(autoSaveTimerRef.current)
                autoSaveTimerRef.current = null
            }
        }
    }, [locationName])

    // onSaveRef를 통해 save 함수를 외부에 노출
    React.useEffect(() => {
        if (onSaveRef) {
            onSaveRef.current = save
        }
        return () => {
            if (onSaveRef) {
                onSaveRef.current = null
            }
        }
    }, [save, onSaveRef])

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                alignItems: "stretch",
                overflow: "hidden",
            }}
        >
            {/* 예식 장소 이름 */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.gap.sm,
                    alignItems: "flex-start",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        ...theme.typography.label,
                    }}
                >
                    예식 장소
                </div>
                <div
                    style={{
                        textAlign: "center",
                        color: "#AEAEAE",
                        fontSize: 14,
                        fontFamily: theme.font.body,
                    }}
                >
                    층 / 홀 정보는 예식 장소와 함께 입력해주세요
                </div>
                <input
                    style={{
                        flex: 1,
                        height: "calc(40px * 1.1429)",
                        padding: "calc(12px * 1.1429)",
                        paddingLeft: "calc(12px * 0.875)", // scale로 인한 좌측 여백 보정
                        background: "white",
                        border: `1px solid ${theme.color.border}`,
                        borderRadius: 2,
                        outlineOffset: -0.25,
                        fontSize: 16, // iOS 자동 확대 방지를 위해 16px로 설정
                        fontFamily: theme.font.body,
                        color: locationName ? "black" : "#ADADAD",
                        width: "calc(100% * 1.1429)",
                        transform: "scale(0.875)", // 14px처럼 보이도록 스케일 조정
                        transformOrigin: "left center",
                        marginBottom: "calc(40px - 40px * 0.875)", // 하단 여백 제거
                    }}
                    placeholder="그랜드볼룸 | 사파이어홀"
                    value={locationName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLocationName(e.target.value)
                    }
                />
                <div
                    style={{
                        textAlign: "center",
                        color: "black",
                        fontSize: 14,
                        ...theme.font.bodyBold,
                        marginTop: 16,
                    }}
                >
                    예식장 주소
                </div>
                {/* 도로명 주소 검색 버튼 - 한 줄 전체 */}
                <button
                    type="button"
                    onClick={openDaumPostcode}
                    style={{
                        width: "calc(100% * 1.1429)",
                        height: "calc(40px * 1.1429)",
                        transform: "scale(0.875)",
                        transformOrigin: "left center",
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        backgroundColor: "#3f3f3f",
                        color: "white",
                        outlineOffset: "-0.50px",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                        border: "none",
                        borderRadius: 2,
                        cursor: "pointer",
                        opacity: 1,
                        fontSize: "16px",
                        fontFamily: theme.font.body,
                        marginBottom: -8,
                    }}
                >
                    도로명 주소 검색
                </button>

                {/* 상세주소 입력 + 입력 버튼 */}
                <div
                    style={{
                        width: "calc(100% * 1.1429)",
                        height: "calc(40px * 1.1429)",
                        transform: "scale(0.875)",
                        transformOrigin: "left center",
                        display: "flex",
                        gap: 6,
                        marginBottom: -8,
                    }}
                >
                    <input
                        style={{
                            flex: 1,
                            height: "100%",
                            borderRadius: 2,
                            padding: "calc(12px * 1.1429)",
                            paddingLeft: "calc(12px * 0.875)",
                            background: addressSearched ? "#ffffff" : "#f5f5f5",
                            border: `1px solid ${theme.color.border}`,
                            outlineOffset: -0.25,
                            fontSize: 16,
                            fontFamily: theme.font.body,
                            color: addressSearched
                                ? detailAddress
                                    ? "black"
                                    : "#ADADAD"
                                : "#999",
                            cursor: addressSearched ? "text" : "pointer",
                        }}
                        placeholder={
                            addressSearched
                                ? "상세주소 입력"
                                : "도로명 주소를 먼저 검색하세요"
                        }
                        value={detailAddress || ""}
                        onChange={(e) => {
                            if (!addressSearched) return
                            setDetailAddress(e.target.value)
                        }}
                        onBlur={() => {
                            if (detailAddress && detailAddress.trim()) {
                                // 상세 주소 입력 완료 시 전체 주소 업데이트하고 입력칸 초기화
                                const combined = `${baseAddress} ${detailAddress}`.trim()
                                setVenue_address(combined)
                                setDetailAddress("") // 입력 완료 후 초기화
                            }
                        }}
                        onClick={() => {
                            if (!addressSearched) {
                                openDaumPostcode()
                            }
                        }}
                        readOnly={!addressSearched}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (addressInputUsed || !addressSearched) return // 이미 사용된 경우 또는 주소 검색 전 무시

                            if (detailAddress && detailAddress.trim()) {
                                // 상세 주소 입력 완료 시 전체 주소 업데이트하고 입력칸 초기화
                                const combined = `${baseAddress} ${detailAddress}`.trim()
                                setVenue_address(combined)
                                setDetailAddress("") // 입력 완료 후 초기화
                                setAddressInputUsed(true) // 사용됨 표시
                            }
                        }}
                        style={{
                            width: 90,
                            height: "100%",
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingTop: 0,
                            paddingBottom: 0,
                            background:
                                addressInputUsed || !addressSearched
                                    ? "#f5f5f5"
                                    : "white",
                            border: `1px solid ${addressInputUsed || !addressSearched ? "#ccc" : theme.color.border}`,
                            borderRadius: 2,
                            cursor:
                                addressInputUsed || !addressSearched
                                    ? "not-allowed"
                                    : "pointer",
                            justifyContent: "center",
                            alignItems: "center",
                            display: "flex",
                            fontSize: 14,
                            fontFamily: theme.font.body,
                            color:
                                addressInputUsed || !addressSearched
                                    ? "#999"
                                    : "#333",
                        }}
                    >
                        입력
                    </button>
                </div>

                {/* 예식장 주소 + 삭제 버튼 */}
                <div
                    style={{
                        width: "calc(100% * 1.1429)",
                        height: "calc(40px * 1.1429)",
                        transform: "scale(0.875)",
                        transformOrigin: "left center",
                        display: "flex",
                        gap: 6,
                    }}
                >
                    <input
                        style={{
                            flex: 1,
                            height: "100%",
                            padding: "calc(12px * 1.1429)",
                            paddingLeft: "calc(12px * 0.875)",
                            background: "#f5f5f5",
                            border: `1px solid ${theme.color.border}`,
                            outlineOffset: -0.25,
                            borderRadius: 2,
                            fontSize: 16,
                            fontFamily: theme.font.body,
                            color: venue_address ? "black" : "#ADADAD",
                            cursor: "pointer",
                        }}
                        placeholder="예식장 주소"
                        value={venue_address}
                        readOnly={true}
                        onClick={openDaumPostcode}
                        onChange={() => {}} // 직접 입력 방지
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setVenue_address("")
                            setDetailAddress("")
                            setAddressInputUsed(false) // 삭제 시 입력 버튼 상태 초기화
                            setAddressSearched(false) // 삭제 시 주소 검색 상태 초기화
                        }}
                        style={{
                            width: 90,
                            height: "100%",
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingTop: 0,
                            paddingBottom: 0,
                            background: "white",
                            border: "1px solid #f7b0b0",
                            borderRadius: 2,
                            cursor: "pointer",
                            justifyContent: "center",
                            alignItems: "center",
                            display: "flex",
                        }}
                    >
                        <div
                            style={{
                                color: "#b12525",
                                fontSize: 14,
                                fontFamily: theme.font.body,
                                wordWrap: "break-word",
                            }}
                        >
                            삭제
                        </div>
                    </button>
                </div>
                {/* 다음 주소 검색 레이어 */}
                <div
                    id="addressLayer"
                    style={{
                        display: "none",
                        position: "fixed",
                        overflow: "hidden",
                        zIndex: 1000,
                        WebkitOverflowScrolling: "touch",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "100%",
                        height: "400px",
                        backgroundColor: "white",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                        borderRadius: "2px",
                        maxWidth: "95vw",
                        maxHeight: "70vh",
                    }}
                >
                    <div
                        id="btnCloseLayer"
                        onClick={closeDaumPostcode}
                        aria-label="닫기 버튼"
                        role="button"
                        style={{
                            cursor: "pointer",
                            position: "absolute",
                            right: "-3px",
                            top: "-3px",
                            zIndex: 1,
                            width: 18,
                            height: 18,
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                        >
                            <rect width="18" height="18" fill="black" />
                            <path
                                d="M3.85742 3.85714L14.1431 14.1429"
                                stroke="white"
                                strokeWidth="1.71429"
                            />
                            <path
                                d="M14.1426 3.85714L3.85686 14.1429"
                                stroke="white"
                                strokeWidth="1.71429"
                            />
                        </svg>
                    </div>
                </div>

                {/* 공용 알림으로 이동 */}
            </div>

            {loading ? (
                <div style={{ padding: 12, color: "#6b7280" }}>
                    불러오는 중...
                </div>
            ) : (
                <div>
                    {items.map((item, index) => (
                        <ItemCard
                            key={index}
                            item={item}
                            index={index}
                            placeholder="교통 수단"
                            onTitleChange={(index, value) =>
                                change(index, "title", value)
                            }
                            onDescriptionChange={(index, value) =>
                                change(index, "description", value)
                            }
                            onDelete={(index) =>
                                setItems((prev) =>
                                    prev.filter((_, i) => i !== index)
                                )
                            }
                            onOrderChange={(index, targetIndex) => {
                                setItems((prev) => {
                                    const next = [...prev]
                                    const [movedItem] = next.splice(index, 1)
                                    next.splice(targetIndex, 0, movedItem)
                                    return next.map((it, i) => ({
                                        ...it,
                                        display_order: i + 1,
                                    }))
                                })
                            }}
                            onFormatInsert={insertFormat}
                            itemsLength={items.length}
                        />
                    ))}
                    <ButtonBase
                        onClick={addItem}
                        style={{
                            width: "100%",
                            height: 40,
                            borderRadius: "2px",
                        }}
                    >
                        + 안내 추가
                    </ButtonBase>
                </div>
            )}

            {/* 교통안내 저장 버튼 */}
            {!hideSaveButton && (
                <button
                    onClick={save}
                    disabled={saving}
                    style={{
                        width: "100%",
                        height: 44,
                        background: saving ? "#b3b3b3" : "#000000",
                        color: "white",
                        border: "none",
                        borderRadius: 2,
                        fontSize: 14,
                        ...theme.font.bodyBold,
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {saving ? "저장 중..." : "저장"}
                </button>
            )}
        </div>
    )
}

// SaveActionBar를 포함하는 wrapper 컴포넌트
export default function AdminNew(props: any) {
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveFunction, setSaveFunction] = useState<
        (() => Promise<void>) | null
    >(null)
    const [showCopyPopup, setShowCopyPopup] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // AdminMainContent에서 상태를 업데이트할 수 있도록 콜백 함수들 제공
    const updateSaveState = (
        hasUnsavedChanges: boolean,
        isSavingOrder: boolean,
        saveImageOrderFn: () => Promise<void>
    ) => {
        setHasChanges(hasUnsavedChanges)
        setIsSaving(isSavingOrder)
        setSaveFunction(() => saveImageOrderFn)
    }

    return (
        <>
            <AdminMainContent
                {...props}
                updateSaveState={updateSaveState}
                showCopyPopup={showCopyPopup}
                setShowCopyPopup={setShowCopyPopup}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                isAuthenticated={isAuthenticated}
                setIsAuthenticated={setIsAuthenticated}
            />
            {/* Footer */}
            <div
                style={{
                    width: "100%",
                    display: "none", // moved into tab footers
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 40,
                    paddingBottom: 30,
                    gap: 10,
                }}
            >
                {/* Icon stack */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        opacity: 0.3,
                    }}
                >
                    <div data-svg-wrapper>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="57"
                            height="13"
                            viewBox="0 0 57 13"
                            fill="none"
                        >
                            <path
                                d="M20.0771 0.908438C19.2193 0.322116 18.1965 0.0300293 17.0106 0.0300293C15.4195 0.0300293 14.045 0.57984 12.8913 1.67731C11.7355 2.77693 11.1587 4.38556 11.1587 6.50534C11.1587 7.92067 11.4375 9.11909 11.995 10.0941C12.5525 11.0713 13.2709 11.7994 14.1479 12.2783C15.025 12.7573 15.9556 12.9957 16.9399 12.9957C17.9863 12.9957 18.947 12.7358 19.824 12.2118C20.7011 11.6899 21.398 10.9339 21.9126 9.9481C22.4273 8.9623 22.6846 7.80469 22.6846 6.47527C22.6846 5.3241 22.4637 4.25455 22.0241 3.26661C21.5824 2.28082 20.9327 1.49261 20.0749 0.908438H20.0771ZM19.5774 9.24795C19.4595 10.0898 19.1936 10.7943 18.7797 11.3634C18.3659 11.9326 17.7612 12.2182 16.9677 12.2182C15.7648 12.2182 14.9842 11.7028 14.6261 10.6719C14.268 9.64098 14.09 8.29007 14.09 6.61702C14.09 5.25967 14.1715 4.15576 14.3323 3.30312C14.4932 2.45263 14.7784 1.82121 15.1836 1.41315C15.5889 1.00723 16.1529 0.8032 16.8777 0.8032C18.012 0.8032 18.7754 1.26925 19.1679 2.2035C19.5603 3.13775 19.7576 4.52731 19.7576 6.37218C19.7576 7.44603 19.6975 8.40605 19.5817 9.2458L19.5774 9.24795Z"
                                fill="black"
                            />
                            <path
                                d="M34.9243 11.5696C34.8171 11.7221 34.6756 11.7973 34.4954 11.7973C34.3003 11.7973 34.1481 11.7458 34.043 11.6405C33.9358 11.5353 33.8607 11.4021 33.8114 11.241C33.7621 11.08 33.7299 10.9082 33.7149 10.7277C33.6977 10.5473 33.6892 10.382 33.6892 10.2295V3.98827C33.6892 3.20866 33.5626 2.56435 33.3096 2.05105C33.0566 1.53775 32.7263 1.12969 32.3189 0.826863C31.9115 0.524038 31.4376 0.309268 30.8994 0.184702C30.3611 0.0622832 29.8143 0 29.2611 0C28.8858 0 28.4441 0.0322155 27.9401 0.0987941C27.4341 0.165373 26.958 0.287791 26.5099 0.468198C26.0617 0.648605 25.6821 0.899885 25.3712 1.22419C25.3519 1.24352 25.3369 1.27144 25.3197 1.29291C25.3069 1.3058 25.2897 1.31439 25.279 1.32728C24.9059 1.71601 24.61 2.40757 24.715 2.92087C24.9059 3.85941 25.9909 3.81646 26.5849 3.44705C27.3183 2.98959 26.8723 2.41186 26.8851 1.78688C26.8916 1.52057 26.8937 1.20056 27.3633 0.936396C27.3955 0.92351 27.4191 0.908476 27.4534 0.89559C27.6807 0.809682 27.9316 0.749546 28.1996 0.710888C28.4677 0.672229 28.725 0.6529 28.9694 0.6529C29.4734 0.6529 29.8658 0.762433 30.1445 0.981498C30.4212 1.20056 30.6249 1.46688 30.7557 1.78044C30.8865 2.094 30.9637 2.41616 30.9873 2.74905C31.013 3.08195 31.0237 3.36115 31.0237 3.5888V4.41567C31.0237 4.58748 30.9036 4.74856 30.6678 4.90105C30.4319 5.05353 30.0931 5.24253 29.6535 5.47019C29.2461 5.68066 28.7571 5.90832 28.1867 6.1553C27.6163 6.40229 27.0695 6.70082 26.5485 7.05304C26.0252 7.40526 25.5814 7.82621 25.2147 8.32018C24.848 8.81415 24.6636 9.40262 24.6636 10.0877C24.6636 10.5817 24.7408 11.0091 24.8973 11.3699C25.0517 11.7307 25.2597 12.0293 25.5213 12.2676C25.7829 12.506 26.0788 12.68 26.4134 12.7938C26.7479 12.9077 27.0931 12.9656 27.4534 12.9656C28.2189 12.9656 28.8794 12.8132 29.4348 12.5103C29.9902 12.2075 30.552 11.7801 31.1224 11.2282C31.3025 11.7973 31.5663 12.2311 31.9179 12.5254C32.2675 12.8196 32.7542 12.9678 33.3739 12.9678C33.717 12.9678 34.0172 12.8969 34.2789 12.7552C34.5405 12.6113 34.7571 12.4523 34.9265 12.2698C35.098 12.0894 35.231 11.909 35.3296 11.7286C35.4282 11.5482 35.4926 11.4107 35.5247 11.3162L35.2052 11.1165C35.1237 11.269 35.0294 11.4215 34.9243 11.5718V11.5696ZM31.0216 10.4228C30.7278 10.7857 30.3804 11.0907 29.9816 11.3377C29.5806 11.5868 29.1539 11.7092 28.6971 11.7092C28.4677 11.7092 28.2682 11.647 28.0967 11.5224C27.9251 11.3978 27.7815 11.2368 27.6678 11.0349C27.5542 10.8351 27.4684 10.6161 27.4105 10.3777C27.3526 10.1393 27.3247 9.89659 27.3247 9.64746C27.3247 8.97952 27.4298 8.44045 27.6421 8.03024C27.8544 7.62003 28.131 7.2721 28.4741 6.98431C28.8172 6.69867 29.2075 6.44524 29.6492 6.22617C30.0888 6.00711 30.5455 5.75368 31.0194 5.46804V10.4206L31.0216 10.4228Z"
                                fill="black"
                            />
                            <path
                                d="M55.3281 10.9855C55.133 11.1852 54.8992 11.3699 54.6312 11.5417C54.3631 11.7136 54.0608 11.851 53.7263 11.9562C53.3917 12.0615 53.0294 12.113 52.6391 12.113C51.7084 12.113 50.9708 11.6341 50.4261 10.6741C49.8793 9.71405 49.607 8.34167 49.607 6.55693C49.607 5.83531 49.6563 5.12227 49.7549 4.41997C49.8514 3.71768 50.0187 3.09055 50.2567 2.53859C50.4926 1.98878 50.8035 1.54206 51.1874 1.20057C51.569 0.85909 52.0472 0.687274 52.6176 0.687274C52.7635 0.687274 52.9157 0.706604 53.0701 0.743114C53.2202 0.779625 53.3596 0.826875 53.4882 0.882715C53.812 1.11681 53.9278 1.45615 53.9321 1.69669C53.945 2.32167 53.499 2.8994 54.2323 3.35686C54.8285 3.72841 55.9114 3.77137 56.1022 2.83068C56.2073 2.31738 55.9114 1.62367 55.5382 1.23708C55.4182 1.11037 55.2595 0.979361 55.1008 0.852647C55.0257 0.790364 54.9485 0.732376 54.8671 0.678684C54.8542 0.670093 54.837 0.655059 54.8242 0.646468C54.8242 0.646468 54.8242 0.648616 54.822 0.650763C54.7255 0.58848 54.6333 0.521902 54.5283 0.472505C54.1852 0.311427 53.8356 0.197599 53.4754 0.131021C53.1173 0.064442 52.8321 0.0322266 52.6198 0.0322266C51.7878 0.0322266 51.0137 0.201895 50.2953 0.545526C49.5769 0.88701 48.9529 1.35736 48.4233 1.95656C47.8936 2.55577 47.4733 3.26666 47.1624 4.09352C46.8536 4.92039 46.6992 5.80739 46.6992 6.75882C46.6992 7.76609 46.8407 8.65308 47.1281 9.42411C47.4133 10.193 47.7971 10.8437 48.2775 11.3764C48.7578 11.909 49.3175 12.3128 49.9522 12.5877C50.5891 12.8626 51.2646 13 51.9829 13C52.7013 13 53.4582 12.8153 54.2087 12.4438C54.9593 12.0744 55.5961 11.4902 56.1172 10.6912L55.8492 10.4056C55.7034 10.5968 55.5318 10.79 55.3345 10.9898L55.3281 10.9855Z"
                                fill="black"
                            />
                            <path
                                d="M10.1143 0.927777C10.1143 0.927777 10.1101 0.923482 10.1079 0.921334C10.1058 0.917039 10.1036 0.912743 10.1015 0.908448C10.0993 0.908448 10.0972 0.9063 10.095 0.9063C9.95995 0.708712 9.80127 0.549782 9.61256 0.431659C9.41743 0.30924 9.20943 0.227628 8.98856 0.188969C8.76983 0.150311 8.57684 0.130981 8.41387 0.130981C7.72982 0.130981 7.09724 0.377967 6.51826 0.871937C5.93929 1.36591 5.45466 2.07894 5.06224 3.0089C5.04509 2.51493 5.00864 2.01666 4.95288 1.51195C4.89498 1.00939 4.81779 0.547635 4.71915 0.130981C4.45754 0.264139 4.1659 0.388705 3.83782 0.500385C3.51188 0.614213 3.17736 0.715155 2.83426 0.798915C2.49116 0.884823 2.14807 0.959993 1.80711 1.02657C1.46402 1.09315 1.15309 1.14469 0.876465 1.18335V1.69665C1.35037 1.69665 1.74064 1.80189 2.05157 2.01022C2.36036 2.21854 2.5169 2.69318 2.5169 3.43414V10.7578C2.5169 11.1379 2.47615 11.4322 2.39467 11.6405C2.31318 11.851 2.19953 12.0099 2.05157 12.1259C1.90575 12.2397 1.73421 12.3106 1.53693 12.3406C1.34179 12.3686 1.12092 12.3836 0.876465 12.3836V12.8969H6.82061V12.3836C6.57616 12.3836 6.35744 12.3686 6.16015 12.3406C5.96502 12.3127 5.79347 12.2418 5.64551 12.128C5.49969 12.0142 5.3839 11.8531 5.30241 11.6448C5.22093 11.4365 5.18018 11.1422 5.18018 10.7642V5.67634C5.18018 5.25968 5.24451 4.79148 5.37532 4.26959C5.50613 3.7477 5.6884 3.26018 5.92642 2.80487C6.1623 2.34955 6.43034 1.96726 6.7327 1.6537C7.03505 1.34014 7.3567 1.18335 7.69766 1.18335C7.78557 1.18335 7.86492 1.19839 7.93997 1.22201C8.05147 1.26282 8.10937 1.35517 8.09436 1.4647C8.07292 1.62363 7.75341 2.15626 8.48678 2.61157C9.08291 2.98312 10.1658 3.02608 10.3567 2.08753C10.4124 1.80833 10.3502 1.47974 10.2216 1.17261C10.1894 1.08456 10.1529 1.0008 10.1058 0.927777H10.1143Z"
                                fill="black"
                            />
                            <path
                                d="M45.8181 0.927777C45.8181 0.927777 45.8138 0.923482 45.8116 0.921334C45.8095 0.917039 45.8073 0.912743 45.8052 0.908448C45.8031 0.908448 45.8009 0.9063 45.7988 0.9063C45.6637 0.708712 45.505 0.549782 45.3163 0.431659C45.1211 0.30924 44.9131 0.227628 44.6923 0.188969C44.4714 0.150311 44.2806 0.130981 44.1176 0.130981C43.4335 0.130981 42.801 0.377967 42.222 0.871937C41.643 1.36591 41.1584 2.07894 40.766 3.0089C40.7488 2.51493 40.7124 2.01666 40.6566 1.51195C40.5987 1.00939 40.5215 0.547635 40.425 0.130981C40.1634 0.264139 39.8696 0.388705 39.5437 0.500385C39.2177 0.614213 38.8832 0.715155 38.5423 0.798915C38.1992 0.884823 37.8561 0.959993 37.5151 1.02657C37.172 1.09315 36.8632 1.14469 36.5845 1.18335V1.69665C37.0584 1.69665 37.4486 1.80189 37.7596 2.01022C38.0684 2.21854 38.2249 2.69318 38.2249 3.43414V10.7578C38.2249 11.1379 38.1842 11.4322 38.1027 11.6405C38.0212 11.851 37.9075 12.0099 37.7596 12.1259C37.6138 12.2397 37.4422 12.3106 37.2449 12.3406C37.0498 12.3686 36.8289 12.3836 36.5845 12.3836V12.8969H42.5286V12.3836C42.2842 12.3836 42.0633 12.3686 41.8682 12.3406C41.673 12.3127 41.5015 12.2418 41.3535 12.128C41.2077 12.0142 41.0919 11.8531 41.0126 11.6448C40.9311 11.4365 40.8903 11.1422 40.8903 10.7642V5.67634C40.8903 5.25968 40.9547 4.79148 41.0855 4.26959C41.2163 3.7477 41.4007 3.26018 41.6366 2.80487C41.8725 2.34955 42.1426 1.96726 42.4428 1.6537C42.7452 1.34014 43.0669 1.18335 43.4078 1.18335C43.4957 1.18335 43.5751 1.19839 43.6501 1.22201C43.7616 1.26282 43.8195 1.35517 43.8045 1.4647C43.7831 1.62363 43.4636 2.15626 44.1969 2.61157C44.7909 2.98312 45.876 3.02608 46.0668 2.08753C46.1226 1.80833 46.0604 1.47974 45.9317 1.17261C45.8996 1.08456 45.8631 1.0008 45.8159 0.927777H45.8181Z"
                                fill="black"
                            />
                        </svg>
                    </div>
                </div>
                <span
                    style={{
                        color: "#BABABA",
                        fontSize: 12,
                        fontFamily: theme.font.body,
                        wordWrap: "break-word",
                    }}
                >
                    © roarc. all rights reseved.
                </span>
            </div>
            {/* 하단 고정 액션바 - 갤러리 순서 변경 시 저장 버튼, 항상 청첩장 보기 버튼 */}
            {isAuthenticated && (
                <BottomActionBar
                    hasChanges={hasChanges}
                    saveFunction={saveFunction}
                    isSaving={isSaving}
                    currentUser={currentUser}
                />
            )}
        </>
    )
}

// 입력 필드 컴포넌트
function InputField({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}): JSX.Element {
    return (
        <div
            style={{
                marginBottom: 12,
                maxWidth: "none",
                margin: "0 auto 0 0",
            }}
        >
            <label
                style={{
                    display: "block",
                    fontSize: 14,
                    color: "#000",
                    marginBottom: 6,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: `1px solid ${theme.color.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    color: "#000",
                    transition: "border-color .15s ease",
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#9ca3af"
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb"
                }}
            />
        </div>
    )
}

// 하단 고정 액션바 컴포넌트
// 경량 브로드캐스트: 어디서든 호출하여 자동 저장 토스트 노출
function broadcastAutoSaveToast() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("autosave:flash"))
    }
}

function BottomActionBar({
    hasChanges,
    saveFunction,
    isSaving,
    currentUser,
}: {
    hasChanges: boolean
    saveFunction: (() => Promise<void>) | null
    isSaving: boolean
    currentUser: any
}) {
    const formatDateForUrl = (dateString: string) => {
        const date = new Date(dateString)
        const year = String(date.getFullYear()).slice(-2) // 뒤 2자리만 (2025 -> 25)
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}${month}${day}`
    }

    const handleViewInvitation = () => {
        if (currentUser?.wedding_date && currentUser?.page_id) {
            const formattedDate = formatDateForUrl(currentUser.wedding_date)
            const invitationUrl = `https://mcard.roarc.kr/${formattedDate}/${currentUser.page_id}`
            window.open(invitationUrl, "_blank")
        } else {
            alert(
                "사용자 정보가 불완전합니다. wedding_date와 page_id가 필요합니다."
            )
        }
    }

    const timersRef = React.useRef<{
        enter?: number
        exit?: number
        dots?: number
        rotate?: number
    }>({})
    const [toastVisible, setToastVisible] = React.useState(false)
    const [toastPhase, setToastPhase] = React.useState<
        "idle" | "enter" | "visible" | "exit"
    >("idle")
    const [dotCount, setDotCount] = React.useState(1)
    const [rotationDeg, setRotationDeg] = React.useState(0)

    React.useEffect(() => {
        const clearAll = () => {
            if (timersRef.current.enter) clearTimeout(timersRef.current.enter)
            if (timersRef.current.exit) clearTimeout(timersRef.current.exit)
            if (timersRef.current.dots) clearInterval(timersRef.current.dots)
            if (timersRef.current.rotate)
                clearInterval(timersRef.current.rotate)
            timersRef.current = {}
        }

        const onFlash = () => {
            clearAll()
            setToastVisible(true)
            setToastPhase("enter")
            timersRef.current.enter = window.setTimeout(
                () => setToastPhase("visible"),
                30
            )
            timersRef.current.dots = window.setInterval(() => {
                setDotCount((c) => (c >= 3 ? 1 : c + 1))
            }, 350)
            timersRef.current.rotate = window.setInterval(() => {
                setRotationDeg((deg) => deg + 180)
            }, 500)
            timersRef.current.exit = window.setTimeout(() => {
                setToastPhase("exit")
                window.setTimeout(() => {
                    setToastVisible(false)
                    clearAll()
                }, 220)
            }, 1500)
        }

        window.addEventListener("autosave:flash", onFlash)
        return () => {
            window.removeEventListener("autosave:flash", onFlash)
            clearAll()
        }
    }, [])

    return (
        <div
            style={{
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 0,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: "430px",
            }}
        >
            {/* 자동 저장 알림 토스트 (청첩장 보기 위 20px) */}
            {toastVisible && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 12px",
                            borderRadius: 37,
                            background: "#ffffff",
                            color: "#757575",
                            boxShadow: theme.shadow.pop,
                            fontFamily: theme.font.body,
                            fontSize: 16,
                            transform:
                                toastPhase === "enter"
                                    ? "translateY(8px)"
                                    : toastPhase === "exit"
                                      ? "translateY(8px)"
                                      : "translateY(0)",
                            opacity:
                                toastPhase === "enter"
                                    ? 0
                                    : toastPhase === "exit"
                                      ? 0
                                      : 1,
                            transition:
                                "opacity .18s ease, transform .18s ease",
                        }}
                    >
                        {/* 회전 아이콘 (제공된 SVG, 0.5초마다 easeInOut 회전) */}
                        <span
                            aria-hidden
                            style={{
                                display: "inline-flex",
                                width: 16,
                                height: 16,
                                transform: `rotate(${rotationDeg}deg)`,
                                transition: "transform .5s ease-in-out",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M15.086 8.75C14.711 12.3328 11.6817 15.125 8 15.125C6.64123 15.1255 5.31065 14.7374 4.16518 14.0065C3.01971 13.2756 2.10712 12.2325 1.535 11M0.875 14.375V10.625H3.125M0.914 7.25C1.289 3.66725 4.3175 0.875 8 0.875C9.35877 0.874549 10.6893 1.26264 11.8348 1.99351C12.9803 2.72437 13.8929 3.76754 14.465 5M15.125 1.625V5.375H12.875"
                                    stroke="#757575"
                                    strokeLinecap="square"
                                />
                            </svg>
                        </span>
                        <span
                            style={{
                                letterSpacing: "-0.01em",
                                color: "#757575",
                            }}
                        >
                            자동 저장 중
                        </span>
                        <span
                            aria-hidden
                            style={{
                                width: 18,
                                display: "inline-flex",
                                color: "#757575",
                            }}
                        >
                            {".".repeat(dotCount)}
                        </span>
                    </div>
                </div>
            )}

            {/* 청첩장 보기 버튼 - 항상 표시 */}
            <button
                onClick={handleViewInvitation}
                style={{
                    width: "100%",
                    height: "calc(56px + env(safe-area-inset-bottom, 0px))",
                    backgroundColor: "#fff",
                    color: "#757575",
                    border: "none",
                    borderTop: `1px solid ${theme.color.border}`,
                    fontSize: 16,
                    ...theme.font.bodyBold,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}
            >
                청첩장 보기
            </button>
        </div>
    )
}

// 커스텀 순서 변경 드롭다운 컴포넌트
interface CustomOrderDropdownProps {
    value: string | number
    onChange: (value: string | number) => void
    options: Array<{ value: string | number; label: string }>
    placeholder?: string
}
function CustomOrderDropdown({
    value,
    onChange,
    options,
    placeholder = "순서 선택",
}: CustomOrderDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [menuStyle, setMenuStyle] =
        React.useState<React.CSSProperties | null>(null)
    const [focusedIndex, setFocusedIndex] = React.useState(-1)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)

    // 선택된 옵션 라벨 찾기
    const selectedOption = options.find((opt) => opt.value === value)
    const selectedLabel = selectedOption?.label

    // 버튼 기준으로 메뉴 위치 계산 (실제 메뉴 높이 추정으로 보정)
    const updateMenuPosition = () => {
        const btn = buttonRef.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        const gap = 6
        const width = rect.width
        let left = rect.left
        // 우측 경계 보정
        const maxLeft =
            (typeof window !== "undefined" ? window.innerWidth : 800) -
            width -
            8
        if (left > maxLeft) left = Math.max(8, maxLeft)
        // 메뉴 높이 추정 (아이템 1개당 ~40px, 최대 240)
        const itemHeight = 40
        const estimatedHeight = Math.min(
            240,
            Math.max(1, options.length) * itemHeight
        )
        const spaceBelow =
            (typeof window !== "undefined" ? window.innerHeight : 600) -
            rect.bottom -
            gap
        const spaceAbove = rect.top - gap
        let top = rect.bottom + gap
        if (
            spaceBelow < Math.min(estimatedHeight, 160) &&
            spaceAbove > spaceBelow
        ) {
            top = Math.max(8, rect.top - gap - estimatedHeight)
        }
        setMenuStyle({
            position: "fixed",
            top,
            left,
            width,
            maxHeight: 240,
            overflowY: "auto",
            zIndex: 10000,
            backgroundColor: "#ffffff",
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.sm,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
            scrollbarWidth: "thin",
            scrollbarColor: "#E5E6E8 transparent",
        })
    }

    // 드롭다운 토글
    const toggleDropdown = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            setFocusedIndex(0)
            // 위치 계산
            requestAnimationFrame(() => updateMenuPosition())
        } else {
            setFocusedIndex(-1)
            setMenuStyle(null)
        }
    }

    // 옵션 선택
    const handleSelect = (selectedValue: string | number) => {
        onChange(selectedValue)
        setIsOpen(false)
        setFocusedIndex(-1)
        buttonRef.current?.focus()
    }

    // 키보드 이벤트 처리
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                toggleDropdown()
            }
            return
        }

        switch (e.key) {
            case "Escape":
                e.preventDefault()
                setIsOpen(false)
                setFocusedIndex(-1)
                buttonRef.current?.focus()
                break
            case "Enter":
            case " ":
                e.preventDefault()
                if (focusedIndex >= 0 && focusedIndex < options.length) {
                    handleSelect(options[focusedIndex].value)
                }
                break
            case "ArrowDown":
                e.preventDefault()
                setFocusedIndex((prev) =>
                    prev < options.length - 1 ? prev + 1 : 0
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setFocusedIndex((prev) =>
                    prev > 0 ? prev - 1 : options.length - 1
                )
                break
        }
    }

    // 바깥 클릭 시 닫기
    React.useEffect(() => {
        if (
            !isOpen ||
            typeof document === "undefined" ||
            typeof window === "undefined"
        ) {
            return
        }

        let scrollTimeout: ReturnType<typeof setTimeout> | null = null

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            const clickedInsideButton = !!(
                dropdownRef.current && dropdownRef.current.contains(target)
            )
            const clickedInsideMenu = !!(
                listRef.current && listRef.current.contains(target)
            )
            if (clickedInsideButton || clickedInsideMenu) return
            setIsOpen(false)
            setFocusedIndex(-1)
        }

        const handleScroll = () => {
            if (scrollTimeout) return
            scrollTimeout = setTimeout(() => {
                updateMenuPosition()
                scrollTimeout = null
            }, 16) // ~60fps
        }

        const handleResize = () => {
            updateMenuPosition()
        }

        document.addEventListener("mousedown", handleClickOutside)
        window.addEventListener("scroll", handleScroll, { passive: true })
        window.addEventListener("resize", handleResize, { passive: true })

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("resize", handleResize)
            if (scrollTimeout) {
                clearTimeout(scrollTimeout)
                scrollTimeout = null
            }
            // 스크롤 복원 (안전장치)
            if (typeof document !== "undefined") {
                document.body.style.overflow = ""
            }
        }
    }, [isOpen])

    React.useEffect(() => {
        if (!isOpen) {
            setMenuStyle(null)
            return
        }
        if (typeof window === "undefined") {
            updateMenuPosition()
            return
        }
        const rafId = window.requestAnimationFrame(() => updateMenuPosition())
        return () => {
            window.cancelAnimationFrame(rafId)
        }
    }, [isOpen])

    return (
        <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
                ref={buttonRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`순서 변경: ${selectedLabel || placeholder}`}
                onClick={toggleDropdown}
                onKeyDown={handleKeyDown}
                style={{
                    width: "100%",
                    height: "100%", // 모바일 터치 타겟
                    padding: "10px 12px",
                    backgroundColor: "#ffffff",
                    border: "none",
                    fontSize: 12, // 모바일 줌 방지
                    ...theme.font.bodyBold,
                    color: "#757575",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    outline: `${theme.border.width}px solid #e5e6e8`,
                    borderRadius: 2,
                    transition:
                        "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                    // 포커스 시 외곽선만 표시
                    e.target.style.borderColor = "#757575"
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = "#E5E6E8"
                }}
            >
                <span>{selectedLabel || placeholder}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0s ease",
                        flexShrink: 0,
                    }}
                >
                    <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="#757575"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen &&
                menuStyle &&
                typeof document !== "undefined" &&
                ReactDOM.createPortal(
                    <>
                        {/* 스크롤 방지 배경 */}
                        <div
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "transparent",
                                zIndex: 9999,
                            }}
                            onClick={() => {
                                setIsOpen(false)
                                setFocusedIndex(-1)
                                if (typeof document !== "undefined") {
                                    document.body.style.overflow = ""
                                }
                            }}
                            onTouchMove={(e) => e.preventDefault()}
                        />
                        <div
                            ref={listRef}
                            role="listbox"
                            tabIndex={-1}
                            aria-label="순서 옵션 목록"
                            style={menuStyle}
                        >
                            {options.map((option, index) => (
                                <div
                                    key={option.value}
                                    role="option"
                                    aria-selected={value === option.value}
                                    tabIndex={focusedIndex === index ? 0 : -1}
                                    onClick={() => handleSelect(option.value)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault()
                                            handleSelect(option.value)
                                        }
                                    }}
                                    style={{
                                        padding: "12px 14px",
                                        fontSize: 12,
                                        ...theme.font.bodyBold,
                                        lineHeight: "18px",
                                        color: "#757575",
                                        backgroundColor:
                                            value === option.value
                                                ? "#F3F4F6"
                                                : "#ffffff",
                                        cursor: "pointer",
                                        outline:
                                            focusedIndex === index
                                                ? "1px solid rgb(156, 156, 156)"
                                                : "1px solid rgb(229, 230, 232)",
                                        transition:
                                            "background-color 0.15s ease",
                                    }}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                    onMouseLeave={() => setFocusedIndex(-1)}
                                >
                                    {option.label}
                                </div>
                            ))}
                        </div>
                    </>,
                    document.body
                )}
        </div>
    )
}

// Property Controls
addPropertyControls(AdminNew, {
    maxSizeKB: {
        type: ControlType.Number,
        title: "목표 파일 크기",
        min: 100,
        max: 5000,
        step: 100,
        unit: "KB",
        defaultValue: 1024,
    },
})
