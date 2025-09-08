import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL) - AccountBtn.tsx 패턴과 동일
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 회원가입 함수 - 프록시를 통한 안전한 연결 (AccountBtn.tsx 패턴 참조)
interface SignupUserData {
    username: string
    password: string
    name: string
}

async function signupUser(userData: SignupUserData): Promise<any> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "register",
                username: userData.username,
                password: userData.password,
                name: userData.name,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result
    } catch (error) {
        console.error("Signup error:", error)
        return {
            success: false,
            error: "회원가입 중 네트워크 오류가 발생했습니다",
        }
    }
}

export default function UserSignup(props: { style?: React.CSSProperties }) {
    const { style } = props

    const [signupForm, setSignupForm] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        name: "",
    })
    const [isSigningUp, setIsSigningUp] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // 회원가입 처리
    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSigningUp(true)
        setError("")
        setSuccess("")

        // 비밀번호 확인
        if (signupForm.password !== signupForm.confirmPassword) {
            setError("비밀번호가 일치하지 않습니다")
            setIsSigningUp(false)
            return
        }

        // 비밀번호 강도 체크 (선택사항)
        if (signupForm.password.length < 6) {
            setError("비밀번호는 최소 6자 이상이어야 합니다")
            setIsSigningUp(false)
            return
        }

        // 프록시를 통한 안전한 회원가입 시도
        const result = await signupUser({
            username: signupForm.username,
            password: signupForm.password,
            name: signupForm.name,
        })

        if (result.success) {
            setSuccess(result.message)
            setSignupForm({
                username: "",
                password: "",
                confirmPassword: "",
                name: "",
            })
        } else {
            setError(result.error)
        }
        setIsSigningUp(false)
    }

    return (
        <div
            style={{
                ...style,
                padding: "40px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "600px",
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: "40px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    maxWidth: "500px",
                    width: "100%",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        💒
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "28px",
                            color: "#1a237e",
                            fontWeight: "600",
                        }}
                    >
                        웨딩 관리 시스템
                    </h2>
                    <p
                        style={{
                            margin: "8px 0 0",
                            fontSize: "16px",
                            color: "#666",
                        }}
                    >
                        계정을 생성하시면 관리자 승인 후 이용하실 수 있습니다
                    </p>
                </div>

                {/* 보안 정보 */}
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "15px",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "8px",
                        border: "1px solid #22c55e",
                    }}
                >
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#15803d",
                            marginBottom: "5px",
                        }}
                    >
                        🔒 보안 연결
                    </div>
                    <p
                        style={{
                            fontSize: "12px",
                            color: "#15803d",
                            margin: "0",
                        }}
                    >
                        모든 데이터는 안전한 프록시 서버를 통해 암호화되어
                        전송됩니다
                    </p>
                </div>

                {/* 성공 메시지 */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                padding: "15px",
                                backgroundColor: "#f0fdf4",
                                color: "#16a34a",
                                borderRadius: "8px",
                                marginBottom: "20px",
                                textAlign: "center",
                                border: "1px solid #bbf7d0",
                            }}
                        >
                            ✅ {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!success && (
                    <form onSubmit={handleSignup}>
                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                이름 <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={signupForm.name}
                                onChange={(e) =>
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="실명을 입력하세요"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#1a237e")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#e0e0e0")
                                }
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                아이디{" "}
                                <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={signupForm.username}
                                onChange={(e) =>
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                placeholder="로그인에 사용할 아이디"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#1a237e")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#e0e0e0")
                                }
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                비밀번호{" "}
                                <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="password"
                                value={signupForm.password}
                                onChange={(e) =>
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                placeholder="최소 6자 이상"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#1a237e")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#e0e0e0")
                                }
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                비밀번호 확인{" "}
                                <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="password"
                                value={signupForm.confirmPassword}
                                onChange={(e) =>
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        confirmPassword: e.target.value,
                                    }))
                                }
                                placeholder="비밀번호를 다시 입력하세요"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#1a237e")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#e0e0e0")
                                }
                                required
                            />
                        </div>

                        {error && (
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: "#fef2f2",
                                    color: "#dc2626",
                                    borderRadius: "8px",
                                    marginBottom: "20px",
                                    textAlign: "center",
                                    border: "1px solid #fecaca",
                                }}
                            >
                                ❌ {error}
                            </div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={isSigningUp}
                            style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: isSigningUp
                                    ? "#9ca3af"
                                    : "#1a237e",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: isSigningUp ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                            }}
                            whileHover={!isSigningUp ? { scale: 1.02 } : {}}
                            whileTap={!isSigningUp ? { scale: 0.98 } : {}}
                        >
                            {isSigningUp ? "가입 중..." : "회원가입"}
                        </motion.button>

                        <div
                            style={{
                                textAlign: "center",
                                marginTop: "20px",
                                fontSize: "14px",
                                color: "#6b7280",
                            }}
                        >
                            💡 계정 생성 후 관리자의 승인을 받으면
                            <br />
                            개인 웨딩 페이지 ID를 받으실 수 있습니다
                        </div>
                    </form>
                )}

                {success && (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <motion.button
                            onClick={() => {
                                setSuccess("")
                                setError("")
                            }}
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
                            다른 계정 만들기
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    )
}

// Property Controls
addPropertyControls(UserSignup, {
    // 필요한 경우 프로퍼티 컨트롤 추가
})
