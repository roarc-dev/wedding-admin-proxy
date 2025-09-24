// LocationUnified.js — Location, NaverMap, LocationDetail, MapBtn을 통합한 완전한 컴포넌트
// - 브라우저 ESM
// - JSX/TS 미사용 (createElement)
// - Framer/React 전역 런타임에서 동작
// - typography.js를 직접 import하여 폰트 CSS를 주입
import typography from "https://cdn.roarc.kr/fonts/typography.js";

// === 런타임 전역에서 React 확보 (지연 해소: 최적화 단계 대비) ===
const React = (() => {
  const resolve = () =>
    (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) || null;
  const fallback = {
    createElement: () => null,
    Fragment: "div",
    useState: (initial) => [initial, () => {}],
    useEffect: (callback, deps) => { callback(); },
    useRef: (initial) => ({ current: initial }),
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

// (옵션) framer-motion이 전역에 있으면 쓰고, 없으면 안전 폴백
const framerNS = (globalThis && globalThis.Framer) || {};
let motion = null;
try {
  const motionEnv = framerNS.motion || globalThis.motion || null;
  motion = motionEnv && (motionEnv.div || motionEnv.span || motionEnv.button) ? motionEnv : null;
} catch (_) {
  motion = null;
}
if (!motion) {
  const factory = (tag) => (props) => React.createElement(tag, props, props && props.children);
  motion = { div: factory("div"), span: factory("span"), button: factory("button") };
}

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

// === Location.tsx 부분 (위치 정보 표시) ===
async function getLocationSettings(pageId) {
  if (!pageId) return { venue_name: "", venue_address: "", transport_location_name: "" };
  try {
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) return { venue_name: "", venue_address: "", transport_location_name: "" };
    const result = await response.json();
    if (result && result.success && result.data) {
      return {
        venue_name: result.data.venue_name || "",
        venue_address: result.data.venue_address || "",
        transport_location_name: result.data.transport_location_name || "",
      };
    }
  } catch (_) {
    return { venue_name: "", venue_address: "", transport_location_name: "" };
  }
}

// === NaverMapSimple.tsx 부분 (네이버 지도 + 좌표) ===
async function getMapConfig() {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/map-config`);
    if (!response.ok) return { naverClientId: "3cxftuac0e" };
    const result = await response.json();
    if (result.success) {
      return {
        naverClientId: result.data.naverClientId || result.data.naverMapsKey || "3cxftuac0e",
      };
    }
  } catch (_) {
    return { naverClientId: "3cxftuac0e" };
  }
}

async function getPageCoordinates(pageId) {
  if (!pageId) return null;
  try {
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) return null;
    const result = await response.json();
    if (result && result.success && result.data) {
      const data = result.data;
      if (data.venue_lat && data.venue_lng) {
        return { lat: data.venue_lat, lng: data.venue_lng };
      }
    }
  } catch (_) {
    return null;
  }
  return null;
}

// === LocationDetail.tsx 부분 (교통편 상세 정보) ===
async function getTransportDetails(pageId) {
  if (!pageId) return [];
  try {
    const bases = [
      typeof window !== "undefined" ? window.location.origin : "",
      PROXY_BASE_URL,
    ].filter(Boolean);
    let res = null;
    for (const base of bases) {
      try {
        const tryRes = await fetch(
          `${base}/api/page-settings?transport&pageId=${encodeURIComponent(pageId)}`
        );
        res = tryRes;
        if (tryRes.ok) break;
      } catch {}
    }
    if (!res) return [];
    const result = await res.json();
    if (result?.success && Array.isArray(result.data)) {
      return result.data;
    }
  } catch (_) {
    return [];
  }
  return [];
}

// === MapBtn.tsx 부분 (지도 앱 링크) ===
function getMapAppLinks(lat, lng, placeName) {
  const locationName = placeName || "목적지";

  return {
    naver: `nmap://route/public?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(locationName)}`,
    kakao: `kakaomap://route?ep=${lat},${lng}&by=CAR`,
    tmap: `https://apis.openapi.sk.com/tmap/app/routes?name=${encodeURIComponent(locationName)}&lon=${lng}&lat=${lat}`,
  };
}

// === 텍스트 스타일링 유틸리티 (LocationDetail에서 사용) ===
function renderStyledText(text) {
  const segments = [];
  let index = 0;
  const regex = /(\{([^}]*)\})|(\n\n)|(\n)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > index) {
      const beforeText = text.slice(index, start);
      segments.push(...processBoldAndLineBreak(beforeText, `t-${index}`));
    }

    if (match[1]) {
      const inner = match[2] || "";
      const innerSegments = processBoldAndLineBreak(inner, `q-${start}`);
      segments.push(
        React.createElement(
          "span",
          { key: `q-${start}`, style: { fontSize: 13, lineHeight: "20px" } },
          innerSegments
        )
      );
    } else if (match[3]) {
      segments.push(
        React.createElement("div", { key: `double-br-${start}`, style: { height: "0.6em" } })
      );
    } else if (match[4]) {
      segments.push(React.createElement("br", { key: `br-${start}` }));
    }

    index = end;
  }

  if (index < text.length) {
    const remainingText = text.slice(index);
    segments.push(...processBoldAndLineBreak(remainingText, `t-${index}`));
  }

  return segments;
}

