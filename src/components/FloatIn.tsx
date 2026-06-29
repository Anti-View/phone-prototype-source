import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

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

function getFloatInMotion(kind: FloatInKind, delay: number) {
  if (kind === 'text') {
    return {
      initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
      animate: { opacity: 0.65, y: 0, filter: 'blur(0px)' },
      transition: {
        y: { delay, type: 'spring' as const, stiffness: 100, damping: 22, mass: 1.2 },
        opacity: { delay, duration: 0.86, ease: [0.22, 1, 0.36, 1] as const },
        filter: { delay, duration: 0.86, ease: [0.22, 1, 0.36, 1] as const },
      },
    }
  }

  if (kind === 'image') {
    return {
      initial: { opacity: 0, y: 34, filter: 'blur(5px)' },
      animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
      transition: {
        y: { delay, type: 'spring' as const, stiffness: 92, damping: 23, mass: 1.28 },
        opacity: { delay, duration: 0.95, ease: [0.22, 1, 0.36, 1] as const },
        filter: { delay, duration: 0.95, ease: [0.22, 1, 0.36, 1] as const },
      },
    }
  }

  if (kind === 'card') {
    return {
      initial: { opacity: 0, y: 34, filter: 'blur(5px)' },
      animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
      transition: {
        y: { delay, type: 'spring' as const, stiffness: 96, damping: 22, mass: 1.22 },
        opacity: { delay, duration: 0.84, ease: [0.22, 1, 0.36, 1] as const },
        filter: { delay, duration: 0.86, ease: [0.22, 1, 0.36, 1] as const },
      },
    }
  }

  return {
    initial: { opacity: 0, y: 28, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: {
      y: { delay, type: 'spring' as const, stiffness: 105, damping: 22, mass: 1.18 },
      opacity: { delay, duration: 0.78, ease: [0.22, 1, 0.36, 1] as const },
      filter: { delay, duration: 0.82, ease: [0.22, 1, 0.36, 1] as const },
    },
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
  const delay = baseDelay + index * step + extraDelay

  const motionState = useMemo(
    () => getFloatInMotion(kind, delay),
    [kind, delay],
  )

  return (
    <motion.div
      initial={motionState.initial}
      animate={ready ? motionState.animate : motionState.initial}
      transition={motionState.transition}
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
  const delay = baseDelay + index * step + extraDelay

  const motionState = useMemo(
    () => getFloatInMotion(kind, delay),
    [kind, delay],
  )

  return (
    <motion.img
      initial={motionState.initial}
      animate={ready ? motionState.animate : motionState.initial}
      transition={motionState.transition}
      {...props}
    />
  )
}
