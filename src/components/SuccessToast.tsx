import { motion, AnimatePresence } from 'framer-motion'

interface SuccessToastProps {
  visible: boolean
  message?: string
}

export default function SuccessToast({ visible, message = '主题应用成功' }: SuccessToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.div
            className="flex items-center gap-2 bg-[#34C759] text-white px-5 py-3 rounded-[1000px] shadow-[0_8px_30px_rgba(52,199,89,0.4)]"
            style={{ fontFamily: "var(--font-ui)" }}
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            exit={{ y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[15px] font-medium">{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
