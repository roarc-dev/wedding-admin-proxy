import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app"

// 토큰 관리
function getAuthToken() {
    return localStorage.getItem("admin_session")
}

function setAuthToken(token) {
    localStorage.setItem("admin_session", token)
}

function removeAuthToken() {
    localStorage.removeItem("admin_session")
}

// 토큰 검증
function validateSessionToken(token) {
    try {
        const data = JSON.parse(atob(token))
        return Date.now() < data.expires ? data : null
    } catch {
        return null
    }
}

// 인증 함수
async function authenticateAdmin(username, password) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/auth`, {
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
            error: `네트워크 오류: ${error.message}`,
        }
    }
}

// 사용자 관리 API 함수들 - auth.js를 사용하도록 수정
async function getAllUsers() {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/auth`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`,
            },
        })

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get users error:", error)
        return []
    }
}

async function createUser(userData) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                action: "createUser",
                username: userData.username,
                password: userData.password,
                name: userData.name,
                page_id: userData.page_id
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Create user error:", error)
        return {
            success: false,
            error: "사용자 생성 중 오류가 발생했습니다",
        }
    }
}

async function updateUser(userData) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/auth`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(userData),
        })

        return await response.json()
    } catch (error) {
        console.error("Update user error:", error)
        return {
            success: false,
            error: "사용자 수정 중 오류가 발생했습니다",
        }
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/auth`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ id: userId }),
        })

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
async function approveUser(userId, status, pageId = null) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                action: "approveUser",
                userId,
                status,
                pageId
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Approve user error:", error)
        return {
            success: false,
            error: "사용자 승인 중 오류가 발생했습니다",
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
    approval_status: 'pending' | 'approved' | 'rejected'
    page_id?: string
}

export default function UserManagement(props) {
    const { style } = props

    // 공통 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [loginForm, setLoginForm] = useState({ username: "", password: "" })
    const [loginError, setLoginError] = useState("")
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    // 사용자 관리 상태
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [approvingUser, setApprovingUser] = useState(null)
    const [pageIdInput, setPageIdInput] = useState("")

    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        name: "",
        is_active: true,
        newPassword: "",
        page_id: ""
    })

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

    // 로그인
    const handleLogin = async (e) => {
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
            page_id: ""
        })
        setEditingUser(null)
        setShowAddModal(true)
    }

    // 사용자 편집
    const handleEditUser = (user) => {
        setUserForm({
            username: user.username,
            password: "",
            name: user.name,
            is_active: user.is_active,
            newPassword: "",
            page_id: user.page_id || ""
        })
        setEditingUser(user)
        setShowAddModal(true)
    }

    // 사용자 승인 모달 열기
    const handleShowApprovalModal = (user) => {
        setApprovingUser(user)
        setPageIdInput("")
        setShowApprovalModal(true)
    }

    // 사용자 승인
    const handleApproveUser = async (status) => {
        if (!approvingUser) return

        setLoading(true)
        try {
            const result = await approveUser(
                approvingUser.id, 
                status, 
                status === 'approved' ? pageIdInput : null
            )

            if (result.success) {
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
                const updateData = {
                    id: editingUser.id,
                    username: userForm.username,
                    name: userForm.name,
                    is_active: userForm.is_active,
                    page_id: userForm.page_id
                }
                if (userForm.newPassword) {
                    updateData.newPassword = userForm.newPassword
                }
                result = await updateUser(updateData)
            } else {
                // 새 사용자 추가
                if (!userForm.username || !userForm.password || !userForm.name) {
                    setError("모든 필드를 입력하세요.")
                    setLoading(false)
                    return
                }
                result = await createUser({
                    username: userForm.username,
                    password: userForm.password,
                    name: userForm.name,
                    page_id: userForm.page_id
                })
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
    const handleDeleteUser = async (user) => {
        if (!confirm(`정말로 '${user.name}' 사용자를 삭제하시겠습니까?`)) return

        setLoading(true)
        try {
            const result = await deleteUser(user.id)

            if (result.success) {
                setSuccess("사용자가 성공적으로 삭제되었습니다.")
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
    const pendingUsers = users.filter(user => user.approval_status === 'pending')
    const approvedUsers = users.filter(user => user.approval_status === 'approved')
    const rejectedUsers = users.filter(user => user.approval_status === 'rejected')

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
                        {currentUser?.name || currentUser?.username}님 | 
                        승인 대기: {pendingUsers.length}명 | 
                        승인됨: {approvedUsers.length}명
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                                        가입일: {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <motion.button
                                        onClick={() => handleShowApprovalModal(user)}
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
                                        onClick={() => handleApproveUser('rejected')}
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
                    전체 사용자 목록 ({users.length})
                </h2>
                <div style={{ display: "flex", gap: "10px" }}>
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
                ) : users.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#6b7280",
                        }}
                    >
                        등록된 사용자가 없습니다.
                    </div>
                ) : (
                    <div style={{ padding: "20px" }}>
                        {users.map((user, index) => (
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
                                        user.approval_status === 'pending' ? "#fffbeb" :
                                        user.approval_status === 'rejected' ? "#fef2f2" :
                                        user.is_active ? "#fafafa" : "#f3f4f6",
                                }}
                            >
                                <div>
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: user.is_active ? "#1f2937" : "#6b7280",
                                            margin: "0 0 5px 0",
                                        }}
                                    >
                                        {user.name} ({user.username})
                                        {user.approval_status === 'pending' && " - 승인 대기"}
                                        {user.approval_status === 'rejected' && " - 승인 거부"}
                                        {!user.is_active && user.approval_status === 'approved' && " - 비활성"}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: 0,
                                        }}
                                    >
                                        가입: {new Date(user.created_at).toLocaleDateString()}
                                        {user.last_login && ` | 마지막 로그인: ${new Date(user.last_login).toLocaleDateString()}`}
                                        {user.page_id && ` | Page ID: ${user.page_id}`}
                                    </p>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                    }}
                                >
                                    {user.approval_status === 'pending' && (
                                        <motion.button
                                            onClick={() => handleShowApprovalModal(user)}
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
                        ))}
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
                                    onChange={(value) =>
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
                                    onChange={(value) =>
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
                                    onChange={(value) =>
                                        setUserForm((prev) => ({
                                            ...prev,
                                            page_id: value,
                                        }))
                                    }
                                />

                                {!editingUser && (
                                    <InputField
                                        label="비밀번호"
                                        type="password"
                                        value={userForm.password}
                                        onChange={(value) =>
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
                                        onChange={(value) =>
                                            setUserForm((prev) => ({
                                                ...prev,
                                                newPassword: value,
                                            }))
                                        }
                                    />
                                )}

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
                                        backgroundColor: loading ? "#9ca3af" : "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: loading ? "not-allowed" : "pointer",
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
                                <p style={{ fontSize: "16px", color: "#374151", margin: "0 0 10px 0" }}>
                                    <strong>{approvingUser.name}</strong> ({approvingUser.username})님을 승인하시겠습니까?
                                </p>
                                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                                    승인 시 개인 웨딩 페이지 ID를 발급해주세요.
                                </p>
                            </div>

                            <div style={{ marginBottom: "25px" }}>
                                <InputField
                                    label="Page ID (선택사항)"
                                    type="text"
                                    value={pageIdInput}
                                    onChange={(value) => setPageIdInput(value)}
                                />
                                <p style={{ fontSize: "12px", color: "#6b7280", margin: "5px 0 0 0" }}>
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
                                    onClick={() => handleApproveUser('rejected')}
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
                                    onClick={() => handleApproveUser('approved')}
                                    disabled={loading}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: loading ? "#9ca3af" : "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: loading ? "not-allowed" : "pointer",
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
function InputField({ label, type = "text", value, onChange, required = false }) {
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
                {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
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