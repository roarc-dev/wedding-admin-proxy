// PhotoSectionProxy.js — PhotoSectionProxy.tsx의 브라우저 ESM JS 버전
// - JSX/TS 미사용 (createElement)
// - Framer/React 전역 런타임에서 동작

// React 전역은 Framer/Canvas 최적화 단계에서 아직 준비 전일 수 있으므로
// 즉시 검사/throw하지 않고, 접근 시점에 동적으로 해소하는 Proxy + 폴백을 사용한다.
const React = (() => {
  const resolve = () =>
    (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) || null;
  const fallback = {
    createElement: () => null,
    Fragment: "div",
  };
  return new Proxy(
    {},
    {
      get(_t, key) {
        const r = resolve();
        if (!r) {
          return (fallback && fallback[key]) || (() => null);
        }
        return r[key];
      },
    }
  );
})();

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

async function getPageSettingsByPageId(pageId) {
  try {
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) return null;
    const result = await response.json();
    if (result && result.success && result.data) return result.data;
    return null;
  } catch (_) {
    return null;
  }
}

// Supabase public object URL -> render transform URL 생성 유틸 (R2 URL은 그대로 반환)
function toTransformedUrl(publicUrl, opts) {
  if (!publicUrl) return publicUrl;
  try {
    // R2/외부 CDN은 변환하지 않음
    const host = new URL(publicUrl).host || "";
    if (!/supabase\.co$/i.test(host)) return publicUrl;
    const url = new URL(publicUrl);
    const split = url.pathname.split("/storage/v1/object/");
    if (split.length !== 2) return publicUrl;
    url.pathname = `/storage/v1/render/image/${split[1]}`;
    const params = url.searchParams;
    if (opts && opts.width) params.set("width", String(opts.width));
    if (opts && opts.height) params.set("height", String(opts.height));
    if (opts && opts.quality) params.set("quality", String(opts.quality));
    if (opts && opts.format) params.set("format", opts.format);
    if (opts && opts.resize) params.set("resize", opts.resize);
    return url.toString();
  } catch (_) {
    return publicUrl;
  }
}

function buildDisplayDateTimeFromSettings(settings, effectiveLocale) {
  if (!settings || !settings.wedding_date) return "";
  try {
    const parts = String(settings.wedding_date).split("-").map((v) => parseInt(v, 10));
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (!y || !m || !d) return "";
    const dt = new Date(y, m - 1, d);
    const year = String(y);
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const weekdayIdx = dt.getDay();
    const weekdayEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][weekdayIdx];
    const weekdayKr = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][weekdayIdx];
    const hour24 = parseInt(settings.wedding_hour || "0", 10);
    const periodEn = hour24 < 12 ? "AM" : "PM";
    const periodKr = hour24 < 12 ? "오전" : "오후";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const isEn = effectiveLocale === "en";
    if (isEn) return `${year}. ${mm}. ${dd}. ${weekdayEn}. ${hour12} ${periodEn}`;
    return `${year}. ${mm}. ${dd}. ${weekdayKr} ${periodKr} ${hour12}시`;
  } catch (_) {
    return "";
  }
}

