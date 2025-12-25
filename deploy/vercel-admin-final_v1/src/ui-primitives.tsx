import React from "react"
import { typography } from "./typography"

/**
 * 로컬 UI 토큰/프리미티브
 * - 이 Vite 프로젝트는 workspace 루트의 node_modules와 타입이 분리되어 있어,
 *   상위 디렉토리의 `FramerComponent/UI/UIPrimitives.tsx`를 직접 import하면
 *   @types/react / csstype 중복으로 TS 타입 충돌이 발생할 수 있습니다.
 * - 따라서 배포 폴더 내부에 동일한 API(theme/mergeStyles/Button/Card)를 로컬로 둡니다.
 */
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
    body: typography.fontFamily.primary,
    bodyBold: `${typography.fontFamily.primary.replace("'Pretendard Variable', ", "").replace("'Pretendard', ", "")}font-weight: ${typography.fontWeight.semiBold}`,
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

export function mergeStyles(
  ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties {
  return Object.assign({}, ...styles)
}

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
        ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)"
      }}
      onMouseUp={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
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
        style,
      )}
    >
      {children}
    </div>
  )
}


