import { Override } from "framer"

// URL에서 page_id 추출: ?page_id=... 또는 경로 마지막 세그먼트
function getPageIdFromUrl(): string | null {
    if (typeof window === "undefined") return null

    try {
        // 1) 쿼리 (?page_id=... | ?pageId=...)
        const qs = new URLSearchParams(window.location.search)
        const qp = qs.get("page_id") || qs.get("pageId")
        if (qp && qp.trim()) return qp.trim()

        // 2) 경로 (/invite/abcd1234, /p/abcd1234 등)
        const parts = window.location.pathname.split("/").filter(Boolean)
        if (parts.length > 0) {
            const lastPart = parts[parts.length - 1]
            // UUID나 영문자+숫자 조합인지 확인 (page_id 형식)
            if (/^[a-zA-Z0-9_-]+$/.test(lastPart) && lastPart.length > 3) {
                return lastPart
            }
        }

        return null
    } catch (error) {
        console.warn("PageID extraction error:", error)
        return null
    }
}

// 에디터/프리뷰에서 테스트용 기본값
const FALLBACK_PAGE_ID = "default"

// Framer Code Override는 함수가 아닌 객체를 반환해야 함
export const SetPageIdFromUrl: Override = () => {
    const pageId = getPageIdFromUrl() || FALLBACK_PAGE_ID
    
    console.log("PageID extracted:", pageId)

    // 모든 하위 컴포넌트에 pageId 전달
    return {
        pageId: pageId
    }
}
