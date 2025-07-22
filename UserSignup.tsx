import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL
const PROXY_BASE_URL = "https://wedding-admin-proxy-1lp2vfy5v-roarcs-projects.vercel.app"

// 직접 Supabase 연결 설정 (테스트용)
const SUPABASE_URL = "https://ydgqnpmybrlnkmklyokf.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZ3FucG15YnJsbmtta2x5b2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyOTY0MDgsImV4cCI6MjA1Mjg3MjQwOH0.HQfEgPkqzFGRJMsyEGJjrFYnUuO1k6bJ9aKP8LrIX-w"
// Service Role Key (RLS 우회용 - 프로덕션에서는 절대 노출하면 안됨!)
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZ3FucG15YnJsbmtta2x5b2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzI5NjQwOCwiZXhwIjoyMDUyODcyNDA4fQ.Z0DxoXOJYy7aTSLZHKUJWoMRH0h8qGJz6V4JhZZldjQ"

// bcrypt 해싱을 위한 간단한 해시 함수 (실제로는 서버에서 해야 함)
async function simpleHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "wedding-salt");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 회원가입 함수 - 프록시 버전
async function signupUserViaProxy(userData) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: userData.username,
                password: userData.password,
                name: userData.name
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Proxy signup error:", error)
        return {
            success: false,
            error: "프록시 회원가입 중 오류가 발생했습니다",
        }
    }
}

// 회원가입 함수 - 직접 Supabase 연결
async function signupUserDirectly(userData) {
    try {
        console.log("Direct Supabase signup attempt:", { username: userData.username, name: userData.name });
        
        // Service Role Key 사용 (RLS 우회)
        const API_KEY = SUPABASE_SERVICE_KEY;
        
        // 0. Supabase 연결 테스트
        console.log("Testing Supabase connection...");
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: "GET",
            headers: {
                "apikey": API_KEY,
                "Authorization": `Bearer ${API_KEY}`
            }
        });
        
        console.log("Connection test response status:", testResponse.status);
        
        if (!testResponse.ok) {
            throw new Error(`Supabase 연결 실패: ${testResponse.status}`);
        }
        
        // 1. 중복 사용자명 체크 (먼저 단순한 SELECT 시도)
        console.log("Checking for existing users...");
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/admin_users?username=eq.${userData.username}&select=username`, {
            method: "GET",
            headers: {
                "apikey": API_KEY,
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        console.log("User check response status:", checkResponse.status);

        if (!checkResponse.ok) {
            const errorText = await checkResponse.text();
            console.error("User check error:", errorText);
            throw new Error(`중복 체크 실패: ${checkResponse.status} - ${errorText}`);
        }

        const existingUsers = await checkResponse.json();
        console.log("Existing users check result:", existingUsers);
        
        if (existingUsers.length > 0) {
            return {
                success: false,
                error: "이미 존재하는 사용자명입니다"
            };
        }

        // 2. 비밀번호 해싱 (간단한 버전)
        const hashedPassword = await simpleHash(userData.password);
        console.log("Password hashed successfully");

        // 3. 새 사용자 삽입
        console.log("Attempting to insert new user...");
        const insertData = {
            username: userData.username,
            password: hashedPassword,
            name: userData.name,
            is_active: false,
            approval_status: "pending",
            page_id: null
        };
        
        console.log("Insert data:", insertData);
        
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
            method: "POST",
            headers: {
                "apikey": API_KEY,
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(insertData)
        });

        console.log("Insert response status:", insertResponse.status);

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error("Insert error:", errorText);
            throw new Error(`사용자 생성 실패: ${insertResponse.status} - ${errorText}`);
        }

        const newUser = await insertResponse.json();
        console.log("User created successfully:", newUser);
        
        return {
            success: true,
            message: "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.",
            data: newUser[0] || newUser
        };

    } catch (error) {
        console.error("Direct signup error details:", error);
        console.error("Error stack:", error.stack);
        return {
            success: false,
            error: `직접 연결 회원가입 오류: ${error.message}`,
        };
    }
}

export default function UserSignup(props) {
    const { style } = props

    const [signupForm, setSignupForm] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        name: ""
    })
    const [isSigningUp, setIsSigningUp] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [useDirectConnection, setUseDirectConnection] = useState(false)

    // 회원가입 처리
    const handleSignup = async (e) => {
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

        // 선택된 방식으로 회원가입 시도
        const result = useDirectConnection 
            ? await signupUserDirectly({
                username: signupForm.username,
                password: signupForm.password,
                name: signupForm.name
            })
            : await signupUserViaProxy({
                username: signupForm.username,
                password: signupForm.password,
                name: signupForm.name
            });

        if (result.success) {
            setSuccess(result.message)
            setSignupForm({
                username: "",
                password: "",
                confirmPassword: "",
                name: ""
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
                minHeight: "600px"
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
                            fontWeight: "600"
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

                {/* 연결 방식 선택 */}
                <div style={{ 
                    marginBottom: "20px", 
                    padding: "15px", 
                    backgroundColor: "#f0f9ff", 
                    borderRadius: "8px",
                    border: "1px solid #0ea5e9"
                }}>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#0c4a6e",
                            cursor: "pointer",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={useDirectConnection}
                            onChange={(e) => setUseDirectConnection(e.target.checked)}
                            style={{
                                width: "16px",
                                height: "16px",
                            }}
                        />
                        🔧 테스트 모드: 직접 Supabase 연결 (프록시 우회)
                    </label>
                    <p style={{ 
                        fontSize: "12px", 
                        color: "#0c4a6e", 
                        margin: "5px 0 0 24px" 
                    }}>
                        {useDirectConnection 
                            ? "프록시를 거치지 않고 직접 Supabase에 연결합니다" 
                            : "프록시 서버를 통해 안전하게 연결합니다"
                        }
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
                                border: "1px solid #bbf7d0"
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
                                    color: "#374151"
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
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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
                                    color: "#374151"
                                }}
                            >
                                아이디 <span style={{ color: "#ef4444" }}>*</span>
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
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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
                                    color: "#374151"
                                }}
                            >
                                비밀번호 <span style={{ color: "#ef4444" }}>*</span>
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
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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
                                    color: "#374151"
                                }}
                            >
                                비밀번호 확인 <span style={{ color: "#ef4444" }}>*</span>
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
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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
                                    border: "1px solid #fecaca"
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
                                backgroundColor: isSigningUp ? "#9ca3af" : useDirectConnection ? "#0ea5e9" : "#1a237e",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: isSigningUp ? "not-allowed" : "pointer",
                                transition: "all 0.2s"
                            }}
                            whileHover={!isSigningUp ? { scale: 1.02 } : {}}
                            whileTap={!isSigningUp ? { scale: 0.98 } : {}}
                        >
                            {isSigningUp ? "가입 중..." : `회원가입 (${useDirectConnection ? "직접 연결" : "프록시"})`}
                        </motion.button>

                        <div 
                            style={{
                                textAlign: "center",
                                marginTop: "20px",
                                fontSize: "14px",
                                color: "#6b7280"
                            }}
                        >
                            💡 계정 생성 후 관리자의 승인을 받으면<br/>
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
                                cursor: "pointer"
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