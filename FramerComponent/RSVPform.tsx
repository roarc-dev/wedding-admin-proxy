import React, {
    useState,

    // Property Controls
} from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 800
 */
export default function RSVPForm(props) {
    const {
        // Supabase 직접 연결 제거 - 프록시 사용
        pageId = "",
        style,
        backgroundColor = "#ffffff",
        buttonColor = "#3b82f6",
        buttonTextColor = "#ffffff",
        borderColor = "#e5e7eb",
        accentColor = "#888888",
        textColor = "#374151",
        // 통합 선택 버튼 색상 컨트롤
        selectionButtonBgColor = "#999999",
        selectionButtonBorderColor = "#e5e7eb",
        selectionButtonActiveBgColor = "#f0f1ff",
        selectionButtonActiveBorderColor = "#888888", // 추가된 속성
        checkboxBorderColor = "#e5e7eb",
        checkboxCheckedBgColor = "#999999",
        checkboxCheckedBorderColor = "#888888",
    } = props

    // 프록시 서버 URL
    const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

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
    const [errors, setErrors] = useState({})
    const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false)

    // 전화번호 포맷팅 함수
    const formatPhoneNumber = (value) => {
        // 숫자만 추출
        const numbers = value.replace(/[^\d]/g, "")

        // 11자리로 제한
        if (numbers.length > 11) return formData.phoneNumber

        // 포맷팅
        if (numbers.length <= 3) {
            return numbers
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
        }
    }

    // 입력 검증 함수
    const validateForm = () => {
        const newErrors = {}

        // 필수 필드 검증
        if (!formData.guestName.trim()) {
            newErrors.guestName = "성함을 입력해주세요"
        }

        if (!formData.guestType) {
            newErrors.guestType = "신랑측/신부측을 선택해주세요"
        }

        if (!formData.relationType) {
            newErrors.relationType = "참석 여부를 선택해주세요"
        }

        if (!formData.mealTime) {
            newErrors.mealTime = "식사 여부를 선택해주세요"
        }

        // 전화번호 검증
        const phoneRegex = /^010-\d{4}-\d{4}$/
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = "연락처를 입력해주세요"
        } else if (!phoneRegex.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "010-1234-5678 형식으로 입력해주세요"
        }

        // 개인정보 동의 검증
        if (!formData.consentPersonalInfo) {
            newErrors.consentPersonalInfo =
                "개인정보 수집 및 이용에 동의해주세요"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target

        if (name === "phoneNumber") {
            // 전화번호는 특별 처리
            const formattedValue = formatPhoneNumber(value)
            setFormData((prev) => ({
                ...prev,
                [name]: formattedValue,
            }))
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }))
        }

        // 입력 시 해당 필드의 에러 제거
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    const handleSubmit = async () => {
        console.log("제출 시작 - 현재 폼 데이터:", formData)
        console.log("프록시 URL:", PROXY_BASE_URL)

        // 폼 검증
        if (!validateForm()) {
            console.log("❌ 폼 검증 실패:", errors)
            return
        }

        // 페이지 ID 검증
        if (!pageId) {
            alert("페이지 ID가 설정되지 않았습니다. Property Panel에서 pageId를 입력하세요.")
            return
        }

        setIsSubmitting(true)
        setSubmitStatus("")

        const requestData = {
            guest_name: formData.guestName,
            guest_type: formData.guestType,
            relation_type: formData.relationType,
            meal_time: formData.mealTime,
            guest_count: parseInt(formData.guestCount),
            phone_number: formData.phoneNumber,
            consent_personal_info: formData.consentPersonalInfo,
            page_id: pageId,
        }

        console.log("전송할 데이터:", requestData)

        try {
            const url = `${PROXY_BASE_URL}/api/rsvp`
            console.log("요청 URL:", url)

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            })

            console.log("응답 상태:", response.status)
            console.log(
                "응답 헤더:",
                Object.fromEntries(response.headers.entries())
            )

            if (!response.ok) {
                const errorData = await response.json()
                console.error("응답 에러 내용:", errorData)
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const result = await response.json()
            console.log("제출 성공:", result)
            
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
        } catch (error) {
            console.error("제출 에러:", error)
            setSubmitStatus("error")
            alert(`제출 실패: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitStatus === "success") {
        return (
            <div
                style={{
                    ...style,
                    maxWidth: "400px",
                    margin: "0 auto",
                    padding: "24px",
                    backgroundColor: backgroundColor,
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
                        }}
                    >
                        참석 의사 전달 완료
                    </h2>
                    <p style={{ color: "#6b7280", marginBottom: "24px" }}>
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
                        }}
                    >
                        다시 작성하기
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                maxWidth: "400px",
                margin: "0 auto",
                padding: "0px",
                backgroundColor: backgroundColor,
                borderRadius: "0px",
            }}
        >
            {/* iOS Safari 포커스 줌 방지를 위한 viewport 설정 */}
            <div
                dangerouslySetInnerHTML={{
                    __html: `
                        <script>
                            if (!document.querySelector('meta[name="viewport"][content*="user-scalable=no"]')) {
                                var meta = document.createElement('meta');
                                meta.name = 'viewport';
                                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                                document.getElementsByTagName('head')[0].appendChild(meta);
                            }
                        </script>
                    `,
                }}
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    alignItems: "center", // 전체 폼을 가운데 정렬
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
                                fontFamily: "Pretendard Regular",
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
                                color: textColor,
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
                                fontFamily: "Pretendard Regular",
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
                                color: textColor,
                            }}
                        >
                            신부측
                        </button>
                    </div>
                    {errors.guestType && (
                        <div
                            style={{
                                color: "#dc2626",
                                fontSize: "12px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            {errors.guestType}
                        </div>
                    )}
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
                            fontWeight: "500",
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
                                fontFamily: "Pretendard Regular",
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
                                color: textColor,
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
                                fontFamily: "Pretendard Regular",
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
                                color: textColor,
                            }}
                        >
                            미참석
                        </button>
                    </div>
                    {errors.relationType && (
                        <div
                            style={{
                                color: "#dc2626",
                                fontSize: "12px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            {errors.relationType}
                        </div>
                    )}
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
                            fontWeight: "500",
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
                                fontFamily: "Pretendard Regular",
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
                                color: textColor,
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
                                fontFamily: "Pretendard Regular",
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
                                color: textColor,
                            }}
                        >
                            식사 불가
                        </button>
                    </div>
                    {errors.mealTime && (
                        <div
                            style={{
                                color: "#dc2626",
                                fontSize: "12px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            {errors.mealTime}
                        </div>
                    )}
                </div>

                {/* 성함과 인원 한 줄 배치 */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        width: "100%",
                    }}
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
                                fontWeight: "500",
                                color: textColor,
                            }}
                        >
                            성함
                        </label>
                        <div style={{ position: "relative", width: "100%" }}>
                            <input
                                type="text"
                                name="guestName"
                                value={formData.guestName}
                                onChange={handleInputChange}
                                placeholder=""
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    padding: "0 12px",
                                    border: errors.guestName
                                        ? "1px solid #dc2626"
                                        : `1px solid ${borderColor}`,
                                    borderRadius: "0px",
                                    fontFamily: "Pretendard Regular",
                                    fontSize: "16px", // iOS 줌 방지를 위해 16px 고정
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    backgroundColor: "#bbbbbb26",
                                    color: "transparent", // 실제 텍스트는 투명으로
                                    WebkitTextSizeAdjust: "100%",
                                }}
                                required
                            />
                            {/* 시각적으로 보이는 텍스트 레이어 */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "0",
                                    left: "12px",
                                    right: "12px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: "14px", // 원하는 크기
                                    fontFamily: "Pretendard Regular",
                                    color: "#000000",
                                    pointerEvents: "none",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                }}
                            >
                                {formData.guestName || "홍길동"}
                            </div>
                            {/* placeholder 효과 */}
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
                                        fontFamily: "Pretendard Regular",
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
                                    fontFamily: "Pretendard Regular",
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
                                fontWeight: "500",
                                color: textColor,
                            }}
                        >
                            인원
                        </label>
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                            }}
                        >
                            <select
                                name="guestCount"
                                value={formData.guestCount}
                                onChange={handleInputChange}
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    padding: "0 35px 0 12px", // 오른쪽에 화살표 공간 확보
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: "0px",
                                    fontFamily: "Pretendard Regular",
                                    fontSize: "14px",
                                    outline: "none",
                                    backgroundColor: "#bbbbbb26",
                                    color: "#888888",
                                    appearance: "none", // 기본 화살표 제거
                                    WebkitAppearance: "none", // Safari
                                    MozAppearance: "none", // Firefox
                                    cursor: "pointer",
                                }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <option key={num} value={num}>
                                        {num}
                                    </option>
                                ))}
                            </select>
                            {/* 커스텀 화살표 */}
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
                            fontWeight: "500",
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
                            placeholder=""
                            maxLength="13"
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: errors.phoneNumber
                                    ? "1px solid #dc2626"
                                    : `1px solid ${borderColor}`,
                                borderRadius: "0px",
                                fontFamily: "Pretendard Regular",
                                fontSize: "16px", // iOS 줌 방지를 위해 16px 고정
                                outline: "none",
                                transition: "border-color 0.2s",
                                backgroundColor: "#bbbbbb26",
                                color: "transparent", // 실제 텍스트는 투명으로
                                WebkitTextSizeAdjust: "100%",
                            }}
                            required
                        />
                        {/* 시각적으로 보이는 텍스트 레이어 */}
                        <div
                            style={{
                                position: "absolute",
                                top: "0",
                                left: "12px",
                                right: "12px",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "14px", // 원하는 크기
                                fontFamily: "Pretendard Regular",
                                color: "#000000",
                                pointerEvents: "none",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                            }}
                        >
                            {formData.phoneNumber || "010-1234-5678"}
                        </div>
                        {/* placeholder 효과 */}
                        {!formData.phoneNumber && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "0",
                                    left: "12px",
                                    right: "12px",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: "14px",
                                    fontFamily: "Pretendard Regular",
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
                                    border: `1px solid ${
                                        formData.consentPersonalInfo
                                            ? checkboxCheckedBorderColor
                                            : checkboxBorderColor
                                    }`,
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
                                    fontFamily: "Pretendard Semibold",
                                    marginBottom: "4px",
                                }}
                            >
                                개인정보 수집 및 이용 동의
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#888888",
                                    fontFamily: "Pretendard Regular",
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
                                        fontFamily: "Pretendard Regular",
                                        lineHeight: "1.5",
                                        padding: "4px 0",
                                        marginTop: "4px",
                                    }}
                                >
                                    • 제공 받는 자: 모바일 청첩장 주문자 (신랑,
                                    신부측)
                                    <br />
                                    • 이용 목적: 행사 참석여부 확인
                                    <br />
                                    • 제공 항목: 성함, 연락처, 동행인원,
                                    식사여부
                                    <br />
                                    • 보유 기간: 모바일 청첩장 만료 시까지
                                    <br />• 개인정보 수집 및 이용에 대한 동의를
                                    거부할 권리가 있으며, 동의 거부 시 참석여부
                                    서비스 이용이 불가합니다.
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

                    {errors.consentPersonalInfo && (
                        <div
                            style={{
                                color: "#dc2626",
                                fontSize: "12px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            {errors.consentPersonalInfo}
                        </div>
                    )}
                </div>

                {/* 제출 버튼 - 가운데 정렬 */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                        width: "100px",
                        backgroundColor: isSubmitting ? "#9ca3af" : buttonColor,
                        color: buttonTextColor,
                        padding: "12px 24px",
                        marginTop: "30px",
                        borderRadius: "0px",
                        fontSize: "14px",
                        fontFamily: "Pretendard Regular",
                        fontWeight: "500",
                        border: `1px solid ${isSubmitting ? "#9ca3af" : buttonColor}`,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s",
                    }}
                >
                    {isSubmitting ? "제출 중..." : "제출"}
                </button>

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
        </div>
    )
}

addPropertyControls(RSVPForm, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "예: wedding-main, anniversary-2024",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "배경색",
        defaultValue: "#ffffff",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "버튼 배경색",
        defaultValue: "#3b82f6",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "버튼 글자색",
        defaultValue: "#ffffff",
    },
    borderColor: {
        type: ControlType.Color,
        title: "테두리 색상",
        defaultValue: "#e5e7eb",
    },
    accentColor: {
        type: ControlType.Color,
        title: "강조 색상",
        defaultValue: "#3b82f6",
    },
    textColor: {
        type: ControlType.Color,
        title: "글자 색상",
        defaultValue: "#374151",
    },
    // 모든 선택 버튼 색상
    selectionButtonBgColor: {
        type: ControlType.Color,
        title: "모든 선택 버튼 배경색",
        defaultValue: "#ffffff",
    },
    selectionButtonBorderColor: {
        type: ControlType.Color,
        title: "모든 선택 버튼 테두리색",
        defaultValue: "#e5e7eb",
    },
    selectionButtonActiveBgColor: {
        type: ControlType.Color,
        title: "모든 선택 버튼 강조 배경색",
        defaultValue: "#e3e3e3",
    },
    selectionButtonActiveBorderColor: {
        type: ControlType.Color,
        title: "모든 선택 버튼 강조 테두리색",
        defaultValue: "#999999",
    },
    checkboxBorderColor: {
        type: ControlType.Color,
        title: "체크박스 테두리 색상",
        defaultValue: "#e5e7eb",
    },
    checkboxCheckedBgColor: {
        type: ControlType.Color,
        title: "체크박스 체크 시 배경색",
        defaultValue: "#3b82f6",
    },
    checkboxCheckedBorderColor: {
        type: ControlType.Color,
        title: "체크박스 체크 시 테두리색",
        defaultValue: "#3b82f6",
    },
})
