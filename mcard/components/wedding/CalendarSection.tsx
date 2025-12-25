'use client'

import React from "react"
import { motion } from "framer-motion"
import CalendarProxy from "./CalendarProxy"
import CalendarAddBtn from "./CalendarAddBtn"

interface CalendarSectionProps {
    pageId: string
    style?: React.CSSProperties
}

export default function CalendarSection({ pageId, style }: CalendarSectionProps) {
    // Layer in View 애니메이션 설정
    const springConfig = {
        type: "spring" as const,
        stiffness: 200,
        damping: 60,
        mass: 1,
    }

    const fadeInUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    }

    return (
        <section
            style={{
                width: '100%',
                paddingTop: '80px',
                paddingBottom: '80px',
                color: 'rgba(245, 245, 245, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                ...style,
            }}
        >
            {/* CalendarProxy 컴포넌트 */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={springConfig}
                variants={fadeInUpVariants}
            >
                <CalendarProxy pageId={pageId} />
            </motion.div>

            {/* 50px 여백 */}
            <div style={{ height: '50px' }} />

            {/* CalendarAddBtn 컴포넌트 */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={springConfig}
                variants={fadeInUpVariants}
                style={{
                    width: '100%',
                    color: 'rgba(245, 245, 245, 1)',
                }}
            >
                <CalendarAddBtn pageId={pageId} />
            </motion.div>
        </section>
    )
}