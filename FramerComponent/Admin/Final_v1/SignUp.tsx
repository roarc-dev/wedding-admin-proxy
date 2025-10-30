import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// 프록시 서버 URL (고정된 Production URL) - AccountBtn.tsx 패턴과 동일
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// Roarc 로고 이미지
const ROARC_LOGO_URL = "https://cdn.roarc.kr/framer/logo/roarc_logo.svg"

// Theme 정의 (Admin.tsx와 동일)
const theme: any = {
    font: {
        body:
            typography?.helpers?.stacks?.pretendardVariable ||
            '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    },
}

// 회원가입 함수 - 프록시를 통한 안전한 연결 (AccountBtn.tsx 패턴 참조)
interface SignupUserData {
    username: string
    password: string
    name: string
    wedding_date?: string
    groom_name_en?: string
    bride_name_en?: string
    page_id?: string
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
                wedding_date: userData.wedding_date,
                groom_name_en: userData.groom_name_en,
                bride_name_en: userData.bride_name_en,
                page_id: userData.page_id,
                role: "user", // SignUp으로 생성되는 계정은 user role로 고정
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
        wedding_date: "",
        groom_name_en: "",
        bride_name_en: "",
    })
    const [isSigningUp, setIsSigningUp] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [passwordMismatch, setPasswordMismatch] = useState(false)
    const [validationErrors, setValidationErrors] = useState<{
        name?: boolean
        username?: boolean
        password?: boolean
        confirmPassword?: boolean
        groom_name_en?: boolean
        bride_name_en?: boolean
    }>({})

    // 비밀번호 확인 검증
    const validatePasswordMatch = (password: string, confirmPassword: string) => {
        if (confirmPassword && password !== confirmPassword) {
            setPasswordMismatch(true)
        } else {
            setPasswordMismatch(false)
        }
    }

    // 필수 필드 검증
    const validateRequiredFields = () => {
        const errors: typeof validationErrors = {}
        
        if (!signupForm.name.trim()) errors.name = true
        if (!signupForm.username.trim()) errors.username = true
        if (!signupForm.password.trim()) errors.password = true
        if (!signupForm.confirmPassword.trim()) errors.confirmPassword = true
        if (!signupForm.groom_name_en.trim()) errors.groom_name_en = true
        if (!signupForm.bride_name_en.trim()) errors.bride_name_en = true
        
        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    // page_id 생성 함수
    const generatePageId = (groomName: string, brideName: string): string => {
        const cleanGroom = groomName.replace(/[\s\p{P}]/gu, '').toLowerCase()
        const cleanBride = brideName.replace(/[\s\p{P}]/gu, '').toLowerCase()
        return `${cleanGroom}${cleanBride}`
    }

    // 회원가입 처리
    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSigningUp(true)
        setError("")
        setSuccess("")

        // 필수 필드 검증
        if (!validateRequiredFields()) {
            setError("모든 칸을 입력해주세요.")
            setIsSigningUp(false)
            return
        }

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

        // page_id 생성
        const pageId = generatePageId(signupForm.groom_name_en, signupForm.bride_name_en)

        // 프록시를 통한 안전한 회원가입 시도
        const result = await signupUser({
            username: signupForm.username,
            password: signupForm.password,
            name: signupForm.name,
            wedding_date: signupForm.wedding_date,
            groom_name_en: signupForm.groom_name_en,
            bride_name_en: signupForm.bride_name_en,
            page_id: pageId,
        })

        if (result.success) {
            setSuccess(result.message)
            setSignupForm({
                username: "",
                password: "",
                confirmPassword: "",
                name: "",
                wedding_date: "",
                groom_name_en: "",
                bride_name_en: "",
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
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                minHeight: "100vh",
                position: "relative",
            }}
        >
            {/* Gap */}
            <div style={{ height: "16px", width: "100%" }} />

            {/* Logo */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 0",
                    gap: "48px",
                }}
            >
                <img
                    src={ROARC_LOGO_URL}
                    alt="Roarc Logo"
                    style={{
                        width: "178.472px",
                        height: "88px",
                    }}
                />
            </div>

            {/* Gap */}
            <div style={{ height: "16px", width: "100%" }} />

            {/* Form Container */}
                    <div
                        style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                    alignItems: "flex-start",
                    padding: "0 32px",
                    width: "100%",
                    maxWidth: "375px",
                }}
            >

                {/* 성공 메시지 */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                fontSize: "14px",
                                color: "#aeaeae",
                                lineHeight: "20px",
                                fontFamily: "Pretendard, sans-serif",
                                marginTop: "160px",
                                marginBottom: "160px",
                                textAlign: "center",
                                width: "100%",
                            }}
                        >
                            <span>회원가입 신청이 완료되었습니다.</span>
                            <br />
                            <span>제출주신 정보를 바탕으로 페이지 생성 중입니다.</span>
                            <br />
                            <span>로그인은 </span>
                            <span style={{ fontWeight: "700" }}>다음날 오전 10시</span>
                            <span>부터 가능합니다.</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!success && (
                    <form onSubmit={handleSignup} style={{ width: "100%" }}>
                        {/* 이름 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                이름
                                {validationErrors.name && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        이 칸을 작성하세요
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={signupForm.name}
                                onChange={(e) => {
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                    // 입력 시 검증 오류 해제
                                    if (validationErrors.name) {
                                        setValidationErrors(prev => ({ ...prev, name: false }))
                                }
                                }}
                                placeholder="네이버 스마트스토어 구매자 성함"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: `1px solid ${validationErrors.name ? "#ef4444" : "#e5e6e8"}`,
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.name ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 아이디 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                아이디
                                {validationErrors.username && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        이 칸을 작성하세요
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={signupForm.username}
                                onChange={(e) => {
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                    // 입력 시 검증 오류 해제
                                    if (validationErrors.username) {
                                        setValidationErrors(prev => ({ ...prev, username: false }))
                                }
                                }}
                                placeholder="네이버 스마트스토어 구매자 ID"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: `1px solid ${validationErrors.username ? "#ef4444" : "#e5e6e8"}`,
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.username ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 비밀번호 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                비밀번호
                                {validationErrors.password && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        이 칸을 작성하세요
                                    </span>
                                )}
                            </label>
                            <input
                                type="password"
                                value={signupForm.password}
                                onChange={(e) => {
                                    const newPassword = e.target.value
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        password: newPassword,
                                    }))
                                    // 비밀번호 변경 시 확인 필드도 검증
                                    validatePasswordMatch(newPassword, signupForm.confirmPassword)
                                    // 입력 시 검증 오류 해제
                                    if (validationErrors.password) {
                                        setValidationErrors(prev => ({ ...prev, password: false }))
                                }
                                }}
                                placeholder="6자 이상 입력해주세요"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: `1px solid ${validationErrors.password ? "#ef4444" : "#e5e6e8"}`,
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.password ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 비밀번호 확인 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                비밀번호 확인
                                {passwordMismatch && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        비밀번호를 확인해주세요
                                    </span>
                                )}
                                {validationErrors.confirmPassword && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        이 칸을 작성하세요
                                    </span>
                                )}
                            </label>
                            <input
                                type="password"
                                value={signupForm.confirmPassword}
                                onChange={(e) => {
                                    const newConfirmPassword = e.target.value
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        confirmPassword: newConfirmPassword,
                                    }))
                                    // 비밀번호 확인 검증
                                    validatePasswordMatch(signupForm.password, newConfirmPassword)
                                    // 입력 시 검증 오류 해제
                                    if (validationErrors.confirmPassword) {
                                        setValidationErrors(prev => ({ ...prev, confirmPassword: false }))
                                    }
                                }}
                                placeholder="비밀번호를 다시 입력해주세요"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: `1px solid ${validationErrors.confirmPassword ? "#ef4444" : "#e5e6e8"}`,
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.confirmPassword ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 필독 안내 */}
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#aeaeae",
                                lineHeight: "20px",
                                marginBottom: "24px",
                                fontFamily: "Pretendard, sans-serif",
                            }}
                        >
                            <p style={{ margin: "0 0 4px 0", fontWeight: "400" }}>***중요</p>
                            <p style={{ margin: "0" }}>
                                아래 정보로 모바일 카드 링크와 내용이 자동 생성됩니다. 제출된 정보값은 수정 및 재제출이 불가하오니 정확하게 입력해주세요.
                            </p>
                        </div>

                        {/* 예식일자 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                예식일자
                            </label>
                            <input
                                type="date"
                                value={signupForm.wedding_date}
                                onChange={(e) =>
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        wedding_date: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: "1px solid #e5e6e8",
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.wedding_date ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 신랑 영문 이름 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                신랑 영문 이름
                                {validationErrors.groom_name_en && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        이 칸을 작성하세요
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={signupForm.groom_name_en}
                                onChange={(e) => {
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        groom_name_en: e.target.value,
                                    }))
                                    if (validationErrors.groom_name_en) {
                                        setValidationErrors(prev => ({ ...prev, groom_name_en: false }))
                                    }
                                }}
                                placeholder="MIN JUN (*성 제외)"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: `1px solid ${validationErrors.groom_name_en ? "#ef4444" : "#e5e6e8"}`,
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.groom_name_en ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 신부 영문 이름 필드 */}
                        <div style={{ marginBottom: "24px", width: "100%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "12px",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#000000",
                                    fontFamily: theme.font.body,
                                }}
                            >
                                신부 영문 이름
                                {validationErrors.bride_name_en && (
                                    <span style={{ color: "#ef4444", marginLeft: "8px", fontSize: "12px" }}>
                                        이 칸을 작성하세요
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={signupForm.bride_name_en}
                                onChange={(e) => {
                                    setSignupForm((prev) => ({
                                        ...prev,
                                        bride_name_en: e.target.value,
                                    }))
                                    if (validationErrors.bride_name_en) {
                                        setValidationErrors(prev => ({ ...prev, bride_name_en: false }))
                                    }
                                }}
                                placeholder="SEO YUN (*성 제외)"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: `1px solid ${validationErrors.bride_name_en ? "#ef4444" : "#e5e6e8"}`,
                                    borderRadius: "2px",
                                    boxSizing: "border-box",
                                    fontSize: "14px",
                                    outline: "none",
                                    fontFamily: theme.font.body,
                                    color: signupForm.bride_name_en ? "#000000" : "#aeaeae",
                                }}
                            />
                        </div>

                        {/* 안내 메시지 */}
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#aeaeae",
                                lineHeight: "20px",
                                marginBottom: "24px",
                                fontFamily: "Pretendard, sans-serif",
                            }}
                        >
                            <span>회원가입 신청 후 </span>
                            <span style={{ fontWeight: "700" }}>다음날 오전 10시</span>부터 로그인 가능합니다. 로그인이 불가한 경우 카카오톡 채널로 문의바랍니다.
                        </div>

                        {error && (
                            <div
                                style={{
                                    padding: "12px",
                                    color: "#dc2626",
                                    marginBottom: "20px",
                                    textAlign: "center",
                                    width: "100%",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* 회원가입 버튼 */}
                        <motion.button
                            type="submit"
                            disabled={isSigningUp}
                            style={{
                                width: "100%",
                                    height: "50px",
                                    backgroundColor: isSigningUp ? "#9ca3af" : "#000000",
                                    color: "#e6e6e6",
                                border: "none",
                                    borderRadius: "0px",
                                    fontSize: "14px",
                                fontWeight: "600",
                                cursor: isSigningUp ? "not-allowed" : "pointer",
                                    fontFamily: theme.font.body,
                                    marginBottom: "24px",
                            }}
                            whileHover={!isSigningUp ? { scale: 1.02 } : {}}
                            whileTap={!isSigningUp ? { scale: 0.98 } : {}}
                        >
                            {isSigningUp ? "가입 중..." : "회원가입 신청하기"}
                        </motion.button>
                    </form>
                )}

            </div>

            {/* Gap */}
            <div style={{ height: "48px", width: "100%" }} />

            {/* Footer */}
            <div
                style={{
                    width: "100%",
                    height: "108px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 40,
                    paddingBottom: 30,
                    gap: 10,
                }}
            >
                <div
                            style={{
                        overflow: "hidden",
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        opacity: 0.3,
                        gap: 10,
                    }}
                >
                    <div data-svg-wrapper>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="57"
                            height="13"
                            viewBox="0 0 57 13"
                            fill="none"
                        >
                            <path
                                d="M20.0771 0.908438C19.2193 0.322116 18.1965 0.0300293 17.0106 0.0300293C15.4195 0.0300293 14.045 0.57984 12.8913 1.67731C11.7355 2.77693 11.1587 4.38556 11.1587 6.50534C11.1587 7.92067 11.4375 9.11909 11.995 10.0941C12.5525 11.0713 13.2709 11.7994 14.1479 12.2783C15.025 12.7573 15.9556 12.9957 16.9399 12.9957C17.9863 12.9957 18.947 12.7358 19.824 12.2118C20.7011 11.6899 21.398 10.9339 21.9126 9.9481C22.4273 8.9623 22.6846 7.80469 22.6846 6.47527C22.6846 5.3241 22.4637 4.25455 22.0241 3.26661C21.5824 2.28082 20.9327 1.49261 20.0749 0.908438H20.0771ZM19.5774 9.24795C19.4595 10.0898 19.1936 10.7943 18.7797 11.3634C18.3659 11.9326 17.7612 12.2182 16.9677 12.2182C15.7648 12.2182 14.9842 11.7028 14.6261 10.6719C14.268 9.64098 14.09 8.29007 14.09 6.61702C14.09 5.25967 14.1715 4.15576 14.3323 3.30312C14.4932 2.45263 14.7784 1.82121 15.1836 1.41315C15.5889 1.00723 16.1529 0.8032 16.8777 0.8032C18.012 0.8032 18.7754 1.26925 19.1679 2.2035C19.5603 3.13775 19.7576 4.52731 19.7576 6.37218C19.7576 7.44603 19.6975 8.40605 19.5817 9.2458L19.5774 9.24795Z"
                                fill="black"
                            />
                            <path
                                d="M34.9243 11.5696C34.8171 11.7221 34.6756 11.7973 34.4954 11.7973C34.3003 11.7973 34.1481 11.7458 34.043 11.6405C33.9358 11.5353 33.8607 11.4021 33.8114 11.241C33.7621 11.08 33.7299 10.9082 33.7149 10.7277C33.6977 10.5473 33.6892 10.382 33.6892 10.2295V3.98827C33.6892 3.20866 33.5626 2.56435 33.3096 2.05105C33.0566 1.53775 32.7263 1.12969 32.3189 0.826863C31.9115 0.524038 31.4376 0.309268 30.8994 0.184702C30.3611 0.0622832 29.8143 0 29.2611 0C28.8858 0 28.4441 0.0322155 27.9401 0.0987941C27.4341 0.165373 26.958 0.287791 26.5099 0.468198C26.0617 0.648605 25.6821 0.899885 25.3712 1.22419C25.3519 1.24352 25.3369 1.27144 25.3197 1.29291C25.3069 1.3058 25.2897 1.31439 25.279 1.32728C24.9059 1.71601 24.61 2.40757 24.715 2.92087C24.9059 3.85941 25.9909 3.81646 26.5849 3.44705C27.3183 2.98959 26.8723 2.41186 26.8851 1.78688C26.8916 1.52057 26.8937 1.20056 27.3633 0.936396C27.3955 0.92351 27.4191 0.908476 27.4534 0.89559C27.6807 0.809682 27.9316 0.749546 28.1996 0.710888C28.4677 0.672229 28.725 0.6529 28.9694 0.6529C29.4734 0.6529 29.8658 0.762433 30.1445 0.981498C30.4212 1.20056 30.6249 1.46688 30.7557 1.78044C30.8865 2.094 30.9637 2.41616 30.9873 2.74905C31.013 3.08195 31.0237 3.36115 31.0237 3.5888V4.41567C31.0237 4.58748 30.9036 4.74856 30.6678 4.90105C30.4319 5.05353 30.0931 5.24253 29.6535 5.47019C29.2461 5.68066 28.7571 5.90832 28.1867 6.1553C27.6163 6.40229 27.0695 6.70082 26.5485 7.05304C26.0252 7.40526 25.5814 7.82621 25.2147 8.32018C24.848 8.81415 24.6636 9.40262 24.6636 10.0877C24.6636 10.5817 24.7408 11.0091 24.8973 11.3699C25.0517 11.7307 25.2597 12.0293 25.5213 12.2676C25.7829 12.506 26.0788 12.68 26.4134 12.7938C26.7479 12.9077 27.0931 12.9656 27.4534 12.9656C28.2189 12.9656 28.8794 12.8132 29.4348 12.5103C29.9902 12.2075 30.552 11.7801 31.1224 11.2282C31.3025 11.7973 31.5663 12.2311 31.9179 12.5254C32.2675 12.8196 32.7542 12.9678 33.3739 12.9678C33.717 12.9678 34.0172 12.8969 34.2789 12.7552C34.5405 12.6113 34.7571 12.4523 34.9265 12.2698C35.098 12.0894 35.231 11.909 35.3296 11.7286C35.4282 11.5482 35.4926 11.4107 35.5247 11.3162L35.2052 11.1165C35.1237 11.269 35.0294 11.4215 34.9243 11.5718V11.5696ZM31.0216 10.4228C30.7278 10.7857 30.3804 11.0907 29.9816 11.3377C29.5806 11.5868 29.1539 11.7092 28.6971 11.7092C28.4677 11.7092 28.2682 11.647 28.0967 11.5224C27.9251 11.3978 27.7815 11.2368 27.6678 11.0349C27.5542 10.8351 27.4684 10.6161 27.4105 10.3777C27.3526 10.1393 27.3247 9.89659 27.3247 9.64746C27.3247 8.97952 27.4298 8.44045 27.6421 8.03024C27.8544 7.62003 28.131 7.2721 28.4741 6.98431C28.8172 6.69867 29.2075 6.44524 29.6492 6.22617C30.0888 6.00711 30.5455 5.75368 31.0194 5.46804V10.4206L31.0216 10.4228Z"
                                fill="black"
                            />
                            <path
                                d="M55.3281 10.9855C55.133 11.1852 54.8992 11.3699 54.6312 11.5417C54.3631 11.7136 54.0608 11.851 53.7263 11.9562C53.3917 12.0615 53.0294 12.113 52.6391 12.113C51.7084 12.113 50.9708 11.6341 50.4261 10.6741C49.8793 9.71405 49.607 8.34167 49.607 6.55693C49.607 5.83531 49.6563 5.12227 49.7549 4.41997C49.8514 3.71768 50.0187 3.09055 50.2567 2.53859C50.4926 1.98878 50.8035 1.54206 51.1874 1.20057C51.569 0.85909 52.0472 0.687274 52.6176 0.687274C52.7635 0.687274 52.9157 0.706604 53.0701 0.743114C53.2202 0.779625 53.3596 0.826875 53.4882 0.882715C53.812 1.11681 53.9278 1.45615 53.9321 1.69669C53.945 2.32167 53.499 2.8994 54.2323 3.35686C54.8285 3.72841 55.9114 3.77137 56.1022 2.83068C56.2073 2.31738 55.9114 1.62367 55.5382 1.23708C55.4182 1.11037 55.2595 0.979361 55.1008 0.852647C55.0257 0.790364 54.9485 0.732376 54.8671 0.678684C54.8542 0.670093 54.837 0.655059 54.8242 0.646468C54.8242 0.646468 54.8242 0.648616 54.822 0.650763C54.7255 0.58848 54.6333 0.521902 54.5283 0.472505C54.1852 0.311427 53.8356 0.197599 53.4754 0.131021C53.1173 0.064442 52.8321 0.0322266 52.6198 0.0322266C51.7878 0.0322266 51.0137 0.201895 50.2953 0.545526C49.5769 0.88701 48.9529 1.35736 48.4233 1.95656C47.8936 2.55577 47.4733 3.26666 47.1624 4.09352C46.8536 4.92039 46.6992 5.80739 46.6992 6.75882C46.6992 7.76609 46.8407 8.65308 47.1281 9.42411C47.4133 10.193 47.7971 10.8437 48.2775 11.3764C48.7578 11.909 49.3175 12.3128 49.9522 12.5877C50.5891 12.8626 51.2646 13 51.9829 13C52.7013 13 53.4582 12.8153 54.2087 12.4438C54.9593 12.0744 55.5961 11.4902 56.1172 10.6912L55.8492 10.4056C55.7034 10.5968 55.5318 10.79 55.3345 10.9898L55.3281 10.9855Z"
                                fill="black"
                            />
                            <path
                                d="M10.1143 0.927777C10.1143 0.927777 10.1101 0.923482 10.1079 0.921334C10.1058 0.917039 10.1036 0.912743 10.1015 0.908448C10.0993 0.908448 10.0972 0.9063 10.095 0.9063C9.95995 0.708712 9.80127 0.549782 9.61256 0.431659C9.41743 0.30924 9.20943 0.227628 8.98856 0.188969C8.76983 0.150311 8.57684 0.130981 8.41387 0.130981C7.72982 0.130981 7.09724 0.377967 6.51826 0.871937C5.93929 1.36591 5.45466 2.07894 5.06224 3.0089C5.04509 2.51493 5.00864 2.01666 4.95288 1.51195C4.89498 1.00939 4.81779 0.547635 4.71915 0.130981C4.45754 0.264139 4.1659 0.388705 3.83782 0.500385C3.51188 0.614213 3.17736 0.715155 2.83426 0.798915C2.49116 0.884823 2.14807 0.959993 1.80711 1.02657C1.46402 1.09315 1.15309 1.14469 0.876465 1.18335V1.69665C1.35037 1.69665 1.74064 1.80189 2.05157 2.01022C2.36036 2.21854 2.5169 2.69318 2.5169 3.43414V10.7578C2.5169 11.1379 2.47615 11.4322 2.39467 11.6405C2.31318 11.851 2.19953 12.0099 2.05157 12.1259C1.90575 12.2397 1.73421 12.3106 1.53693 12.3406C1.34179 12.3686 1.12092 12.3836 0.876465 12.3836V12.8969H6.82061V12.3836C6.57616 12.3836 6.35744 12.3686 6.16015 12.3406C5.96502 12.3127 5.79347 12.2418 5.64551 12.128C5.49969 12.0142 5.3839 11.8531 5.30241 11.6448C5.22093 11.4365 5.18018 11.1422 5.18018 10.7642V5.67634C5.18018 5.25968 5.24451 4.79148 5.37532 4.26959C5.50613 3.7477 5.6884 3.26018 5.92642 2.80487C6.1623 2.34955 6.43034 1.96726 6.7327 1.6537C7.03505 1.34014 7.3567 1.18335 7.69766 1.18335C7.78557 1.18335 7.86492 1.19839 7.93997 1.22201C8.05147 1.26282 8.10937 1.35517 8.09436 1.4647C8.07292 1.62363 7.75341 2.15626 8.48678 2.61157C9.08291 2.98312 10.1658 3.02608 10.3567 2.08753C10.4124 1.80833 10.3502 1.47974 10.2216 1.17261C10.1894 1.08456 10.1529 1.0008 10.1058 0.927777H10.1143Z"
                                fill="black"
                            />
                            <path
                                d="M45.8181 0.927777C45.8181 0.927777 45.8138 0.923482 45.8116 0.921334C45.8095 0.917039 45.8073 0.912743 45.8052 0.908448C45.8031 0.908448 45.8009 0.9063 45.7988 0.9063C45.6637 0.708712 45.505 0.549782 45.3163 0.431659C45.1211 0.30924 44.9131 0.227628 44.6923 0.188969C44.4714 0.150311 44.2806 0.130981 44.1176 0.130981C43.4335 0.130981 42.801 0.377967 42.222 0.871937C41.643 1.36591 41.1584 2.07894 40.766 3.0089C40.7488 2.51493 40.7124 2.01666 40.6566 1.51195C40.5987 1.00939 40.5215 0.547635 40.425 0.130981C40.1634 0.264139 39.8696 0.388705 39.5437 0.500385C39.2177 0.614213 38.8832 0.715155 38.5423 0.798915C38.1992 0.884823 37.8561 0.959993 37.5151 1.02657C37.172 1.09315 36.8632 1.14469 36.5845 1.18335V1.69665C37.0584 1.69665 37.4486 1.80189 37.7596 2.01022C38.0684 2.21854 38.2249 2.69318 38.2249 3.43414V10.7578C38.2249 11.1379 38.1842 11.4322 38.1027 11.6405C38.0212 11.851 37.9075 12.0099 37.7596 12.1259C37.6138 12.2397 37.4422 12.3106 37.2449 12.3406C37.0498 12.3686 36.8289 12.3836 36.5845 12.3836V12.8969H42.5286V12.3836C42.2842 12.3836 42.0633 12.3686 41.8682 12.3406C41.673 12.3127 41.5015 12.2418 41.3535 12.128C41.2077 12.0142 41.0919 11.8531 41.0126 11.6448C40.9311 11.4365 40.8903 11.1422 40.8903 10.7642V5.67634C40.8903 5.25968 40.9547 4.79148 41.0855 4.26959C41.2163 3.7477 41.4007 3.26018 41.6366 2.80487C41.8725 2.34955 42.1426 1.96726 42.4428 1.6537C42.7452 1.34014 43.0669 1.18335 43.4078 1.18335C43.4957 1.18335 43.5751 1.19839 43.6501 1.22201C43.7616 1.26282 43.8195 1.35517 43.8045 1.4647C43.7831 1.62363 43.4636 2.15626 44.1969 2.61157C44.7909 2.98312 45.876 3.02608 46.0668 2.08753C46.1226 1.80833 46.0604 1.47974 45.9317 1.17261C45.8996 1.08456 45.8631 1.0008 45.8159 0.927777H45.8181Z"
                                fill="black"
                            />
                        </svg>
                    </div>
                </div>
                <span
                    style={{
                        color: "#BABABA",
                        fontSize: 12,
                        fontFamily: theme.font.body,
                        wordWrap: "break-word",
                    }}
                >
                    © roarc. all rights reseved.
                </span>
            </div>
        </div>
    )
}

// Property Controls
addPropertyControls(UserSignup, {
    // 필요한 경우 프로퍼티 컨트롤 추가
})
