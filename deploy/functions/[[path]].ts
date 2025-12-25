import React from "react"
import { renderToReadableStream } from "react-dom/server"

import App from "../components/App"
import { mergeStyles, theme } from "../../FramerComponent/UI/UIPrimitives"

type PagesContext = {
  request: Request
  env?: Record<string, unknown>
  params?: Record<string, string>
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  background: theme.color.bg,
  color: theme.color.text,
  fontFamily: theme.font.body,
}

function Document({ requestUrl }: { requestUrl: string }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={requestUrl} />
        <title>Cloudflare Pages + React Streaming</title>
        <meta
          name="description"
          content="Cloudflare Pages Functions에서 TSX를 바로 스트리밍 렌더링합니다."
        />
      </head>
      <body style={mergeStyles(bodyStyle, { minHeight: "100vh" })}>
        <App />
      </body>
    </html>
  )
}

export const onRequest = async ({ request }: PagesContext) => {
  try {
    const stream = await renderToReadableStream(<Document requestUrl={request.url} />, {
      bootstrapScripts: [],
    })

    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream<Uint8Array>()
    const writer = writable.getWriter()
    const writeDoctype = writer.write(encoder.encode("<!DOCTYPE html>"))

    stream
      .pipeTo(writable, { preventClose: true })
      .then(() => writer.close())
      .catch((error) => writer.abort(error))

    await Promise.all([stream.allReady, writeDoctype])

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Render error: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
