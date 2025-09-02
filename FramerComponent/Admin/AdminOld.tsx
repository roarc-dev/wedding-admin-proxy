import React, { useState, useEffect, SetStateAction } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// ======= Gallery Minis (single-file, inline styles) =======
type UiRadioItem = {
    value: string
    label: React.ReactNode
    preview?: React.ReactNode
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
                    width: 12,
                    height: 12,
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
function UiRadioGroup({
    value,
    onChange,
    items,
    label,
}: {
    value: string
    onChange: (v: string) => void
    items: UiRadioItem[]
    label?: React.ReactNode
}) {
    return (
        <div>
            {label && <Label>{label}</Label>}
            <Row gap={4} wrap>
                {items.map((it) => (
                    <Card
                        key={String(it.value)}
                        style={{
                            padding: theme.space(3),
                            minWidth: 280,
                            flex: 1,
                        }}
                    >
                        <Row align="center" gap={2}>
                            <UiRadio
                                checked={value === it.value}
                                onChange={() => onChange(it.value)}
                            />
                            <div
                                style={{
                                    fontFamily: theme.font.bodyBold,
                                    fontSize: theme.text.sm,
                                    color: theme.color.text,
                                }}
                            >
                                {it.label}
                            </div>
                        </Row>
                        {it.preview && (
                            <div style={{ marginTop: theme.space(3) }}>
                                {it.preview}
                            </div>
                        )}
                    </Card>
                ))}
            </Row>
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
function UiIndexPill({ index }: { index: number }) {
    return (
        <div
            style={{
                width: 28,
                height: 28,
                borderRadius: theme.radius.pill,
                background: "#fff",
                border: `1px solid ${theme.color.border}`,
                display: "grid",
                placeItems: "center",
                fontFamily: theme.font.bodyBold,
                fontSize: theme.text.sm,
            }}
        >
            {index}
        </div>
    )
}
function UiPhotoTile({
    src,
    name,
    index,
    onDelete,
    onReplace,
    selected,
    onToggleSelection,
}: {
    src: string
    name: string
    index: number
    onDelete: () => void
    onReplace: (file: File) => void
    selected?: boolean
    onToggleSelection?: () => void
}) {
    const [isReplacing, setIsReplacing] = React.useState(false)

    const handleReplaceClick = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                setIsReplacing(true)
                onReplace(file)
                setTimeout(() => setIsReplacing(false), 1000)
            }
        }
        input.click()
    }

    const orderOptions = Array.from({ length: 20 }, (_, i) => i + 1)

    return (
        <div
            style={{
                position: "relative",
                backgroundColor: "white",
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "stretch",
                display: "flex",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "120px",
                    backgroundImage: src ? `url(${src})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 10,
                    display: "flex",
                }}
            >
                {/* 상단 영역 - 인덱스와 edit 버튼 */}
                <div
                    style={{
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
                            outline: "0.50px #E5E6E8 solid",
                            outlineOffset: "-0.50px",
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
                                fontFamily: "Pretendard SemiBold",
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
                        <div data-svg-wrapper>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 28 28"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    cursor: isReplacing
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: isReplacing ? 0.5 : 1,
                                }}
                                onClick={
                                    !isReplacing
                                        ? handleReplaceClick
                                        : undefined
                                }
                            >
                                <rect width="28" height="28" fill="#0C0C0F" />
                                <path
                                    d="M10.3001 18.7953H7V15.396L15.8939 6.23457C16.0397 6.08438 16.2375 6 16.4438 6C16.65 6 16.8478 6.08438 16.9937 6.23457L19.194 8.50028C19.2663 8.57469 19.3237 8.66305 19.3628 8.76031C19.402 8.85757 19.4221 8.96182 19.4221 9.06711C19.4221 9.17239 19.402 9.27665 19.3628 9.37391C19.3237 9.47117 19.2663 9.55953 19.194 9.63394L10.3001 18.7953ZM7 20.3977H21V22H7V20.3977Z"
                                    fill="white"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 영역 - 파일명과 순서 드롭다운 */}
            <div
                style={{
                    width: "100%",
                    paddingLeft: 6,
                    paddingRight: 6,
                    paddingTop: 8,
                    paddingBottom: 8,
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
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        display: "inline-flex",
                    }}
                >
                    <div
                        style={{
                            color: "#757575",
                            fontSize: 12,
                            fontFamily: "Pretendard SemiBold",
                            wordWrap: "break-word",
                        }}
                    >
                        {name.length > 20
                            ? `${name.substring(0, 17)}...`
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
                            paddingLeft: 13,
                            paddingRight: 13,
                            paddingTop: 8,
                            paddingBottom: 8,
                            background: "white",
                            outline: "1px #E5E6E8 solid",
                            outlineOffset: "-1px",
                            justifyContent: "space-between",
                            alignItems: "center",
                            display: "flex",
                        }}
                    >
                        <div
                            style={{
                                color: "#757575",
                                fontSize: 12,
                                fontFamily: "Pretendard SemiBold",
                                wordWrap: "break-word",
                            }}
                        >
                            {index}번째
                        </div>
                        <select
                            value={index}
                            onChange={(e) => {
                                const newPosition = parseInt(e.target.value)
                                const moveImageToPosition = (window as any)
                                    .moveImageToPosition
                                if (moveImageToPosition) {
                                    moveImageToPosition(index - 1, newPosition)
                                }
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                color: "#757575",
                                fontSize: 12,
                                fontFamily: "Pretendard Regular",
                                cursor: "pointer",
                                width: "auto",
                                minWidth: "50px",
                            }}
                        >
                            {orderOptions.map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div
                        data-svg-wrapper
                        style={{ position: "relative", cursor: "pointer" }}
                        onClick={onDelete}
                    >
                        <svg
                            width="32"
                            height="33"
                            viewBox="0 0 32 33"
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
        <Card style={{ textAlign: "center", padding: theme.space(8) }}>
            {icon && (
                <div
                    style={{
                        fontSize: theme.text.xl,
                        marginBottom: theme.space(3),
                    }}
                >
                    {icon}
                </div>
            )}
            <div
                style={{
                    fontFamily: theme.font.bodyBold,
                    fontSize: theme.text.lg,
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
                        marginBottom: theme.space(4),
                    }}
                >
                    {description}
                </div>
            )}
            {action && action}
        </Card>
    )
}

/** =====================
 * Single-file UI tokens & primitives (Framer-friendly)
 * No external libraries; inline styles only.
 * ===================== */
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
        body: "Pretendard Regular",
        bodyBold: "Pretendard SemiBold",
        display: "P22LateNovemberW01-Regular Regular, serif",
    },
    radius: { sm: 0, md: 0, lg: 0, xl: 24, pill: 999 },
    shadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
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
    // 공통 타이포그래피 스타일
    typography: {
        label: {
            fontFamily: "Pretendard SemiBold",
            fontSize: 14,
            color: "black",
        },
        body: {
            fontFamily: "Pretendard Regular",
            fontSize: 14,
        },
        sectionHeader: {
            fontFamily: "Pretendard Regular",
            fontSize: 14,
            color: "#757575",
        },
        preview: {
            fontSize: 12,
            color: "#7F7F7F",
            textAlign: "center" as const,
        },
    },
} as const

function mergeStyles(
    ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties {
    return Object.assign({}, ...styles)
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
        fontFamily: theme.font.bodyBold,
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
                    borderRadius: theme.radius.xl,
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
}: React.PropsWithChildren<{
    title: string
    right?: React.ReactNode
    isOpen?: boolean
    onToggle?: () => void
    style?: React.CSSProperties
}>) {
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
                            fontFamily: "Pretendard Regular",
                            wordWrap: "break-word",
                        }}
                    >
                        {title}
                    </div>

                    {/* 토글 버튼 - Roarc 화살표 아이콘 */}
                    {onToggle && (
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                padding: "13px 9px",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "10px",
                                display: "inline-flex",
                            }}
                        >
                            {/* 화살표 아이콘 - SVG */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="8"
                                viewBox="0 0 14 8"
                                fill="none"
                                style={{
                                    transform: `rotate(${isOpen ? 0 : 180}deg)`,
                                    transition: "transform 0.2s ease",
                                }}
                            >
                                <path
                                    d="M13 1.25L7 6.75L1 1.25"
                                    stroke="#757575"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                    )}

                    {/* 우측 추가 요소 */}
                    {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
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
    padding: `${theme.space(2.5)}px ${theme.space(3)}px`,
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
        <Row gap={2} style={{ marginTop: theme.space(2), width: "100%" }}>
            <Button onClick={onSave} disabled={!!loading} fullWidth>
                {loading ? "저장 중..." : (label ?? "저장")}
            </Button>
        </Row>
    )
}

// ======= Field / Select / Switch Primitives (Single-file, inline styles) =======
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
                            fontFamily: theme.font.bodyBold,
                            fontSize: theme.text.sm,
                            color: theme.color.sub,
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
                borderRadius: theme.radius.md,
                padding: `0 ${theme.space(2.5)}px`,
                background: "#fff",
                height: theme.space(10),
                display: "flex",
                alignItems: "center",
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
                    fontSize: theme.text.base,
                    ...style,
                }}
            />
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
                    border: `0.5px solid ${checked ? theme.color.primary : theme.color.border}`,
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
    openMap,
    onToggle,
    children,
}: {
    title: string
    sectionKey: string
    openMap: Record<string, boolean>
    onToggle: (key: string) => void
    children: React.ReactNode
}) {
    return (
        <Section
            title={title}
            isOpen={!!openMap[sectionKey]}
            onToggle={() => onToggle(sectionKey)}
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
                border: "0.5px solid #E5E6E8",
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                fontFamily: "Pretendard Regular",
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
                justifyContent: "center",
                paddingBottom: 12,
                boxSizing: "border-box",
                ...style,
            }}
        >
            <div
                style={{
                    fontFamily: "P22LateNovemberW01-Regular Regular",
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
                    fontFamily: "P22LateNovemberW01-Regular Regular",
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
        if (!targetDate) return ""
        const d = new Date(targetDate)
        const h24 = parseInt(hour || "0")
        const mm = parseInt(minute || "0")
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
                    fontFamily: "Pretendard Regular",
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
                                fontFamily: theme.font.bodyBold,
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
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width={theme.space(6)}
                                                    height={theme.space(5.25)}
                                                    viewBox="0 0 16 14"
                                                    fill="none"
                                                    style={{
                                                        position: "absolute",
                                                        top: "50%",
                                                        left: "50%",
                                                        transform:
                                                            "translate(-50%, -40%)",
                                                        zIndex: 0,
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
                                            ) : (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        width: 31,
                                                        height: 31,
                                                        borderRadius: "50%",
                                                        backgroundColor:
                                                            highlightColor,
                                                        zIndex: 0,
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
                                                fontFamily: isHighlighted(d)
                                                    ? "Pretendard SemiBold"
                                                    : "Pretendard Regular",
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
                        fontFamily: "Pretendard Regular",
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
                        fontFamily: "Pretendard SemiBold",
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

// 세션 토큰 관리
function getAuthToken() {
    return localStorage.getItem("admin_session")
}

function setAuthToken(token: string): void {
    localStorage.setItem("admin_session", token)
}

function removeAuthToken() {
    localStorage.removeItem("admin_session")
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
                action: "login",
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

function generateSessionToken(user: { id: string; username: string }): string {
    return btoa(
        JSON.stringify({
            userId: user.id,
            username: user.username,
            expires: Date.now() + 24 * 60 * 60 * 1000,
        })
    )
}

function validateSessionToken(
    token: string
): { userId: string; username: string; expires: number } | null {
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
    groom_father_name: string
    groom_father_phone: string
    groom_father_account: string
    groom_father_bank: string
    groom_mother_name: string
    groom_mother_phone: string
    groom_mother_account: string
    groom_mother_bank: string
    bride_name: string
    bride_phone: string
    bride_account: string
    bride_bank: string
    bride_father_name: string
    bride_father_phone: string
    bride_father_account: string
    bride_father_bank: string
    bride_mother_name: string
    bride_mother_phone: string
    bride_mother_account: string
    bride_mother_bank: string
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

async function saveImageMeta(
    pageId: string,
    fileName: string,
    order: number,
    storagePath: string,
    fileSize: number
): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                action: "saveMeta",
                pageId,
                fileName,
                displayOrder: order,
                storagePath,
                fileSize,
            }),
        })

        const result = await response.json()
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

// 기본 이미지 압축 함수
async function compressImage(
    file: File,
    maxSizeKB = 1024,
    quality = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        img.onload = () => {
            let { width, height } = img

            // 적절한 크기 계산 (품질 저하 최소화)
            const MAX_WIDTH = 1920
            const MAX_HEIGHT = 1080

            if (width > MAX_WIDTH) {
                height = (height * MAX_WIDTH) / width
                width = MAX_WIDTH
            }

            if (height > MAX_HEIGHT) {
                width = (width * MAX_HEIGHT) / height
                height = MAX_HEIGHT
            }

            canvas.width = width
            canvas.height = height

            // 렌더링 품질 설정 (고품질)
            if (ctx) {
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = "high"

                // 배경 설정 (투명도 제거)
                ctx.fillStyle = "white"
                ctx.fillRect(0, 0, width, height)
                ctx.drawImage(img, 0, 0, width, height)
            }

            // 반복적 압축 (품질 유지하면서 크기 조정)
            const compressRecursive = (
                currentQuality: number,
                attempt = 0
            ): void => {
                if (attempt > 8) {
                    // 최대 8번 시도 (품질 저하 최소화)
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("압축 실패"))
                                return
                            }
                            const finalFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            })
                            resolve(finalFile)
                        },
                        "image/jpeg",
                        Math.max(0.3, currentQuality) // 최소 품질 0.3 유지
                    )
                    return
                }

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("압축 실패"))
                            return
                        }

                        const fileSizeKB = blob.size / 1024

                        if (fileSizeKB <= maxSizeKB || currentQuality <= 0.3) {
                            const compressedFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            })
                            resolve(compressedFile)
                        } else {
                            // 품질을 점진적으로 낮춤 (작은 단위로)
                            const newQuality = Math.max(
                                0.3,
                                currentQuality - 0.05
                            )
                            compressRecursive(newQuality, attempt + 1)
                        }
                    },
                    "image/jpeg",
                    currentQuality
                )
            }

            compressRecursive(quality)
        }

        img.onerror = () => reject(new Error("이미지 로드 실패"))
        img.src = URL.createObjectURL(file)
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

        // 1단계: 큰 파일의 경우 사전 리사이징
        let processedFile = file
        if (originalSize > 10 * 1024 * 1024) {
            // 10MB 이상 - 더 작은 크기로
            processedFile = await compressImage(file, targetSizeKB, 0.9)
            onProgress?.(40)
        } else if (originalSize > 5 * 1024 * 1024) {
            // 5MB 이상 - 적당한 크기로
            processedFile = await compressImage(file, targetSizeKB, 0.85)
            onProgress?.(35)
        }

        // 2단계: 기본 압축
        onProgress?.(50)
        let compressedFile = await compressImage(
            processedFile,
            targetSizeKB,
            0.8
        )

        // 3단계: 여전히 크면 추가 압축
        if (compressedFile.size / 1024 > targetSizeKB) {
            onProgress?.(70)
            compressedFile = await compressImage(
                processedFile,
                targetSizeKB,
                0.6
            )
        }

        // 4단계: 최종 압축 (최소 품질 유지)
        if (compressedFile.size / 1024 > targetSizeKB) {
            onProgress?.(90)
            compressedFile = await compressImage(
                processedFile,
                targetSizeKB,
                0.4
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

export default function AdminNew(props: any) {
    const { maxSizeKB = 1024, style } = props

    // 공통 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loginForm, setLoginForm] = useState({ username: "", password: "" })
    const [loginError, setLoginError] = useState("")
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<"basic" | "gallery">("basic")

    // 아코디언 상태 관리
    const [openSections, setOpenSections] = useState({
        name: true, // "성함" 섹션은 기본적으로 열림
        photo: false,
        invite: false,
        transport: false,
        calendar: false,
        images: false,
        contacts: false,
        account: false,
        kakaoShare: false,
    })
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
    const [inviteData, setInviteData] = useState({
        invitationText:
            "저희 두 사람이 하나 되는 약속의 시간에\n마음을 담아 소중한 분들을 모십니다.\n귀한 걸음으로 축복해 주시면 감사하겠습니다.",
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
                    groomName: pageSettings.groom_name_kr || prev.groomName,
                    brideFatherName:
                        d.bride_father_name ?? prev.brideFatherName,
                    brideMotherName:
                        d.bride_mother_name ?? prev.brideMotherName,
                    brideName: pageSettings.bride_name_kr || prev.brideName,
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
                    groomName: pageSettings.groom_name_kr || prev.groomName,
                    brideName: pageSettings.bride_name_kr || prev.brideName,
                }))
            }
        } catch (_err) {
            // noop
        }
    }

    const saveInviteData = async (): Promise<void> => {
        try {
            setInviteSaving(true)
            const body = {
                invite: {
                    invitation_text: inviteData.invitationText,
                    groom_father_name: inviteData.groomFatherName,
                    groom_mother_name: inviteData.groomMotherName,
                    groom_name:
                        pageSettings.groom_name_kr || inviteData.groomName,
                    bride_father_name: inviteData.brideFatherName,
                    bride_mother_name: inviteData.brideMotherName,
                    bride_name:
                        pageSettings.bride_name_kr || inviteData.brideName,
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
                setError(`청첩장 저장 중 오류: ${msg}${code}`)
            } else {
                setSuccess("청첩장 정보가 저장되었습니다.")
                // 저장 후 재로드로 동기화
                await loadInviteData()
            }
        } catch (_e) {
            setError("청첩장 저장 중 오류가 발생했습니다.")
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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // 페이지 설정 관련 상태
    const [pageSettings, setPageSettings] = useState({
        groom_name_kr: "",
        groom_name_en: "",
        bride_name_kr: "",
        bride_name_en: "",
        wedding_date: "",
        wedding_hour: "14",
        wedding_minute: "00",
        venue_name: "",
        venue_address: "",
        photo_section_image_url: "",
        photo_section_image_path: "",
        photo_section_overlay_position: "bottom",
        photo_section_overlay_color: "#ffffff",
        photo_section_locale: "en",
        highlight_shape: "circle",
        highlight_color: "#e0e0e0",
        highlight_text_color: "black",
        gallery_type: "thumbnail",
    })
    const [settingsLoading, setSettingsLoading] = useState(false)
    const [compressProgress, setCompressProgress] = useState<number | null>(
        null
    )

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
            pageSettings.groom_name_en || pageSettings.groom_name_kr || "GROOM",
        brideName:
            pageSettings.bride_name_en || pageSettings.bride_name_kr || "BRIDE",
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

    // 초대글 텍스트 포맷팅(볼드/인용) 삽입
    const insertInviteFormat = (format: "bold" | "quote") => {
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
        baseStyle?: React.CSSProperties
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
                        fontFamily: "Pretendard SemiBold",
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

    const renderInvitationSegmentsPreview = (text: string): JSX.Element[] => {
        const lines = (text || "").split("\n")
        const rendered: JSX.Element[] = []
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const parts: JSX.Element[] = []
            let lastIndex = 0
            let keySeq = 0
            const regex = /\{([^}]*)\}/g
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
                const start = match.index
                const end = start + match[0].length
                if (start > lastIndex) {
                    const chunk = line.slice(lastIndex, start)
                    if (chunk)
                        parts.push(
                            <span key={`t-${i}-${keySeq++}`}>
                                {renderBoldSegmentsPreview(chunk)}
                            </span>
                        )
                }
                const inner = match[1]
                if (inner)
                    parts.push(
                        <span
                            key={`q-${i}-${keySeq++}`}
                            style={{
                                fontSize: 14,
                                lineHeight: "1em",
                                color: "#6e6e6e",
                            }}
                        >
                            {renderBoldSegmentsPreview(inner, {
                                fontSize: 14,
                                lineHeight: "1em",
                                color: "#6e6e6e",
                            })}
                        </span>
                    )
                lastIndex = end
            }
            if (lastIndex < line.length) {
                const rest = line.slice(lastIndex)
                if (rest)
                    parts.push(
                        <span key={`t-${i}-${keySeq++}`}>
                            {renderBoldSegmentsPreview(rest)}
                        </span>
                    )
            }
            rendered.push(
                <span key={`line-${i}`}>
                    {parts}
                    {i !== lines.length - 1 && <br />}
                </span>
            )
        }
        return rendered
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

    // 아코디언 토글 함수
    const toggleSection = (sectionName: keyof typeof openSections) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionName]: !prev[sectionName],
        }))
    }

    const initialContactData = {
        page_id: "",
        groom_name: "",
        groom_phone: "",
        groom_account: "",
        groom_bank: "",
        groom_father_name: "",
        groom_father_phone: "",
        groom_father_account: "",
        groom_father_bank: "",
        groom_mother_name: "",
        groom_mother_phone: "",
        groom_mother_account: "",
        groom_mother_bank: "",
        bride_name: "",
        bride_phone: "",
        bride_account: "",
        bride_bank: "",
        bride_father_name: "",
        bride_father_phone: "",
        bride_father_account: "",
        bride_father_bank: "",
        bride_mother_name: "",
        bride_mother_phone: "",
        bride_mother_account: "",
        bride_mother_bank: "",
    }

    // 임시 테스트 함수 (디버깅용)
    // 이미지 순서 테스트용 함수 제거됨

    // 이미지 순서 변경 관련 함수들 (컴포넌트 내부로 이동)
    // 이미지 순서 변경 (로컬 상태만 변경)
    const handleReorderImages = (fromIndex: number, toIndex: number) => {
        const newImages = [...existingImages]
        const [movedImage] = newImages.splice(fromIndex, 1)
        newImages.splice(toIndex, 0, movedImage)

        // 로컬 상태만 업데이트 (서버 저장은 별도)
        setExistingImages(newImages)
        setHasUnsavedChanges(true)

        console.log("로컬 순서 변경:", {
            fromIndex,
            toIndex,
            newLength: newImages.length,
        })
    }

    // 서버에 순서 변경사항 저장
    const saveImageOrder = async () => {
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
    const cancelOrderChanges = () => {
        if (!hasUnsavedChanges) return

        if (confirm("변경사항을 취소하고 원래 순서로 되돌리시겠습니까?")) {
            setExistingImages([...originalOrder])
            setHasUnsavedChanges(false)
        }
    }

    const moveImageUp = (index: number) => {
        if (index > 0) handleReorderImages(index, index - 1)
    }

    const moveImageDown = (index: number) => {
        if (index < existingImages.length - 1)
            handleReorderImages(index, index + 1)
    }

    const moveImageToPosition = (fromIndex: number, toPosition: number) => {
        if (
            toPosition >= 1 &&
            toPosition <= existingImages.length &&
            toPosition !== fromIndex + 1
        ) {
            handleReorderImages(fromIndex, toPosition - 1)
        }
    }

    // window 객체에 함수 추가하여 UiPhotoTile에서 호출 가능하도록 함
    ;(window as any).moveImageToPosition = moveImageToPosition

    // 특정 위치의 이미지 교체 함수
    const handleReplaceImage = async (index: number, newFile: File) => {
        if (!currentPageId) return alert("페이지 ID를 설정하세요")

        try {
            // 1. 기존 이미지 정보 가져오기
            const oldImage = existingImages[index]
            if (!oldImage) return

            // 2. 파일 유효성 검사
            validateImageFileSize(newFile)

            // 3. 이미지 압축 (필요한 경우)
            let processedFile = newFile
            if (newFile.size / 1024 > maxSizeKB) {
                const compressionResult = await progressiveCompress(
                    newFile,
                    maxSizeKB,
                    (progress) => {
                        console.log(`압축 진행률: ${progress}%`)
                    }
                )
                processedFile = compressionResult.compressedFile
            }

            // 4. presigned URL 요청 (기존 파일명 유지 또는 새 파일명 사용)
            const fileName = processedFile.name || oldImage.filename
            const { signedUrl, path } = await getPresignedUrl(
                fileName,
                currentPageId
            )

            // 5. 새 파일 업로드
            await uploadToPresignedUrl(signedUrl, processedFile)

            // 6. 기존 이미지의 메타데이터 업데이트
            // saveImageMeta(pageId, fileName, order, storagePath, fileSize)
            await saveImageMeta(
                currentPageId,
                processedFile.name,
                oldImage.display_order ?? index + 1,
                path,
                processedFile.size
            )

            // 7. 로컬 상태 업데이트
            const updatedImages = [...existingImages]
            updatedImages[index] = {
                ...oldImage,
                filename: processedFile.name,
                original_name: processedFile.name,
                public_url: path,
            }
            setExistingImages(updatedImages)

            console.log(
                `이미지 교체 완료: ${oldImage.original_name} -> ${processedFile.name}`
            )
        } catch (error) {
            console.error("이미지 교체 실패:", error)
            alert("이미지 교체 중 오류가 발생했습니다.")
        }
    }

    // window 객체에 함수 추가
    ;(window as any).handleReplaceImage = handleReplaceImage

    // 선택된 이미지들 상태 추가
    const [selectedImages, setSelectedImages] = useState<Set<string>>(
        new Set<string>()
    )

    // 순서 변경 관련 상태
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isSavingOrder, setIsSavingOrder] = useState(false)
    const [originalOrder, setOriginalOrder] = useState<ImageInfo[]>([])

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

    // 전체 선택/해제
    const toggleSelectAll = () => {
        if (selectedImages.size === existingImages.length) {
            setSelectedImages(new Set())
        } else {
            setSelectedImages(new Set(existingImages.map((img) => img.id)))
        }
    }

    // 세션 확인
    useEffect(() => {
        const token = localStorage.getItem("admin_session")
        if (token) {
            const tokenData = validateSessionToken(token)
            if (tokenData) {
                setIsAuthenticated(true)
                setCurrentUser({ username: tokenData.username })
                // 저장된 사전 할당 페이지 ID 적용 (관리자가 미리 설정한 경우)
                const storedAssigned = localStorage.getItem("assigned_page_id")
                if (storedAssigned && storedAssigned.trim().length > 0) {
                    setAssignedPageId(storedAssigned)
                    setCurrentPageId(storedAssigned)
                }
                loadAllPages()
                loadContactList()
            } else {
                localStorage.removeItem("admin_session")
            }
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
            localStorage.setItem(
                "admin_session",
                generateSessionToken(result.user)
            )
            setIsAuthenticated(true)
            setCurrentUser(result.user)
            // 로그인 사용자에 page_id가 할당되어 있으면 강제 적용 (비관리자용)
            const assigned =
                (result.user && (result.user as any).page_id) || null
            if (
                assigned &&
                typeof assigned === "string" &&
                assigned.trim().length > 0
            ) {
                setAssignedPageId(assigned)
                setCurrentPageId(assigned)
                localStorage.setItem("assigned_page_id", assigned)
            } else {
                setAssignedPageId(null)
                localStorage.removeItem("assigned_page_id")
            }
            setLoginForm({ username: "", password: "" })
            loadAllPages()
            loadContactList()
            loadPageSettings()
        } else {
            setLoginError(result.error)
        }
        setIsLoggingIn(false)
    }

    const handleLogout = () => {
        removeAuthToken()
        setIsAuthenticated(false)
        setCurrentUser(null)
        setCurrentPageId("")
        setAssignedPageId(null)
        // 페이지 리스트 사용 안함
        setExistingImages([])
        setContactList([])
        localStorage.removeItem("assigned_page_id")
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
                const ts = Date.now() + imagesVersion
                const withVersion = images.map((img: any) => ({
                    ...img,
                    public_url: img.public_url
                        ? `${img.public_url}${img.public_url.includes("?") ? "&" : "?"}v=${ts}`
                        : img.public_url,
                }))
                setExistingImages(withVersion)
                setOriginalOrder([...images]) // 원본 순서 저장
            } catch (err) {
                console.error("이미지 목록 로드 실패:", err)
            }
        }
    }

    const loadContactList = async () => {
        setLoading(true)
        try {
            const contacts = await getAllContacts(currentPageId)
            setContactList(contacts)
        } catch (err) {
            setError("연락처 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const loadPageSettings = async () => {
        if (!currentPageId) return

        setSettingsLoading(true)
        try {
            const response = await fetch(
                `${PROXY_BASE_URL}/api/page-settings?pageId=${currentPageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            )

            const result = await response.json()
            if (result.success) {
                setPageSettings(result.data)
            }
        } catch (err) {
            console.error("페이지 설정 로드 실패:", err)
        } finally {
            setSettingsLoading(false)
        }
    }

    const allowedSettingKeys = [
        "groom_name_kr",
        "groom_name_en",
        "bride_name_kr",
        "bride_name_en",
        "wedding_date",
        "wedding_hour",
        "wedding_minute",
        "venue_name",
        "venue_address",
        "photo_section_image_url",
        "photo_section_image_path",
        "photo_section_overlay_position",
        "photo_section_overlay_color",
        "photo_section_locale",
        "highlight_shape",
        "highlight_color",
        "highlight_text_color",
        "gallery_type",
    ] as const

    type AllowedSettingKey = (typeof allowedSettingKeys)[number]

    function sanitizeSettingsForSave(
        input: any
    ): Record<AllowedSettingKey, any> {
        const out: Record<string, any> = {}
        for (const key of allowedSettingKeys) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                out[key] = input[key]
            }
        }
        if (Object.prototype.hasOwnProperty.call(out, "wedding_date")) {
            if (out["wedding_date"] === "") {
                out["wedding_date"] = null
            }
        }
        return out as Record<AllowedSettingKey, any>
    }

    const savePageSettings = async (overrideSettings?: any) => {
        if (!currentPageId) return

        setSettingsLoading(true)
        try {
            const merged = overrideSettings
                ? { ...pageSettings, ...overrideSettings }
                : pageSettings
            const settingsToSave = sanitizeSettingsForSave(merged)
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
                setSuccess("설정이 저장되었습니다.")
                // 저장 후 다시 로드해서 동기화
                setTimeout(() => loadPageSettings(), 500)
            } else {
                setError(
                    `설정 저장에 실패했습니다: ${result.error || "알 수 없는 오류"}`
                )
            }
        } catch (err) {
            console.error("Save page settings error:", err)
            const message = err instanceof Error ? err.message : String(err)
            setError(`설정 저장 중 오류가 발생했습니다: ${message}`)
        } finally {
            setSettingsLoading(false)
        }
    }

    // 포토섹션 메인 이미지 업로드 (압축 포함)
    const handlePhotoSectionImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file || !currentPageId) return

        setSettingsLoading(true)
        try {
            // 로컬 미리보기 즉시 반영
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
                        if (!response.ok) {
                            const t = await response.text()
                            console.warn("기존 포토섹션 이미지 삭제 실패:", t)
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

            // 3. presigned URL 요청 (원본 파일명으로 확장자 보존)
            const { signedUrl, path } = await getPresignedUrl(
                `photosection_${file.name}`,
                currentPageId
            )

            // 4. 파일을 직접 Storage에 업로드 (압축된 파일 사용)
            await uploadToPresignedUrl(signedUrl, finalFile)

            // 5. 경로 저장 및 서버 저장
            const imagePath = path

            // 로컬 상태 선반영
            setPageSettings((prev: any) => ({
                ...prev,
                photo_section_image_path: imagePath,
                photo_section_image_url: "",
            }))
            // CDN 캐시 무효화를 위한 버전 업데이트
            setPhotoSectionImageVersion((v) => v + 1)

            // 즉시 서버 저장 (override)
            await savePageSettings({
                photo_section_image_path: imagePath,
                photo_section_image_url: "",
            })

            setSuccess("메인 사진이 업로드되었습니다.")
        } catch (error: unknown) {
            console.error("Photo section image upload error:", error)
            const message =
                error instanceof Error ? error.message : String(error)
            setError("메인 사진 업로드 중 오류가 발생했습니다: " + message)
        } finally {
            setSettingsLoading(false)
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

                    // 3. presigned URL 요청
                    const { signedUrl, path, originalName } =
                        await getPresignedUrl(processedFile.name, currentPageId)

                    // 4. 파일을 직접 Storage에 업로드
                    await uploadToPresignedUrl(signedUrl, processedFile)

                    // 5. DB에 메타데이터 저장
                    const saved = await saveImageMeta(
                        currentPageId,
                        originalName,
                        existingImages.length + i + 1,
                        path,
                        processedFile.size
                    )

                    completed++
                    setProgress(Math.round((completed / totalFiles) * 100))

                    // 낙관적 반영: 방금 업로드한 이미지 그리드에 즉시 추가 (캐시 무효화 파라미터 포함)
                    const newImg: ImageInfo = {
                        id: saved.id || saved?.id || `${Date.now()}_${i}`,
                        filename: saved.filename || path,
                        public_url: ((): string => {
                            const base =
                                saved.public_url ||
                                (saved.storage_path ? saved.storage_path : "")
                            const url = base || ""
                            const sep = url.includes("?") ? "&" : "?"
                            return url ? `${url}${sep}v=${Date.now()}` : url
                        })(),
                        original_name: saved.original_name || originalName,
                    }
                    setExistingImages((prev) => [...prev, newImg])
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
                setSuccess("연락처가 성공적으로 삭제되었습니다!")
                // 3초 후 성공 메시지 자동 제거
                setTimeout(() => setSuccess(null), 3000)
            } else {
                // 실패 시 원래 상태로 복원
                if (contactToDelete) {
                    setContactList((prev) => [...prev, contactToDelete])
                }
                setError("삭제에 실패했습니다: " + result.error)
            }
        } catch (err) {
            // 실패 시 원래 상태로 복원
            if (contactToDelete) {
                setContactList((prev) => [...prev, contactToDelete])
            }
            setError("삭제에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveContact = async () => {
        if (!selectedContact) return

        if (!selectedContact.page_id.trim()) {
            setError("페이지 ID는 필수입니다.")
            return
        }
        if (selectedContact.page_id !== currentPageId) {
            setError("현재 선택된 페이지와 연락처의 페이지 ID가 다릅니다.")
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

                setSuccess(
                    isUpdate
                        ? "연락처가 성공적으로 수정되었습니다!"
                        : "연락처가 성공적으로 추가되었습니다!"
                )
                setIsEditingContact(false)
                setSelectedContact(null)

                // 3초 후 성공 메시지 자동 제거
                setTimeout(() => setSuccess(null), 3000)
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

                setError(`저장에 실패했습니다: ${result.error}`)
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

            setError(
                `저장에 실패했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
            )
        } finally {
            setLoading(false)
        }
    }

    const handleContactInputChange = (field: string, value: string) => {
        if (selectedContact) {
            // page_id는 직접 수정 불가
            if (field === "page_id") return
            setSelectedContact({ ...selectedContact, [field]: value })
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
                setSuccess("연락처가 저장되었습니다.")
                setTimeout(() => setSuccess(null), 3000)
            } else {
                setError(result.error || "저장에 실패했습니다")
            }
        } catch (err) {
            setError(
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
        if (isAuthenticated && currentPageId) {
            loadContactList()
            loadPageSettings()
            // 페이지 변경 시 선택된 이미지 초기화
            setSelectedImages(new Set())
        }
    }, [currentPageId])

    // 알림 메시지 자동 제거
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null)
                setSuccess(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    maxWidth: "430px",
                    minWidth: "375px",
                    height: "100vh",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "15px",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        padding: "32px 24px",
                        width: "100%",
                        maxWidth: "320px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                color: "#000000",
                                marginBottom: "8px",
                            }}
                        >
                            웨딩 통합 관리자
                        </h2>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "14px",
                                color: "#6b7280",
                            }}
                        >
                            이미지 업로드 및 연락처 관리
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    color: "#000000",
                                }}
                            >
                                아이디
                            </label>
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
                                    padding: "12px 16px",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "0",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    backgroundColor: "white",
                                    color: "#000000",
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    color: "#000000",
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
                                    padding: "12px 16px",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "0",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    backgroundColor: "white",
                                    color: "#000000",
                                }}
                                required
                            />
                        </div>

                        {loginError && (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    backgroundColor: "#f5f5f5",
                                    color: "#666666",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                backgroundColor: "#000000",
                                color: "white",
                                border: "none",
                                borderRadius: "0",
                                fontSize: "16px",
                                cursor: "pointer",
                            }}
                        >
                            {isLoggingIn ? "로그인 중..." : "로그인"}
                        </button>
                    </form>
                </div>
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
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f5f5f5",
                overflow: "auto",
            }}
        >
            {/* 성공/에러 메시지 표시 */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            padding: "12px 16px",
                            backgroundColor: "#f5f5f5",
                            color: "#000000",
                            fontSize: "14px",
                            textAlign: "center",
                            borderBottom: "1px solid #e0e0e0",
                        }}
                    >
                        {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            padding: "12px 16px",
                            backgroundColor: "#f5f5f5",
                            color: "#666666",
                            fontSize: "14px",
                            textAlign: "center",
                            borderBottom: "1px solid #e0e0e0",
                        }}
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 헤더 */}
            <div
                style={{
                    width: "100%",
                    padding: "24px 16px 24px 16px",
                    backgroundColor: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "0.5px solid #E5E6E8",
                }}
            >
                <button
                    style={{
                        padding: "6px 8px",
                        backgroundColor: "black",
                        color: "white",
                        border: "none",
                        fontSize: "10px",
                        fontFamily: "Pretendard Regular",
                        cursor: "pointer",
                    }}
                >
                    미리보기
                </button>

                <span
                    style={{
                        color: "black",
                        fontSize: "16px",
                        fontFamily: "Pretendard SemiBold",
                    }}
                >
                    {pageSettings.groom_name_kr || "신랑"} ♥{" "}
                    {pageSettings.bride_name_kr || "신부"}
                </span>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: "6px 8px",
                        backgroundColor: "white",
                        color: "#7F7F7F",
                        border: "0.5px solid #E5E6E8",
                        fontSize: "10px",
                        fontFamily: "Pretendard Regular",
                        cursor: "pointer",
                    }}
                >
                    로그아웃
                </button>
            </div>
            {/* 탭 버튼들 */}
            <div
                style={{
                    display: "flex",
                    backgroundColor: "white",
                    borderBottom: "0.5px solid #E5E6E8",
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
                        fontFamily: "Pretendard Regular",
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
                        fontFamily: "Pretendard Regular",
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
                        padding: "16px 0px 16px 0px",
                    }}
                >
                    {/* 성함 섹션 */}
                    <AccordionSection
                        title="성함"
                        sectionKey="name"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
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
                                    gap: theme.gap.md,
                                }}
                            >
                                {/* NameSection 미리보기 */}
                                <div
                                    style={{
                                        border: `1px solid ${theme.color.border}`,
                                        padding: theme.space(3),
                                        marginBottom: 0,
                                        background: theme.color.surface,
                                    }}
                                >
                                    <InlineNameSection
                                        {...buildNameSectionProps()}
                                    />
                                </div>
                                <div
                                    style={{
                                        fontSize: theme.text.xs,
                                        color: theme.color.muted,
                                        marginBottom: theme.space(2),
                                        textAlign: "center",
                                    }}
                                >
                                    미리보기
                                </div>

                                {/* 입력 필드들 */}
                                <div
                                    style={{
                                        flexDirection: "column",
                                        display: "flex",
                                        gap: theme.gap.md,
                                    }}
                                >
                                    <div
                                        style={{
                                            flexDirection: "column",
                                            display: "flex",
                                            gap: "8px",
                                        }}
                                    >
                                        <Label>신랑 영문 성함</Label>
                                        <Input
                                            type="text"
                                            value={
                                                pageSettings.groom_name_en || ""
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
                                        />
                                    </div>

                                    <div
                                        style={{
                                            flexDirection: "column",
                                            display: "flex",
                                            gap: theme.space(2),
                                        }}
                                    >
                                        <Label>신부 영문 성함</Label>
                                        <Input
                                            type="text"
                                            value={
                                                pageSettings.bride_name_en || ""
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
                                        />
                                    </div>

                                    {/* 저장 버튼 */}
                                    <SaveBar
                                        onSave={savePageSettings}
                                        loading={settingsLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 메인 사진 */}
                    <AccordionSection
                        title="메인 사진"
                        sectionKey="photo"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
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
                                    gap: theme.gap.md,
                                }}
                            >
                                {/* 미리보기 박스 */}
                                <div
                                    style={{
                                        width: "100%",
                                        background: "#FAFAFA",
                                        border: "0.5px solid #E5E6E8",
                                        outlineOffset: "-0.25px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 468,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <InlinePhotoSection
                                            {...buildPhotoSectionProps()}
                                            style={{ height: "100%" }}
                                        />
                                    </div>
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontFamily: "Pretendard Regular",
                                        color: "#7F7F7F",
                                        textAlign: "center",
                                    }}
                                >
                                    미리보기
                                </div>

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
                                                height: 40,
                                                padding: 12,
                                                background: "#818181",
                                                color: "white",
                                                border: "none",
                                                display: "inline-flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: 10,
                                                cursor: "pointer",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard Regular",
                                            }}
                                        >
                                            업로드
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
                                        gap: theme.gap.md,
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
                                        />
                                    </Field>
                                    {/* 언어 토글 (영문/국문) */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "inline-flex",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {(["en", "kr"] as const).map((loc) => (
                                            <div
                                                key={loc}
                                                onClick={() =>
                                                    setPageSettings({
                                                        ...pageSettings,
                                                        photo_section_locale:
                                                            loc,
                                                    })
                                                }
                                                style={{
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background:
                                                        pageSettings.photo_section_locale ===
                                                        loc
                                                            ? "#ECECEC"
                                                            : "white",
                                                    border: "0.5px solid #E5E6E8",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    cursor: "pointer",
                                                    userSelect: "none",
                                                }}
                                            >
                                                <span style={{ fontSize: 12 }}>
                                                    {loc === "en"
                                                        ? "영문"
                                                        : "국문"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* AM/PM + 시간/분 선택 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "inline-flex",
                                            gap: theme.gap.sm,
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
                                                        <div
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
                                                                background:
                                                                    selected
                                                                        ? "#ECECEC"
                                                                        : "white",
                                                                border: "0.5px solid #E5E6E8",
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
                                                                }}
                                                            >
                                                                {ap}
                                                            </span>
                                                        </div>
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
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: "0.5px solid #E5E6E8",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
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
                                                        border: "none",
                                                        outline: "none",
                                                        background:
                                                            "transparent",
                                                        fontSize: 12,
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
                                                        width: 7.5,
                                                        height: 3.44,
                                                        transform:
                                                            "rotate(180deg)",
                                                        outline:
                                                            "0.94px #757575 solid",
                                                        outlineOffset:
                                                            "-0.47px",
                                                    }}
                                                />
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
                                                    flex: 1,
                                                    height: 40,
                                                    padding: 12,
                                                    background: "white",
                                                    border: "0.5px solid #E5E6E8",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
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
                                                        border: "none",
                                                        outline: "none",
                                                        background:
                                                            "transparent",
                                                        fontSize: 12,
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
                                                        width: 7.5,
                                                        height: 3.44,
                                                        transform:
                                                            "rotate(180deg)",
                                                        outline:
                                                            "0.94px #757575 solid",
                                                        outlineOffset:
                                                            "-0.47px",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 일시 표시 위치 / 텍스트 색상 */}
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
                                            display: "inline-flex",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {(["top", "bottom"] as const).map(
                                            (pos) => (
                                                <div
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
                                                        background:
                                                            pageSettings.photo_section_overlay_position ===
                                                            pos
                                                                ? "#ECECEC"
                                                                : "white",
                                                        border: "0.5px solid #E5E6E8",
                                                        display: "flex",
                                                        justifyContent:
                                                            "center",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                    }}
                                                >
                                                    <span
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {pos === "top"
                                                            ? "상단"
                                                            : "하단"}
                                                    </span>
                                                </div>
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
                                        {(["#ffffff", "#000000"] as const).map(
                                            (color) => (
                                                <div
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
                                                        background:
                                                            pageSettings.photo_section_overlay_color ===
                                                            color
                                                                ? "#ECECEC"
                                                                : "white",
                                                        border: "0.5px solid #E5E6E8",
                                                        display: "flex",
                                                        justifyContent:
                                                            "center",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                    }}
                                                >
                                                    <span
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {color === "#ffffff"
                                                            ? "흰색"
                                                            : "검정색"}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* 예식장 이름 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <Field label="예식장 이름">
                                        <Input
                                            type="text"
                                            value={pageSettings.venue_name}
                                            onChange={(e) =>
                                                setPageSettings({
                                                    ...pageSettings,
                                                    venue_name: e.target.value,
                                                })
                                            }
                                            placeholder="ROARC HOTEL"
                                        />
                                    </Field>
                                </div>

                                {/* 저장 버튼 */}
                                <SaveBar
                                    onSave={savePageSettings}
                                    loading={settingsLoading}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 초대글 */}
                    <AccordionSection
                        title="초대글"
                        sectionKey="invite"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
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
                                    gap: theme.gap.md,
                                }}
                            >
                                {/* 미리보기 */}
                                <div
                                    style={{
                                        width: "100%",
                                        padding: 20,
                                        background: "#FAFAFA",
                                        border: "0.5px solid #E5E6E8",
                                    }}
                                >
                                    {/* InviteName.tsx의 렌더링을 반영한 미리보기 */}
                                    <div
                                        style={{
                                            alignSelf: "stretch",
                                            textAlign: "center",
                                            color: "black",
                                            fontSize: 16,
                                            fontFamily: "Pretendard Regular",
                                            lineHeight: "32px",
                                            wordWrap: "break-word",
                                        }}
                                    >
                                        {renderInvitationSegmentsPreview(
                                            inviteData.invitationText
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
                                                                "Pretendard Regular",
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
                                                                    "Pretendard Regular",
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
                                                                "Pretendard Regular",
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
                                                            "Pretendard Regular",
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
                                                            "Pretendard Regular",
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
                                                                "Pretendard Regular",
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
                                                                    "Pretendard Regular",
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
                                                                "Pretendard Regular",
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
                                                            "Pretendard Regular",
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
                                                            "Pretendard Regular",
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
                                                alignItems: "flex-start",
                                                display: "inline-flex",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    alignSelf: "stretch",
                                                    color: "black",
                                                    fontSize: 18,
                                                    fontFamily:
                                                        "Pretendard SemiBold",
                                                    lineHeight: "32px",
                                                    wordWrap: "break-word",
                                                }}
                                            >
                                                {inviteData.groomName || ""}
                                            </div>
                                            <div
                                                style={{
                                                    alignSelf: "stretch",
                                                    color: "black",
                                                    fontSize: 18,
                                                    fontFamily:
                                                        "Pretendard SemiBold",
                                                    lineHeight: "32px",
                                                    wordWrap: "break-word",
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
                                            border: "0.5px solid #E5E6E8",
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
                                                width: "100%",
                                                border: "none",
                                                outline: "none",
                                                background: "transparent",
                                                ...theme.typography.body,
                                                lineHeight: "20px",
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
                                                border: "0.5px solid #E5E6E8",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                fontSize: 12,
                                                cursor: "pointer",
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
                                                border: "0.5px solid #E5E6E8",
                                                fontFamily:
                                                    "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
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
                                            border: "0.5px solid #E5E6E8",
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
                                            placeholder="신랑 성함"
                                            style={{
                                                width: "100%",
                                                border: "none",
                                                outline: "none",
                                                fontSize: 14,
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
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
                                            border: "0.5px solid #E5E6E8",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 10,
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
                                            placeholder="신부 성함"
                                            style={{
                                                width: "100%",
                                                border: "none",
                                                outline: "none",
                                                fontSize: 14,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* 저장 */}
                                <SaveBar
                                    onSave={saveInviteData}
                                    loading={inviteSaving}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 연락처 */}
                    <AccordionSection
                        title="연락처"
                        sectionKey="contacts"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
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
                                    gap: theme.gap.md,
                                }}
                            >
                                {/* 신랑 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.md,
                                    }}
                                >
                                    <div style={theme.typography.label}>
                                        신랑
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.groomName}
                                            placeholder="초대글에서 신랑 이름을 입력해주세요"
                                        />
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: "0.5px solid #E5E6E8",
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={
                                                    selectedContact?.groom_phone ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard Regular",
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
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div style={theme.typography.label}>
                                        신랑 아버지
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.groomFatherName}
                                            placeholder="초대글에서 신랑 아버지 이름을 입력해주세요"
                                        />
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: "0.5px solid #E5E6E8",
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={
                                                    selectedContact?.groom_father_phone ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_father_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard Regular",
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
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div style={theme.typography.label}>
                                        신랑 어머니
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.groomMotherName}
                                            placeholder="초대글에서 신랑 어머니 이름을 입력해주세요"
                                        />
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: "0.5px solid #E5E6E8",
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={
                                                    selectedContact?.groom_mother_phone ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "groom_mother_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard Regular",
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
                                        padding: "24px 0px 0px 0px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.md,
                                    }}
                                >
                                    <div style={theme.typography.label}>
                                        신부
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.brideName}
                                            placeholder="초대글에서 신부 이름을 입력해주세요"
                                        />
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: "0.5px solid #E5E6E8",
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={
                                                    selectedContact?.bride_phone ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard Regular",
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
                                        flexDirection: "column",
                                        gap: theme.gap.sm,
                                    }}
                                >
                                    <div style={theme.typography.label}>
                                        신부 아버지
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.brideFatherName}
                                            placeholder="초대글에서 신부 아버지 이름을 입력해주세요"
                                        />
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: "0.5px solid #E5E6E8",
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={
                                                    selectedContact?.bride_father_phone ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_father_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard Regular",
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
                                    }}
                                >
                                    <div style={theme.typography.label}>
                                        신부 어머니
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.sm,
                                        }}
                                    >
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.brideMotherName}
                                            placeholder="초대글에서 신부 어머니 이름을 입력해주세요"
                                        />
                                        {/* 전화번호 입력 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "white",
                                                border: "0.5px solid #E5E6E8",
                                                outlineOffset: -0.25,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="tel"
                                                value={
                                                    selectedContact?.bride_mother_phone ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleContactInputChange(
                                                        "bride_mother_phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="010-1234-5678"
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: 14,
                                                    fontFamily:
                                                        "Pretendard Regular",
                                                    color: selectedContact?.bride_mother_phone
                                                        ? "black"
                                                        : "#ADADAD",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 저장 버튼 */}
                                <SaveBar
                                    onSave={handleSaveContactInline}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </AccordionSection>
                    {/* 캘린더 */}
                    <AccordionSection
                        title="캘린더"
                        sectionKey="calendar"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
                    >
                        <div
                            style={{
                                padding: "32px 16px",
                                backgroundColor: "white",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "flex-start",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: theme.gap.md,
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
                                        gap: theme.gap.md,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 480,
                                            background: "#FAFAFA",
                                            border: "0.5px solid #E5E6E8",
                                            outlineOffset: -0.25,
                                            display: "flex",
                                            alignItems: "flex-start",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {/* 기존 캘린더 미리보기 */}
                                        <InlineCalendarPreview
                                            date={pageSettings.wedding_date}
                                            hour={pageSettings.wedding_hour}
                                            minute={pageSettings.wedding_minute}
                                            groomName={
                                                pageSettings.groom_name_kr
                                            }
                                            brideName={
                                                pageSettings.bride_name_kr
                                            }
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
                                            fontFamily: "Pretendard Regular",
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
                                    }}
                                >
                                    {/* 예식일 표시 모양 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                textAlign: "center",
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            예식일 표시 모양
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 36,
                                                alignItems: "center",
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
                                                        border: "1px solid #E5E6E8",
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
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                        border: "1px solid #E5E6E8",
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
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
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

                                            {/* 색상바 */}
                                            <div
                                                style={{
                                                    width: "100%",
                                                    padding: 6,
                                                    border: "1px solid #E5E6E8",
                                                    borderRadius: 4,
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: 28,
                                                        backgroundColor:
                                                            pageSettings.highlight_color ||
                                                            "#e0e0e0",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 텍스트 색상 */}
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                textAlign: "center",
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            텍스트 색상
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 32,
                                                alignItems: "center",
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
                                                        border: "1px solid #E5E6E8",
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
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                        border: "1px solid #E5E6E8",
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
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
                                                    }}
                                                >
                                                    흰색
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 저장 버튼 */}
                                    <SaveBar
                                        onSave={savePageSettings}
                                        loading={settingsLoading}
                                        label="저장"
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 교통 안내 */}
                    <AccordionSection
                        title="교통 안내"
                        sectionKey="transport"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
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
                                    gap: theme.gap.md,
                                    alignItems: "flex-start",
                                }}
                            >
                                <TransportTab
                                    pageId={currentPageId}
                                    tokenGetter={getAuthToken}
                                />

                                {/* 저장 버튼 */}
                                <SaveBar
                                    onSave={savePageSettings}
                                    loading={settingsLoading}
                                    label="저장"
                                />
                            </div>
                        </div>
                    </AccordionSection>
                    {/* 계좌 안내 */}
                    <AccordionSection
                        title="계좌 안내"
                        sectionKey="account"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
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
                                    gap: "36px",
                                }}
                            >
                                {/* 계좌번호 입력 폼들 */}
                                {/* 신랑측 계좌 */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.gap.md,
                                    }}
                                >
                                    {/* 신랑 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            신랑
                                        </div>
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.groomName}
                                            placeholder="초대글에서 신랑 이름을 입력해주세요"
                                        />
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            신랑 아버지
                                        </div>
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.groomFatherName}
                                            placeholder="초대글에서 신랑 아버지 이름을 입력해주세요"
                                        />
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            신랑 어머니
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                        flexDirection: "column",
                                        gap: theme.gap.md,
                                    }}
                                >
                                    {/* 신부 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            신부
                                        </div>
                                        {/* 이름 표시 */}
                                        <NameDisplay
                                            name={inviteData.brideName}
                                            placeholder="초대글에서 신부 이름을 입력해주세요"
                                        />
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            신부 아버지
                                        </div>
                                        {/* 이름 표시 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "#F8F9FA",
                                                border: "0.5px solid #E5E6E8",
                                                display: "flex",
                                                alignItems: "center",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard Regular",
                                                color: inviteData.brideFatherName
                                                    ? "black"
                                                    : "#ADADAD",
                                            }}
                                        >
                                            {inviteData.brideFatherName ||
                                                "초대글에서 신부 아버지 이름을 입력해주세요"}
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                            flexDirection: "column",
                                            gap: theme.gap.md,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                            }}
                                        >
                                            신부 어머니
                                        </div>
                                        {/* 이름 표시 */}
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 40,
                                                padding: 12,
                                                background: "#F8F9FA",
                                                border: "0.5px solid #E5E6E8",
                                                display: "flex",
                                                alignItems: "center",
                                                fontSize: 14,
                                                fontFamily:
                                                    "Pretendard Regular",
                                                color: inviteData.brideMotherName
                                                    ? "black"
                                                    : "#ADADAD",
                                            }}
                                        >
                                            {inviteData.brideMotherName ||
                                                "초대글에서 신부 어머니 이름을 입력해주세요"}
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
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
                                                    border: "0.5px solid #E5E6E8",
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
                                                        width: "100%",
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: 14,
                                                        fontFamily:
                                                            "Pretendard Regular",
                                                        color: selectedContact?.bride_mother_account
                                                            ? "black"
                                                            : "#ADADAD",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 저장 버튼 */}
                                <SaveBar
                                    onSave={handleSaveContactInline}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 추가 기능 */}
                    <AccordionSection
                        title="추가 기능"
                        sectionKey="kakaoShare"
                        openMap={openSections}
                        onToggle={(key) => toggleSection(key as any)}
                    >
                        <div
                            style={{
                                padding: "16px",
                                textAlign: "center",
                                color: "#666",
                            }}
                        >
                            추가 기능 설정 준비 중입니다.
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* 갤러리 탭 */}
            {activeTab === "gallery" && (
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: theme.space(5),
                        backgroundColor: theme.color.surface,
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.space(4),
                    }}
                >
                    {/* 갤러리 설정 */}
                    <div
                        style={{
                            background: theme.color.roarc.white,
                            border: `0.50px solid ${theme.color.roarc.greyBorder}`,
                            borderRadius: theme.radius.md,
                            overflow: "hidden",
                            marginBottom: theme.space(4),
                        }}
                    >
                        <div
                            style={{
                                alignSelf: "stretch",
                                padding: "14px 16px",
                                background: theme.color.roarc.white,
                                overflow: "hidden",
                                borderBottom: `0.50px solid ${theme.color.roarc.greyBorder}`,
                                justifyContent: "center",
                                alignItems: "center",
                                display: "inline-flex",
                                width: "100%",
                            }}
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
                                <div
                                    style={{
                                        color: theme.color.roarc.grey600,
                                        fontSize: "16px",
                                        fontFamily: "Pretendard Regular",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    갤러리 설정
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                padding: theme.space(4),
                                background: theme.color.roarc.white,
                            }}
                        >
                            <UiRadioGroup
                                label="갤러리 타입"
                                value={pageSettings.gallery_type || "thumbnail"}
                                onChange={(v) =>
                                    setPageSettings({
                                        ...pageSettings,
                                        gallery_type: v,
                                    })
                                }
                                items={[
                                    {
                                        value: "thumbnail",
                                        label: (
                                            <div>
                                                <div
                                                    style={{
                                                        fontFamily:
                                                            theme.font.bodyBold,
                                                        fontSize:
                                                            theme.text.base,
                                                    }}
                                                >
                                                    썸네일형
                                                </div>
                                                <div
                                                    style={{
                                                        fontFamily:
                                                            theme.font.body,
                                                        fontSize: theme.text.sm,
                                                        color: theme.color
                                                            .muted,
                                                        marginTop:
                                                            theme.space(1),
                                                    }}
                                                >
                                                    메인 이미지 + 하단 썸네일
                                                    목록
                                                    <br />
                                                    클릭으로 이미지 전환
                                                </div>
                                            </div>
                                        ),
                                        preview: (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: theme.space(2),
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: theme.space(2),
                                                    background: "#fff",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius:
                                                        theme.radius.sm,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 56,
                                                        height: 79,
                                                        background: "#D9D9D9",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(4, 12px)",
                                                        gap: 2,
                                                    }}
                                                >
                                                    {Array.from({
                                                        length: 4,
                                                    }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                width: 12,
                                                                height: 12,
                                                                background:
                                                                    "#D9D9D9",
                                                                borderRadius: 2,
                                                            }}
                                                        />
                                                    ))}
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
                                                        fontFamily:
                                                            theme.font.bodyBold,
                                                        fontSize:
                                                            theme.text.base,
                                                    }}
                                                >
                                                    베이직형
                                                </div>
                                                <div
                                                    style={{
                                                        fontFamily:
                                                            theme.font.body,
                                                        fontSize: theme.text.sm,
                                                        color: theme.color
                                                            .muted,
                                                        marginTop:
                                                            theme.space(1),
                                                    }}
                                                >
                                                    좌우 슬라이드로 이미지 전환
                                                    <br />
                                                    하단 인디케이터 표시
                                                </div>
                                            </div>
                                        ),
                                        preview: (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: theme.space(2),
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: theme.space(2),
                                                    background: "#fff",
                                                    border: `1px solid ${theme.color.border}`,
                                                    borderRadius:
                                                        theme.radius.sm,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 56,
                                                        height: 95,
                                                        background: "#D9D9D9",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        width: 1.2,
                                                        height: 95,
                                                        background: "#D9D9D9",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        height: 95,
                                                        flex: 1,
                                                        background: "#D9D9D9",
                                                    }}
                                                />
                                            </div>
                                        ),
                                    },
                                ]}
                            />

                            <SaveBar
                                onSave={savePageSettings}
                                loading={settingsLoading}
                                label="설정 저장"
                            />
                        </div>
                    </div>

                    {/* 갤러리 관리 */}
                    <div
                        style={{
                            background: theme.color.roarc.white,
                            border: `0.50px solid ${theme.color.roarc.greyBorder}`,
                            borderRadius: theme.radius.md,
                            overflow: "hidden",
                            marginBottom: theme.space(4),
                        }}
                    >
                        <div
                            style={{
                                alignSelf: "stretch",
                                padding: "14px 16px",
                                background: theme.color.roarc.white,
                                overflow: "hidden",
                                borderBottom: `0.50px solid ${theme.color.roarc.greyBorder}`,
                                justifyContent: "center",
                                alignItems: "center",
                                display: "inline-flex",
                                width: "100%",
                            }}
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
                                <div
                                    style={{
                                        color: theme.color.roarc.grey600,
                                        fontSize: "16px",
                                        fontFamily: "Pretendard Regular",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    갤러리 관리
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                padding: theme.space(4),
                                background: theme.color.roarc.white,
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
                                        gap: 12,
                                        display: "inline-flex",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            if (currentPageId) {
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
                                                "0.50px var(--roarc-grey-500, #AEAEAE) solid",
                                            outlineOffset: "-0.50px",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 8,
                                            display: "flex",
                                            border: "none",
                                            borderRadius: "4px",
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
                                                fontFamily:
                                                    "Pretendard Regular",
                                                wordWrap: "break-word",
                                            }}
                                        >
                                            사진 추가
                                        </div>
                                    </button>
                                </div>
                            </div>

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
                                            backgroundColor:
                                                theme.color.success,
                                            color: "white",
                                            borderRadius: theme.radius.md,
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
                                                fontFamily: theme.font.bodyBold,
                                                marginBottom: theme.space(1),
                                            }}
                                        >
                                            ✅ {uploadSuccess}개의 이미지가
                                            성공적으로 업로드되었습니다
                                        </div>
                                        <div
                                            style={{
                                                fontSize: theme.text.xs,
                                                opacity: 0.8,
                                            }}
                                        >
                                            페이지: {currentPageId}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 이미지 목록 */}
                            {currentPageId && (
                                <Card>
                                    <Row
                                        justify="space-between"
                                        align="center"
                                        style={{ marginBottom: theme.space(4) }}
                                    >
                                        <div>
                                            <Label>
                                                이미지 목록 (
                                                {existingImages.length}
                                                개)
                                            </Label>
                                            {hasUnsavedChanges && (
                                                <span
                                                    style={{
                                                        marginLeft:
                                                            theme.space(2),
                                                        padding: `${theme.space(0.5)}px ${theme.space(1.5)}px`,
                                                        backgroundColor:
                                                            theme.color.danger,
                                                        color: "white",
                                                        fontSize: theme.text.xs,
                                                        borderRadius:
                                                            theme.radius.sm,
                                                    }}
                                                >
                                                    변경됨
                                                </span>
                                            )}
                                        </div>
                                        <Row gap={2}>
                                            <Button
                                                variant="secondary"
                                                onClick={toggleSelectAll}
                                            >
                                                {selectedImages.size ===
                                                existingImages.length
                                                    ? "전체 해제"
                                                    : "전체 선택"}
                                            </Button>
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
                                        <h3
                                            style={{
                                                margin: 0,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            이미지 순서 관리
                                            {hasUnsavedChanges && (
                                                <span
                                                    style={{
                                                        marginLeft: "8px",
                                                        padding: "2px 6px",
                                                        backgroundColor:
                                                            "#ff4444",
                                                        color: "white",
                                                        fontSize: "10px",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    변경됨
                                                </span>
                                            )}
                                        </h3>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                            }}
                                        >
                                            <button
                                                onClick={toggleSelectAll}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#6b7280",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                {selectedImages.size ===
                                                existingImages.length
                                                    ? "전체 해제"
                                                    : "전체 선택"}
                                            </button>
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

                                    {hasUnsavedChanges && (
                                        <Card
                                            style={{
                                                backgroundColor: "#fff3cd",
                                                border: `1px solid #ffecb5`,
                                                marginBottom: theme.space(4),
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontFamily: theme.font.body,
                                                    fontSize: theme.text.sm,
                                                    color: "#856404",
                                                    marginBottom:
                                                        theme.space(3),
                                                }}
                                            >
                                                순서가 변경되었습니다. 아래
                                                '순서 저장' 버튼을 눌러
                                                저장하세요.
                                            </div>
                                            <Row gap={2}>
                                                <Button
                                                    onClick={saveImageOrder}
                                                >
                                                    순서 저장
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={cancelOrderChanges}
                                                >
                                                    취소
                                                </Button>
                                            </Row>
                                        </Card>
                                    )}

                                    {existingImages.length === 0 ? (
                                        <EmptyState
                                            title="업로드된 이미지가 없습니다"
                                            description="사진 추가 버튼을 통해 이미지를 추가해보세요."
                                            icon="🖼️"
                                            action={
                                                <Button
                                                    onClick={() => {
                                                        const input =
                                                            document.getElementById(
                                                                "fileInput"
                                                            ) as HTMLInputElement | null
                                                        input?.click()
                                                    }}
                                                >
                                                    이미지 업로드
                                                </Button>
                                            }
                                        />
                                    ) : (
                                        <UiGrid columns={2} gap={12}>
                                            {existingImages.map(
                                                (image, index) => (
                                                    <UiPhotoTile
                                                        key={image.id}
                                                        src={image.public_url}
                                                        name={
                                                            image.original_name
                                                        }
                                                        index={index + 1}
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
                                                        onReplace={(file) =>
                                                            handleReplaceImage(
                                                                index,
                                                                file
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </UiGrid>
                                    )}
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {null}
        </div>
    )
}

// 교통안내 입력 탭 컴포넌트
function TransportTab({
    pageId,
    tokenGetter,
}: {
    pageId: string
    tokenGetter: () => string | null
}): JSX.Element {
    type TransportItem = {
        id?: string
        title: string
        description: string
        display_order: number
    }

    const DEFAULT_ITEMS: TransportItem[] = [
        {
            title: "버스",
            description: "버스 번호와 정류장을 입력해주세요",
            display_order: 1,
        },
        {
            title: "지하철",
            description: "지하철 호선과 하차역을 입력해주세요",
            display_order: 2,
        },
    ]

    const [items, setItems] = React.useState<TransportItem[]>(DEFAULT_ITEMS)
    const [locationName, setLocationName] = React.useState<string>("")
    const [loading, setLoading] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [errorMsg, setErrorMsg] = React.useState<string>("")
    const [successMsg, setSuccessMsg] = React.useState<string>("")

    React.useEffect(() => {
        let mounted = true
        const getApiBases = () => {
            const bases: string[] = []
            try {
                if (typeof window !== "undefined" && window.location?.origin) {
                    bases.push(window.location.origin)
                }
            } catch {}
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
            setErrorMsg("")
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
                    if (result.locationName) {
                        setLocationName(String(result.locationName))
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
            const updatedTextarea = document.getElementById(
                textareaId
            ) as HTMLTextAreaElement
            if (updatedTextarea) {
                updatedTextarea.focus()
                updatedTextarea.setSelectionRange(cursorOffset, cursorOffset)
            }
        }, 0)
    }

    const save = async () => {
        if (!pageId) {
            setErrorMsg("페이지 ID가 필요합니다")
            return
        }
        setSaving(true)
        setErrorMsg("")
        setSuccessMsg("")
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
            setSuccessMsg("교통안내가 저장되었습니다.")
        } catch (e: any) {
            setErrorMsg(e?.message || "저장 중 오류가 발생했습니다")
        } finally {
            setSaving(false)
            setTimeout(() => {
                setErrorMsg("")
                setSuccessMsg("")
            }, 3000)
        }
    }

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                alignItems: "stretch",
            }}
        >
            {/* 식장 이름 */}
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
                        color: "black",
                        fontSize: 14,
                        fontFamily: "Pretendard SemiBold",
                    }}
                >
                    식장 이름
                </div>
                <div
                    style={{
                        textAlign: "center",
                        color: "#AEAEAE",
                        fontSize: 14,
                        fontFamily: "Pretendard Regular",
                    }}
                >
                    식장 이름에 홀 이름을 쓰고싶다면 여기에 써주세요
                </div>
                <input
                    style={{
                        flex: 1,
                        height: 40,
                        padding: 12,
                        background: "white",
                        border: "0.5px solid #E5E6E8",
                        outlineOffset: -0.25,
                        fontSize: 14,
                        fontFamily: "Pretendard Regular",
                        color: "#ADADAD",
                        width: "100%",
                    }}
                    placeholder="그랜드볼룸, 사파이어홀"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ padding: 12, color: "#6b7280" }}>
                    불러오는 중...
                </div>
            ) : (
                <div>
                    {items.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                width: "100%",
                                padding: 12,
                                border: "0.5px solid #E5E6E8",
                                outlineOffset: -0.5,
                                display: "flex",
                                flexDirection: "column",
                                gap: theme.gap.sm,
                                marginBottom: 12,
                                alignItems: "flex-start",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        textAlign: "center",
                                        color: "black",
                                        fontSize: 14,
                                        fontFamily: "Pretendard SemiBold",
                                    }}
                                >
                                    교통 안내
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        style={{
                                            padding: 6,
                                            border: "1px solid #E5E6E8",
                                            outlineOffset: -1,
                                            background: "white",
                                            cursor:
                                                index === 0
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity: index === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 16,
                                                height: 16,
                                                padding: "13px 9px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 12,
                                                    height: 5.5,
                                                    border: "1.5px solid #757575",
                                                    borderRadius: 1,
                                                }}
                                            />
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => move(index, 1)}
                                        disabled={index === items.length - 1}
                                        style={{
                                            padding: 6,
                                            border: "1px solid #E5E6E8",
                                            outlineOffset: -1,
                                            background: "white",
                                            cursor:
                                                index === items.length - 1
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                index === items.length - 1
                                                    ? 0.5
                                                    : 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 16,
                                                height: 16,
                                                padding: "13px 9px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 12,
                                                    height: 5.5,
                                                    border: "1.5px solid #757575",
                                                    borderRadius: 1,
                                                    transform: "rotate(180deg)",
                                                }}
                                            />
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <input
                                style={{
                                    width: "100%",
                                    height: 40,
                                    padding: 12,
                                    background: "white",
                                    border: "0.5px solid #E5E6E8",
                                    outlineOffset: -0.25,
                                    fontSize: 14,
                                    fontFamily: "Pretendard Regular",
                                    color:
                                        item.title === "" ? "#ADADAD" : "black",
                                }}
                                placeholder="버스"
                                value={item.title}
                                onChange={(e) =>
                                    change(index, "title", e.target.value)
                                }
                            />
                            <textarea
                                id={`description-${index}`}
                                style={{
                                    width: "100%",
                                    height: 120,
                                    padding: 12,
                                    background: "white",
                                    border: "0.5px solid #E5E6E8",
                                    outlineOffset: -0.25,
                                    fontSize: 14,
                                    fontFamily: "Pretendard Regular",
                                    color:
                                        item.description === ""
                                            ? "#ADADAD"
                                            : "black",
                                    resize: "none",
                                }}
                                placeholder="상세 항목을 입력해주세요"
                                value={item.description}
                                onChange={(e) =>
                                    change(index, "description", e.target.value)
                                }
                            />
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
                                    onClick={() => insertFormat(index, "bold")}
                                    style={{
                                        padding: "4px 8px",
                                        border: "0.5px solid #E5E6E8",
                                        outlineOffset: -0.5,
                                        background: "white",
                                        cursor: "pointer",
                                        fontSize: 10,
                                        fontFamily: "Pretendard Regular",
                                        color: "#7F7F7F",
                                        lineHeight: "20px",
                                    }}
                                    title="선택한 텍스트를 두껍게 (*텍스트*)"
                                >
                                    볼드
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertFormat(index, "small")}
                                    style={{
                                        padding: "4px 8px",
                                        border: "0.5px solid #E5E6E8",
                                        outlineOffset: -0.5,
                                        background: "white",
                                        cursor: "pointer",
                                        fontSize: 10,
                                        fontFamily: "Pretendard Regular",
                                        color: "#7F7F7F",
                                        lineHeight: "20px",
                                    }}
                                    title="선택한 텍스트를 작게 ({텍스트})"
                                >
                                    작게
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addItem}
                        style={{
                            width: "100%",
                            height: 40,
                            padding: 12,
                            background: "#ECECEC",
                            border: "0.5px solid #E5E6E8",
                            outlineOffset: -0.25,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                            fontSize: 14,
                            fontFamily: "Pretendard Regular",
                            color: "black",
                        }}
                    >
                        + 안내 추가
                    </button>
                </div>
            )}
        </div>
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
                    color: "#6b7280",
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
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    color: "#111827",
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
