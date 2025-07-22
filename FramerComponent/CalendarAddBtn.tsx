import * as React from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect } from "react"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app"

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

interface AddToCalendarButtonProps {
    pageId: string
    buttonText?: string
    buttonBackgroundColor?: string
    buttonTextColor?: string
    buttonFont: {
        family: string
        size: number
        weight: string
        lineHeight: string
        letterSpacing?: string
    }
}

export function AddToCalendarButton({
    pageId = "demo",
    buttonText = "캘린더 추가",
    buttonBackgroundColor = "#007AFF",
    buttonTextColor = "#FFFFFF",
    buttonFont,
}: AddToCalendarButtonProps) {
    const [pageSettings, setPageSettings] = useState({
        groom_name_kr: '',
        bride_name_kr: '',
        wedding_date: '',
        wedding_hour: '14',
        wedding_minute: '00',
        venue_name: '',
        venue_address: ''
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 페이지 설정 로드
    useEffect(() => {
        fetchPageSettings()
    }, [pageId])

    const fetchPageSettings = async () => {
        if (!pageId) return
        
        setLoading(true)
        setError(null)
        
        try {
            const response = await fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`)
            const result = await response.json()
            
            if (result.success) {
                setPageSettings(result.data)
            } else {
                throw new Error(result.error || '설정을 불러올 수 없습니다.')
            }
        } catch (err) {
            console.error('페이지 설정 로드 실패:', err)
            setError(err instanceof Error ? err.message : '설정을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleClick = () => {
        if (!pageSettings.wedding_date || !pageSettings.wedding_hour || !pageSettings.wedding_minute) {
            alert('웨딩 날짜와 시간이 설정되지 않았습니다.')
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
            const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000)
            const eventDates = `${formatDateForCalendar(startDateTime)}/${formatDateForCalendar(endDateTime)}`

            // 이벤트명과 설명 자동 생성 (성 제외하고 이름만 사용)
            const groomFirstName = pageSettings.groom_name_kr ? pageSettings.groom_name_kr.slice(-2) : "신랑"
            const brideFirstName = pageSettings.bride_name_kr ? pageSettings.bride_name_kr.slice(-2) : "신부"
            
            const eventName = `${groomFirstName} ♥ ${brideFirstName}의 결혼식`
            const eventDetails = `${groomFirstName}과 ${brideFirstName}의 새로운 출발을 축하해 주세요`
            const eventLocation = pageSettings.venue_name || ''

            const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
                eventName
            )}&dates=${eventDates}&details=${encodeURIComponent(
                eventDetails
            )}&location=${encodeURIComponent(eventLocation)}`
            
            window.open(url, "_blank")
        } catch (err) {
            console.error('캘린더 이벤트 생성 실패:', err)
            alert('캘린더 이벤트 생성에 실패했습니다.')
        }
    }

    // 버튼 스타일: 높이와 너비는 100%로 부모 영역을 채우고, borderRadius는 0으로 설정
    const buttonStyle: React.CSSProperties = {
        backgroundColor: buttonBackgroundColor,
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
    }

    // 버튼 텍스트에 적용할 스타일
    const textStyle: React.CSSProperties = {
        ...buttonFont,
        color: buttonTextColor,
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
            <span style={textStyle}>{buttonText}</span>
        </motion.button>
    )
}

addPropertyControls(AddToCalendarButton, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "demo",
        description: "각 결혼식 페이지를 구분하는 고유 ID",
    },
    buttonText: {
        type: ControlType.String,
        title: "버튼 텍스트",
        defaultValue: "캘린더 추가",
    },
    buttonBackgroundColor: {
        type: ControlType.Color,
        title: "버튼 배경색",
        defaultValue: "#007AFF",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "버튼 텍스트 색상",
        defaultValue: "#FFFFFF",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "버튼 폰트",
        controls: "extended",
        defaultValue: {
            family: "Arial",
            size: 16,
            weight: "normal",
            lineHeight: "1.2em",
            letterSpacing: "normal",
        },
    },
})
