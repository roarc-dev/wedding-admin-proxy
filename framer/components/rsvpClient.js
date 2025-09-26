// rsvpClient.js — RSVP 폼 컴포넌트 (React 훅 직접 import, JSX Runtime 사용)
// - 브라우저 ESM 환경에서 동작
// - P22TextComplete.js 패턴 적용: JSX Runtime + 직접 import
// - Framer 캔버스와 브라우저 양쪽에서 동작

import { jsx } from "react/jsx-runtime"
import { useState, useCallback, useEffect } from "react"

function RSVPClient(props) {
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

  // API 기본 엔드포인트 (배포 환경 기준)
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
  const [displayStyle, setDisplayStyle] = useState("none")

  // 서버에서 page_settings.rsvp 값을 조회해 표시 상태를 동기화
  useEffect(() => {
    let cancelled = false
    async function fetchRsvp() {
      try {
        if (!pageId) return
        const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        const serverRsvp = (json && json.data && json.data.rsvp) || json?.rsvp
        if (!cancelled && (serverRsvp === "on" || serverRsvp === "off")) {
          setDisplayStyle(serverRsvp === "on" ? "block" : "none")
        }
      } catch (_) {
      }
    }
    fetchRsvp()
    return () => {
      cancelled = true
    }
  }, [pageId])

  const formatPhoneNumber = useCallback((value) => {
    const numbers = value.replace(/[^\d]/g, "")
    if (numbers.length > 11) return formData.phoneNumber || ""
    if (numbers.length <= 3) return numbers
    else if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    else return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }, [formData.phoneNumber])

  const validateForm = useCallback(() => {
    const newErrors = {}
    if (!formData.guestName.trim()) newErrors.guestName = "성함을 입력해주세요"
    if (!formData.guestType) newErrors.guestType = "신랑측/신부측을 선택해주세요"
    if (!formData.relationType) newErrors.relationType = "참석 여부를 선택해주세요"
    if (!formData.mealTime) newErrors.mealTime = "식사 여부를 선택해주세요"
    const phoneRegex = /^010-\d{4}-\d{4}$/
    if (!formData.phoneNumber) newErrors.phoneNumber = "연락처를 입력해주세요"
    else if (!phoneRegex.test(formData.phoneNumber)) newErrors.phoneNumber = "010-1234-5678 형식으로 입력해주세요"
    if (!formData.consentPersonalInfo) newErrors.consentPersonalInfo = "개인정보 수집 및 이용에 동의해주세요"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleInputChange = useCallback((e) => {
    const target = e.target
    const name = target.name
    const value = target.value
    const inputType = target.type
    const isChecked = target.checked

    if (name === "phoneNumber") {
      const formattedValue = formatPhoneNumber(value)
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else if (name === "guestCount") {
      const numeric = Number(value)
      setFormData((prev) => ({ ...prev, guestCount: Number.isFinite(numeric) ? numeric : prev.guestCount }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: inputType === "checkbox" ? isChecked === true : value }))
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }, [formatPhoneNumber, errors])

  const handleSubmit = useCallback(async () => {
    console.log("제출 시작 - 현재 폼 데이터:", formData)
    if (!validateForm()) return
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
      guest_count: formData.guestCount,
      phone_number: formData.phoneNumber,
      consent_personal_info: formData.consentPersonalInfo,
      page_id: pageId,
    }

    try {
      const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"
      const url = `${PROXY_BASE_URL}/api/rsvp`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) throw new Error((await response.json()).error || `HTTP ${response.status}`)
      const result = await response.json()
      console.log("제출 성공:", result)

      setSubmitStatus("success")
      setFormData({
        guestName: "", guestType: "", relationType: "", mealTime: "",
        guestCount: 1, phoneNumber: "", consentPersonalInfo: false,
      })
    } catch (error) {
      console.error("제출 에러:", error)
      setSubmitStatus("error")
      alert(`제출 실패: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, pageId, errors])

  if (submitStatus === "success") {
    return jsx("div", {
      style: { margin: "80px 0", backgroundColor: "#F5F5F5", padding: "80px 0" },
      children: jsx("div", {
        style: { ...style, width: "75%", height: "fit-content", maxWidth: "400px", margin: "0 auto", padding: "24px", backgroundColor, borderRadius: "0px" },
        children: jsx("div", { style: { textAlign: "center" }, children: [
          jsx("div", { style: { color: "#10b981", fontSize: "48px", marginBottom: "16px" }, children: "✓" }),
          jsx("h2", { style: { fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }, children: "참석 의사 전달 완료" }),
          jsx("p", { style: { color: "#6b7280", marginBottom: "24px" }, children: "소중한 시간을 내어 참석해 주셔서 감사합니다." }),
          jsx("button", {
            onClick: () => setSubmitStatus(""),
            style: { backgroundColor: buttonColor, color: buttonTextColor, padding: "8px 24px", borderRadius: "0px", border: `1px solid ${buttonColor}`, cursor: "pointer", transition: "background-color 0.2s" },
            children: "다시 작성하기",
          }),
        ] })
      })
    })
  }

  // RSVP가 비활성화된 경우 숨김 (displayStyle로 제어)
  if (displayStyle === "none") {
    return jsx("div", { style: { display: "none" }, children: null })
  }

  return jsx("div", { style: { backgroundColor: "#F5F5F5", padding: "80px 0", display: displayStyle }, children: [
    jsx("div", { style: { width: "100%", height: "fit-content", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "P22 Late November, serif", fontSize: "25px", letterSpacing: "0.05em", lineHeight: "0.7em", textAlign: "center", whiteSpace: "nowrap", marginBottom: "20px" }, children: "RSVP" }),
    jsx("div", { style: { fontFamily: "Pretendard Regular", fontSize: "15px", color: "#8c8c8c", lineHeight: "1.8em", textAlign: "center", marginBottom: "30px" }, children: "결혼식 참석 여부를 알려주세요" }),
    jsx("div", { style: { ...style, width: "75%", height: "fit-content", maxWidth: "400px", margin: "0 auto", padding: "0px", backgroundColor, borderRadius: "0px" }, children: [
      jsx("div", { dangerouslySetInnerHTML: { __html: "<script>if (!document.querySelector('meta[name=\"viewport\"][content*=\"user-scalable=no\"]')) { var meta = document.createElement('meta'); meta.name = 'viewport'; meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'; document.getElementsByTagName('head')[0].appendChild(meta); }</script>" } }),
      jsx("div", { style: { display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }, children: [
        // 신랑측/신부측 선택
        jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" }, children: jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: [
          jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, guestType: "신랑측" })), style: { padding: "10px", borderRadius: "0px", fontSize: "12px", fontFamily: "Pretendard Regular", border: formData.guestType === "신랑측" ? `1px solid ${selectionButtonActiveBorderColor}` : `1px solid ${selectionButtonBorderColor}`, backgroundColor: formData.guestType === "신랑측" ? selectionButtonActiveBgColor : selectionButtonBgColor, cursor: "pointer", transition: "all 0.2s", color: formData.guestType === "신랑측" ? selectionTextColor : textColor }, children: "신랑측" }),
          jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, guestType: "신부측" })), style: { padding: "10px", borderRadius: "0px", fontSize: "12px", fontFamily: "Pretendard Regular", border: formData.guestType === "신부측" ? `1px solid ${selectionButtonActiveBorderColor}` : `1px solid ${selectionButtonBorderColor}`, backgroundColor: formData.guestType === "신부측" ? selectionButtonActiveBgColor : selectionButtonBgColor, cursor: "pointer", transition: "all 0.2s", color: formData.guestType === "신부측" ? selectionTextColor : textColor }, children: "신부측" }),
        ]}) }),
        // 참석 여부
        jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" }, children: [
          jsx("label", { style: { fontSize: "12px", fontWeight: "500", color: textColor }, children: "참석 여부" }),
          jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: [
            jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, relationType: "참석" })), style: { padding: "10px", borderRadius: "0px", fontSize: "12px", fontFamily: "Pretendard Regular", border: formData.relationType === "참석" ? `1px solid ${selectionButtonActiveBorderColor}` : `1px solid ${selectionButtonBorderColor}`, backgroundColor: formData.relationType === "참석" ? selectionButtonActiveBgColor : selectionButtonBgColor, cursor: "pointer", transition: "all 0.2s", color: formData.relationType === "참석" ? selectionTextColor : textColor }, children: "참석" }),
            jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, relationType: "미참석" })), style: { padding: "10px", borderRadius: "0px", fontSize: "12px", fontFamily: "Pretendard Regular", border: formData.relationType === "미참석" ? `1px solid ${selectionButtonActiveBorderColor}` : `1px solid ${selectionButtonBorderColor}`, backgroundColor: formData.relationType === "미참석" ? selectionButtonActiveBgColor : selectionButtonBgColor, cursor: "pointer", transition: "all 0.2s", color: formData.relationType === "미참석" ? selectionTextColor : textColor }, children: "미참석" }),
          ]})
        ]}),
        // 식사 여부
        jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" }, children: [
          jsx("label", { style: { fontSize: "12px", fontWeight: "500", color: textColor }, children: "식사 여부" }),
          jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }, children: [
            jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, mealTime: "식사 가능" })), style: { padding: "10px", borderRadius: "0px", fontSize: "12px", fontFamily: "Pretendard Regular", border: formData.mealTime === "식사 가능" ? `1px solid ${selectionButtonActiveBorderColor}` : `1px solid ${selectionButtonBorderColor}`, backgroundColor: formData.mealTime === "식사 가능" ? selectionButtonActiveBgColor : selectionButtonBgColor, cursor: "pointer", transition: "all 0.2s", color: formData.mealTime === "식사 가능" ? selectionTextColor : textColor }, children: "식사 가능" }),
            jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, mealTime: "식사 불가" })), style: { padding: "10px", borderRadius: "0px", fontSize: "12px", fontFamily: "Pretendard Regular", border: formData.mealTime === "식사 불가" ? `1px solid ${selectionButtonActiveBorderColor}` : `1px solid ${selectionButtonBorderColor}`, backgroundColor: formData.mealTime === "식사 불가" ? selectionButtonActiveBgColor : selectionButtonBgColor, cursor: "pointer", transition: "all 0.2s", color: formData.mealTime === "식사 불가" ? selectionTextColor : textColor }, children: "식사 불가" }),
          ]})
        ]}),

        // 성함과 인원
        jsx("div", { style: { display: "flex", gap: "10px", width: "100%" }, children: [
          // 성함
          jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", flex: "1" }, children: [
            jsx("label", { style: { fontSize: "12px", fontWeight: "500", color: textColor }, children: "성함" }),
            jsx("div", { style: { position: "relative", width: "100%" }, children: [
              jsx("input", { type: "text", name: "guestName", value: formData.guestName, onChange: handleInputChange, style: { width: "100%", height: "40px", padding: "0 12px", border: errors.guestName ? "1px solid #dc2626" : `1px solid ${borderColor}`, borderRadius: "0px", fontFamily: "Pretendard Regular", fontSize: "16px", outline: "none", transition: "border-color 0.2s", backgroundColor: "#bbbbbb26", color: "transparent", WebkitTextSizeAdjust: "100%" }, required: true }),
              jsx("div", { style: { position: "absolute", top: "0", left: "12px", right: "12px", height: "40px", display: "flex", alignItems: "center", fontSize: "14px", fontFamily: "Pretendard Regular", color: "#000000", pointerEvents: "none", whiteSpace: "nowrap", overflow: "hidden" }, children: formData.guestName || "홍길동" }),
              !formData.guestName && jsx("div", { style: { position: "absolute", top: "0", left: "12px", right: "12px", height: "40px", display: "flex", alignItems: "center", fontSize: "14px", fontFamily: "Pretendard Regular", color: "#999999", pointerEvents: "none" }, children: "홍길동" }),
            ]}),
            errors.guestName && jsx("div", { style: { color: "#dc2626", fontSize: "12px", fontFamily: "Pretendard Regular" }, children: errors.guestName }),
          ]}),
          // 인원
          jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", flex: "1" }, children: [
            jsx("label", { style: { fontSize: "12px", fontWeight: "500", color: textColor }, children: "인원" }),
            jsx("div", { style: { position: "relative", width: "100%" }, children: [
              jsx("select", { name: "guestCount", value: formData.guestCount, onChange: handleInputChange, style: { width: "100%", height: "40px", padding: "0 35px 0 12px", border: `1px solid ${borderColor}`, borderRadius: "0px", fontFamily: "Pretendard Regular", fontSize: "14px", outline: "none", backgroundColor: "#bbbbbb26", color: "#000", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: "pointer" }, children: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => jsx("option", { key: num, value: num, children: num })) }),
              jsx("div", { style: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#888888" }, children: jsx("svg", { width: "12", height: "7", viewBox: "0 0 12 7", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: jsx("path", { d: "M1 1L6 6L11 1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
            ]}),
          ]}),
        ]}),

        // 연락처
        jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" }, children: [
          jsx("label", { style: { fontSize: "12px", fontWeight: "500", color: textColor }, children: "연락처" }),
          jsx("div", { style: { position: "relative", width: "100%" }, children: [
            jsx("input", { type: "tel", name: "phoneNumber", value: formData.phoneNumber, onChange: handleInputChange, maxLength: 13, style: { width: "100%", padding: "12px", border: errors.phoneNumber ? "1px solid #dc2626" : `1px solid ${borderColor}`, borderRadius: "0px", fontFamily: "Pretendard Regular", fontSize: "16px", outline: "none", transition: "border-color 0.2s", backgroundColor: "#bbbbbb26", color: "transparent", WebkitTextSizeAdjust: "100%" }, required: true }),
            jsx("div", { style: { position: "absolute", top: "0", left: "12px", right: "12px", height: "100%", display: "flex", alignItems: "center", fontSize: "14px", fontFamily: "Pretendard Regular", color: "#000000", pointerEvents: "none", whiteSpace: "nowrap", overflow: "hidden" }, children: formData.phoneNumber || "010-1234-5678" }),
            !formData.phoneNumber && jsx("div", { style: { position: "absolute", top: "0", left: "12px", right: "12px", height: "100%", display: "flex", alignItems: "center", fontSize: "14px", fontFamily: "Pretendard Regular", color: "#999999", pointerEvents: "none" }, children: "010-1234-5678" }),
          ]}),
          errors.phoneNumber && jsx("div", { style: { color: "#dc2626", fontSize: "12px" }, children: errors.phoneNumber }),
        ]}),

        // 개인정보 동의
        jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" }, children: jsx("div", { style: { display: "flex", alignItems: "flex-start", gap: "8px" }, children: [
          jsx("div", { style: { position: "relative", width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }, children: [
            jsx("input", { type: "checkbox", name: "consentPersonalInfo", checked: formData.consentPersonalInfo, onChange: handleInputChange, style: { position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", margin: 0 }, required: true }),
            jsx("div", { style: { width: "16px", height: "16px", border: `1px solid ${formData.consentPersonalInfo ? checkboxCheckedBorderColor : checkboxBorderColor}`, backgroundColor: formData.consentPersonalInfo ? checkboxCheckedBgColor : "#bbbbbb26", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }, children: formData.consentPersonalInfo && jsx("svg", { width: "10", height: "8", viewBox: "0 0 10 8", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: jsx("path", { d: "M1 4L3.5 6.5L9 1", stroke: "#ffffff", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
          ]}),
          jsx("div", { style: { flex: 1 }, children: [
            jsx("div", { style: { fontSize: "11px", color: "#888888", fontFamily: "Pretendard Semibold", marginBottom: "4px" }, children: "개인정보 수집 및 이용 동의" }),
            jsx("div", { style: { fontSize: "11px", color: "#888888", fontFamily: "Pretendard Regular" }, children: "참석여부 전달을 위한 개인정보 수집 및 이용에 동의해 주세요." }),
            isPrivacyExpanded && jsx("div", { style: { fontSize: "11px", color: "#888888", fontFamily: "Pretendard Regular", lineHeight: "1.5", padding: "4px 0", marginTop: "4px" }, children: ["• 제공 받는 자: 모바일 청첩장 주문자 (신랑, 신부측)", jsx("br"), "• 이용 목적: 행사 참석여부 확인", jsx("br"), "• 제공 항목: 성함, 연락처, 동행인원, 식사여부", jsx("br"), "• 보유 기간: 모바일 청첩장 만료 시까지", jsx("br"), "• 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 참석여부 서비스 이용이 불가합니다."] }),
          ]}),
          jsx("button", { type: "button", onClick: () => setIsPrivacyExpanded(!isPrivacyExpanded), style: { background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0, marginTop: "-2px", display: "flex", alignItems: "center", justifyContent: "center" }, children: jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "9", viewBox: "0 0 77 41", fill: "none", style: { transition: "transform 0.2s", transform: isPrivacyExpanded ? "scaleY(-1)" : "scaleY(1)" }, children: jsx("path", { d: "M2.5 3L39 36L74.5 3", stroke: "#888888", strokeWidth: "6" }) }) }),
        ]}) }),

        // 제출 버튼
        jsx("button", { onClick: handleSubmit, disabled: isSubmitting, style: { width: "100px", backgroundColor: isSubmitting ? "#9ca3af" : buttonColor, color: buttonTextColor, padding: "12px 24px", marginTop: "30px", borderRadius: "0px", fontSize: "14px", fontFamily: "Pretendard Regular", fontWeight: "500", border: `1px solid ${isSubmitting ? "#9ca3af" : buttonColor}`, cursor: isSubmitting ? "not-allowed" : "pointer", transition: "background-color 0.2s" }, children: isSubmitting ? "제출 중..." : "제출" }),

        // 에러 메시지
        submitStatus === "error" && jsx("div", { style: { padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "0px", width: "100%" }, children: "제출 중 오류가 발생했습니다. 다시 시도해주세요." }),
      ]}),
    ]}),
  ]})
}

RSVPClient.displayName = "RSVPClient"
export default RSVPClient
