import React from "react"

/** ------------------------------------------------------
 * THEME & TOKENS — define once, reuse everywhere
 * ----------------------------------------------------- */
export const theme = {
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
  },
  font: {
    body: "'Pretendard', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    bodyBold: "'Pretendard SemiBold', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    display: "P22LateNovemberW01-Regular Regular, serif",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
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
} as const

/** Utilities */
export function mergeStyles(
  ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties {
  return Object.assign({}, ...styles)
}

/** ------------------------------------------------------
 *  UI PRIMITIVES
 * ----------------------------------------------------- */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export function Button({
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
    sm: { padding: "8px 12px", fontSize: theme.text.sm },
    md: { padding: "10px 14px", fontSize: theme.text.base },
    lg: { padding: "12px 18px", fontSize: theme.text.lg },
  }

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: { background: theme.color.primary, color: theme.color.primaryText },
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
    danger: { background: theme.color.danger, color: theme.color.primaryText },
  }

  return (
    <button
      {...rest}
      disabled={disabled}
      style={mergeStyles(base, sizes[size], variants[variant], style)}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)"
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
      }}
    >
      {children}
    </button>
  )
}

export function Card({
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

export function Row({
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
        },
        style
      )}
    >
      {children}
    </div>
  )
}

export function Section({
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
    <Card style={mergeStyles({ padding: theme.space(4) }, style)}>
      <Row
        align="center"
        justify="space-between"
        style={{ cursor: onToggle ? "pointer" : "default" }}
      >
        <div style={{ fontFamily: theme.font.bodyBold, fontSize: theme.text.lg }}>
          {title}
        </div>
        <Row gap={2} align="center">
          {right}
          {onToggle && (
            <button
              onClick={onToggle}
              aria-label={isOpen ? "Collapse" : "Expand"}
              style={{
                border: 0,
                background: "transparent",
                width: 28,
                height: 28,
                borderRadius: theme.radius.pill,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: `rotate(${isOpen ? 180 : 0}deg)`,
                  transition: "transform .2s ease",
                }}
              >
                ⌄
              </span>
            </button>
          )}
        </Row>
      </Row>
      {isOpen && <div style={{ marginTop: theme.space(4) }}>{children}</div>}
    </Card>
  )
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div
      style={{
        fontFamily: theme.font.bodyBold,
        fontSize: theme.text.sm,
        color: theme.color.sub,
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

export const inputBase: React.CSSProperties = {
  width: "100%",
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.color.border}`,
  padding: "10px 12px",
  fontFamily: theme.font.body,
  fontSize: theme.text.base,
  outline: "none",
  background: "#fff",
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={mergeStyles(inputBase, props.style)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={mergeStyles(inputBase, { resize: "vertical", minHeight: 120 }, props.style)}
    />
  )
}

/** Common save bar: full-width primary button */
export function SaveBar({ onSave, loading }: { onSave: () => void; loading?: boolean }) {
  return (
    <Row gap={2} style={{ marginTop: theme.space(2) }}>
      <Button onClick={onSave} disabled={!!loading} fullWidth>
        {loading ? "저장 중..." : "저장"}
      </Button>
    </Row>
  )
}

/** Accordion wrapper compatible with openMap/toggleSection patterns */
export function AccordionSection({
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
    <Section title={title} isOpen={!!openMap[sectionKey]} onToggle={() => onToggle(sectionKey)}>
      {children}
    </Section>
  )
}

/** Optional helpers for display headings */
export function DisplayHeading({
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