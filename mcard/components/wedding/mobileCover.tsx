import React, { useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface Props {
    width: number
    height: number
}

export default function MobileCoverAnimation(props: Props) {
    const { width, height } = props
    const [isVisible, setIsVisible] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const { scrollY } = useScroll()

    // 스크롤 위치에 따른 변환값 계산
    const y = useTransform(scrollY, [0, 1], [0, height])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY =
                window.scrollY || document.documentElement.scrollTop

            if (currentScrollY > 0 && isVisible) {
                setIsVisible(false)
                setIsAnimating(true)
            } else if (currentScrollY === 0 && !isVisible) {
                setIsVisible(true)
                setIsAnimating(true)
            }
        }

        // 스크롤 이벤트 리스너 등록
        window.addEventListener("scroll", handleScroll, { passive: true })

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [isVisible])

    // 애니메이션 완료 후 pointerEvents 제어
    const handleAnimationComplete = () => {
        setIsAnimating(false)
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                width: "100%",
                maxWidth: "430px",
                margin: "0 auto",
                height: "100vh",
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: "240px",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "calc(100vh - 240px)",
                    overflow: "hidden",
                }}
                animate={{
                    y: isVisible ? 0 : "100%",
                }}
                transition={{
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1], // ease-out
                }}
                onAnimationComplete={handleAnimationComplete}
            >
                <img
                    src="https://cdn.roarc.kr/framer/components/mobileCover3.png"
                    alt="Mobile Cover"
                    style={{
                        width: "100%",
                        height: "100vh", // 전체 뷰포트 높이로 설정
                        objectFit: "cover",
                        objectPosition: "top", // 상단부터 보이도록 설정
                        display: "block",
                    }}
                    loading="eager"
                />
            </motion.div>
        </div>
    )
}
