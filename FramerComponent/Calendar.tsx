import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface CalendarComponentProps {
    pageId: string
    highlightColor: string
    testDates: string
    useTestData: boolean
    displayDate: string
    displayTime: string
    groomName: string
    brideName: string
}

export default function CalendarComponent({
    pageId = "default",
    highlightColor = "#e0e0e0",
    testDates = "2024-12-25,2024-12-31,2025-01-01",
    useTestData = false,
    displayDate = "2022-10-16",
    displayTime = "15:00",
    groomName = "태호",
    brideName = "보름",
}: CalendarComponentProps) {
    const [calendarData, setCalendarData] = useState<any[]>([])
    const [currentMonth, setCurrentMonth] = useState<string>("")
    const [currentYear, setCurrentYear] = useState<number>(
        new Date().getFullYear()
    )

    useEffect(() => {
        fetchCalendarData()
    }, [pageId, useTestData, testDates])

    // D-day 계산 함수
    const calculateDday = () => {
        try {
            const today = new Date()
            const targetDate = new Date(displayDate)

            // 시간 정보 제거 (자정으로 설정)
            today.setHours(0, 0, 0, 0)
            targetDate.setHours(0, 0, 0, 0)

            const timeDiff = targetDate.getTime() - today.getTime()
            const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

            if (dayDiff > 0) {
                return `D-${dayDiff.toString().padStart(2, "0")}일`
            } else if (dayDiff === 0) {
                return "D-DAY"
            } else {
                return `D+${Math.abs(dayDiff).toString().padStart(2, "0")}일`
            }
        } catch (error) {
            return "D-00일"
        }
    }

    // 날짜와 시간 포맷팅 함수
    const formatDateTime = () => {
        try {
            const date = new Date(displayDate)
            const [hour, minute] = displayTime.split(":")
            date.setHours(parseInt(hour), parseInt(minute))

            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()

            const dayNames = [
                "일요일",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
            ]
            const dayName = dayNames[date.getDay()]

            const hour24 = parseInt(hour)
            const hour12 =
                hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
            const ampm = hour24 < 12 ? "오전" : "오후"

            // 분 정보 처리: 00분이 아닌 경우만 표시
            const minuteValue = parseInt(minute)
            const minuteText = minuteValue !== 0 ? ` ${minuteValue}분` : ""

            return `${year}년 ${month}월 ${day}일 ${dayName} ${ampm} ${hour12}시${minuteText}`
        } catch (error) {
            return "날짜 형식이 올바르지 않습니다"
        }
    }

    const fetchCalendarData = async () => {
        // 테스트 데이터 사용 옵션이 켜져 있으면 테스트 데이터 사용
        if (useTestData && testDates) {
            const dates = testDates
                .split(",")
                .map((date) => date.trim())
                .filter((date) => date)
            const testCalendarData = dates.map((date, index) => ({
                id: `test_${index}`,
                page_id: pageId,
                date: date,
                title: `Test Event ${index + 1}`,
                created_at: new Date().toISOString(),
            }))

            setCalendarData(testCalendarData)

            if (testCalendarData.length > 0) {
                const firstDate = new Date(testCalendarData[0].date)
                setCurrentMonth((firstDate.getMonth() + 1).toString())
                setCurrentYear(firstDate.getFullYear())
            }
            return
        }

        // 프록시를 통한 안전한 데이터 조회
        try {
            const response = await fetch(`${PROXY_BASE_URL}/api/calendar?pageId=${pageId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                console.error("Calendar data fetch error:", response.status)
                return
            }

            const result = await response.json()
            
            if (result.success && result.data && result.data.length > 0) {
                setCalendarData(result.data)
                // 첫 번째 데이터로 월 설정
                const firstDate = new Date(result.data[0].date)
                setCurrentMonth((firstDate.getMonth() + 1).toString())
                setCurrentYear(firstDate.getFullYear())
            }
        } catch (error) {
            console.error("Calendar API connection error:", error)
        }
    }

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    const generateCalendar = () => {
        if (!currentMonth)
            return {
                weeks: [],
                days: ["S", "M", "T", "W", "T", "F", "S"],
                maxWeeks: 0,
            }

        const monthIndex = parseInt(currentMonth) - 1 // 숫자 월을 0-based index로 변환
        const daysInMonth = getDaysInMonth(currentYear, monthIndex)
        const firstDay = getFirstDayOfMonth(currentYear, monthIndex)

        const weeks = []
        const dayNames = ["S", "M", "T", "W", "T", "F", "S"]

        // 실제 필요한 주 수 계산
        const totalCells = daysInMonth + firstDay
        const actualWeeks = Math.ceil(totalCells / 7)

        // 각 요일별로 날짜 배열 생성
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const daysForColumn = []

            // 첫 번째 주에서 해당 요일이 시작되는 날짜 계산
            let startDate = dayIndex - firstDay + 1

            // 해당 요일의 모든 날짜 추가 (실제 주 수만큼만)
            let weekCount = 0
            while (weekCount < actualWeeks) {
                if (startDate > 0 && startDate <= daysInMonth) {
                    daysForColumn.push(startDate)
                } else {
                    daysForColumn.push(null) // 빈 날짜는 null로 표시
                }
                startDate += 7
                weekCount++
            }

            weeks.push(daysForColumn)
        }

        return { weeks, days: dayNames, maxWeeks: actualWeeks }
    }

    const isHighlighted = (day: number | null) => {
        if (day === null) return false
        return calendarData.some((item) => {
            const itemDate = new Date(item.date)
            return (
                itemDate.getDate() === day &&
                itemDate.getMonth() === parseInt(currentMonth) - 1 && // 숫자 월을 0-based index로 변환
                itemDate.getFullYear() === currentYear
            )
        })
    }

    const { weeks, days, maxWeeks } = generateCalendar()

    // 달력 끝에서 고정 간격 40px
    const fixedMarginTop = 40

    return (
        <div
            style={{
                width: "fit-content",
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            {/* 날짜와 시간 표시 */}
            <div
                style={{
                    fontSize: "16px",
                    lineHeight: "1.8em",
                    fontFamily: "Pretendard Regular",
                    textAlign: "center",
                    marginBottom: "20px",
                }}
            >
                {formatDateTime()}
            </div>

            {/* 월 표시 */}
            <div
                style={{
                    fontSize: "50px",
                    lineHeight: "1.8em",
                    fontFamily: "P22LateNovemberW01-Regular Regular",
                    textAlign: "center",
                    marginBottom: "20px",
                }}
            >
                {currentMonth}
            </div>

            {/* 달력 */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "11px",
                    padding: "0 20px 0 20px",
                    alignItems: "flex-start",
                    justifyContent: "center",
                }}
            >
                {weeks.map((daysInColumn, columnIndex) => (
                    <div
                        key={columnIndex}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        {/* 요일 헤더 */}
                        <div
                            style={{
                                fontSize: "15px",
                                lineHeight: "2.6em",
                                fontFamily: "Pretendard SemiBold",
                                marginBottom: "5px",
                            }}
                        >
                            {days[columnIndex]}
                        </div>

                        {/* 날짜들 */}
                        {daysInColumn.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "31px",
                                    height: "31px",
                                    marginBottom: "2px",
                                }}
                            >
                                {day !== null ? (
                                    <>
                                        {/* 하이라이트 원형 배경 */}
                                        {isHighlighted(day) && (
                                            <motion.div
                                                style={{
                                                    position: "absolute",
                                                    width: "31px",
                                                    height: "31px",
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        highlightColor,
                                                    zIndex: 0,
                                                }}
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [1, 0.8, 1],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            />
                                        )}

                                        {/* 날짜 텍스트 */}
                                        <div
                                            style={{
                                                fontSize: "15px",
                                                lineHeight: "2.6em",
                                                fontFamily: isHighlighted(day)
                                                    ? "Pretendard SemiBold"
                                                    : "Pretendard Regular",
                                                zIndex: 1,
                                                position: "relative",
                                            }}
                                        >
                                            {day}
                                        </div>
                                    </>
                                ) : (
                                    // 빈 공간
                                    <div
                                        style={{
                                            width: "31px",
                                            height: "31px",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* 하단 신랑신부 이름과 D-day */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: `${fixedMarginTop}px`,
                }}
            >
                {/* 신랑신부 이름 */}
                <div
                    style={{
                        fontSize: "17px",
                        lineHeight: "1em",
                        fontFamily: "Pretendard Regular",
                        textAlign: "center",
                        marginBottom: "10px",
                    }}
                >
                    {groomName} ♥ {brideName}의 결혼식
                </div>

                {/* D-day 카운터 */}
                <div
                    style={{
                        fontSize: "17px",
                        lineHeight: "1em",
                        fontFamily: "Pretendard SemiBold",
                        textAlign: "center",
                    }}
                >
                    {calculateDday()}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(CalendarComponent, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "default",
        placeholder: "Enter page ID",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#e0e0e0",
    },
    testDates: {
        type: ControlType.String,
        title: "Test Dates",
        defaultValue: "2024-12-25,2024-12-31,2025-01-01",
        placeholder: "Enter dates (YYYY-MM-DD) separated by commas",
    },
    useTestData: {
        type: ControlType.Boolean,
        title: "Use Test Data",
        defaultValue: false,
    },
    displayDate: {
        type: ControlType.String,
        title: "Display Date",
        defaultValue: "2022-10-16",
        placeholder: "YYYY-MM-DD",
    },
    displayTime: {
        type: ControlType.String,
        title: "Display Time",
        defaultValue: "15:00",
        placeholder: "HH:MM (24시간 형식)",
    },
    groomName: {
        type: ControlType.String,
        title: "신랑 이름",
        defaultValue: "태호",
        placeholder: "신랑 이름을 입력하세요",
    },
    brideName: {
        type: ControlType.String,
        title: "신부 이름",
        defaultValue: "보름",
        placeholder: "신부 이름을 입력하세요",
    },
})
