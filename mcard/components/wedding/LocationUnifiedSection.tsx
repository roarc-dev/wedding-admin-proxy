'use client'

import React from "react"
import { motion } from "framer-motion"
import LocationUnified from "./LocationUnified"

interface LocationUnifiedSectionProps {
    pageId: string
    style?: React.CSSProperties
}

export default function LocationUnifiedSection({ pageId, style }: LocationUnifiedSectionProps) {
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
                ...style,
            }}
        >
            {/* LocationUnified 컴포넌트 - 가로 100% fill */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={springConfig}
                variants={fadeInUpVariants}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <LocationUnified
                    pageId={pageId}
                    style={{
                        width: '100%',
                        maxWidth: 'none', // 가로 100% fill
                    }}
                />
            </motion.div>
        </section>
    )
}