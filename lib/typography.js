/**
 * Typography utilities for Admin (CDN-hosted fonts)
 * - Supports font-face injection for P22 Late November and Pretendard (via cdn.roarc.kr)
 * - Provides inline-style presets and helpers for Framer-friendly usage
 * - Token-aware: accepts optional theme/mergeStyles to align with Roarc UI tokens
 */

const DEFAULT_CDN_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL) || 'https://cdn.roarc.kr'

// Default expected CDN paths (you can upload fonts to these paths on cdn.roarc.kr)
// Adjust the paths if you place them differently on your CDN.
const DEFAULT_FONT_PATHS = {
  pretendard: {
    // Variable font recommended (supports weights 100-900). If you use static weights, set files.normal/bold instead.
    variable: 'fonts/pretendard/Pretendard-Variable.woff2',
    // fallback examples for static weights (uncomment and upload if needed)
    // normal: 'fonts/pretendard/Pretendard-Regular.woff2',
    // bold: 'fonts/pretendard/Pretendard-Bold.woff2',
  },
  p22: {
    // Many P22 Late November distributions are single-weight display fonts.
    normal: 'fonts/p22-late-november/P22LateNovember.woff2',
  },
}

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/$/, '')
  const p = String(path || '').replace(/^\//, '')
  return `${b}/${p}`
}

function buildFontFaceCss(cdnBase, fontPaths) {
  const paths = fontPaths || DEFAULT_FONT_PATHS
  const base = cdnBase || DEFAULT_CDN_BASE

  const css = []

  // Pretendard (variable preferred)
  if (paths.pretendard && paths.pretendard.variable) {
    css.push(`@font-face{font-family:"Pretendard";font-style:normal;font-weight:100 900;font-display:swap;src:url("${joinUrl(base, paths.pretendard.variable)}") format("woff2");}`)
  } else if (paths.pretendard && (paths.pretendard.normal || paths.pretendard.bold)) {
    if (paths.pretendard.normal) {
      css.push(`@font-face{font-family:"Pretendard";font-style:normal;font-weight:400;font-display:swap;src:url("${joinUrl(base, paths.pretendard.normal)}") format("woff2");}`)
    }
    if (paths.pretendard.bold) {
      css.push(`@font-face{font-family:"Pretendard";font-style:normal;font-weight:700;font-display:swap;src:url("${joinUrl(base, paths.pretendard.bold)}") format("woff2");}`)
    }
  }

  // P22 Late November (display)
  if (paths.p22 && paths.p22.normal) {
    css.push(`@font-face{font-family:"P22 Late November";font-style:normal;font-weight:400;font-display:swap;src:url("${joinUrl(base, paths.p22.normal)}") format("woff2");}`)
  }

  return css.join('')
}

function injectFontFacesOnce(options) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const id = 'roarc-typography-fontfaces'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.type = 'text/css'
  style.appendChild(document.createTextNode(buildFontFaceCss(options?.cdnBase, options?.fontPaths)))
  document.head.appendChild(style)
}

function getStacks() {
  const systemSans = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple SD Gothic Neo,Noto Sans KR,\"Apple Color Emoji\",\"Segoe UI Emoji\"'
  return {
    pretendard: `"Pretendard", ${systemSans}`,
    p22: `"P22 Late November", "Pretendard", ${systemSans}`,
  }
}

function makeFontStyle({ family, weight, size, lineHeight }) {
  const stacks = getStacks()
  const familyName = family === 'p22' ? stacks.p22 : stacks.pretendard
  const style = {
    fontFamily: familyName,
    fontWeight: weight != null ? weight : 400,
  }
  if (size != null) style.fontSize = typeof size === 'number' ? `${size}px` : size
  if (lineHeight != null) style.lineHeight = typeof lineHeight === 'number' ? `${lineHeight}px` : lineHeight
  return style
}

// Create a token-aware typography helper. If theme/mergeStyles are provided, they are used.
function createTypography(options) {
  const cdnBase = options?.cdnBase || DEFAULT_CDN_BASE
  const fontPaths = options?.fontPaths || DEFAULT_FONT_PATHS
  const theme = options?.theme
  const mergeStyles = options?.mergeStyles

  const sizeTokens = theme?.text || {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    display: 48,
  }

  const styles = {
    headingXL: makeFontStyle({ family: 'p22', weight: 400, size: sizeTokens.display, lineHeight: 1.1 }),
    headingL: makeFontStyle({ family: 'p22', weight: 400, size: sizeTokens.xl, lineHeight: 1.15 }),
    headingM: makeFontStyle({ family: 'p22', weight: 400, size: sizeTokens.lg, lineHeight: 1.2 }),
    title: makeFontStyle({ family: 'pretendard', weight: 700, size: sizeTokens.lg, lineHeight: 1.35 }),
    body: makeFontStyle({ family: 'pretendard', weight: 400, size: sizeTokens.md, lineHeight: 1.5 }),
    caption: makeFontStyle({ family: 'pretendard', weight: 400, size: sizeTokens.sm, lineHeight: 1.4 }),
  }

  const helpers = {
    fontPretendard: (weight = 400, size, lineHeight) => makeFontStyle({ family: 'pretendard', weight, size, lineHeight }),
    fontP22: (size, lineHeight) => makeFontStyle({ family: 'p22', weight: 400, size, lineHeight }),
    stacks: getStacks(),
    merge: (...s) => (typeof mergeStyles === 'function' ? mergeStyles(...s) : Object.assign({}, ...s.filter(Boolean))),
  }

  return {
    cdnBase,
    fontPaths,
    ensure: (override) => injectFontFacesOnce({ cdnBase: override?.cdnBase || cdnBase, fontPaths: override?.fontPaths || fontPaths }),
    buildFontFaceCss: (override) => buildFontFaceCss(override?.cdnBase || cdnBase, override?.fontPaths || fontPaths),
    styles,
    helpers,
  }
}

// Default instance (no-op until ensure() is called). Consumers can also call createTypography to pass custom tokens.
const typography = createTypography()

export {
  DEFAULT_CDN_BASE,
  DEFAULT_FONT_PATHS,
  buildFontFaceCss,
  injectFontFacesOnce,
  createTypography,
}

export default typography


