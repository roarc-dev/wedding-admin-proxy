import React, { useState, useEffect } from "react"
import styled from "styled-components"
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

async function deleteUser(userId: string): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ id: userId }),
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

interface User {
    id: string
    username: string
    name: string
    is_active: boolean
    created_at: string
    last_login?: string
    approval_status: "pending" | "approved" | "rejected"
    page_id?: string
}

// Styled Components
const StyledGap16 = styled.div`
  width: 375px;
  height: 16px;
  position: relative;
`;

const StyledUseradminspan = styled.span`
  color: black;
  font-size: 28px;
  font-family: P22LateNovemberW01-Regular;
  font-weight: 400;
  word-wrap: break-word;
`;

const StyledGap1601 = styled.div`
  width: 375px;
  height: 16px;
  position: relative;
`;

const StyledSpan = styled.span`
  color: black;
  font-size: 14px;
  font-family: Pretendard;
  font-weight: 600;
  word-wrap: break-word;
`;

const StyledGap1602 = styled.div`
  width: 375px;
  height: 16px;
  position: relative;
`;

const Styled01span = styled.span`
  color: #7F7F7F;
  font-size: 12px;
  font-family: Pretendard;
  font-weight: 400;
  word-wrap: break-word;
`;

const StyledPwspan = styled.span`
  color: #AEAEAE;
  font-size: 12px;
  font-family: Pretendard;
  font-weight: 400;
  word-wrap: break-word;
`;

const StyledPageidspan = styled.span`
  color: #AEAEAE;
  font-size: 14px;
  font-family: Pretendard;
  font-weight: 400;
  word-wrap: break-word;
`;

const StyledFrame2117912734 = styled.div`
  width: 167.50px;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  display: flex;
`;

const StyledFrame2117912735 = styled.div`
  height: 32px;
  padding: 12px;
  outline: 1px #E5E6E8 solid;
  outline-offset: -0.50px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: flex;
  cursor: pointer;
  background: white;
  border-radius: 2px;
`;

const StyledName = styled.div`
  align-self: stretch;
  height: 32px;
  padding: 16px;
  border-radius: 2px;
  outline: 1px #E5E6E8 solid;
  outline-offset: -0.50px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  display: flex;
  background: white;
`;

const StyledNameInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: Pretendard;
  font-weight: 400;
  color: #AEAEAE;
  background: transparent;

  &::placeholder {
    color: #AEAEAE;
  }
`;

const StyledFrame211791273501 = styled.div`
  align-self: stretch;
  height: 32px;
  padding: 12px;
  background: black;
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: inline-flex;
  cursor: pointer;
  border-radius: 2px;
`;

const StyledFrame2117912733 = styled.div`
  align-self: stretch;
  justify-content: space-between;
  align-items: center;
  display: inline-flex;
`;

const StyledFrame2117912731 = styled.div`
  align-self: stretch;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  display: flex;
`;

const StyledFrame2117912727 = styled.div`
  align-self: stretch;
  padding: 14px;
  background: white;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  display: flex;
`;

const StyledFrame2117912732 = styled.div`
  align-self: stretch;
  padding: 28px;
  background: #ECECEC;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 14px;
  display: flex;
`;

const StyledFrame2117912729 = styled.div`
  flex: 1 1 0;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  display: flex;
`;

const StyledFrame2117912730 = styled.div`
  align-self: stretch;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
  display: inline-flex;
`;

const StyledFrame2117912726 = styled.div`
  align-self: stretch;
  padding-left: 28px;
  padding-right: 28px;
  padding-top: 18px;
  padding-bottom: 18px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 24px;
  display: flex;
`;

const StyledAdmin = styled.div`
  width: 375px;
  height: 100vh;
  background: white;
  overflow: hidden;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  display: inline-flex;
`;

const StyledDeleteButton = styled.button`
  width: 24px;
  height: 24px;
  background: #FF4444;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
