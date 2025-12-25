import React, { useMemo } from "react"

import { Button, Card, mergeStyles, theme } from "../../FramerComponent/UI/UIPrimitives"

type Feature = {
  title: string
  description: string
  actionLabel: string
}

const featureList: Feature[] = [
  {
    title: "Admin 대시보드",
    description: "초대장과 RSVP, 갤러리 설정을 한 곳에서 관리하세요.",
    actionLabel: "관리 열기",
  },
  {
    title: "실시간 편집",
    description: "Framer 컴포넌트를 그대로 TSX로 렌더링해 즉시 반영합니다.",
    actionLabel: "편집 보기",
  },
  {
    title: "Cloudflare Pages",
    description: "Functions 기반 스트리밍으로 TTFB와 SEO를 동시에 확보합니다.",
    actionLabel: "배포 진행",
  },
]

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: theme.color.surface,
  fontFamily: theme.font.body,
  color: theme.color.text,
  padding: `${theme.space(8)}px ${theme.space(5)}px`,
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: theme.space(4),
  width: "100%",
  maxWidth: 1080,
}

const heroStyle: React.CSSProperties = {
  maxWidth: 1080,
  width: "100%",
  marginBottom: theme.space(8),
  display: "flex",
  flexDirection: "column",
  gap: theme.space(3),
}

const headingStyle: React.CSSProperties = {
  fontFamily: theme.font.display,
  fontSize: theme.text.display,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
}

const subStyle: React.CSSProperties = {
  fontSize: theme.text.lg,
  color: theme.color.sub,
  maxWidth: 720,
  lineHeight: 1.6,
}

const footerStyle: React.CSSProperties = {
  marginTop: theme.space(10),
  color: theme.color.muted,
  fontSize: theme.text.sm,
}

const cardStyle: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.space(3),
}

const actionRowStyle: React.CSSProperties = {
  marginTop: "auto",
}

const CTA_HEIGHT = 48

function FeatureCard({ title, description, actionLabel }: Feature) {
  return (
    <Card style={cardStyle}>
      <div style={{ fontFamily: theme.font.bodyBold, fontSize: theme.text.lg }}>{title}</div>
      <div style={{ color: theme.color.sub, lineHeight: 1.5 }}>{description}</div>
      <div style={actionRowStyle}>
        <Button
          aria-label={actionLabel}
          style={{ height: CTA_HEIGHT, width: "100%" }}
          role="button"
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  )
}

const MemoFeatureCard = React.memo(FeatureCard)

function Hero() {
  return (
    <div style={heroStyle}>
      <div style={headingStyle}>Cloudflare Pages + React Streaming</div>
      <div style={subStyle}>
        Next.js 없이도 Functions 엔드포인트 한 개로 Framer TSX를 스트리밍 렌더링합니다. 아래
        카드들은 TSX 순수 컴포넌트이며, 배포 파이프라인에 그대로 올릴 수 있습니다.
      </div>
      <Button
        aria-label="배포 가이드 보기"
        style={{ height: CTA_HEIGHT, width: "fit-content", paddingLeft: 20, paddingRight: 20 }}
      >
        배포 가이드 보기
      </Button>
    </div>
  )
}

const MemoHero = React.memo(Hero)

function FeatureGrid() {
  const features = useMemo(() => featureList, [])

  return (
    <div style={gridStyle}>
      {features.map((item) => (
        <MemoFeatureCard
          key={item.title}
          title={item.title}
          description={item.description}
          actionLabel={item.actionLabel}
        />
      ))}
    </div>
  )
}

const MemoFeatureGrid = React.memo(FeatureGrid)

function FooterNote() {
  return (
    <div style={footerStyle}>
      Functions 엔드포인트(`/functions/index.ts`)에서 `renderToReadableStream`으로 이 컴포넌트를
      스트리밍합니다. 정적 빌드 없이 Cloudflare Pages에 바로 업로드 가능합니다.
    </div>
  )
}

const MemoFooterNote = React.memo(FooterNote)

function App() {
  return (
    <main
      style={mergeStyles(containerStyle, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space(4),
      })}
    >
      <MemoHero />
      <MemoFeatureGrid />
      <MemoFooterNote />
    </main>
  )
}

export default React.memo(App)







