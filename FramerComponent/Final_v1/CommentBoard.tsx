import * as React from "react"
import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// 프록시 서버 URL
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

const ITEMS_PER_PAGE = 5

interface CommentBoardProps {
    pageId?: string
    fontFamily?: any
}

export default function CommentBoard({
    pageId = "default",
    fontFamily = "Pretendard Regular",
}: CommentBoardProps) {
    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (_) {}
    }, [])

    // Pretendard 폰트 스택
    const pretendardFontFamily = React.useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // 고정 색상 값
    const BG = "#ffffff"
    const TXT = "#000"
    const INPUT_BG = "#F5f5f5"
    const INPUT_TXT = "#000"
    const COMMENT_BG = "transparent"
    const [displayStyle, setDisplayStyle] = useState<"none" | "block">("none")
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [commentText, setCommentText] = useState("")
    const [comments, setComments] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [refresh, setRefresh] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [deletePassword, setDeletePassword] = useState("")
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteCommentId, setDeleteCommentId] = useState("")
    const [expandedComments, setExpandedComments] = useState<Set<string>>(
        new Set()
    )
    // 작성 모달
    const [showWriteModal, setShowWriteModal] = useState(false)

    useEffect(() => {
        fetchComments()
    }, [page, refresh])

    async function fetchComments() {
        try {
            const requestBody = {
                action: "getByPageId",
                pageId: pageId,
                page: page,
                itemsPerPage: ITEMS_PER_PAGE,
            }

            const bases = [
                typeof window !== "undefined" ? window.location.origin : "",
                PROXY_BASE_URL,
            ].filter(Boolean)

            let response: Response | null = null
            for (const base of bases) {
                try {
                    const tryResponse = await fetch(`${base}/api/comments`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                    })
                    response = tryResponse
                    if (tryResponse.ok) break
                } catch (fetchError) {
                    console.log(`Failed to fetch from ${base}:`, fetchError)
                }
            }

            if (!response) throw new Error("모든 서버 연결에 실패했습니다")
            if (!response.ok) {
                const errorText = await response.text()
                console.error("Error response:", errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()

            if (result.success) {
                setComments(result.data || [])
                setTotalPages(Math.ceil((result.count || 0) / ITEMS_PER_PAGE))
                setErrorMessage("")
            } else {
                throw new Error(result.error || "데이터를 가져올 수 없습니다")
            }
        } catch (error: any) {
            console.error("댓글 로드 에러:", error)
            setErrorMessage(`댓글 로드 실패: ${error.message}`)
        }
    }

    async function handleSubmit() {
        setErrorMessage("")
        if (!name || !password || !commentText) {
            setErrorMessage("모든 항목을 입력해주세요.")
            return
        }
        if (!/^\d{4}$/.test(password)) {
            setErrorMessage("비밀번호는 4자리 숫자여야 합니다.")
            return
        }

        try {
            const requestBody = {
                action: "insert",
                name: name,
                password: password,
                comment: commentText,
                page_id: pageId,
            }

            const bases = [
                typeof window !== "undefined" ? window.location.origin : "",
                PROXY_BASE_URL,
            ].filter(Boolean)

            let response: Response | null = null
            for (const base of bases) {
                try {
                    const tryResponse = await fetch(`${base}/api/comments`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                    })
                    response = tryResponse
                    if (tryResponse.ok) break
                } catch (fetchError) {
                    console.log(`Failed to submit to ${base}:`, fetchError)
                }
            }

            if (!response) throw new Error("모든 서버 연결에 실패했습니다")
            if (!response.ok) {
                const errorText = await response.text()
                console.error("Error response:", errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()

            if (result.success) {
                setName("")
                setPassword("")
                setCommentText("")
                setPage(1)
                setRefresh((prev) => !prev)
                setShowWriteModal(false) // 등록 후 작성 팝업 닫기
            } else {
                throw new Error(result.error || "등록 중 오류가 발생했습니다.")
            }
        } catch (error: any) {
            console.error("댓글 등록 에러:", error)
            setErrorMessage(`등록 중 오류가 발생했습니다: ${error.message}`)
        }
    }

    async function handleDelete(id: string) {
        setDeleteCommentId(id)
        setShowDeleteModal(true)
        setDeletePassword("")
    }

    async function confirmDelete() {
        if (!deletePassword || !/^\d{4}$/.test(deletePassword)) {
            setErrorMessage("4자리 비밀번호를 입력하세요.")
            return
        }

        try {
            const requestBody = {
                action: "delete",
                id: deleteCommentId,
                password: deletePassword,
                page_id: pageId,
            }

            const bases = [
                typeof window !== "undefined" ? window.location.origin : "",
                PROXY_BASE_URL,
            ].filter(Boolean)

            let response: Response | null = null
            for (const base of bases) {
                try {
                    const tryResponse = await fetch(`${base}/api/comments`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                    })
                    response = tryResponse
                    if (tryResponse.ok) break
                } catch (fetchError) {
                    console.log(`Failed to delete from ${base}:`, fetchError)
                }
            }

            if (!response)
                throw new Error("서버 연결에 실패했습니다. 다시 시도해주세요.")
            if (!response.ok) {
                const errorText = await response.text()
                console.error("Error response:", errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()

            if (result.success) {
                setShowDeleteModal(false)
                setDeletePassword("")
                setDeleteCommentId("")
                setErrorMessage("")
                setRefresh((prev) => !prev)
            } else {
                throw new Error(
                    result.error ||
                        "삭제 중 오류가 발생했습니다. 다시 시도해주세요."
                )
            }
        } catch (error: any) {
            console.error("댓글 삭제 에러:", error)
            setErrorMessage(`삭제 중 오류가 발생했습니다: ${error.message}`)
        }
    }

    function cancelDelete() {
        setShowDeleteModal(false)
        setDeletePassword("")
        setDeleteCommentId("")
        setErrorMessage("")
    }

    function toggleComment(commentId: string) {
        setExpandedComments((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(commentId)) newSet.delete(commentId)
            else newSet.add(commentId)
            return newSet
        })
    }

    // 서버에서 page_settings.comments 값을 조회해 표시 상태를 동기화
    useEffect(() => {
        let cancelled = false
        async function fetchCommentsToggle() {
            try {
                if (!pageId) return
                const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) return
                const json = await res.json()
                const serverComments = (json && json.data && json.data.comments) || json?.comments
                if (!cancelled && (serverComments === "on" || serverComments === "off")) {
                    setDisplayStyle(serverComments === "on" ? "block" : "none")
                }
            } catch (_) {}
        }
        fetchCommentsToggle()
        return () => {
            cancelled = true
        }
    }, [pageId])

    if (displayStyle === "none") {
        return <div style={{ display: "none" }} />
    }

    return (
        <div
            style={{
                width: "100%",
                height: "auto",
                backgroundColor: BG,
                padding: 0,
                WebkitTextSizeAdjust: "100%",
                textSizeAdjust: "100%",
            }}
        >
            {/* 아웃터 래퍼: 상하 80px, fill #fff, overflow hidden */}
            <div
                style={{
                    width: "100%",
                    paddingTop: 80,
                    paddingBottom: 80,
                    backgroundColor: BG,
                    overflow: "hidden",
                }}
            >
                {/* 헤더 영역 (제목 + 서브텍스트) */}
                <div
                    style={{
                        width: "100%",
                        paddingBottom: "30px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* 제목 */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ type: "spring", stiffness: 100, damping: 60, mass: 1, delay: 0 }}
                        style={{
                            width: "100%",
                            height: 20,
                            textAlign: "center",
                            fontFamily: pretendardFontFamily,
                            fontWeight: 600,
                            fontSize: 22,
                            lineHeight: "0.7em",
                            color: "#000",
                        }}
                    >
                        축하 전하기
                    </motion.div>
                    {/* 서브텍스트 */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ type: "spring", stiffness: 100, damping: 60, mass: 1, delay: 0 }}
                        style={{
                            marginTop: 20,
                            width: "fit-content",
                            height: "fit-content",
                            textAlign: "center",
                            fontFamily: pretendardFontFamily,
                            fontWeight: 400,
                            fontSize: 15,
                            lineHeight: "1.8em",
                            color: "#8c8c8c",
                        }}
                    >
                        신랑 신부에게 축하의 한 마디를 남겨주세요
                    </motion.div>
                </div>

                {/* 인너 래퍼: 기존 컴포넌트 컨테이너 (80% 폭, 가운데) */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ type: "spring", stiffness: 100, damping: 60, mass: 1, delay: 0 }}
                    style={{
                        width: "80%",
                        height: "fit-content",
                        margin: "0 auto",
                    }}
                >
            {/* 댓글 남기기 버튼 */}
            <div style={{ marginBottom: 16 }}>
                <button
                    onClick={() => {
                        setShowWriteModal(true)
                        setErrorMessage("")
                    }}
                    style={{
                        width: "100%",
                        height: 54,
                        backgroundColor: "#ECECEC",
                        color: TXT,
                        fontSize: 14, // iOS 확대 방지
                        fontFamily: pretendardFontFamily,
                        fontWeight: 600,
                        border: "none",
                        borderRadius: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 19 19"
                        fill="none"
                        style={{
                            display: "block",
                        }}
                    >
                        <path
                            d="M0 19V14.75L14.625 0.174988L18.8 4.44999L4.25 19H0Z"
                            fill="black"
                        />
                    </svg>
                    축하의 한마디
                </button>
            </div>

            {/* 댓글 리스트 */}
            {comments.map((c, index) => {
                const d = new Date(c.created_at)
                const mm = String(d.getMonth() + 1).padStart(2, "0")
                const dd = String(d.getDate()).padStart(2, "0")
                const formattedDate = `${mm}/${dd}`
                const isExpanded = expandedComments.has(c.id)
                const isLongComment = c.comment.length > 100

                return (
                    <div
                        key={c.id}
                        style={{
                            paddingTop: 16,
                            paddingRight: 0,
                            paddingBottom: 16,
                            paddingLeft: 0,
                            marginBottom: index === comments.length - 1 ? 0 : 0,
                            backgroundColor: COMMENT_BG,
                            borderRadius: 0,
                            border: "none",
                            borderBottom:
                                index === comments.length - 1
                                    ? "none"
                                    : "0.5px solid #ECECEC",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 14,
                                        color: "#757575",
                                        fontFamily: pretendardFontFamily,
                                        fontWeight: 600,
                                    }}
                                >
                                    {c.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#aeaeae",
                                        opacity: 0.6,
                                        fontFamily: pretendardFontFamily,
                                        fontWeight: 400,
                                    }}
                                >
                                    {formattedDate}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(c.id)}
                                style={{
                                    paddingTop: 6,
                                    paddingRight: 4,
                                    paddingBottom: 6,
                                    paddingLeft: 6,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                title="삭제"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="8"
                                    height="8"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path
                                        d="M7.71094 7L13.1016 12.3984L12.3984 13.1016L7 7.71094L1.60156 13.1016L0.898438 12.3984L6.28906 7L0.898438 1.60156L1.60156 0.898438L7 6.28906L12.3984 0.898438L13.1016 1.60156L7.71094 7Z"
                                        fill="#c7c7c7"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div
                            style={{
                                fontSize: 14,
                                color: TXT,
                                fontFamily: pretendardFontFamily,
                                fontWeight: 400,
                                lineHeight: "1.5",
                                maxHeight: isExpanded ? "200px" : "80px",
                                overflowY: isExpanded ? "auto" : "hidden",
                                wordBreak: "break-word",
                                transition: "max-height 0.3s ease",
                                paddingBottom:
                                    !isExpanded && isLongComment ? "0" : "0",
                                position: "relative",
                            }}
                        >
                            {c.comment}
                            {!isExpanded && isLongComment && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: "40px",
                                        background:
                                            "linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.8) 50%, white 100%)",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>

                        {!isExpanded && isLongComment && (
                            <div
                                style={{
                                    textAlign: "right",
                                }}
                            >
                                <button
                                    onClick={() => toggleComment(c.id)}
                                    style={{
                                        fontSize: 12,
                                        color: TXT,
                                        opacity: 0.7,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: pretendardFontFamily,
                                        fontWeight: 400,
                                        textDecoration: "underline",
                                        padding: "4px 4px",
                                    }}
                                >
                                    더보기
                                </button>
                            </div>
                        )}

                        {isExpanded && isLongComment && (
                            <div
                                style={{
                                    textAlign: "right",
                                }}
                            >
                                <button
                                    onClick={() => toggleComment(c.id)}
                                    style={{
                                        fontSize: 12,
                                        color: TXT,
                                        opacity: 0.7,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: pretendardFontFamily,
                                        fontWeight: 400,
                                        textDecoration: "underline",
                                        marginTop: 8,
                                    }}
                                >
                                    접기
                                </button>
                            </div>
                        )}
                    </div>
                )
            })}

            {comments.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: 40,
                        color: TXT,
                        opacity: 0.6,
                        fontSize: 14,
                        fontFamily: pretendardFontFamily,
                        fontWeight: 400,
                    }}
                >
                    신랑 신부에게 축하의 한 마디를 남겨보세요.
                </div>
            )}

            {totalPages > 1 && (
                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        justifyContent: "center",
                        gap: 4,
                    }}
                >
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            style={{
                                padding: "10px 8px",
                                border: "none",
                                backgroundColor: "transparent",
                                color: page === i + 1 ? "black" : "#aeaeae",
                                borderRadius: 0,
                                cursor: "pointer",
                                fontSize: 14,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* 작성 모달 */}
            {showWriteModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => {
                        // 배경 클릭 시 닫기 (모달 내부 클릭은 버블링 방지)
                        setShowWriteModal(false)
                        setErrorMessage("")
                    }}
                >
                    <div
                        style={{
                            backgroundColor: BG,
                            padding: 24,
                            borderRadius: 0,
                            width: "min(560px, 92vw)",
                            border: "none",
                            WebkitTextSizeAdjust: "100%",
                            textSizeAdjust: "100%",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                marginBottom: 8,
                                width: "100%",
                            }}
                        >
                            <input
                                placeholder="이름"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: "calc(50% - 4px)",
                                    padding: 12,
                                    backgroundColor: INPUT_BG,
                                    color: INPUT_TXT,
                                    border: "none",
                                    borderRadius: 0,
                                    fontSize: 16, // iOS 확대 방지
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 400,
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                autoFocus
                                enterKeyHint="next"
                            />
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="\d{4}"
                                maxLength={4}
                                placeholder="4자리 숫자 비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: "calc(50% - 4px)",
                                    padding: 12,
                                    backgroundColor: INPUT_BG,
                                    color: INPUT_TXT,
                                    border: "none",
                                    borderRadius: 0,
                                    fontSize: 16, // iOS 확대 방지
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 400,
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                enterKeyHint="next"
                            />
                        </div>

                        <textarea
                            placeholder="축하의 한 마디"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            style={{
                                width: "100%",
                                marginBottom: 8,
                                padding: 12,
                                backgroundColor: INPUT_BG,
                                color: INPUT_TXT,
                                border: "none",
                                borderRadius: 0,
                                fontSize: 16, // iOS 확대 방지
                                fontFamily: pretendardFontFamily,
                                fontWeight: 400,
                                outline: "none",
                                resize: "vertical",
                                minHeight: 100,
                                boxSizing: "border-box",
                                lineHeight: 1.4,
                            }}
                            enterKeyHint="done"
                        />

                        {errorMessage && (
                            <div
                                style={{
                                    padding: 12,
                                    marginBottom: 10,
                                    backgroundColor: "#fee",
                                    color: "#c33",
                                    border: "none",
                                    borderRadius: 0,
                                    fontSize: 12,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 400,
                                }}
                            >
                                {errorMessage}
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                justifyContent: "flex-end",
                                marginTop: 8,
                            }}
                        >
                            <button
                                onClick={() => {
                                    setShowWriteModal(false)
                                    setErrorMessage("")
                                }}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: BG,
                                    color: TXT,
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                    opacity: 0.7,
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#727272",
                                    color: BG,
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    fontSize: 14, // iOS 확대 방지
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                }}
                            >
                                등록
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 모달 */}
            {showDeleteModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: BG,
                            padding: 32,
                            borderRadius: 0,
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                            minWidth: 320,
                            border: "none",
                        }}
                    >
                        <h4
                            style={{
                                margin: "0 0 16px 0",
                                fontSize: 16,
                                fontFamily: pretendardFontFamily,
                                fontWeight: 600,
                                color: TXT,
                            }}
                        >
                            댓글 삭제
                        </h4>
                        <p
                            style={{
                                margin: "0 0 16px 0",
                                fontSize: 14,
                                fontFamily: pretendardFontFamily,
                                fontWeight: 400,
                                color: TXT,
                                opacity: 0.8,
                            }}
                        >
                            삭제하려면 댓글의 4자리 비밀번호를 입력하세요.
                        </p>
                        <input
                            type="password"
                            placeholder="4자리 비밀번호"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 12,
                                marginBottom: 20,
                                border: "none",
                                borderRadius: 0,
                                fontSize: 16, // iOS 확대 방지
                                fontFamily: pretendardFontFamily,
                                fontWeight: 400,
                                backgroundColor: INPUT_BG,
                                color: INPUT_TXT,
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            inputMode="numeric"
                            pattern="\d{4}"
                            maxLength={4}
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: BG,
                                    color: TXT,
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                    opacity: 0.7,
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#ff4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
                </motion.div>
            </div>
        </div>
    )
}

addPropertyControls(CommentBoard, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        description: "각 페이지를 구분하는 고유 키입니다.",
        defaultValue: "default",
        placeholder: "예: home, about, contact",
    },
})
