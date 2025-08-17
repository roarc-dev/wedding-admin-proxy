import * as React from "react"
import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

const ITEMS_PER_PAGE = 5

interface CommentBoardProps {
    pageId?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: any
    inputBackgroundColor?: string
    inputTextColor?: string
    commentBackgroundColor?: string
}

export default function CommentBoard({
    pageId = "default",
    backgroundColor = "#ffffff",
    textColor = "#000000",
    fontFamily = "Pretendard Regular",
    inputBackgroundColor = "#f5f5f5",
    inputTextColor = "#000000",
    commentBackgroundColor = "#ffffff",
}: CommentBoardProps) {
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

    useEffect(() => {
        fetchComments()
    }, [page, refresh])

    async function fetchComments() {
        try {
            const url = `${PROXY_BASE_URL}/api/comments`

            const requestBody = {
                action: "getByPageId",
                pageId: pageId,
                page: page,
                itemsPerPage: ITEMS_PER_PAGE,
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Error response:", errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()

            if (result.success) {
                setComments(result.data || [])
                setTotalPages(Math.ceil((result.count || 0) / ITEMS_PER_PAGE))
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
            const url = `${PROXY_BASE_URL}/api/comments`

            const requestBody = {
                action: "insert",
                name: name,
                password: password,
                comment: commentText,
                page_id: pageId,
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

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
            setErrorMessage("4자리 숫자 비밀번호를 입력하세요.")
            return
        }

        try {
            const url = `${PROXY_BASE_URL}/api/comments`

            const requestBody = {
                action: "delete",
                id: deleteCommentId,
                password: deletePassword,
                page_id: pageId,
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

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
                throw new Error(result.error || "삭제 중 오류가 발생했습니다.")
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
            if (newSet.has(commentId)) {
                newSet.delete(commentId)
            } else {
                newSet.add(commentId)
            }
            return newSet
        })
    }

    return (
        <div
            style={{
                width: "100%",
                height: "auto",
                backgroundColor: backgroundColor,
                padding: 20,
            }}
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
                        backgroundColor: inputBackgroundColor,
                        color: inputTextColor,
                        border: "none",
                        borderRadius: 0,
                        fontSize: 16,
                        fontFamily: "Pretendard Regular",
                        outline: "none",
                        boxSizing: "border-box",
                    }}
                />
                <input
                    type="password"
                    placeholder="4자리 숫자 비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: "calc(50% - 4px)",
                        padding: 12,
                        backgroundColor: inputBackgroundColor,
                        color: inputTextColor,
                        border: "none",
                        borderRadius: 0,
                        fontSize: 16,
                        fontFamily: fontFamily,
                        outline: "none",
                        boxSizing: "border-box",
                    }}
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
                    backgroundColor: inputBackgroundColor,
                    color: inputTextColor,
                    border: "none",
                    borderRadius: 0,
                    fontSize: 16,
                    fontFamily: fontFamily,
                    outline: "none",
                    resize: "vertical",
                    minHeight: 80,
                    boxSizing: "border-box",
                }}
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
                        fontFamily: fontFamily,
                    }}
                >
                    {errorMessage}
                </div>
            )}

            <button
                onClick={handleSubmit}
                style={{
                    width: "100%",
                    height: 44,
                    backgroundColor: "#727272",
                    color: backgroundColor,
                    fontSize: 16,
                    fontFamily: fontFamily,
                    border: "none",
                    borderRadius: 0,
                    cursor: "pointer",
                    marginBottom: 24,
                    fontWeight: "500",
                }}
            >
                등록
            </button>

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
                            padding: 16,
                            marginBottom: index === comments.length - 1 ? 0 : 0,
                            backgroundColor: commentBackgroundColor,
                            borderRadius: 0,
                            border: "none",
                            borderBottom:
                                index === comments.length - 1
                                    ? "none"
                                    : "1px solid #c2c2c2",
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
                                        fontWeight: "600",
                                        fontSize: 14,
                                        color: textColor,
                                        fontFamily: fontFamily,
                                    }}
                                >
                                    {c.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: textColor,
                                        opacity: 0.6,
                                        fontFamily: fontFamily,
                                    }}
                                >
                                    {formattedDate}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(c.id)}
                                style={{
                                    padding: "6px 12px",
                                    fontSize: 12,
                                    backgroundColor: "#c2c2c2",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    fontFamily: fontFamily,
                                    fontWeight: "500",
                                }}
                            >
                                삭제
                            </button>
                        </div>

                        <div
                            style={{
                                fontSize: 14,
                                color: textColor,
                                fontFamily: fontFamily,
                                lineHeight: "1.5",
                                maxHeight: isExpanded ? "200px" : "80px",
                                overflowY: isExpanded ? "auto" : "hidden",
                                position: "relative",
                                wordBreak: "break-word",
                                transition: "max-height 0.3s ease",
                            }}
                        >
                            {c.comment}
                            {!isExpanded && isLongComment && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        background: `linear-gradient(to right, transparent, ${commentBackgroundColor} 50%)`,
                                        paddingLeft: 20,
                                    }}
                                >
                                    <button
                                        onClick={() => toggleComment(c.id)}
                                        style={{
                                            fontSize: 12,
                                            color: textColor,
                                            opacity: 0.7,
                                            backgroundColor: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily: fontFamily,
                                            textDecoration: "underline",
                                        }}
                                    >
                                        더보기
                                    </button>
                                </div>
                            )}
                        </div>

                        {isExpanded && isLongComment && (
                            <button
                                onClick={() => toggleComment(c.id)}
                                style={{
                                    fontSize: 12,
                                    color: textColor,
                                    opacity: 0.7,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontFamily: fontFamily,
                                    textDecoration: "underline",
                                    marginTop: 8,
                                }}
                            >
                                접기
                            </button>
                        )}
                    </div>
                )
            })}

            {comments.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: 40,
                        color: textColor,
                        opacity: 0.6,
                        fontSize: 14,
                        fontFamily: fontFamily,
                    }}
                >
                    등록된 댓글이 없습니다.
                </div>
            )}

            {totalPages > 1 && (
                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            style={{
                                padding: "10px 16px",
                                border: "none",
                                backgroundColor:
                                    page === i + 1
                                        ? textColor
                                        : backgroundColor,
                                color:
                                    page === i + 1
                                        ? backgroundColor
                                        : textColor,
                                borderRadius: 0,
                                cursor: "pointer",
                                fontSize: 14,
                                fontFamily: fontFamily,
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
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
                            backgroundColor: backgroundColor,
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
                                fontSize: 18,
                                fontFamily: fontFamily,
                                color: textColor,
                                fontWeight: "600",
                            }}
                        >
                            댓글 삭제
                        </h4>
                        <p
                            style={{
                                margin: "0 0 16px 0",
                                fontSize: 14,
                                fontFamily: fontFamily,
                                color: textColor,
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
                                fontSize: 14,
                                fontFamily: fontFamily,
                                backgroundColor: inputBackgroundColor,
                                color: inputTextColor,
                                outline: "none",
                                boxSizing: "border-box",
                            }}
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
                                    backgroundColor: backgroundColor,
                                    color: textColor,
                                    border: "none",
                                    borderRadius: 0,
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontFamily: fontFamily,
                                    fontWeight: "500",
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
                                    fontFamily: fontFamily,
                                    fontWeight: "500",
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    backgroundColor: {
        type: ControlType.Color,
        title: "배경색",
        description: "컴포넌트의 배경색을 설정합니다.",
        defaultValue: "#ffffff",
    },
    textColor: {
        type: ControlType.Color,
        title: "텍스트 색상",
        description: "텍스트 색상을 설정합니다.",
        defaultValue: "#000000",
    },
    inputBackgroundColor: {
        type: ControlType.Color,
        title: "입력창 배경색",
        description: "입력창의 배경색을 설정합니다.",
        defaultValue: "#f5f5f5",
    },
    inputTextColor: {
        type: ControlType.Color,
        title: "입력창 텍스트 색상",
        description: "입력창의 텍스트 색상을 설정합니다.",
        defaultValue: "#000000",
    },
    commentBackgroundColor: {
        type: ControlType.Color,
        title: "댓글 배경색",
        description: "댓글 영역의 배경색을 설정합니다.",
        defaultValue: "#ffffff",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "폰트",
        description: "사용할 폰트를 선택합니다.",
        defaultValue: "Pretendard Regular" as any,
    },
})
