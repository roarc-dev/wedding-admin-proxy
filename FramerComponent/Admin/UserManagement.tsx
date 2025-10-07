import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL) - AccountBtn.tsx 패턴과 동일
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 토큰 관리
function getAuthToken() {
    return localStorage.getItem("admin_session")
}

function setAuthToken(token: string) {
    localStorage.setItem("admin_session", token)
}

function removeAuthToken() {
    localStorage.removeItem("admin_session")
}

// 토큰 검증
interface AdminTokenPayload {
    username: string
    expires: number
    name?: string
}

function validateSessionToken(token: string): AdminTokenPayload | null {
    try {
        const data = JSON.parse(atob(token)) as AdminTokenPayload
        return Date.now() < data.expires ? data : null
    } catch {
        return null
    }
}

// 페이지 타입 목록 (확장 가능)
const PAGE_TYPES = ["papillon", "eternal", "fiore"] as const
type PageType = (typeof PAGE_TYPES)[number]

// 페이지 설정 타입 업데이트 함수
async function updatePageType(pageId: string, type: PageType) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/page-settings`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ settings: { type } }),
        })
        return await response.json()
    } catch (e) {
        return { success: false, error: "네트워크 오류" }
    }
}

// 인증 함수
interface AuthSuccessResult {
    success: true
    user: { username: string; name?: string }
}

interface AuthErrorResult {
    success: false
    error: string
}

type AuthResult = AuthSuccessResult | AuthErrorResult

async function authenticateAdmin(
    username: string,
    password: string
): Promise<AuthResult> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "login",
                username,
                password,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        if (result.success) {
            setAuthToken(result.token)
            return {
                success: true,
                user: result.user,
            }
        } else {
            return {
                success: false,
                error: result.error,
            }
        }
    } catch (error) {
        console.error("Login error:", error)
        return {
            success: false,
            error: `네트워크 오류: ${
                error instanceof Error ? error.message : String(error)
            }`,
        }
    }
}

// 사용자 관리 API 함수들 - auth.js를 사용하도록 수정
async function getAllUsers(): Promise<User[]> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result.success ? (result.data as User[]) : []
    } catch (error) {
        console.error("Get users error:", error)
        return []
    }
}

interface CreateUserData {
    username: string
    password: string
    name: string
    page_id?: string
    role?: string
}

async function createUser(userData: CreateUserData): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                action: "createUser",
                username: userData.username,
                password: userData.password,
                name: userData.name,
                page_id: userData.page_id,
                role: userData.role,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error("Create user error:", error)
        return {
            success: false,
            error: "사용자 생성 중 오류가 발생했습니다",
        }
    }
}

interface UpdateUserData {
    id: string
    username: string
    name: string
    is_active: boolean
    page_id?: string
    newPassword?: string
    expiry_date?: string | null
    role?: string
}

async function updateUser(userData: UpdateUserData): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(userData),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error("Update user error:", error)
        return {
            success: false,
            error: "사용자 수정 중 오류가 발생했습니다",
        }
    }
}

async function deleteUser(
    userId: string,
    deleteAllData: boolean = false
): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ id: userId, deleteAllData }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error("Delete user error:", error)
        return {
            success: false,
            error: "사용자 삭제 중 오류가 발생했습니다",
        }
    }
}

// 사용자 승인/거부 함수
async function approveUser(
    userId: string,
    status: "approved" | "rejected",
    pageId?: string | null
): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                action: "approveUser",
                userId,
                status,
                pageId,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error("Approve user error:", error)
        return {
            success: false,
            error: "사용자 승인 중 오류가 발생했습니다",
        }
    }
}

// page_settings 업데이트 함수 (승인 시 웨딩 정보 복사)
async function updatePageSettingsWithWeddingInfo(
    pageId: string,
    weddingDate?: string,
    groomNameEn?: string,
    brideNameEn?: string
): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/page-settings?approval=true&pageId=${pageId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                settings: {
                    wedding_date: weddingDate,
                    groom_name_en: groomNameEn,
                    bride_name_en: brideNameEn,
                },
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error("Update page settings error:", error)
        return {
            success: false,
            error: "페이지 설정 업데이트 중 오류가 발생했습니다",
        }
    }
}

interface User {
    id: string
    username: string
    name: string
    is_active: boolean
    created_at: string
    last_login?: string
    approval_status: "pending" | "approved" | "rejected"
    page_id?: string
    expiry_date?: string | null
    wedding_date?: string | null
    groom_name_en?: string | null
    bride_name_en?: string | null
    role?: string
}

export default function UserManagement(props: { style?: React.CSSProperties }) {
    const { style } = props

    // 공통 상태
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [currentUser, setCurrentUser] = useState<{
        username: string
        name?: string
    } | null>(null)
    const [loginForm, setLoginForm] = useState<{
        username: string
        password: string
    }>({ username: "", password: "" })
    const [loginError, setLoginError] = useState<string>("")
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

    // 사용자 관리 상태
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState<boolean>(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false)
    const [approvingUser, setApprovingUser] = useState<User | null>(null)
    const [pageIdInput, setPageIdInput] = useState<string>("")

    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        name: "",
        is_active: true,
        newPassword: "",
        page_id: "",
        type: "papillon" as PageType,
        expiry_date: "",
        role: "user",
    })

    // 탭 상태
    const [activeTab, setActiveTab] = useState<
        "all" | "pending" | "active" | "expired"
    >("all")

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState<number>(1)
    const itemsPerPage = 10

    // 세션 확인
    useEffect(() => {
        const token = getAuthToken()
        if (token) {
            const tokenData = validateSessionToken(token)
            if (tokenData) {
                setIsAuthenticated(true)
                setCurrentUser({ username: tokenData.username })
                loadUsers()
            } else {
                removeAuthToken()
            }
        }
    }, [])

    // 탭 변경 시 페이지 초기화
    useEffect(() => {
        setCurrentPage(1)
    }, [activeTab])

    // 로그인
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoggingIn(true)
        setLoginError("")

        const result = await authenticateAdmin(
            loginForm.username,
            loginForm.password
        )
        if (result.success) {
            setIsAuthenticated(true)
            setCurrentUser(result.user)
            setLoginForm({ username: "", password: "" })
            loadUsers()
        } else {
            setLoginError(result.error)
        }
        setIsLoggingIn(false)
    }

    // 로그아웃
    const handleLogout = () => {
        removeAuthToken()
        setIsAuthenticated(false)
        setCurrentUser(null)
        setUsers([])
    }

    // 사용자 목록 로드
    const loadUsers = async () => {
        setLoading(true)
        try {
            const usersData = await getAllUsers()
            setUsers(usersData)
        } catch (err) {
            setError("사용자 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 새 사용자 추가
    const handleAddUser = () => {
        setUserForm({
            username: "",
            password: "",
            name: "",
            is_active: true,
            newPassword: "",
            page_id: "",
            type: "papillon",
            expiry_date: "",
            role: "user",
        })
        setEditingUser(null)
        setShowAddModal(true)
    }

    // 사용자 편집
    const handleEditUser = (user: User) => {
        setUserForm({
            username: user.username,
            password: "",
            name: user.name,
            is_active: user.is_active,
            newPassword: "",
            page_id: user.page_id || "",
            type: "papillon",
            expiry_date: user.expiry_date || "",
            role: user.role || "user",
        })
        setEditingUser(user)
        setShowAddModal(true)
    }

    // 사용자 승인 모달 열기
    const handleShowApprovalModal = (user: User) => {
        setApprovingUser(user)
        setPageIdInput("")
        setShowApprovalModal(true)
    }

    // 사용자 승인
    const handleApproveUser = async (status: "approved" | "rejected") => {
        if (!approvingUser) return

        setLoading(true)
        try {
            const result = await approveUser(
                approvingUser.id,
                status,
                status === "approved" ? pageIdInput : null
            )

            if (result.success) {
                // 승인 시 page_settings에 웨딩 정보 복사
                if (status === "approved" && pageIdInput && approvingUser) {
                    const pageSettingsResult = await updatePageSettingsWithWeddingInfo(
                        pageIdInput,
                        approvingUser.wedding_date || undefined,
                        approvingUser.groom_name_en || undefined,
                        approvingUser.bride_name_en || undefined
                    )

                    if (!pageSettingsResult.success) {
                        console.warn("Page settings update failed:", pageSettingsResult.error)
                        // 페이지 설정 업데이트 실패해도 승인은 성공으로 처리
                    }
                }

                setSuccess(result.message)
                setShowApprovalModal(false)
                setApprovingUser(null)
                setPageIdInput("")
                loadUsers()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError("승인 처리 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 사용자 저장
    const handleSaveUser = async () => {
        setLoading(true)
        try {
            let result
            if (editingUser) {
                // 수정
                const updateData: UpdateUserData = {
                    id: editingUser.id,
                    username: userForm.username,
                    name: userForm.name,
                    is_active: userForm.is_active,
                    page_id: userForm.page_id,
                    expiry_date: userForm.expiry_date || null,
                    role: userForm.role,
                }
                if (userForm.newPassword) {
                    updateData.newPassword = userForm.newPassword
                }
                result = await updateUser(updateData)
            } else {
                // 새 사용자 추가
                if (
                    !userForm.username ||
                    !userForm.password ||
                    !userForm.name
                ) {
                    setError("모든 필드를 입력하세요.")
                    setLoading(false)
                    return
                }
                result = await createUser({
                    username: userForm.username,
                    password: userForm.password,
                    name: userForm.name,
                    page_id: userForm.page_id,
                    role: userForm.role,
                })
            }

            // page_settings.type 저장 (Page ID가 있고 타입이 선택된 경우)
            if (userForm.page_id) {
                await updatePageType(userForm.page_id, userForm.type)
            }

            if (result.success) {
                setSuccess(result.message || "작업이 완료되었습니다.")
                setShowAddModal(false)
                loadUsers()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError("작업 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 사용자 삭제
    const handleDeleteUser = async (user: User) => {
        const deleteAllData = confirm(
            `'${user.name}' 사용자를 삭제하시겠습니까?\n\n` +
                `⚠️ 확인을 누르면 모든 데이터가 삭제됩니다:\n` +
                `- 사용자 계정\n` +
                `- Page ID: ${user.page_id || "없음"}\n` +
                `- 페이지 설정, 연락처, 이미지, 댓글, RSVP 등 모든 데이터\n\n` +
                `취소를 누르면 계정만 삭제됩니다.`
        )

        if (
            !confirm(
                deleteAllData
                    ? "⚠️ 경고: 모든 데이터를 영구적으로 삭제합니다. 계속하시겠습니까?"
                    : `'${user.name}' 사용자 계정만 삭제하시겠습니까?`
            )
        )
            return

        setLoading(true)
        try {
            const result = await deleteUser(user.id, deleteAllData)

            if (result.success) {
                setSuccess(result.message || "사용자가 성공적으로 삭제되었습니다.")
                loadUsers()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError("삭제 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 알림 메시지 자동 제거
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null)
                setSuccess(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    // 승인 상태별 사용자 분류
    const pendingUsers = users.filter(
        (user: User) => user.approval_status === "pending"
    )
    const approvedUsers = users.filter(
        (user: User) => user.approval_status === "approved"
    )
    const rejectedUsers = users.filter(
        (user: User) => user.approval_status === "rejected"
    )

    // 만료 상태별 사용자 분류
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiredUsers = users.filter((user: User) => {
        if (!user.expiry_date) return false
        const expiryDate = new Date(user.expiry_date)
        return expiryDate < today && user.approval_status === "approved"
    })

    const activeUsers = users.filter((user: User) => {
        if (!user.expiry_date) {
            return user.approval_status === "approved" && user.is_active
        }
        const expiryDate = new Date(user.expiry_date)
        return (
            expiryDate >= today &&
            user.approval_status === "approved" &&
            user.is_active
        )
    })

    // 탭별 사용자 필터링
    const getFilteredUsers = () => {
        switch (activeTab) {
            case "pending":
                return pendingUsers
            case "active":
                return activeUsers
            case "expired":
                return expiredUsers
            case "all":
            default:
                return users
        }
    }

    const filteredUsers = getFilteredUsers()

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    // 페이지 변경 함수
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        // 페이지 변경 시 스크롤을 맨 위로
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 만료된 사용자 일괄 삭제
    const handleBulkDeleteExpired = async () => {
        if (expiredUsers.length === 0) {
            alert("만료된 사용자가 없습니다.")
            return
        }

        if (
            !confirm(
                `만료된 사용자 ${expiredUsers.length}명을 모두 삭제하시겠습니까?\n\n` +
                    `⚠️ 다음 사용자들의 모든 데이터가 삭제됩니다:\n` +
                    expiredUsers.map((u) => `- ${u.name} (${u.username})`).join("\n") +
                    `\n\n이 작업은 되돌릴 수 없습니다.`
            )
        )
            return

        setLoading(true)
        try {
            const deletePromises = expiredUsers.map((user) =>
                deleteUser(user.id, true)
            )

            const results = await Promise.all(deletePromises)
            const successCount = results.filter((r) => r.success).length
            const failCount = results.length - successCount

            if (failCount > 0) {
                setError(
                    `${successCount}명 삭제 성공, ${failCount}명 삭제 실패`
                )
            } else {
                setSuccess(`${successCount}명의 사용자가 성공적으로 삭제되었습니다.`)
            }

            loadUsers()
        } catch (err) {
            setError("일괄 삭제 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div
                style={{
                    ...style,
                    padding: "40px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        padding: "40px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        maxWidth: "400px",
                        width: "100%",
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: "30px" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            👥
                        </div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "24px",
                                color: "#1a237e",
                            }}
                        >
                            사용자 관리
                        </h2>
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: "14px",
                                color: "#666",
                            }}
                        >
                            관리자 계정으로 로그인하세요
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                아이디
                            </label>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                비밀번호
                            </label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                }}
                                required
                            />
                        </div>

                        {loginError && (
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: "#ffebee",
                                    color: "#c62828",
                                    borderRadius: "6px",
                                    marginBottom: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: "#1a237e",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: "pointer",
                            }}
                        >
                            {isLoggingIn ? "로그인 중..." : "로그인"}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // 관리자 화면
    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                padding: "20px",
            }}
        >
            {/* 헤더 */}
            <div
                style={{
                    padding: "16px",
                    backgroundColor: "#1a237e",
                    color: "white",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: "18px" }}>
                        👥 사용자 관리
                    </h2>
                    <div
                        style={{
                            fontSize: "12px",
                            opacity: 0.8,
                            marginTop: "4px",
                        }}
                    >
                        {currentUser?.name || currentUser?.username}님 | 승인
                        대기: {pendingUsers.length}명 | 승인됨:{" "}
                        {approvedUsers.length}명
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                    }}
                >
                    로그아웃
                </button>
            </div>

            {/* 알림 메시지 */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            padding: "12px 20px",
                            borderRadius: "6px",
                            backgroundColor: error ? "#fef2f2" : "#f0fdf4",
                            border: `1px solid ${error ? "#fecaca" : "#bbf7d0"}`,
                            color: error ? "#dc2626" : "#16a34a",
                        }}
                    >
                        {error || success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 탭 메뉴 */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
            >
                {[
                    { key: "all", label: "전체", count: users.length },
                    { key: "pending", label: "승인 대기", count: pendingUsers.length },
                    { key: "active", label: "활성", count: activeUsers.length },
                    { key: "expired", label: "만료", count: expiredUsers.length },
                ].map((tab) => (
                    <motion.button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            backgroundColor:
                                activeTab === tab.key ? "#1a237e" : "#f3f4f6",
                            color: activeTab === tab.key ? "white" : "#1f2937",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: activeTab === tab.key ? "600" : "500",
                            transition: "all 0.2s",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {tab.label} ({tab.count})
                    </motion.button>
                ))}
            </div>

            {/* 승인 대기자 섹션 */}
            {pendingUsers.length > 0 && (
                <div
                    style={{
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fbbf24",
                        borderRadius: "10px",
                        padding: "20px",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#92400e",
                            margin: "0 0 15px 0",
                        }}
                    >
                        ⏳ 승인 대기 중인 사용자 ({pendingUsers.length})
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                        }}
                    >
                        {pendingUsers.map((user) => (
                            <div
                                key={user.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "15px",
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #fbbf24",
                                }}
                            >
                                <div>
                                    <h4
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#1f2937",
                                            margin: "0 0 5px 0",
                                        }}
                                    >
                                        {user.name} ({user.username})
                                    </h4>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: 0,
                                        }}
                                    >
                                        가입일:{" "}
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <motion.button
                                        onClick={() =>
                                            handleShowApprovalModal(user)
                                        }
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#10b981",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        승인 처리
                                    </motion.button>
                                    <motion.button
                                        onClick={() =>
                                            handleApproveUser("rejected")
                                        }
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        거부
                                    </motion.button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 사용자 목록 헤더 */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
            >
                <h2
                    style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        color: "#1f2937",
                        margin: 0,
                    }}
                >
                    {activeTab === "all" && `전체 사용자 (${filteredUsers.length})`}
                    {activeTab === "pending" && `승인 대기 (${filteredUsers.length})`}
                    {activeTab === "active" && `활성 사용자 (${filteredUsers.length})`}
                    {activeTab === "expired" && `만료된 사용자 (${filteredUsers.length})`}
                </h2>
                <div style={{ display: "flex", gap: "10px" }}>
                    {activeTab === "expired" && expiredUsers.length > 0 && (
                        <motion.button
                            onClick={handleBulkDeleteExpired}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: loading ? "#9ca3af" : "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                            whileHover={!loading ? { scale: 1.05 } : {}}
                            whileTap={!loading ? { scale: 0.95 } : {}}
                        >
                            🗑️ 만료된 사용자 일괄 삭제
                        </motion.button>
                    )}
                    <motion.button
                        onClick={handleAddUser}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        직접 사용자 추가
                    </motion.button>
                    <motion.button
                        onClick={loadUsers}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#2196f3",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        새로고침
                    </motion.button>
                </div>
            </div>

            {/* 사용자 목록 */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#6b7280",
                        }}
                    >
                        로딩 중...
                    </div>
                ) : paginatedUsers.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#6b7280",
                        }}
                    >
                        {activeTab === "expired"
                            ? "만료된 사용자가 없습니다."
                            : activeTab === "active"
                              ? "활성 사용자가 없습니다."
                              : activeTab === "pending"
                                ? "승인 대기 중인 사용자가 없습니다."
                                : "등록된 사용자가 없습니다."}
                    </div>
                ) : (
                    <div style={{ padding: "20px" }}>
                        {paginatedUsers.map((user, index) => {
                            // 만료 상태 계산
                            const getExpiryStatus = (expiryDate?: string | null) => {
                                if (!expiryDate) return null
                                const expiry = new Date(expiryDate)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const diffDays = Math.ceil(
                                    (expiry.getTime() - today.getTime()) /
                                        (1000 * 60 * 60 * 24)
                                )

                                if (diffDays < 0)
                                    return {
                                        text: `${Math.abs(diffDays)}일 전 만료`,
                                        color: "#dc2626",
                                    }
                                if (diffDays === 0)
                                    return { text: "오늘 만료", color: "#dc2626" }
                                if (diffDays <= 7)
                                    return {
                                        text: `${diffDays}일 후 만료`,
                                        color: "#f59e0b",
                                    }
                                return {
                                    text: `${diffDays}일 남음`,
                                    color: "#10b981",
                                }
                            }

                            const expiryStatus = getExpiryStatus(user.expiry_date)

                            return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "15px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    marginBottom: "10px",
                                    backgroundColor:
                                        user.approval_status === "pending"
                                            ? "#fffbeb"
                                            : user.approval_status ===
                                                "rejected"
                                              ? "#fef2f2"
                                              : user.is_active
                                                ? "#fafafa"
                                                : "#f3f4f6",
                                }}
                            >
                                <div>
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: user.is_active
                                                ? "#1f2937"
                                                : "#6b7280",
                                            margin: "0 0 5px 0",
                                        }}
                                    >
                                        {user.name} ({user.username})
                                        {user.approval_status === "pending" &&
                                            " - 승인 대기"}
                                        {user.approval_status === "rejected" &&
                                            " - 승인 거부"}
                                        {!user.is_active &&
                                            user.approval_status ===
                                                "approved" &&
                                            " - 비활성"}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: 0,
                                        }}
                                    >
                                        가입:{" "}
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}
                                        {user.last_login &&
                                            ` | 마지막 로그인: ${new Date(user.last_login).toLocaleDateString()}`}
                                        {user.page_id &&
                                            ` | Page ID: ${user.page_id}`}
                                        {user.role &&
                                            ` | 권한: ${user.role === 'admin' ? '관리자' : '사용자'}`}
                                    </p>
                                    {/* 웨딩 정보 표시 */}
                                    {(user.wedding_date || user.groom_name_en || user.bride_name_en) && (
                                        <div
                                            style={{
                                                marginTop: "8px",
                                                padding: "8px",
                                                backgroundColor: "#f0f9ff",
                                                borderRadius: "4px",
                                                border: "1px solid #bae6fd",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: "#0369a1",
                                                    margin: "0 0 4px 0",
                                                }}
                                            >
                                                💒 웨딩 정보:
                                            </p>
                                            {user.wedding_date && (
                                                <p style={{ fontSize: "11px", color: "#0369a1", margin: "2px 0" }}>
                                                    예식일: {new Date(user.wedding_date).toLocaleDateString()}
                                                </p>
                                            )}
                                            {(user.groom_name_en || user.bride_name_en) && (
                                                <p style={{ fontSize: "11px", color: "#0369a1", margin: "2px 0" }}>
                                                    {user.groom_name_en && user.bride_name_en
                                                        ? `${user.groom_name_en} & ${user.bride_name_en}`
                                                        : user.groom_name_en || user.bride_name_en}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {expiryStatus && (
                                        <p
                                            style={{
                                                fontSize: "13px",
                                                color: expiryStatus.color,
                                                margin: "5px 0 0 0",
                                                fontWeight: "600",
                                            }}
                                        >
                                            📅 {expiryStatus.text}
                                        </p>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                    }}
                                >
                                    {user.approval_status === "pending" && (
                                        <motion.button
                                            onClick={() =>
                                                handleShowApprovalModal(user)
                                            }
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#10b981",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                cursor: "pointer",
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            승인
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={() => handleEditUser(user)}
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#3b82f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        편집
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleDeleteUser(user)}
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        삭제
                                    </motion.button>
                                </div>
                            </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            padding: "20px",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        {/* 이전 페이지 버튼 */}
                        <motion.button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: "8px 12px",
                                backgroundColor: currentPage === 1 ? "#f3f4f6" : "#ffffff",
                                color: currentPage === 1 ? "#9ca3af" : "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                            whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                        >
                            ← 이전
                        </motion.button>

                        {/* 페이지 번호들 */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // 현재 페이지 주변만 표시 (최대 5개)
                            const showPage = 
                                page === 1 || 
                                page === totalPages || 
                                Math.abs(page - currentPage) <= 2

                            if (!showPage) {
                                // 연속된 페이지 사이의 생략 표시
                                if (page === currentPage - 3 || page === currentPage + 3) {
                                    return (
                                        <span
                                            key={page}
                                            style={{
                                                padding: "8px 4px",
                                                color: "#9ca3af",
                                                fontSize: "14px",
                                            }}
                                        >
                                            ...
                                        </span>
                                    )
                                }
                                return null
                            }

                            return (
                                <motion.button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    style={{
                                        padding: "8px 12px",
                                        backgroundColor: currentPage === page ? "#1a237e" : "#ffffff",
                                        color: currentPage === page ? "#ffffff" : "#374151",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        minWidth: "40px",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {page}
                                </motion.button>
                            )
                        })}

                        {/* 다음 페이지 버튼 */}
                        <motion.button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: "8px 12px",
                                backgroundColor: currentPage === totalPages ? "#f3f4f6" : "#ffffff",
                                color: currentPage === totalPages ? "#9ca3af" : "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                            whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                        >
                            다음 →
                        </motion.button>
                    </div>
                )}
            </div>

            {/* 사용자 추가/편집 모달 */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "10px",
                                padding: "30px",
                                width: "100%",
                                maxWidth: "500px",
                                maxHeight: "80vh",
                                overflow: "auto",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "600",
                                    marginBottom: "20px",
                                    color: "#1f2937",
                                }}
                            >
                                {editingUser ? "사용자 편집" : "새 사용자 추가"}
                            </h2>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                    marginBottom: "30px",
                                }}
                            >
                                <InputField
                                    label="사용자명"
                                    type="text"
                                    value={userForm.username}
                                    onChange={(value: string) =>
                                        setUserForm((prev) => ({
                                            ...prev,
                                            username: value,
                                        }))
                                    }
                                    required
                                />

                                <InputField
                                    label="이름"
                                    type="text"
                                    value={userForm.name}
                                    onChange={(value: string) =>
                                        setUserForm((prev) => ({
                                            ...prev,
                                            name: value,
                                        }))
                                    }
                                    required
                                />

                                <InputField
                                    label="Page ID"
                                    type="text"
                                    value={userForm.page_id}
                                    onChange={(value: string) =>
                                        setUserForm((prev) => ({
                                            ...prev,
                                            page_id: value,
                                        }))
                                    }
                                />

                                {/* Role 선택 */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        권한
                                    </label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) =>
                                            setUserForm((prev) => ({
                                                ...prev,
                                                role: e.target.value,
                                            }))
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            background: "white",
                                        }}
                                    >
                                        <option value="user">사용자</option>
                                        <option value="admin">관리자</option>
                                    </select>
                                </div>

                                {/* Type 선택 (동적 타입 관리) */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        타입
                                    </label>
                                    <select
                                        value={userForm.type}
                                        onChange={(e) =>
                                            setUserForm((prev) => ({
                                                ...prev,
                                                type: (e.target
                                                    .value as PageType),
                                            }))
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            background: "white",
                                        }}
                                    >
                                        {PAGE_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!editingUser && (
                                    <InputField
                                        label="비밀번호"
                                        type="password"
                                        value={userForm.password}
                                        onChange={(value: string) =>
                                            setUserForm((prev) => ({
                                                ...prev,
                                                password: value,
                                            }))
                                        }
                                        required
                                    />
                                )}

                                {editingUser && (
                                    <InputField
                                        label="새 비밀번호 (변경하지 않으려면 비워두세요)"
                                        type="password"
                                        value={userForm.newPassword}
                                        onChange={(value: string) =>
                                            setUserForm((prev) => ({
                                                ...prev,
                                                newPassword: value,
                                            }))
                                        }
                                    />
                                )}

                                {/* 만료 기간 입력 */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        서비스 만료 기간
                                    </label>
                                    <input
                                        type="date"
                                        value={userForm.expiry_date}
                                        onChange={(e) =>
                                            setUserForm((prev) => ({
                                                ...prev,
                                                expiry_date: e.target.value,
                                            }))
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                            margin: "5px 0 0 0",
                                        }}
                                    >
                                        만료 기간을 설정하지 않으면 무제한입니다.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={userForm.is_active}
                                            onChange={(e) =>
                                                setUserForm((prev) => ({
                                                    ...prev,
                                                    is_active: e.target.checked,
                                                }))
                                            }
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                            }}
                                        />
                                        활성 사용자
                                    </label>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <motion.button
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    취소
                                </motion.button>
                                <motion.button
                                    onClick={handleSaveUser}
                                    disabled={loading}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: loading
                                            ? "#9ca3af"
                                            : "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: loading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                    whileHover={!loading ? { scale: 1.05 } : {}}
                                    whileTap={!loading ? { scale: 0.95 } : {}}
                                >
                                    {loading ? "저장 중..." : "저장"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 승인 모달 */}
            <AnimatePresence>
                {showApprovalModal && approvingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "10px",
                                padding: "30px",
                                width: "100%",
                                maxWidth: "450px",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "600",
                                    marginBottom: "20px",
                                    color: "#1f2937",
                                }}
                            >
                                사용자 승인
                            </h2>

                            <div style={{ marginBottom: "25px" }}>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#374151",
                                        margin: "0 0 10px 0",
                                    }}
                                >
                                    <strong>{approvingUser.name}</strong> (
                                    {approvingUser.username})님을
                                    승인하시겠습니까?
                                </p>
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "#6b7280",
                                        margin: 0,
                                    }}
                                >
                                    승인 시 개인 웨딩 페이지 ID를 발급해주세요.
                                </p>
                                
                                {/* 웨딩 정보 미리보기 */}
                                {(approvingUser.wedding_date || approvingUser.groom_name_en || approvingUser.bride_name_en) && (
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            padding: "12px",
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "6px",
                                            border: "1px solid #e5e7eb",
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color: "#374151",
                                                margin: "0 0 8px 0",
                                            }}
                                        >
                                            📋 입력된 웨딩 정보:
                                        </p>
                                        {approvingUser.wedding_date && (
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0" }}>
                                                예식일자: {new Date(approvingUser.wedding_date).toLocaleDateString()}
                                            </p>
                                        )}
                                        {approvingUser.groom_name_en && (
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0" }}>
                                                신랑 영문명: {approvingUser.groom_name_en}
                                            </p>
                                        )}
                                        {approvingUser.bride_name_en && (
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0" }}>
                                                신부 영문명: {approvingUser.bride_name_en}
                                            </p>
                                        )}
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "#9ca3af",
                                                margin: "8px 0 0 0",
                                                fontStyle: "italic",
                                            }}
                                        >
                                            승인 시 위 정보가 페이지 설정에 자동 반영됩니다.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: "25px" }}>
                                <InputField
                                    label="Page ID (선택사항)"
                                    type="text"
                                    value={pageIdInput}
                                    onChange={(value: string) =>
                                        setPageIdInput(value)
                                    }
                                />
                                <p
                                    style={{
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        margin: "5px 0 0 0",
                                    }}
                                >
                                    예: wedding-kim-lee-2024
                                </p>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <motion.button
                                    onClick={() => setShowApprovalModal(false)}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    취소
                                </motion.button>
                                <motion.button
                                    onClick={() =>
                                        handleApproveUser("rejected")
                                    }
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#ef4444",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    거부
                                </motion.button>
                                <motion.button
                                    onClick={() =>
                                        handleApproveUser("approved")
                                    }
                                    disabled={loading}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: loading
                                            ? "#9ca3af"
                                            : "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: loading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                    whileHover={!loading ? { scale: 1.05 } : {}}
                                    whileTap={!loading ? { scale: 0.95 } : {}}
                                >
                                    {loading ? "승인 중..." : "승인"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// 입력 필드 컴포넌트
interface InputFieldProps {
    label: string
    type?: string
    value: string
    onChange: (value: string) => void
    required?: boolean
}

function InputField({
    label,
    type = "text",
    value,
    onChange,
    required = false,
}: InputFieldProps) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "5px",
                }}
            >
                {label}{" "}
                {required && <span style={{ color: "#ef4444" }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                }}
            />
        </div>
    )
}

// Property Controls
addPropertyControls(UserManagement, {
    // 필요한 경우 프로퍼티 컨트롤 추가
})
