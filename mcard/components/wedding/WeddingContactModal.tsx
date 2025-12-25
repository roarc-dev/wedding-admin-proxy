'use client'

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import WeddingContact from "./WeddingContact"

// Typography 폰트 스택 (typography.js에서 가져온 값들)
const FONT_STACKS = {
    pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    p22: '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    goldenbook: '"goldenbook", "Goldenbook", serif',
    sloopScriptPro: '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif',
}

interface WeddingContactModalProps {
    pageId: string
    style?: React.CSSProperties
}

export default function WeddingContactModal({ pageId, style }: WeddingContactModalProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // 폰트 패밀리 설정 (typography.js에서 가져온 폰트 스택 사용)
    const pretendardFontFamily = FONT_STACKS.pretendardVariable

    // 버튼 클릭 핸들러
    const handleButtonClick = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    // 모달 닫기 핸들러
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    // 오버레이 클릭 핸들러 (컴포넌트 외부 클릭 시 닫기)
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleCloseModal()
        }
    }, [handleCloseModal])

    return (
        <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            ...style
        }}>
            {/* 축하 연락하기 버튼 */}
            <motion.button
                onClick={handleButtonClick}
                style={{
                    width: '258px',
                    height: '54px',
                    background: '#EBEBEB',
                    border: 'none',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontFamily: pretendardFontFamily,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#000000',
                }}
                whileHover={{ backgroundColor: '#E0E0E0' }}
                whileTap={{ scale: 0.98 }}
            >
                축하 연락하기
            </motion.button>

            {/* 모달 오버레이 */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                        }}
                        onClick={handleOverlayClick}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                maxWidth: '400px',
                                width: '90%',
                                maxHeight: '80vh',
                            }}
                            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록
                        >
                            <WeddingContact pageId={pageId} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
