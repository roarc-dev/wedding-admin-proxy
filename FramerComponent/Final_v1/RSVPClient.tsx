import React, { useState, useCallback, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=6fdc95bcc8fd197d879c051a8c2d5a03"

// API 기본 엔드포인트 (배포 환경 기준)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface RSVPClientProps {
    pageId?: string
    style?: React.CSSProperties
    backgroundColor?: string
    buttonColor?: string
    buttonTextColor?: string
    borderColor?: string
    accentColor?: string
    textColor?: string
    selectionTextColor?: string
    selectionButtonBgColor?: string
    selectionButtonBorderColor?: string
    selectionButtonActiveBgColor?: string
    selectionButtonActiveBorderColor?: string
    checkboxBorderColor?: string
    checkboxCheckedBgColor?: string
    checkboxCheckedBorderColor?: string
}

interface PageSettingsResp {
    data?: { rsvp?: string; type?: string }
    rsvp?: string
    type?: string
    success?: boolean
}

interface ErrorsShape {
    [key: string]: string | undefined
}

export default function RSVPClient(props: RSVPClientProps) {
    const {
        pageId = "",
        style,
        backgroundColor = "transparent",
        buttonColor = "#e0e0e0",
        buttonTextColor = "#000",
        borderColor = "#99999933",
        accentColor = "#000",
        textColor = "#999999",
        selectionTextColor = "#000000",
        selectionButtonBgColor = "#bbbbbb26",
        selectionButtonBorderColor = "#88888819",
        selectionButtonActiveBgColor = "#99999966",
        selectionButtonActiveBorderColor = "#00000088",
        checkboxBorderColor = "#88888833",
        checkboxCheckedBgColor = "#000",
        checkboxCheckedBorderColor = "#000",
    } = props || {}

    const [formData, setFormData] = useState({
        guestName: "",
        guestType: "",
        relationType: "",
        mealTime: "",
        guestCount: 1,
        phoneNumber: "",
        consentPersonalInfo: false,
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState("")
    const [errors, setErrors] = useState<ErrorsShape>({})
    const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false)
    const [displayStyle, setDisplayStyle] = useState<"none" | "block">("none")
    const [pageType, setPageType] = useState("")

    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[RSVPClient] Failed to ensure typography fonts:", error)
        }
    }, [])

    const pretendardFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const p22FontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.p22 ||
                '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const goldenbookFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.goldenbook ||
                '"Goldenbook", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Goldenbook", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const titleFontFamily = useMemo(() => {
        const normalizedType = (pageType || "").toLowerCase().trim()
        if (normalizedType.includes("eternal")) {
            return goldenbookFontFamily
        }
        if (
            normalizedType.includes("papillon") ||
            normalizedType.includes("fiore")
        ) {
            return p22FontFamily
        }
        return p22FontFamily
    }, [pageType, goldenbookFontFamily, p22FontFamily])

    // 서버에서 page_settings.rsvp 값을 조회해 표시 상태를 동기화
    useEffect(() => {
        let cancelled = false
        async function fetchRsvp() {
            try {
                if (!pageId) return
                const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) return
                const json = (await res.json()) as PageSettingsResp
                const serverRsvp =
                    (json && json.data && json.data.rsvp) || json?.rsvp
                const settingsType =
                    (json && json.data && json.data.type) || json?.type || ""
                if (!cancelled) {
                    if (serverRsvp === "on" || serverRsvp === "off") {
                        setDisplayStyle(serverRsvp === "on" ? "block" : "none")
                    }
                    setPageType(settingsType)
                }
            } catch (_) {}
        }
        fetchRsvp()
        return () => {
            cancelled = true
        }
    }, [pageId])

    const formatPhoneNumber = useCallback(
        (value: string) => {
            const numbers = value.replace(/[^\d]/g, "")
            if (numbers.length > 11) return formData.phoneNumber || ""
            if (numbers.length <= 3) return numbers
            else if (numbers.length <= 7)
                return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
            else
                return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
        },
        [formData.phoneNumber]
    )

    const validateForm = useCallback(() => {
        const newErrors: ErrorsShape = {}
        if (!formData.guestName.trim())
            newErrors.guestName = "성함을 입력해주세요"
        if (!formData.guestType)
            newErrors.guestType = "신랑측/신부측을 선택해주세요"
        if (!formData.relationType)
            newErrors.relationType = "참석 여부를 선택해주세요"
        if (!formData.mealTime) newErrors.mealTime = "식사 여부를 선택해주세요"
        const phoneRegex = /^010-\d{4}-\d{4}$/
        if (!formData.phoneNumber)
            newErrors.phoneNumber = "연락처를 입력해주세요"
        else if (!phoneRegex.test(formData.phoneNumber))
            newErrors.phoneNumber = "010-1234-5678 형식으로 입력해주세요"
        if (!formData.consentPersonalInfo)
            newErrors.consentPersonalInfo =
                "개인정보 수집 및 이용에 동의해주세요"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const target = e.target
            const name = target.name as keyof typeof formData
            const value = (target as HTMLInputElement | HTMLSelectElement).value
            const inputType = (target as HTMLInputElement).type
            const isChecked = (target as HTMLInputElement).checked

            if (name === "phoneNumber") {
                const formattedValue = formatPhoneNumber(value)
                setFormData((prev) => ({ ...prev, [name]: formattedValue }))
            } else if (name === "guestCount") {
                const numeric = Number(value)
                setFormData((prev) => ({
                    ...prev,
                    guestCount: Number.isFinite(numeric)
                        ? numeric
                        : prev.guestCount,
                }))
            } else {
                setFormData((prev) => ({
                    ...prev,
                    [name]:
                        inputType === "checkbox" ? isChecked === true : value,
                }))
            }

            if (errors[name])
                setErrors((prev) => ({ ...prev, [name]: undefined }))
        },
        [formatPhoneNumber, errors]
    )

    const handleSubmit = useCallback(async () => {
        // console.log("제출 시작 - 현재 폼 데이터:", formData)
        if (!validateForm()) return
        if (!pageId) {
            alert(
                "페이지 ID가 설정되지 않았습니다. Property Panel에서 pageId를 입력하세요."
            )
            return
        }

        setIsSubmitting(true)
        setSubmitStatus("")

        const requestData = {
            guest_name: formData.guestName,
            guest_type: formData.guestType,
            relation_type: formData.relationType,
            meal_time: formData.mealTime,
            guest_count: formData.guestCount,
            phone_number: formData.phoneNumber,
            consent_personal_info: formData.consentPersonalInfo,
            page_id: pageId,
        }

        try {
            const url = `${PROXY_BASE_URL}/api/rsvp-unified`
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "submit",
                    ...requestData,
                }),
            })

            if (!response.ok)
                throw new Error(
                    ((await response.json()) as any).error ||
                        `HTTP ${response.status}`
                )
            // const result = await response.json()
            // console.log("제출 성공:", result)

            setSubmitStatus("success")
            setFormData({
                guestName: "",
                guestType: "",
                relationType: "",
                mealTime: "",
                guestCount: 1,
                phoneNumber: "",
                consentPersonalInfo: false,
            })
        } catch (error: any) {
            // console.error("제출 에러:", error)
            setSubmitStatus("error")
            alert(`제출 실패: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }, [formData, validateForm, pageId, errors])

    if (submitStatus === "success") {
        return (
            <div
                style={{
                    margin: "80px 0",
                    backgroundColor: "#F5F5F5",
                    padding: "80px 0",
                }}
            >
                <div
                    style={{
                        ...(style || {}),
                        width: "75%",
                        height: "fit-content",
                        maxWidth: "400px",
                        margin: "0 auto",
                        padding: "24px",
                        backgroundColor,
                        borderRadius: "0px",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                color: "#10b981",
                                fontSize: "48px",
                                marginBottom: "16px",
                            }}
                        >
                            ✓
                        </div>
                        <h2
                            style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#1f2937",
                                marginBottom: "8px",
                                fontFamily: pretendardFontFamily,
                            }}
                        >
                            참석 의사 전달 완료
                        </h2>
                        <p
                            style={{
                                color: "#6b7280",
                                marginBottom: "24px",
                                fontFamily: pretendardFontFamily,
                            }}
                        >
                            소중한 시간을 내어 참석해 주셔서 감사합니다.
                        </p>
                        <button
                            onClick={() => setSubmitStatus("")}
                            style={{
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                padding: "8px 24px",
                                borderRadius: "0px",
                                border: `1px solid ${buttonColor}`,
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                fontFamily: pretendardFontFamily,
                                fontWeight: 500,
                            }}
                        >
                            다시 작성하기
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // RSVP가 비활성화된 경우 숨김 (displayStyle로 제어)
    if (displayStyle === "none") {
        return <div style={{ display: "none" }}>{null}</div>
    }

    return (
        <div
            style={{
                backgroundColor: "#F5F5F5",
                padding: "80px 0",
                display: displayStyle,
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                style={{
                    width: "100%",
                    height: "fit-content",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: titleFontFamily,
                    fontSize: "25px",
                    letterSpacing: "0.05em",
                    lineHeight: "0.7em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    marginBottom: "20px",
                }}
            >
                RSVP
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                style={{
                    fontFamily: pretendardFontFamily,
                    fontSize: "15px",
                    color: "#8c8c8c",
                    lineHeight: "1.8em",
                    textAlign: "center",
                    marginBottom: "30px",
                }}
            >
                결혼식 참석 여부를 알려주세요
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                style={{
                    ...(style || {}),
                    width: "75%",
                    height: "fit-content",
                    maxWidth: "400px",
                    margin: "0 auto",
                    padding: "0px",
                    backgroundColor,
                    borderRadius: "0px",
                }}
            >
                {/* viewport meta 강제 */}
                <div
                    dangerouslySetInnerHTML={{
                        __html: '<script>if (!document.querySelector(\'meta[name="viewport"][content*="user-scalable=no"]\')) { var meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"; document.getElementsByTagName("head")[0].appendChild(meta); }</script>',
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "15px",
                        alignItems: "center",
                    }}
                >
                    {/* 신랑측/신부측 선택 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "10px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        guestType: "신랑측",
                                    }))
                                }
                                style={{
                                    padding: "10px",
                                    borderRadius: "0px",
                                    fontSize: "12px",
                                    fontFamily: pretendardFontFamily,
                                    border:
                                        formData.guestType === "신랑측"
                                            ? `1px solid ${selectionButtonActiveBorderColor}`
                                            : `1px solid ${selectionButtonBorderColor}`,
                                    backgroundColor:
                                        formData.guestType === "신랑측"
                                            ? selectionButtonActiveBgColor
                                            : selectionButtonBgColor,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    color:
                                        formData.guestType === "신랑측"
                                            ? selectionTextColor
                                            : textColor,
                                }}
                            >
                                신랑측
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        guestType: "신부측",
                                    }))
                                }
                                style={{
                                    padding: "10px",
                                    borderRadius: "0px",
                                    fontSize: "12px",
                                    fontFamily: pretendardFontFamily,
                                    border:
                                        formData.guestType === "신부측"
                                            ? `1px solid ${selectionButtonActiveBorderColor}`
                                            : `1px solid ${selectionButtonBorderColor}`,
                                    backgroundColor:
                                        formData.guestType === "신부측"
                                            ? selectionButtonActiveBgColor
                                            : selectionButtonBgColor,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    color:
                                        formData.guestType === "신부측"
                                            ? selectionTextColor
                                            : textColor,
                                }}
                            >
                                신부측
                            </button>
                        </div>
                    </div>

                    {/* 참석 여부 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            width: "100%",
                        }}
                    >
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: textColor,
                            }}
                        >
                            참석 여부
                        </label>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "10px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        relationType: "참석",
                                    }))
                                }
                                style={{
                                    padding: "10px",
                                    borderRadius: "0px",
                                    fontSize: "12px",
                                    fontFamily: pretendardFontFamily,
                                    border:
                                        formData.relationType === "참석"
                                            ? `1px solid ${selectionButtonActiveBorderColor}`
                                            : `1px solid ${selectionButtonBorderColor}`,
                                    backgroundColor:
                                        formData.relationType === "참석"
                                            ? selectionButtonActiveBgColor
                                            : selectionButtonBgColor,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    color:
                                        formData.relationType === "참석"
                                            ? selectionTextColor
                                            : textColor,
                                }}
                            >
                                참석
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        relationType: "미참석",
                                    }))
                                }
                                style={{
                                    padding: "10px",
                                    borderRadius: "0px",
                                    fontSize: "12px",
                                    fontFamily: pretendardFontFamily,
                                    border:
                                        formData.relationType === "미참석"
                                            ? `1px solid ${selectionButtonActiveBorderColor}`
                                            : `1px solid ${selectionButtonBorderColor}`,
                                    backgroundColor:
                                        formData.relationType === "미참석"
                                            ? selectionButtonActiveBgColor
                                            : selectionButtonBgColor,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    color:
                                        formData.relationType === "미참석"
                                            ? selectionTextColor
                                            : textColor,
                                }}
                            >
                                미참석
                            </button>
                        </div>
                    </div>

                    {/* 식사 여부 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            width: "100%",
                        }}
                    >
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: textColor,
                            }}
                        >
                            식사 여부
                        </label>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "12px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        mealTime: "식사 가능",
                                    }))
                                }
                                style={{
                                    padding: "10px",
                                    borderRadius: "0px",
                                    fontSize: "12px",
                                    fontFamily: pretendardFontFamily,
                                    border:
                                        formData.mealTime === "식사 가능"
                                            ? `1px solid ${selectionButtonActiveBorderColor}`
                                            : `1px solid ${selectionButtonBorderColor}`,
                                    backgroundColor:
                                        formData.mealTime === "식사 가능"
                                            ? selectionButtonActiveBgColor
                                            : selectionButtonBgColor,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    color:
                                        formData.mealTime === "식사 가능"
                                            ? selectionTextColor
                                            : textColor,
                                }}
                            >
                                식사 가능
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        mealTime: "식사 불가",
                                    }))
                                }
                                style={{
                                    padding: "10px",
                                    borderRadius: "0px",
                                    fontSize: "12px",
                                    fontFamily: pretendardFontFamily,
                                    border:
                                        formData.mealTime === "식사 불가"
                                            ? `1px solid ${selectionButtonActiveBorderColor}`
                                            : `1px solid ${selectionButtonBorderColor}`,
                                    backgroundColor:
                                        formData.mealTime === "식사 불가"
                                            ? selectionButtonActiveBgColor
                                            : selectionButtonBgColor,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    color:
                                        formData.mealTime === "식사 불가"
                                            ? selectionTextColor
                                            : textColor,
                                }}
                            >
                                식사 불가
                            </button>
                        </div>
                    </div>

                    {/* 성함과 인원 */}
                    <div
                        style={{ display: "flex", gap: "10px", width: "100%" }}
                    >
                        {/* 성함 */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                flex: "1",
                            }}
                        >
                            <label
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: textColor,
                                }}
                            >
                                성함
                            </label>
                            <div
                                style={{ position: "relative", width: "100%" }}
                            >
                                <input
                                    type="text"
                                    name="guestName"
                                    value={formData.guestName}
                                    onChange={handleInputChange}
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    padding: "0 12px",
                                    border: errors.guestName
                                        ? "1px solid #dc2626"
                                        : `1px solid ${borderColor}`,
                                    borderRadius: "0px",
                                    fontFamily: pretendardFontFamily,
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    backgroundColor: "#bbbbbb26",
                                    color: "transparent",
                                        WebkitTextSizeAdjust: "100%",
                                    }}
                                    required
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "0",
                                        left: "12px",
                                        right: "12px",
                                        height: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: "14px",
                                        fontFamily: pretendardFontFamily,
                                        color: "#000000",
                                        pointerEvents: "none",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                    }}
                                >
                                    {formData.guestName || "홍길동"}
                                </div>
                                {!formData.guestName && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "0",
                                            left: "12px",
                                            right: "12px",
                                            height: "40px",
                                            display: "flex",
                                            alignItems: "center",
                                            fontSize: "14px",
                                            fontFamily: pretendardFontFamily,
                                            color: "#999999",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        홍길동
                                    </div>
                                )}
                            </div>
                            {errors.guestName && (
                                <div
                                    style={{
                                        color: "#dc2626",
                                        fontSize: "12px",
                                        fontFamily: pretendardFontFamily,
                                    }}
                                >
                                    {errors.guestName}
                                </div>
                            )}
                        </div>

                        {/* 인원 */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                flex: "1",
                            }}
                        >
                            <label
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: textColor,
                                }}
                            >
                                인원
                            </label>
                            <div
                                style={{ position: "relative", width: "100%" }}
                            >
                                <select
                                    name="guestCount"
                                    value={formData.guestCount}
                                    onChange={handleInputChange}
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    padding: "0 35px 0 12px",
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: "0px",
                                    fontFamily: pretendardFontFamily,
                                    fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "#bbbbbb26",
                                        color: "#000",
                                        appearance: "none",
                                        WebkitAppearance: "none",
                                        MozAppearance: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                        (num) => (
                                            <option key={num} value={num}>
                                                {num}
                                            </option>
                                        )
                                    )}
                                </select>
                                <div
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        pointerEvents: "none",
                                        color: "#888888",
                                    }}
                                >
                                    <svg
                                        width="12"
                                        height="7"
                                        viewBox="0 0 12 7"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M1 1L6 6L11 1"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 연락처 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            width: "100%",
                        }}
                    >
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: textColor,
                            }}
                        >
                            연락처
                        </label>
                        <div style={{ position: "relative", width: "100%" }}>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                maxLength={13}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: errors.phoneNumber
                                        ? "1px solid #dc2626"
                                        : `1px solid ${borderColor}`,
                                    borderRadius: "0px",
                                    fontFamily: pretendardFontFamily,
                                    fontSize: "16px",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    backgroundColor: "#bbbbbb26",
                                    color: "transparent",
                                    WebkitTextSizeAdjust: "100%",
                                }}
                                required
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "12px",
                                    right: "12px",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: "14px",
                                    fontFamily: pretendardFontFamily,
                                    color: "#000000",
                                    pointerEvents: "none",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                }}
                            >
                                {formData.phoneNumber || "010-1234-5678"}
                            </div>
                            {!formData.phoneNumber && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "12px",
                                        right: "12px",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: "14px",
                                        fontFamily: pretendardFontFamily,
                                        color: "#999999",
                                        pointerEvents: "none",
                                    }}
                                >
                                    010-1234-5678
                                </div>
                            )}
                        </div>
                        {errors.phoneNumber && (
                            <div style={{ color: "#dc2626", fontSize: "12px" }}>
                                {errors.phoneNumber}
                            </div>
                        )}
                    </div>

                    {/* 개인정보 동의 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "16px",
                                    height: "16px",
                                    flexShrink: 0,
                                    marginTop: "2px",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    name="consentPersonalInfo"
                                    checked={formData.consentPersonalInfo}
                                    onChange={handleInputChange}
                                    style={{
                                        position: "absolute",
                                        opacity: 0,
                                        width: "100%",
                                        height: "100%",
                                        cursor: "pointer",
                                        margin: 0,
                                    }}
                                    required
                                />
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        border: `1px solid ${formData.consentPersonalInfo ? checkboxCheckedBorderColor : checkboxBorderColor}`,
                                        backgroundColor:
                                            formData.consentPersonalInfo
                                                ? checkboxCheckedBgColor
                                                : "#bbbbbb26",
                                        borderRadius: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s",
                                        cursor: "pointer",
                                    }}
                                >
                                    {formData.consentPersonalInfo && (
                                        <svg
                                            width="10"
                                            height="8"
                                            viewBox="0 0 10 8"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M1 4L3.5 6.5L9 1"
                                                stroke="#ffffff"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#888888",
                                        fontFamily: pretendardFontFamily,
                                        fontWeight: 600,
                                        marginBottom: "4px",
                                    }}
                                >
                                    개인정보 수집 및 이용 동의
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#888888",
                                        fontFamily: pretendardFontFamily,
                                    }}
                                >
                                    참석여부 전달을 위한 개인정보 수집 및 이용에
                                    동의해 주세요.
                                </div>
                                {isPrivacyExpanded && (
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "#888888",
                                            fontFamily: pretendardFontFamily,
                                            lineHeight: "1.5",
                                            padding: "4px 0",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {/* prettier-ignore */}
                                        {[
                                            "• 제공 받는 자: 모바일 청첩장 주문자 (신랑, 신부측)",
                                            <br key="br1" />,
                                            "• 이용 목적: 행사 참석여부 확인",
                                            <br key="br2" />,
                                            "• 제공 항목: 성함, 연락처, 동행인원, 식사여부",
                                            <br key="br3" />,
                                            "• 보유 기간: 모바일 청첩장 만료 시까지",
                                            <br key="br4" />,
                                            "• 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 참석여부 서비스 이용이 불가합니다.",
                                        ]}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setIsPrivacyExpanded(!isPrivacyExpanded)
                                }
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    flexShrink: 0,
                                    marginTop: "-2px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="9"
                                    viewBox="0 0 77 41"
                                    fill="none"
                                    style={{
                                        transition: "transform 0.2s",
                                        transform: isPrivacyExpanded
                                            ? "scaleY(-1)"
                                            : "scaleY(1)",
                                    }}
                                >
                                    <path
                                        d="M2.5 3L39 36L74.5 3"
                                        stroke="#888888"
                                        strokeWidth="6"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            width: "100px",
                            backgroundColor: isSubmitting
                                ? "#9ca3af"
                                : buttonColor,
                            color: buttonTextColor,
                            padding: "12px 24px",
                            marginTop: "30px",
                            borderRadius: "0px",
                            fontSize: "14px",
                            fontFamily: pretendardFontFamily,
                            fontWeight: 500,
                            border: `1px solid ${isSubmitting ? "#9ca3af" : buttonColor}`,
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                            transition: "background-color 0.2s",
                        }}
                    >
                        {isSubmitting ? "제출 중..." : "제출"}
                    </button>

                    {/* 에러 메시지 */}
                    {submitStatus === "error" && (
                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#dc2626",
                                borderRadius: "0px",
                                width: "100%",
                            }}
                        >
                            제출 중 오류가 발생했습니다. 다시 시도해주세요.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

RSVPClient.displayName = "RSVPClient"

addPropertyControls(RSVPClient, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: wedding-demo",
    },
})