`;

const StyledAddIcon = styled.div`
  width: 34px;
  height: 34px;
  border: 1px solid #E5E6E8;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const StyledRefreshIcon = styled.div`
  width: 34px;
  height: 34px;
  border: 1px solid #E5E6E8;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;

  svg {
    width: 20px;
    height: 20px;
  }
`;

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

    // 새 사용자 추가 상태
    const [newUserForm, setNewUserForm] = useState({
        username: "",
        password: "",
        name: "",
        page_id: "",
    })

    // 사용자별 Page ID 상태 관리
    const [userPageIds, setUserPageIds] = useState<{[key: string]: string}>({})

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

    // 사용자 목록 로드
    const loadUsers = async () => {
        setLoading(true)
        try {
            const usersData = await getAllUsers()
            setUsers(usersData)

            // 각 사용자의 현재 page_id를 상태에 저장
            const pageIdMap: {[key: string]: string} = {}
            usersData.forEach(user => {
                pageIdMap[user.id] = user.page_id || ""
            })
            setUserPageIds(pageIdMap)
        } catch (err) {
            setError("사용자 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 새 사용자 추가
    const handleCreateUser = async () => {
        if (!newUserForm.username || !newUserForm.password || !newUserForm.name) {
            setError("모든 필드를 입력하세요.")
            return
        }

        setLoading(true)
        try {
            const result = await createUser({
                username: newUserForm.username,
                password: newUserForm.password,
                name: newUserForm.name,
            })

            if (result.success) {
                setSuccess("사용자가 성공적으로 추가되었습니다.")
                setNewUserForm({ username: "", password: "", name: "", page_id: "" })
                loadUsers()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError("사용자 추가 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // Page ID 변경 핸들러
    const handlePageIdChange = (userId: string, pageId: string) => {
        setUserPageIds(prev => ({
            ...prev,
            [userId]: pageId
        }))
    }

    // 사용자 저장 (Page ID 업데이트)
    const handleSaveUser = async (userId: string) => {
        const pageId = userPageIds[userId] || ""

        setLoading(true)
        try {
            const result = await updateUser({
                id: userId,
                username: users.find(u => u.id === userId)?.username || "",
                name: users.find(u => u.id === userId)?.name || "",
                is_active: pageId ? true : false, // Page ID가 있으면 활성, 없으면 비활성
                page_id: pageId,
            })

            if (result.success) {
                setSuccess("사용자 정보가 성공적으로 저장되었습니다.")
                loadUsers()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError("저장 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 사용자 삭제
    const handleDeleteUser = async (userId: string) => {
        if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return

        setLoading(true)
        try {
            const result = await deleteUser(userId)

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

    return (
        <StyledAdmin>
            <StyledGap16 />
            <StyledUseradminspan>USER ADMIN</StyledUseradminspan>
            <StyledGap1601 />
            <StyledFrame2117912726>
                <StyledFrame2117912730>
                    <StyledSpan>전체 사용자 목록 ({users.length})</StyledSpan>
                    <StyledFrame2117912729>
                        <StyledAddIcon onClick={handleCreateUser}>
                            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="1" width="32" height="32" fill="white"/>
                                <rect x="1" y="1" width="32" height="32" stroke="#E5E6E8"/>
                                <path d="M24 18H18V24H16V18H10V16H16V10H18V16H24V18Z" fill="#757575"/>
                            </svg>
                        </StyledAddIcon>
                        <StyledRefreshIcon onClick={loadUsers}>
                            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="1" width="32" height="32" stroke="#E5E6E8"/>
                                <path d="M17 25C14.7667 25 12.875 24.225 11.325 22.675C9.775 21.125 9 19.2333 9 17C9 14.7667 9.775 12.875 11.325 11.325C12.875 9.775 14.7667 9 17 9C18.15 9 19.25 9.23733 20.3 9.712C21.35 10.1867 22.25 10.866 23 11.75V9H25V16H18V14H22.2C21.6667 13.0667 20.9377 12.3333 20.013 11.8C19.0883 11.2667 18.084 11 17 11C15.3333 11 13.9167 11.5833 12.75 12.75C11.5833 13.9167 11 15.3333 11 17C11 18.6667 11.5833 20.0833 12.75 21.25C13.9167 22.4167 15.3333 23 17 23C18.2833 23 19.4417 22.6333 20.475 21.9C21.5083 21.1667 22.2333 20.2 22.65 19H24.75C24.2833 20.7667 23.3333 22.2083 21.9 23.325C20.4667 24.4417 18.8333 25 17 25Z" fill="#757575"/>
                            </svg>
                        </StyledRefreshIcon>
                    </StyledFrame2117912729>
                </StyledFrame2117912730>
            </StyledFrame2117912726>
            <StyledGap1602 />

            {/* 사용자 목록 */}
            <StyledFrame2117912732>
                {users.map((user, index) => {
                    const pageId = userPageIds[user.id] || user.page_id || ""

                    return (
                        <StyledFrame2117912727 key={user.id}>
                            <StyledFrame2117912733>
                                <StyledFrame2117912734>
                                    <StyledSpan>{user.name}</StyledSpan>
                                    <Styled01span>ID: {user.username}</Styled01span>
                                </StyledFrame2117912734>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <StyledFrame2117912735>
                                        <StyledPwspan>PW변경</StyledPwspan>
                                    </StyledFrame2117912735>
                                    <StyledDeleteButton onClick={() => handleDeleteUser(user.id)}>
                                        ✕
                                    </StyledDeleteButton>
                                </div>
                            </StyledFrame2117912733>
                            <StyledFrame2117912731>
                                <StyledSpan>Page ID</StyledSpan>
                                <StyledName>
                                    <StyledNameInput
                                        value={pageId}
                                        onChange={(e) => handlePageIdChange(user.id, e.target.value)}
                                        placeholder="Page ID 입력"
                                    />
                                </StyledName>
                                <StyledFrame211791273501 onClick={() => handleSaveUser(user.id)}>
                                    <StyledSpan>저장</StyledSpan>
                                </StyledFrame211791273501>
                            </StyledFrame2117912731>
                        </StyledFrame2117912727>
                    )
                })}

                {/* 새 사용자 추가 폼 */}
                <StyledFrame2117912727>
                    <StyledFrame2117912733>
                        <StyledFrame2117912734>
                            <StyledNameInput
                                value={newUserForm.name}
                                onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="이름 입력"
                                style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "Pretendard", fontWeight: 600, color: "black" }}
                            />
                            <StyledNameInput
                                value={newUserForm.username}
                                onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="아이디 입력"
                                style={{ border: "none", outline: "none", fontSize: "12px", fontFamily: "Pretendard", fontWeight: 400, color: "#7F7F7F" }}
                            />
                        </StyledFrame2117912734>
                        <StyledFrame2117912735>
                            <StyledPwspan>PW변경</StyledPwspan>
                        </StyledFrame2117912735>
                    </StyledFrame2117912733>
                    <StyledFrame2117912731>
                        <StyledSpan>Page ID</StyledSpan>
                        <StyledName>
                            <StyledNameInput
                                value={newUserForm.page_id || ""}
                                onChange={(e) => setNewUserForm(prev => ({ ...prev, page_id: e.target.value }))}
                                placeholder="Page ID 입력"
                            />
                        </StyledName>
                        <StyledFrame211791273501 onClick={handleCreateUser}>
                            <StyledSpan>생성</StyledSpan>
                        </StyledFrame211791273501>
                    </StyledFrame2117912731>
                </StyledFrame2117912727>
            </StyledFrame2117912732>
        </StyledAdmin>
    )
}

// Property Controls
addPropertyControls(UserManagement, {
    // 필요한 경우 프로퍼티 컨트롤 추가
})