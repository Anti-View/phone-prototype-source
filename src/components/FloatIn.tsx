import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'

type FloatInKind = 'item' | 'text' | 'image' | 'card'

type FloatInContextValue = {
  ready: boolean
  step: number
  baseDelay: number
}

const FloatInContext = createContext<FloatInContextValue>({
  ready: true,
  step: 0.22,
  baseDelay: 0,
})

function getFloatInVariants(kind: FloatInKind): Variants {
  if (kind === 'text') {
    return {
      hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
      show: (delay = 0) => ({
        opacity: 0.65,
        y: 0,
        filter: 'blur(0px)',
        transition: {
          delay,
          y: { type: 'spring', stiffness: 100, damping: 22, mass: 1.2 },
          opacity: { duration: 0.86, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 0.86, ease: [0.22, 1, 0.36, 1] },
        },
      }),
    }
  }

  if (kind === 'image') {
    return {
      hidden: { opacity: 0, y: 34, filter: 'blur(5px)' },
      show: (delay = 0) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
          delay: delay + 0.34,
          y: { type: 'spring', stiffness: 92, damping: 23, mass: 1.28 },
          opacity: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
        },
      }),
    }
  }

  if (kind === 'card') {
    return {
      hidden: { opacity: 0, y: 34, filter: 'blur(5px)' },
      show: (delay = 0) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
          delay,
          y: { type: 'spring', stiffness: 96, damping: 22, mass: 1.22 },
          opacity: { duration: 0.84, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 0.86, ease: [0.22, 1, 0.36, 1] },
        },
      }),
    }
  }

  return {
    hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
    show: (delay = 0) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        delay,
        y: { type: 'spring', stiffness: 105, damping: 22, mass: 1.18 },
        opacity: { duration: 0.78, ease: [0.22, 1, 0.36, 1] },
        filter: { duration: 0.82, ease: [0.22, 1, 0.36, 1] },
      },
    }),
  }
}

export function FloatInGroup({
  children,
  startDelay = 0,
  resetKey,
  step = 0.22,
  baseDelay = 0,
  enabled = true,
}: {
  children: ReactNode
  startDelay?: number
  resetKey?: string | number
  step?: number
  baseDelay?: number
  enabled?: boolean
}) {
  const [timerReady, setTimerReady] = useState(startDelay <= 0)

  useEffect(() => {
    if (!enabled) {
      setTimerReady(false)
      return
    }

    setTimerReady(startDelay <= 0)

    if (startDelay <= 0) return

    const timer = window.setTimeout(() => {
      setTimerReady(true)
    }, startDelay)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, startDelay, resetKey])

  const value = useMemo(
    () => ({
      ready: enabled && timerReady,
      step,
      baseDelay,
    }),
    [enabled, timerReady, step, baseDelay],
  )

  return (
    <FloatInContext.Provider value={value}>
      {children}
    </FloatInContext.Provider>
  )
}

type FloatInItemProps = HTMLMotionProps<'div'> & {
  index?: number
  kind?: FloatInKind
  extraDelay?: number
}

export function FloatInItem({
  index = 0,
  kind = 'item',
  extraDelay = 0,
  children,
  ...props
}: FloatInItemProps) {
  const { ready, step, baseDelay } = useContext(FloatInContext)
  const variants = useMemo(() => getFloatInVariants(kind), [kind])
  const delay = baseDelay + index * step + extraDelay

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate={ready ? 'show' : 'hidden'}
      custom={delay}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type FloatInImageProps = HTMLMotionProps<'img'> & {
  index?: number
  kind?: FloatInKind
  extraDelay?: number
}

export function FloatInImage({
  index = 0,
  kind = 'image',
  extraDelay = 0,
  ...props
}: FloatInImageProps) {
  const { ready, step, baseDelay } = useContext(FloatInContext)
  const variants = useMemo(() => getFloatInVariants(kind), [kind])
  const delay = baseDelay + index * step + extraDelay

  return (
    <motion.img
      variants={variants}
      initial="hidden"
      animate={ready ? 'show' : 'hidden'}
      custom={delay}
      {...props}
    />
  )
}
