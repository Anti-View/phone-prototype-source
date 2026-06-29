import { type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type IslandVariant = 'square' | 'wide'

const VARIANTS = {
  square: { w: 264, h: 264, left: 69,  radius: 56 },
  wide:   { w: 370, h: 240, left: 16,  radius: 56 },
} as const

interface DynamicIslandProps {
  expanded: boolean
  variant?: IslandVariant
  onClose: () => void
  children?: ReactNode
  style?: CSSProperties
}

export default function DynamicIsland({ expanded, variant = 'square', onClose, children, style }: DynamicIslandProps) {
  const v = VARIANTS[variant]

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: expanded ? 50 : 40 }}>
      {/* Backdrop — tap to dismiss */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute inset-0 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Island shell */}
      <motion.div
        className="absolute pointer-events-auto overflow-hidden bg-black"
        initial={false}
        style={style}
        animate={{
          left: expanded ? v.left : 186,
          top: 16,
          width: expanded ? v.w : 30,
          height: expanded ? v.h : 30,
          borderRadius: expanded ? v.radius : 30,
        }}
        transition={
          expanded
            ? { type: 'spring', stiffness: 170, damping: 18, mass: 1 }
            : { type: 'spring', stiffness: 260, damping: 32, mass: 1 }
        }
      >
        {/* UI content — individual items animate with FloatIn */}
        {expanded && (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </motion.div>
    </div>
  )
}