function processBoldAndLineBreak(text, keyPrefix) {
  const segments = [];
  let index = 0;
  const regex = /(\*([^*]+)\*)|(\n\n)|(\n)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > index) {
      const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em";
      segments.push(
        React.createElement("span", { key: `${keyPrefix}-${index}`, style: { lineHeight } }, text.slice(index, start))
      );
    }

    if (match[1]) {
      const inner = match[2] || "";
      const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em";
      segments.push(
        React.createElement(
          "span",
          { key: `${keyPrefix}-b-${start}`, style: { fontFamily: "Pretendard SemiBold", lineHeight } },
          inner
        )
      );
    } else if (match[3]) {
      segments.push(
        React.createElement("div", { key: `${keyPrefix}-double-br-${start}`, style: { height: "0.6em" } })
      );
    } else if (match[4]) {
      segments.push(React.createElement("br", { key: `${keyPrefix}-br-${start}` }));
    }

    index = end;
  }

  if (index < text.length) {
    const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em";
    segments.push(
      React.createElement("span", { key: `${keyPrefix}-${index}`, style: { lineHeight } }, text.slice(index))
    );
  }

  return segments;
}

// === 메인 컴포넌트 ===
function LocationUnified(props) {
  const { pageId = "", style } = props;
  const resolveReactNow = () =>
    (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) || null;
  const R = resolveReactNow();
  if (!R) {
    return null;
  }
  const { useEffect, useRef, useState } = R;

  // 통합 상태 관리
  const [locationSettings, setLocationSettings] = useState({
    venue_name: "",
    venue_address: "",
    transport_location_name: "",
  });
  const [coordinates, setCoordinates] = useState(null);
  const [transportItems, setTransportItems] = useState([]);
  const [naverClientId, setNaverClientId] = useState("3cxftuac0e");
  const [isLoading, setIsLoading] = useState(true);
  const [showCopyMessage, setShowCopyMessage] = useState(false);

  // Refs
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  // 기본 마커 SVG
  const defaultMarkerSvg = `data:image/svg+xml;base64,${btoa(`<svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M676.89 393.29C676.89 561.91 497.9 788.29 427.74 870.55C413.08 887.74 386.6 887.98 371.66 871.04C301.08 791.03 123.11 571.59 123.11 393.3C123.11 240.38 247.08 116.41 400 116.41C552.92 116.41 676.89 240.38 676.89 393.3V393.29Z" fill="url(#paint0_linear_16_59)"/>
<path d="M400.001 514.31C470.688 514.31 527.991 457.007 527.991 386.32C527.991 315.633 470.688 258.33 400.001 258.33C329.314 258.33 272.011 315.633 272.011 386.32C272.011 457.007 329.314 514.31 400.001 514.31Z" fill="url(#paint1_linear_16_59)"/>
<defs>
<linearGradient id="paint0_linear_16_59" x1="400" y1="883.6" x2="400" y2="116.4" gradientUnits="userSpaceOnUse">
<stop stop-color="#5C5C5C"/>
<stop offset="1" stop-color="#C8C8C8"/>
</linearGradient>
<linearGradient id="paint1_linear_16_59" x1="400.001" y1="514.32" x2="400.001" y2="258.33" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="#C8C8C8"/>
</linearGradient>
</defs>
</svg>`)}`;

  // 초기 데이터 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const [settings, coords, transport, config] = await Promise.all([
          getLocationSettings(pageId),
          getPageCoordinates(pageId),
          getTransportDetails(pageId),
          getMapConfig(),
        ]);

        if (!mounted) return;

        setLocationSettings(settings);
        setCoordinates(coords);
        setTransportItems(transport);
        setNaverClientId(config.naverClientId);
      } catch (error) {
        console.error("LocationUnified data load error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [pageId]);

  // 네이버 지도 초기화
  useEffect(() => {
    if (!naverClientId || !window.naver || !mapRef.current) return;

    const initMap = () => {
      if (!window.naver.maps) return;

      const position = new window.naver.maps.LatLng(
        coordinates?.lat || 37.3595704,
        coordinates?.lng || 127.105399
      );

      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        zoomControl: false,
        logoControl: false,
        scaleControl: false,
      });

      const iconSize = new window.naver.maps.Size(42, 52);
      const iconAnchor = new window.naver.maps.Point(21, 26);

      markerInstance.current = new window.naver.maps.Marker({
        map: mapInstance.current,
        position,
        icon: {
          url: defaultMarkerSvg,
          size: iconSize,
          origin: new window.naver.maps.Point(0, 0),
          anchor: iconAnchor,
        },
        clickable: true,
        visible: true,
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(markerInstance.current, "click", () => {
        const venueName = locationSettings.venue_name || locationSettings.venue_address || "위치";
        const encodedName = encodeURIComponent(venueName);
        const appName = encodeURIComponent(window.location.hostname) || "framer";
        const mobileUrl = `nmap://route/public?lat=${position.lat}&lng=${position.lng}&name=${encodedName}&appname=${appName}`;
        const webUrl = `https://map.naver.com/p/?c=${position.lng},${position.lat},15,0,0,0,dh`;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        window.open(isMobile ? mobileUrl : webUrl, "_blank");
      });
    };

    // 이미 로드된 경우 바로 초기화
    let injectedScript = null;
    if (window.naver && window.naver.maps) {
      initMap();
    } else {
      // 네이버 지도 API 로드
      injectedScript = document.createElement("script");
      injectedScript.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverClientId}`;
      injectedScript.async = true;
      injectedScript.onload = initMap;
      injectedScript.onerror = () => console.error("네이버 지도 API 로드 실패");
      document.head.appendChild(injectedScript);
    }

    return () => {
      if (injectedScript && injectedScript.parentNode) {
        document.head.removeChild(injectedScript);
      }
    };
  }, [naverClientId, coordinates, locationSettings]);

  // 복사 기능
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(locationSettings.venue_address || "");
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    } catch {
      // ignore
    }
  };

  // 표시할 장소명
  const displayLocationName = locationSettings.transport_location_name || locationSettings.venue_name || "장소이름";

  // 지도 앱 링크
  const mapLinks = coordinates ? getMapAppLinks(coordinates.lat, coordinates.lng, displayLocationName) : null;

  // 폴백 교통편 아이템
  const safeTransportItems = transportItems.length > 0 ? transportItems : [
    { title: "교통편", description: "상세 항목", display_order: 1 },
    { title: "교통편", description: "상세 항목", display_order: 2 },
  ];

  // P22 폰트 스택
  const pretendardStack = (typography && typography.helpers && typography.helpers.stacks && typography.helpers.stacks.pretendard)
    || `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"`;

  return React.createElement(
    "div",
    {
      style: {
        width: "fit-content",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }
    },
    // 1. Location.tsx 부분 - 장소 정보
    React.createElement(
      "div",
      {
        style: {
          width: "fit-content",
          height: "fit-content",
          paddingTop: 40,
          paddingBottom: 28,
          display: "inline-flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
          position: "relative",
        }
      },
      React.createElement(
        "div",
        {
          style: {
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 5,
          }
        },
        // 장소 이름
        React.createElement(
          "div",
          {
            style: {
              alignSelf: "stretch",
              textAlign: "center",
              color: "black",
              fontSize: 18,
              lineHeight: "32px",
              fontFamily: pretendardStack,
            }
          },
          isLoading ? "" : displayLocationName.includes("|") ? displayLocationName.split("|").map((part, index, array) =>
            React.createElement(
              React.Fragment,
              { key: index },
              React.createElement(
                "span",
                {
                  style: {
                    fontFamily: "Pretendard SemiBold",
                    fontSize: 18,
                    lineHeight: "32px",
                  }
                },
                part.trim()
              ),
              index < array.length - 1 && React.createElement(
                "span",
                {
                  style: {
                    fontFamily: "Pretendard Regular",
                    fontSize: 18,
                    lineHeight: "32px",
                  }
                },
                " | "
              )
            )
          ) : React.createElement(
            "span",
            {
              style: {
                fontFamily: "Pretendard SemiBold",
                fontSize: 18,
                lineHeight: "32px",
              }
            },
            displayLocationName
          )
        ),
        // 주소 + 복사
        React.createElement(
          "div",
          {
            style: {
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 5,
            }
          },
          React.createElement(
            "div",
            {
              style: {
                alignSelf: "stretch",
                textAlign: "center",
                color: "black",
                fontSize: 16,
                fontFamily: pretendardStack,
                lineHeight: "32px",
              }
            },
          isLoading ? "" : locationSettings.venue_address || "장소 상세주소"
          ),
          React.createElement(
            "div",
            {
              onClick: copyToClipboard,
              style: {
                display: "inline-flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 5,
                cursor: locationSettings.venue_address ? "pointer" : "default",
              }
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }
              },
              React.createElement(
                "svg",
                {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "11",
                  height: "13",
                  viewBox: "0 0 11 13",
                  fill: "none",
                  style: { marginRight: 4 }
                },
                React.createElement("rect", {
                  x: "0.5",
                  y: "0.5",
                  width: "7.35989",
                  height: "9.41763",
                  stroke: "#7F7F7F",
                }),
                React.createElement("path", {
                  d: "M3.2998 12.5001H10.4997V3.23438",
                  stroke: "#7F7F7F",
                })
              ),
              React.createElement(
                "div",
                {
                  style: {
                    color: "#9ca3af",
                    fontSize: 14,
                    fontFamily: pretendardStack,
                  }
                },
                "복사"
              )
            )
          )
        )
      ),
      // 복사 메시지
      showCopyMessage && React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 200,
            height: 40,
            background: "#FFFFFF",
            borderRadius: 5,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            pointerEvents: "none",
          }
        },
        React.createElement(
          "div",
          {
            style: {
              color: "#000000",
              fontSize: 14,
              fontFamily: pretendardStack,
              textAlign: "center",
            }
          },
          "복사되었습니다"
        )
      )
    ),
    // 2. NaverMapSimple.tsx 부분 - 지도
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "300px",
          position: "relative",
          margin: "20px 0",
        }
      },
      React.createElement("div", { ref: mapRef, style: { width: "100%", height: "100%" } }),
      isLoading && React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#666",
            fontFamily: pretendardStack,
          }
        },
        "지도 로딩 중..."
      )
    ),
    // 3. LocationDetail.tsx 부분 - 교통편 상세
    React.createElement(
      "div",
      {
        style: {
          width: "88%",
          height: "fit-content",
          paddingTop: 30,
          paddingBottom: 30,
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 15,
          display: "inline-flex",
          marginBottom: "20px",
        }
      },
      safeTransportItems
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((item, idx) => React.createElement(
          "div",
          {
            key: idx,
            style: {
              alignSelf: "stretch",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              display: "inline-flex",
              gap: 10,
            }
          },
          React.createElement(
            "div",
            {
              style: {
                width: 52,
                color: "black",
                fontSize: 15,
                fontFamily: "Pretendard SemiBold",
                lineHeight: "1.6em",
                wordWrap: "break-word",
              }
            },
            item.title || ""
          ),
          React.createElement(
            "div",
            {
              style: {
                flex: "1 1 0",
                color: "black",
                fontSize: 15,
                fontFamily: pretendardStack,
                wordWrap: "break-word",
              }
            },
            renderStyledText(item.description || "")
          )
        ))
    ),
    // 4. MapBtn.tsx 부분 - 지도 앱 링크
    React.createElement(
      "div",
      {
        style: {
          height: "44px",
          width: "88%",
          display: "flex",
          gap: 6,
          marginBottom: "20px",
        }
      },
      mapLinks && React.createElement(
        "a",
        {
          href: mapLinks.naver,
          target: "_blank",
          rel: "noopener noreferrer",
          style: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "13px 13px",
            border: "none",
            background: "#f5f5f5",
            cursor: "pointer",
            textDecoration: "none",
            fontFamily: pretendardStack,
            fontSize: "14px",
            fontWeight: "600",
            color: "#000000",
          }
        },
        React.createElement(
          "img",
          {
            src: "https://cdn.roarc.kr/framer/LocationIcon/nmap.png",
            alt: "네이버 지도",
            style: { width: "20px", height: "20px" }
          }
        ),
        "네이버 지도"
      ),
      mapLinks && React.createElement(
        "a",
        {
          href: mapLinks.kakao,
          target: "_blank",
          rel: "noopener noreferrer",
          style: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "13px 13px",
            border: "none",
            background: "#f5f5f5",
            cursor: "pointer",
            textDecoration: "none",
            fontFamily: pretendardStack,
            fontSize: "14px",
            fontWeight: "600",
            color: "#000000",
          }
        },
        React.createElement(
          "img",
          {
            src: "https://cdn.roarc.kr/framer/LocationIcon/kakaomap_basic.png",
            alt: "카카오맵",
            style: { width: "20px", height: "20px" }
          }
        ),
        "카카오맵"
      ),
      mapLinks && React.createElement(
        "a",
        {
          href: mapLinks.tmap,
          target: "_blank",
          rel: "noopener noreferrer",
          style: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "13px 13px",
            border: "none",
            background: "#f5f5f5",
            cursor: "pointer",
            textDecoration: "none",
            fontFamily: pretendardStack,
            fontSize: "14px",
            fontWeight: "600",
            color: "#000000",
          }
        },
        React.createElement(
          "img",
          {
            src: "https://cdn.roarc.kr/framer/LocationIcon/tmap.svg",
            alt: "티맵",
            style: { width: "20px", height: "20px" }
          }
        ),
        "티맵"
      )
    )
  );
}

LocationUnified.displayName = "LocationUnified";
export default LocationUnified;
