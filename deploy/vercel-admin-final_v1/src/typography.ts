// typography.ts - Pretendard Variable Font 로드 및 타이포그래피 설정

// Pretendard Variable Font 로드
export function loadPretendardFont() {
  // 이미 로드된 폰트가 있는지 확인
  if (document.querySelector('link[data-font="pretendard"]')) {
    return
  }

  // Pretendard Variable Font CSS 로드
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
  link.setAttribute('data-font', 'pretendard')
  document.head.appendChild(link)
}

// 폰트 로드 초기화
export function initTypography() {
  // DOM이 준비되면 폰트 로드
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPretendardFont)
  } else {
    loadPretendardFont()
  }
}

// 기본 타이포그래피 스타일
export const typography = {
  fontFamily: {
    primary: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  },
  fontWeight: {
    thin: 100,
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',    // 48px
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}

// CSS 커스텀 속성으로 타이포그래피 설정
export function injectTypographyCSS() {
  const style = document.createElement('style')
  style.textContent = `
    :root {
      --font-family-primary: ${typography.fontFamily.primary};
      --font-family-mono: ${typography.fontFamily.mono};

      --font-weight-thin: ${typography.fontWeight.thin};
      --font-weight-light: ${typography.fontWeight.light};
      --font-weight-regular: ${typography.fontWeight.regular};
      --font-weight-medium: ${typography.fontWeight.medium};
      --font-weight-semi-bold: ${typography.fontWeight.semiBold};
      --font-weight-bold: ${typography.fontWeight.bold};
      --font-weight-extra-bold: ${typography.fontWeight.extraBold};
      --font-weight-black: ${typography.fontWeight.black};

      --font-size-xs: ${typography.fontSize.xs};
      --font-size-sm: ${typography.fontSize.sm};
      --font-size-base: ${typography.fontSize.base};
      --font-size-lg: ${typography.fontSize.lg};
      --font-size-xl: ${typography.fontSize.xl};
      --font-size-2xl: ${typography.fontSize['2xl']};
      --font-size-3xl: ${typography.fontSize['3xl']};
      --font-size-4xl: ${typography.fontSize['4xl']};
      --font-size-5xl: ${typography.fontSize['5xl']};

      --line-height-none: ${typography.lineHeight.none};
      --line-height-tight: ${typography.lineHeight.tight};
      --line-height-snug: ${typography.lineHeight.snug};
      --line-height-normal: ${typography.lineHeight.normal};
      --line-height-relaxed: ${typography.lineHeight.relaxed};
      --line-height-loose: ${typography.lineHeight.loose};
    }

    body {
      font-family: var(--font-family-primary);
      font-weight: var(--font-weight-regular);
      line-height: var(--line-height-normal);
    }
  `
  document.head.appendChild(style)
}

// 전체 타이포그래피 시스템 초기화
export function init() {
  injectTypographyCSS()
  initTypography()
}
