import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

// 달력 설정 정보 타입 정의
interface CalendarSettings {
    // 결혼식 정보
    wedding_date: string
    wedding_time: string
    groom_name: string
    bride_name: string

    // 하이라이트 스타일
    highlight_shape?: "circle" | "heart"
    highlight_color?: string
    highlight_text_color?: string

    // 캘린더 이벤트
    calendar_events?: Array<{
        date: string
        title: string
    }>
}

interface CalendarComponentLocalProps {
    calendarSettings?: CalendarSettings
}

// 하트 모양 SVG 컴포넌트
const HeartShape: React.FC<{ color: string; size?: number }> = ({
    color,
    size = 16,
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 0.875} // 16:14 비율 유지
        viewBox="0 0 16 14"
        fill="none"
        style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -45%)", // 약간 위로 이동
            zIndex: 0,
        }}
    >
        <g clipPath="url(#clip0_31_239)">
            <g style={{ mixBlendMode: "multiply" }}>
                <path
                    d="M8.21957 1.47997C8.08957 1.59997 7.99957 1.73997 7.87957 1.85997C7.75957 1.73997 7.66957 1.59997 7.53957 1.47997C3.08957 -2.76003 -2.51043 2.94997 1.21957 7.84997C2.91957 10.08 5.58957 11.84 7.86957 13.43C10.1596 11.83 12.8196 10.08 14.5196 7.84997C18.2596 2.94997 12.6596 -2.76003 8.19957 1.47997H8.21957Z"
                    fill={color}
                />
            </g>
        </g>
        <defs>
            <clipPath id="clip0_31_239">
                <rect width="15.76" height="13.44" fill="white" />
            </clipPath>
        </defs>
    </svg>
)

