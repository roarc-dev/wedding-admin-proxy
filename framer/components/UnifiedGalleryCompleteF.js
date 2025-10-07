// UnifiedGalleryComplete.js — UnifiedGallery.tsx 기반의 jsx runtime JS 버전
// - JSX Runtime 사용 (reference.js 패턴 적용)
// - React 훅 직접 import
// - typography.js를 통해 폰트 로딩 보장

import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// === reference.js 패턴: React 훅 직접 import로 Proxy 패턴 불필요 ===

const createElement = (type, props, ...children) => {
  const normalizedProps = props || {};
  if (children.length === 0) {
    return jsx(type, normalizedProps);
  }
  const childValue = children.length === 1 ? children[0] : children;
  if (Array.isArray(childValue)) {
    return jsxs(type, { ...normalizedProps, children: childValue });
  }
  return jsx(type, { ...normalizedProps, children: childValue });
};

const React = { createElement, Fragment };

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

async function getImagesByPageId(pageId) {
  const res = await fetch(`${PROXY_BASE_URL}/api/images?action=getByPageId&pageId=${encodeURIComponent(pageId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json && json.success) return json.data || [];
  throw new Error(json && json.error ? json.error : "이미지 목록을 가져올 수 없습니다");
}

async function getPageGalleryType(pageId) {
  const res = await fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return "thumbnail";
  const json = await res.json();
  if (json && json.success && json.data) return json.data.gallery_type || "thumbnail";
  return "thumbnail";
}

function UnifiedGalleryComplete(props) {
  const { pageId = "default", style } = props || {};

  // reference.js 패턴: React 훅을 직접 import했으므로 바로 사용 가능
  // 더 이상 런타임 확인이나 Proxy 패턴 불필요

  // 폰트 로딩 보장
  useEffect(() => {
    try { typography && typeof typography.ensure === "function" && typography.ensure(); } catch (_) {}
  }, []);

  // P22 폰트 스택 (P22TextComplete.js와 동일 스타일 사용)
  const p22Stack = (typography && typography.helpers && typography.helpers.stacks && typography.helpers.stacks.p22)
    || `"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"`;

  const [galleryType, setGalleryType] = useState("thumbnail");
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 터치 이벤트를 위한 state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true); setError("");
        const [type, list] = await Promise.all([
          getPageGalleryType(pageId),
          getImagesByPageId(pageId),
        ]);
        if (!live) return;
        // 테스트를 위해 강제로 slide 타입 설정 (pageId가 "test"일 때)
        const finalType = pageId === "test" ? "slide" : type;
        setGalleryType(finalType);
        const mapped = (list || []).map((img, idx) => ({
          id: img.id || String(idx),
          src: img.public_url || img.path || img.url,
          alt: img.original_name || `Image ${idx + 1}`,
        })).filter(x => !!x.src);
        setImages(mapped);
        if (mapped.length === 0) setSelectedIndex(0);
        else if (selectedIndex >= mapped.length) setSelectedIndex(0);
      } catch (e) {
        if (!live) return;
        setError(e && e.message ? e.message : "갤러리 로딩 실패");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [pageId]);

  const hasImages = images && images.length > 0;

  // 상단 라벨(GALLERY) 스타일 (P22TextComplete.js의 기본값과 동일)
  const labelStyle = useMemo(() => ({
    width: "100%",
    height: "fit-content",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    boxSizing: "border-box",
    fontFamily: p22Stack,
    fontSize: "25px",
    letterSpacing: "0.05em",
    lineHeight: "0.7em",
    textAlign: "center",
    whiteSpace: "nowrap",
    color: "black",
    marginBottom: "50px",
  }), [p22Stack]);

  // 공통 컨테이너 스타일 (UnifiedGallery.tsx와 동일하게)
  const baseContainerStyle = useMemo(() => ({
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto", // 중앙 정렬
    backgroundColor: "transparent",
    padding: "0",
    boxSizing: "border-box",
    marginBottom: galleryType === "thumbnail" ? "60px" : "0",
  }), [galleryType]);

  const containerStyle = useMemo(() => ({
    ...baseContainerStyle,
    ...(style || {}),
    // 더 간단한 방법: 이미지가 없을 때 완전히 숨김
    display: hasImages ? (style && style.display ? style.display : "block") : "none",
  }), [style, hasImages, baseContainerStyle]);

  // GALLERY 라벨 스타일에 상단 여백 포함
  const labelStyleWithMargin = useMemo(() => ({
    ...labelStyle,
    marginTop: "80px", // GALLERY 글씨 위에 80px 여백 추가
  }), [labelStyle]);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      // 왼쪽으로 스와이프 (다음 이미지)
      goToNext();
    } else if (distance < -minSwipeDistance) {
      // 오른쪽으로 스와이프 (이전 이미지)
      goToPrevious();
    }
  };

  // 다음/이전 이미지로 이동
  const goToNext = () => {
    if (galleryType === "slide") {
      const nextIndex = selectedIndex < images.length - 1 ? selectedIndex + 1 : 0;
      setSelectedIndex(nextIndex);
      scrollToImage(nextIndex);
    } else {
      if (selectedIndex < images.length - 1) {
        handleThumbnailClick(selectedIndex + 1);
      }
    }
  };

  const goToPrevious = () => {
    if (galleryType === "slide") {
      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : images.length - 1;
      setSelectedIndex(prevIndex);
      scrollToImage(prevIndex);
    } else {
      if (selectedIndex > 0) {
        handleThumbnailClick(selectedIndex - 1);
      }
    }
  };

  // 특정 이미지로 스크롤 (슬라이드형용)
  const scrollToImage = (index) => {
    if (scrollContainerRef.current) {
      const scrollLeft = index * (344 + 10); // 이미지 너비 + 간격
      scrollContainerRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  };

  // 썸네일 클릭 핸들러 (썸네일형용)
  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
  };

  // 스크롤 이벤트로 현재 이미지 인덱스 업데이트 (슬라이드형용)
  const handleScroll = () => {
    if (scrollContainerRef.current && galleryType === "slide") {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const imageWidth = 344 + 10; // 이미지 너비 + 간격
      const newIndex = Math.round(scrollLeft / imageWidth);
      if (newIndex !== selectedIndex && newIndex < images.length) {
        setSelectedIndex(newIndex);
      }
    }
  };

  if (!hasImages && loading) {
    return jsx("div", {
      style: { ...baseContainerStyle, ...(style || {}) },
      children: jsx("div", { style: labelStyleWithMargin, children: "GALLERY" })
    });
  }

  if (!hasImages && !loading) {
    // 이미지가 없으면 완전히 숨김(display: none) 처리됨
    return jsx("div", { style: containerStyle });
  }


  // 갤러리 타입에 따른 렌더링
  if (galleryType === "slide") {
    // 슬라이드형 갤러리
    const slideMainArea = React.createElement("div", {
      style: {
        width: "100%",
        height: "529px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0)",
      }
    }, React.createElement("div", {
      ref: scrollContainerRef,
      style: {
        display: "flex",
        height: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        gap: "10px",
        scrollSnapType: "x mandatory",
      },
      onScroll: handleScroll,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }, images.map((image, index) => React.createElement("div", {
      key: image.id || String(index),
      style: {
        flexShrink: 0,
        width: "344px",
        height: "529px",
        borderRadius: "0px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        scrollSnapAlign: "start",
        position: "relative",
      }
    }, React.createElement("img", {
      src: image.src,
      alt: image.alt,
      style: {
        width: "100%",
        height: "100%",
        userSelect: "none",
        pointerEvents: "none",
        display: "block",
      },
      onError: (e) => { try { e.target.style.display = "none"; } catch (_) {} },
    })))),
    
    // 네비게이션 버튼
    React.createElement("div", {
      style: {
        position: "absolute",
        bottom: "12px",
        left: "12px",
        display: "flex",
        gap: "5px",
      }
    },
    // 이전 버튼
    React.createElement("button", {
      onClick: goToPrevious,
      style: {
        width: "28px",
        height: "28px",
        borderRadius: "14px",
        border: "none",
        backgroundColor: "rgba(0, 0, 0, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "opacity 0.2s ease",
        padding: "0",
      }
    }, React.createElement("div", {
      style: { width: "7px", height: "12px", color: "white" },
      dangerouslySetInnerHTML: { __html: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022" stroke="white" stroke-width="1.54982" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
    })),
    // 다음 버튼
    React.createElement("button", {
      onClick: goToNext,
      style: {
        width: "28px",
        height: "28px",
        borderRadius: "14px",
        border: "none",
        backgroundColor: "rgba(0, 0, 0, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "opacity 0.2s ease",
        padding: "0",
      }
    }, React.createElement("div", {
      style: { width: "7px", height: "12px", color: "white", transform: "scaleX(-1)" },
      dangerouslySetInnerHTML: { __html: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022" stroke="white" stroke-width="1.54982" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
    }))
    ));

    return React.createElement("div", { style: containerStyle },
      React.createElement("div", { style: labelStyleWithMargin }, "GALLERY"),
      React.createElement("div", { 
        style: { 
          ...slideMainArea.props.style,
          marginBottom: "80px" // 슬라이드형에 하단 여백 추가
        } 
      }, slideMainArea.props.children),
      // 스크롤바 숨김을 위한 스타일
      React.createElement("style", {
        dangerouslySetInnerHTML: {
          __html: `div::-webkit-scrollbar { display: none; }`
        }
      })
    );
  }

  // 썸네일형 갤러리 (기본값) - UnifiedGallery.tsx와 동일한 고정 높이
  const mainArea = React.createElement("div", {
    style: {
      width: "100%",
      height: "460px", // 고정 높이
      position: "relative",
      borderRadius: 0,
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }, React.createElement("img", {
    src: images[selectedIndex] && images[selectedIndex].src,
    alt: images[selectedIndex] && images[selectedIndex].alt,
    style: { 
      maxWidth: "100%", 
      maxHeight: "100%", 
      objectFit: "contain", // 이미지 비율 유지하면서 컨테이너에 맞춤
      userSelect: "none", 
      pointerEvents: "none", 
      display: "block" 
    },
    onError: (e) => { try { e.target.style.display = "none"; } catch (_) {} },
  }));

  // 썸네일 영역(가로 스크롤)
  const thumbs = React.createElement("div", {
    style: {
      marginTop: "30px",
      marginBottom: "20px",
      paddingLeft: 0,
      paddingRight: 0,
      position: "relative",
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: "6px",
      overflowX: "auto",
      scrollbarWidth: "none", // Firefox
      msOverflowStyle: "none", // IE
      paddingLeft: "16px",
      paddingBottom: "20px",
      paddingRight: "16px",
    }
  }, images.map((img, idx) => React.createElement("div", {
    key: img.id || String(idx),
    style: {
      flexShrink: 0,
      width: "60px",
      height: "60px",
      borderRadius: "8px",
      overflow: "hidden",
      cursor: "pointer",
      border: selectedIndex === idx ? "0px solid #6366f1" : "0px solid transparent",
      transition: "border-color 0.2s ease",
    },
    onClick: () => handleThumbnailClick(idx)
  }, React.createElement("img", {
    src: img.src,
    alt: img.alt,
    style: { width: "100%", height: "100%", objectFit: "cover", opacity: selectedIndex === idx ? 1 : 0.5, transition: "opacity 0.2s ease" },
    onError: (e) => { try { e.target.style.display = "none"; e.target.parentNode && (e.target.parentNode.innerHTML = '<div style=\"display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:10px;\">Error</div>'); } catch (_) {} },
  })))));

  return React.createElement("div", { style: containerStyle },
    React.createElement("div", { style: labelStyleWithMargin }, "GALLERY"),
    mainArea,
    thumbs,
    // 스크롤바 숨김을 위한 스타일
    React.createElement("style", {
      dangerouslySetInnerHTML: {
        __html: `.thumbnail-scroll::-webkit-scrollbar { display: none; }`
      }
    })
  );
}

UnifiedGalleryComplete.displayName = "UnifiedGalleryComplete";
export default UnifiedGalleryComplete;

