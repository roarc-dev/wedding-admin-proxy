import React, { useCallback, useEffect, useMemo, useState } from "react"

import { Button, Card, mergeStyles, theme } from "./ui-primitives"

type AuthGateProps = {
  children: React.ReactNode
}

type MeResponse =
  | { authenticated: true; user: { id: string; name: string | null; email: string | null } }
  | { authenticated: false }

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: theme.color.bg,
  fontFamily: theme.font.body,
  color: theme.color.text,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.space(6),
}

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  display: "flex",
  flexDirection: "column",
  gap: theme.space(3),
}

const titleStyle: React.CSSProperties = {
  fontFamily: theme.font.bodyBold,
  fontSize: theme.text.lg,
}

const descStyle: React.CSSProperties = {
  color: theme.color.sub,
  lineHeight: 1.5,
  fontSize: theme.text.md,
}

const CTA_HEIGHT = 48

function AuthGate({ children }: AuthGateProps) {
  const [status, setStatus] = useState<"loading" | "authed" | "guest" | "error">("loading")

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" })
      if (res.ok) {
        const data = (await res.json()) as MeResponse
        if ("authenticated" in data && data.authenticated) {
          setStatus("authed")
          return
        }
      }
      setStatus("guest")
    } catch {
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  const onLogin = useCallback(() => {
    window.location.href = "/api/auth/naver"
  }, [])

  const onRetry = useCallback(() => {
    setStatus("loading")
    void fetchMe()
  }, [fetchMe])

  const body = useMemo(() => {
    if (status === "authed") return children

    const title =
      status === "loading"
        ? "로그인 확인 중…"
        : status === "error"
          ? "연결에 문제가 있어요"
          : "로그인이 필요합니다"

    const description =
      status === "loading"
        ? "잠시만 기다려 주세요."
        : status === "error"
          ? "네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          : "네이버 로그인 후 구매한 초대장을 편집할 수 있습니다."

    const primaryLabel = status === "guest" ? "네이버로 로그인" : status === "error" ? "다시 시도" : "잠시만요"
    const onPrimary = status === "guest" ? onLogin : status === "error" ? onRetry : undefined

    return (
      <div style={containerStyle}>
        <Card style={cardStyle}>
          <div style={titleStyle}>{title}</div>
          <div style={descStyle}>{description}</div>
          <Button
            aria-label={primaryLabel}
            role="button"
            style={mergeStyles(
              { height: CTA_HEIGHT, width: "100%" },
              status === "loading" ? { opacity: 0.6, pointerEvents: "none" } : {},
            )}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        </Card>
      </div>
    )
  }, [children, onLogin, onRetry, status])

  return <>{body}</>
}

export default React.memo(AuthGate)


