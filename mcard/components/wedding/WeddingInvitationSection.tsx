'use client'

import React from "react"
import { motion } from "framer-motion"
import InviteName from "./InviteName"
import WeddingContactModal from "./WeddingContactModal"

interface WeddingInvitationSectionProps {
    pageId: string
    style?: React.CSSProperties
}

export default function WeddingInvitationSection({
    pageId,
    style
}: WeddingInvitationSectionProps) {
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
                backgroundColor: '#fafafa',
                ...style,
            }}
        >
            {/* 초대장 텍스트 섹션 */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={springConfig}
                variants={fadeInUpVariants}
            >
                <InviteName pageId={pageId} />
            </motion.div>

            {/* 40px 여백 */}
            <div style={{ height: '40px' }} />

            {/* 축하 연락하기 버튼 */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={springConfig}
                variants={fadeInUpVariants}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexWrap: 'nowrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <WeddingContactModal pageId={pageId} />
            </motion.div>
        </section>
    )
}