function PhotoSectionProxy(props) {
  const {
    pageId,
    imageUrl,
    displayDateTime,
    location,
    useOverrideDateTime = false,
    useOverrideLocation = false,
    useOverrideOverlayTextColor = false,
    useOverrideOverlayPosition = false,
    useOverrideLocale = false,
    overlayPosition,
    overlayTextColor,
    locale = "en", // props는 en|ko, 내부 계산은 en|kr
    style,
  } = props || {};

  const resolveReactNow = () =>
    (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) || null;
  const R = resolveReactNow();
  if (!R) return null;
  const { useState, useEffect, createElement } = R;

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!pageId) {
        if (mounted) setSettings(null);
        return;
      }
      const data = await getPageSettingsByPageId(pageId);
      if (!mounted) return;
      setSettings(data);
    })();
    return () => {
      mounted = false;
    };
  }, [pageId]);

  const buildImageUrlFromSettings = (s) => {
    if (!s) return undefined;
    // 우선순위: R2 URL > direct_url(이미지 URL) > public_url > path 파생
    const r2 = (s && (s.photo_section_image_r2_url || s.photo_section_r2_url)) || undefined;
    if (r2) return r2;
    const direct = s && s.photo_section_image_url || undefined;
    if (direct) return direct;
    const derived = s && s.photo_section_image_public_url;
    if (derived) return derived;
    const fromPath = s.photo_section_image_path
      ? `https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/${s.photo_section_image_path}`
      : undefined;
    const base = direct || fromPath;
    if (!base) return undefined;
    if (s.updated_at) {
      const sep = base.includes("?") ? "&" : "?";
      const cacheKey = new Date(s.updated_at).getTime();
      return `${base}${sep}v=${cacheKey}`;
    }
    return base;
  };

  const effectiveImageUrl = imageUrl != null ? imageUrl : buildImageUrlFromSettings(settings);
  const effectiveLocale = useOverrideLocale ? (locale === "en" ? "en" : "kr") : (settings && settings.photo_section_locale === "en" ? "en" : "kr");
  const effectiveDisplayDateTime = useOverrideDateTime
    ? (displayDateTime || "")
    : buildDisplayDateTimeFromSettings(settings, effectiveLocale);
  const effectiveLocation = useOverrideLocation ? (location || undefined) : (settings && settings.venue_name) || undefined;
  const effectiveOverlayPosition = useOverrideOverlayPosition
    ? (overlayPosition || "bottom")
    : (settings && settings.photo_section_overlay_position) || "bottom";
  const effectiveOverlayTextColor = useOverrideOverlayTextColor
    ? (overlayTextColor || "#ffffff")
    : (settings && settings.photo_section_overlay_color) || "#ffffff";

  const containerStyle = {
    width: "100%",
    height: "640px",
    position: "relative",
    overflow: "hidden",
    ...(style || {}),
  };

  const overlayStyle = {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: effectiveOverlayTextColor,
    fontFamily: "'Pretendard Regular', sans-serif",
    fontSize: "15px",
    lineHeight: "1.4",
    zIndex: 10,
    textShadow: effectiveOverlayTextColor === "#ffffff" ? "0px 1px 4px rgba(0, 0, 0, 0.25)" : "none",
    ...(effectiveOverlayPosition === "top" ? { top: "40px" } : { bottom: "40px" }),
  };

  const renderImage = () => {
    if (!effectiveImageUrl) {
      return createElement(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
            color: "#6b7280",
            fontFamily: "'Pretendard Regular', sans-serif",
            fontSize: 14,
            letterSpacing: 0.2,
          },
        },
        "사진을 업로드 해주세요"
      );
    }

    const base = effectiveImageUrl;
    // Supabase URL일 때만 transform srcset 사용, R2/외부 URL은 원본만 사용
    const host = (() => { try { return new URL(base).host; } catch(_) { return ""; } })();
    const isSupabase = /supabase\.co$/i.test(host);
    const large = isSupabase ? toTransformedUrl(base, { width: 860, quality: 80, format: "jpg", resize: "cover" }) : base;
    const small = isSupabase ? toTransformedUrl(base, { width: 430, quality: 80, format: "jpg", resize: "cover" }) : base;
    const medium = isSupabase ? toTransformedUrl(base, { width: 640, quality: 80, format: "jpg", resize: "cover" }) : base;
    const useTransform = isSupabase && large !== base && small !== base && medium !== base;
    const srcSet = useTransform ? `${small} 430w, ${medium} 640w, ${large} 860w` : undefined;

    return createElement("img", {
      src: base,
      srcSet,
      sizes: "(max-width: 430px) 100vw, 430px",
      alt: "Wedding couple",
      style: { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" },
      loading: "lazy",
      decoding: "async",
      onError: (e) => {
        try {
          const img = e && e.target ? e.target : null;
          if (!img) return;
          if (!img.dataset) img.dataset = {};
          if (img.dataset.fallbackDone === "1") return;
          img.dataset.fallbackDone = "1";
          img.srcset = "";
          img.src = base;
        } catch (_) {}
      },
    });
  };

  return React.createElement(
    "div",
    { style: containerStyle },
    renderImage(),
    (effectiveDisplayDateTime || effectiveLocation)
      ? React.createElement(
          "div",
          { style: overlayStyle },
          effectiveDisplayDateTime
            ? React.createElement("div", { style: { marginBottom: "5px" } }, effectiveDisplayDateTime)
            : null,
          effectiveLocation ? React.createElement("div", null, effectiveLocation) : null
        )
      : null
  );
}

PhotoSectionProxy.displayName = "PhotoSectionProxy";
export default PhotoSectionProxy;