export default function CalendarComponentLocal({
    calendarSettings: propCalendarSettings,
}: CalendarComponentLocalProps) {
    const [currentMonth, setCurrentMonth] = useState<string>("")
    const [currentYear, setCurrentYear] = useState<number>(
        new Date().getFullYear()
    )

    const defaultCalendarSettings: CalendarSettings = {
        wedding_date: "2024-12-18",
        wedding_time: "14:00",
        groom_name: "김신랑",
        bride_name: "박신부",
        highlight_shape: "circle",
        highlight_color: "#e0e0e0",
        highlight_text_color: "black",
        calendar_events: [
            {
                date: "2024-12-18",
                title: "결혼식",
            },
        ],
    }

    const calendarSettings = propCalendarSettings || defaultCalendarSettings

    // 달력 월/연도 업데이트 로직
    useEffect(() => {
        if (calendarSettings?.wedding_date) {
            try {
                const weddingDate = new Date(calendarSettings.wedding_date)
                if (!isNaN(weddingDate.getTime())) {
                    setCurrentMonth((weddingDate.getMonth() + 1).toString())
                    setCurrentYear(weddingDate.getFullYear())
                }
            } catch (error) {
                console.error(
                    "Invalid wedding date:",
                    calendarSettings.wedding_date
                )
            }
        } else if (
            calendarSettings?.calendar_events &&
            calendarSettings.calendar_events.length > 0
        ) {
            try {
                const firstEvent = calendarSettings.calendar_events[0]
                const eventDate = new Date(firstEvent.date)
                if (!isNaN(eventDate.getTime())) {
                    setCurrentMonth((eventDate.getMonth() + 1).toString())
                    setCurrentYear(eventDate.getFullYear())
                }
            } catch (error) {
                console.error(
                    "Invalid event date:",
                    calendarSettings.calendar_events[0]?.date
                )
            }
        }
    }, [calendarSettings?.wedding_date, calendarSettings?.calendar_events])

    // pageSettings와 calendarData를 calendarSettings에서 추출
    const pageSettings = {
        wedding_date: calendarSettings.wedding_date,
        wedding_time: calendarSettings.wedding_time,
        groom_name: calendarSettings.groom_name,
        bride_name: calendarSettings.bride_name,
        highlight_shape: calendarSettings.highlight_shape,
        highlight_color: calendarSettings.highlight_color,
        highlight_text_color: calendarSettings.highlight_text_color,
    }

    const calendarData = calendarSettings.calendar_events || []

    // D-day 계산 함수
    const calculateDday = () => {
        try {
            const weddingDate = pageSettings?.wedding_date
            if (!weddingDate) {
                return "D-00일"
            }

            const today = new Date()
            const targetDate = new Date(weddingDate)

            // 시간 정보 제거 (자정으로 설정)
            today.setHours(0, 0, 0, 0)
            targetDate.setHours(0, 0, 0, 0)

            const timeDiff = targetDate.getTime() - today.getTime()
            const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

            // D-1일 이하(결혼식 당일 포함)일 때 D-DAY 표시
            if (dayDiff <= 1 && dayDiff >= 0) {
                return "D-DAY"
            }

            if (dayDiff > 1) {
                return `D-${dayDiff.toString().padStart(2, "0")}일`
            }

            return `D+${Math.abs(dayDiff).toString().padStart(2, "0")}일`
        } catch (error) {
            return "D-00일"
        }
    }

    // 날짜와 시간 포맷팅 함수
    const formatDateTime = () => {
        try {
            const weddingDate = pageSettings?.wedding_date
            const weddingTime = pageSettings?.wedding_time

            if (!weddingDate || !weddingTime) {
                return "날짜 정보 없음"
            }

            const date = new Date(weddingDate)
            const [hour, minute] = weddingTime.split(":")
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

        const currentMonthIndex = parseInt(currentMonth) - 1 // 0-based

        // 디버깅 정보 (필요시 활성화)
        // if (day === 18) {
        //     console.log('하이라이트 체크:', { day, currentMonth, currentYear, pageSettings, calendarData })
        // }

        // 1. 웨딩 날짜인지 확인
        if (pageSettings?.wedding_date) {
            const weddingDate = new Date(pageSettings.wedding_date)
            const isWeddingDay =
                weddingDate.getDate() === day &&
                weddingDate.getMonth() === currentMonthIndex &&
                weddingDate.getFullYear() === currentYear

            // if (day === 18) {
            //     console.log('웨딩 날짜 체크:', { weddingDate: pageSettings.wedding_date, isWeddingDay })
            // }

            if (isWeddingDay) {
                return true
            }
        }

        // 2. 캘린더 이벤트 날짜인지 확인
        const isEventDay = calendarData.some((item) => {
            const itemDate = new Date(item.date)
            const matches =
                itemDate.getDate() === day &&
                itemDate.getMonth() === currentMonthIndex &&
                itemDate.getFullYear() === currentYear

            // if (day === 18) {
            //     console.log('이벤트 날짜 체크:', { itemDate: item.date, matches })
            // }

            return matches
        })

        // if (day === 18) {
        //     console.log('최종 하이라이트 결과:', isEventDay)
        // }

        return isEventDay
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
                                        {/* 하이라이트 배경 (원형 또는 하트) */}
                                        {isHighlighted(day) && (
                                            <>
                                                {pageSettings?.highlight_shape ===
                                                "heart" ? (
                                                    <motion.div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            zIndex: 0,
                                                        }}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [
                                                                1, 0.8, 1,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        }}
                                                    >
                                                        <HeartShape
                                                            color={
                                                                pageSettings?.highlight_color ||
                                                                "#e0e0e0"
                                                            }
                                                            size={28}
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            width: "31px",
                                                            height: "31px",
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                pageSettings?.highlight_color ||
                                                                "#e0e0e0",
                                                            zIndex: 0,
                                                        }}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [
                                                                1, 0.8, 1,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* 날짜 텍스트 */}
                                        <div
                                            style={{
                                                fontSize: "15px",
                                                lineHeight: "2.6em",
                                                fontFamily: isHighlighted(day)
                                                    ? "Pretendard SemiBold"
                                                    : "Pretendard Regular",
                                                color: isHighlighted(day)
                                                    ? pageSettings?.highlight_text_color ||
                                                      "black"
                                                    : "black",
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
                    {pageSettings?.groom_name || "신랑"} ♥{" "}
                    {pageSettings?.bride_name || "신부"}의 결혼식
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

addPropertyControls(CalendarComponentLocal, {
    calendarSettings: {
        type: ControlType.Object,
        title: "달력 설정",
        controls: {
            // 결혼식 정보 섹션
            wedding_date: {
                type: ControlType.String,
                title: "결혼식 날짜",
                defaultValue: "2024-12-18",
                placeholder: "YYYY-MM-DD 형식으로 입력 (예: 2024-12-18)",
            },
            wedding_time: {
                type: ControlType.String,
                title: "결혼식 시간",
                defaultValue: "14:00",
                placeholder: "HH:MM 형식으로 입력 (예: 14:00)",
            },
            groom_name: {
                type: ControlType.String,
                title: "신랑 이름",
                defaultValue: "김신랑",
            },
            bride_name: {
                type: ControlType.String,
                title: "신부 이름",
                defaultValue: "박신부",
            },

            // 스타일 설정 섹션
            highlight_shape: {
                type: ControlType.Enum,
                title: "하이라이트 모양",
                defaultValue: "circle",
                options: ["circle", "heart"],
                displaySegmentedControl: true,
            },
            highlight_color: {
                type: ControlType.Color,
                title: "하이라이트 색상",
                defaultValue: "#e0e0e0",
            },
            highlight_text_color: {
                type: ControlType.Color,
                title: "하이라이트 텍스트 색상",
                defaultValue: "#000000",
            },

            // 캘린더 이벤트 섹션
            calendar_events: {
                type: ControlType.Array,
                title: "캘린더 이벤트",
                control: {
                    type: ControlType.Object,
                    controls: {
                        date: {
                            type: ControlType.String,
                            title: "날짜",
                            defaultValue: "2024-12-18",
                            placeholder: "YYYY-MM-DD 형식으로 입력",
                        },
                        title: {
                            type: ControlType.String,
                            title: "제목",
                            defaultValue: "결혼식",
                            placeholder: "이벤트 제목을 입력하세요",
                        },
                    },
                },
                defaultValue: [
                    {
                        date: "2024-12-18",
                        title: "결혼식",
                    },
                ],
            },
        },
    },
})
