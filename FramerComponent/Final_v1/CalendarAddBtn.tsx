import * as React from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect, useMemo } from "react"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL =
    "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app"

// 날짜를 구글 캘린더 형식(YYYYMMDDTHHmmss)으로 포맷하는 헬퍼 함수
function formatDateForCalendar(date: Date): string {
    const pad = (num: number) => String(num).padStart(2, "0")
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    const seconds = pad(date.getSeconds())
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

interface CalendarAddBtnProps {
    pageId: string
    style?: React.CSSProperties
}

export default function CalendarAddBtn({
    pageId = "demo",
    style,
}: CalendarAddBtnProps) {
    const [pageSettings, setPageSettings] = useState({
        groom_name_kr: "",
        bride_name_kr: "",
        wedding_date: "",
        wedding_hour: "14",
        wedding_minute: "00",
        venue_name: "",
        venue_address: "",
        transport_location_name: "",
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[CalendarAddBtn] Typography loading failed:", error)
        }
    }, [])

    // Pretendard 폰트 스택을 안전하게 가져오기
    const pretendardFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // 페이지 설정 로드
    useEffect(() => {
        fetchPageSettings()
    }, [pageId])

    const fetchPageSettings = async () => {
        if (!pageId) {
            console.log("❌ pageId가 없습니다:", pageId)
            return
        }

        console.log("🔄 페이지 설정 로드 시작:", pageId)
        setLoading(true)
        setError(null)

        try {
            const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`
            console.log("📡 API 호출:", url)

            const response = await fetch(url)
            console.log("📨 Response status:", response.status)

            const result = await response.json()
            console.log("📋 API 응답 데이터:", result)

            if (result.success) {
                console.log("✅ 설정 데이터 로드 성공:", result.data)
                setPageSettings(result.data)
            } else {
                console.log("❌ API 오류:", result.error)
                throw new Error(result.error || "설정을 불러올 수 없습니다.")
            }
        } catch (err) {
            console.error("❌ 페이지 설정 로드 실패:", err)
            setError(
                err instanceof Error
                    ? err.message
                    : "설정을 불러오는데 실패했습니다."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleClick = () => {
        console.log("🔘 버튼 클릭됨")
        console.log("📊 현재 pageSettings:", pageSettings)
        console.log("📅 wedding_date:", pageSettings.wedding_date)
        console.log("⏰ wedding_hour:", pageSettings.wedding_hour)
        console.log("⏱️ wedding_minute:", pageSettings.wedding_minute)

        if (
            !pageSettings.wedding_date ||
            !pageSettings.wedding_hour ||
            !pageSettings.wedding_minute
        ) {
            console.log("❌ 필수 데이터 누락")
            alert("웨딩 날짜와 시간이 설정되지 않았습니다.")
            return
        }

        try {
            // 시간 정보 파싱
            const startHour = parseInt(pageSettings.wedding_hour, 10)
            const startMinute = parseInt(pageSettings.wedding_minute, 10)

            // wedding_date에 시간 정보를 적용하여 시작 시간 생성
            const startDateTime = new Date(pageSettings.wedding_date)
            startDateTime.setHours(startHour, startMinute, 0, 0)

            // 종료 시간은 시작 시간보다 2시간 후로 자동 설정
            const endDateTime = new Date(
                startDateTime.getTime() + 2 * 60 * 60 * 1000
            )
            const eventDates = `${formatDateForCalendar(startDateTime)}/${formatDateForCalendar(endDateTime)}`

            // 이벤트명과 설명 자동 생성 (성 제외하고 이름만 사용)
            const groomFirstName = pageSettings.groom_name_kr
                ? pageSettings.groom_name_kr.slice(-2)
                : "신랑"
            const brideFirstName = pageSettings.bride_name_kr
                ? pageSettings.bride_name_kr.slice(-2)
                : "신부"

            const eventName = `${groomFirstName} ♥︎ ${brideFirstName}의 결혼식`
            const eventDetails = `${groomFirstName} ♥︎ ${brideFirstName}의 새로운 출발을 축하해 주세요`
            const eventLocation = pageSettings.transport_location_name || ""

            const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
                eventName
            )}&dates=${eventDates}&details=${encodeURIComponent(
                eventDetails
            )}&location=${encodeURIComponent(eventLocation)}`

            window.open(url, "_blank")
        } catch (err) {
            console.error("캘린더 이벤트 생성 실패:", err)
            alert("캘린더 이벤트 생성에 실패했습니다.")
        }
    }

    // 버튼 스타일: AddCalendarComplete2.js 스타일 참고
    const buttonStyle: React.CSSProperties = {
        backgroundColor: "#e0e0e0",
        color: "#000000",
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
        ...style,
    }

    // 버튼 텍스트에 적용할 스타일: AddCalendarComplete2.js 스타일 참고
    const textStyle: React.CSSProperties = {
        fontFamily: pretendardFontFamily,
        fontSize: 14,
        fontWeight: 600,
        fontVariationSettings: '"wght" 600',
        lineHeight: "1.2em",
        letterSpacing: "normal",
        color: "#000000",
    }

    // 로딩 중이거나 에러가 있을 때
    if (loading || error) {
        return (
            <div style={buttonStyle}>
                <span style={textStyle}>
                    {loading ? "로딩 중..." : "설정 오류"}
                </span>
            </div>
        )
    }

    return (
        <motion.button style={buttonStyle} onClick={handleClick}>
            <span style={textStyle}>캘린더에 추가하기</span>
        </motion.button>
    )
}

addPropertyControls(CalendarAddBtn, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "demo",
        description: "각 결혼식 페이지를 구분하는 고유 ID",
    },
})
