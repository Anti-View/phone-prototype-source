import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, type PanInfo } from 'framer-motion'
import NavBar from './NavBar'
import { publicAsset } from '../utils/assets'
import { FloatInGroup, FloatInItem } from './FloatIn'

const SF = "'SF Pro Display', 'SF Pro', -apple-system"
const PINGFANG = "'PingFang SC', sans-serif"
const GLASS_CARD_SHADOW = '0px 1px 1px #D0D5EA inset, 0px -2px 1px white inset'
const SHEET_SHADOW = '0px 15px 75px rgba(0, 0, 0, 0.18)'

const DISPLAY_CASES = [
  {
    image: 'img/洞洞板.png',
    description:
      '趣味洞洞板为你定格现实好物，开启 HarmonyOS Vision，把它们变成贴纸与挂件随心定格。',
  },
  {
    image: 'img/木制柜台.png',
    description:
      '经典木质展台，专为陈列专辑与书封而设，你和 Catlien 的心头好，皆在此悉数收纳。',
  },
  {
    image: 'img/亚克力.png',
    description:
      '借助 HarmonyOS Vision，将现实物品化作 3D 模型，收入你的亚克力展柜。',
  },
] as const

/* ── Shared shell for showcase sheets ── */
function ShowcaseSheetShell({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) {
  return (
    <motion.div
      className="absolute left-0 top-[188px] w-full h-[686px] bg-[#EEEFF4] rounded-t-[38px] z-30 flex flex-col items-center overflow-hidden"
      style={{
        boxShadow: SHEET_SHADOW,
        fontFamily: 'var(--font-ui)',
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        type: 'spring',
        damping: 28,
        stiffness: 280,
        mass: 1.1,
      }}
    >
      <div
        style={{
          alignSelf: 'stretch',
          paddingBottom: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            height: 16,
            paddingTop: 5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}
        >
          <svg width="36" height="5" viewBox="0 0 36 5" fill="none">
            <path
              d="M0 2.5C0 1.11929 1.11929 0 2.5 0H33.5C34.8807 0 36 1.11929 36 2.5C36 3.88071 34.8807 5 33.5 5H2.5C1.11929 5 0 3.88071 0 2.5Z"
              fill="#CCCCCC"
            />
          </svg>
        </div>

        <div
          style={{
            alignSelf: 'stretch',
            paddingLeft: 16,
            paddingRight: 16,
            position: 'relative',
            display: 'inline-flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 44,
              minWidth: 44,
              paddingLeft: 4,
              paddingRight: 4,
              position: 'relative',
              borderRadius: 296,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
            }}
            className="active:scale-90 transition-transform"
          >
            <div
              style={{
                width: 44,
                height: 44,
                left: 0,
                top: 0,
                position: 'absolute',
                borderRadius: 999,
                background: 'rgba(120, 120, 128, 0.16)',
              }}
            />
            <div
              style={{
                width: 36,
                alignSelf: 'stretch',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#727272',
                fontSize: 17,
                fontFamily: SF,
                fontWeight: 510,
              }}
            >
              􀆄
            </div>
          </button>

          <div style={{ width: 8, alignSelf: 'stretch', position: 'relative' }} />
          <div style={{ width: 36, height: 22 }} />
        </div>
      </div>

      {children}
    </motion.div>
  )
}

/* ── Shared primary button ── */
function PrimaryButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:scale-[0.98] transition-transform"
      style={{
        width: 370,
        height: 52,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 6,
        paddingBottom: 6,
        position: 'relative',
        borderRadius: 1000,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        border: 0,
        background: '#0088FF',
        boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          height: 36,
          borderRadius: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: 'white',
            fontSize: 17,
            fontFamily: PINGFANG,
            fontWeight: 500,
          }}
        >
          {label}
        </div>
      </div>
    </button>
  )
}

/* ── Sheet 1: Choose showcase ── */
function ChooseShowcaseSheet({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (selectedIndex: number) => void
}) {
  const CASE_PAGE_WIDTH = 338
  const CASE_IMAGE_SIZE = 322
  const CASE_PAGE_GAP = 64
  const CASE_STEP = CASE_PAGE_WIDTH + CASE_PAGE_GAP
  const CASE_COUNT = DISPLAY_CASES.length
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0)
  const showcaseTrackX = useMotionValue(0)

  const snapToShowcaseCase = useCallback((index: number) => {
    const target = Math.max(0, Math.min(CASE_COUNT - 1, index))
    setSelectedCaseIndex(target)
    animate(showcaseTrackX, -target * CASE_STEP, {
      type: 'spring',
      stiffness: 300,
      damping: 28,
      mass: 1,
    })
  }, [showcaseTrackX])

  const handleShowcaseTrackDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50
      const velocityThreshold = 450
      let target = selectedCaseIndex
      if (
        (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) &&
        selectedCaseIndex < CASE_COUNT - 1
      ) {
        target = selectedCaseIndex + 1
      } else if (
        (info.offset.x > threshold || info.velocity.x > velocityThreshold) &&
        selectedCaseIndex > 0
      ) {
        target = selectedCaseIndex - 1
      }
      snapToShowcaseCase(target)
    },
    [selectedCaseIndex, snapToShowcaseCase],
  )

  const handleConfirm = useCallback(() => {
    snapToShowcaseCase(selectedCaseIndex)
    onConfirm(selectedCaseIndex)
  }, [selectedCaseIndex, snapToShowcaseCase, onConfirm])

  return (
    <ShowcaseSheetShell onClose={onClose}>
      <div
        style={{
          alignSelf: 'stretch',
          paddingBottom: 36,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <FloatInGroup startDelay={160} resetKey="choose-showcase-sheet-content" step={0.16}>
          <div
            style={{
              alignSelf: 'stretch',
              paddingLeft: 32,
              paddingRight: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 24,
            }}
          >
            {/* Title */}
            <FloatInItem index={0} kind="item" style={{ width: '100%' }}>
              <div
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: 'black',
                    fontSize: 22,
                    fontFamily: PINGFANG,
                    fontWeight: 600,
                  }}
                >
                  选择展柜
                </div>
              </div>
            </FloatInItem>

            {/* Horizontal track */}
            <FloatInItem index={1} kind="item">
              <div
                style={{
                  width: CASE_PAGE_WIDTH,
                  overflow: 'visible',
                  touchAction: 'pan-x',
                  cursor: 'grab',
                }}
              >
                <motion.div
                  drag="x"
                  dragConstraints={{
                    left: -(CASE_COUNT - 1) * CASE_STEP,
                    right: 0,
                  }}
                  dragElastic={0.18}
                  dragMomentum={false}
                  dragDirectionLock
                  onDragEnd={handleShowcaseTrackDragEnd}
                  style={{
                    x: showcaseTrackX,
                    display: 'inline-flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: CASE_PAGE_GAP,
                  }}
                >
                  {DISPLAY_CASES.map((item) => (
                    <div
                      key={item.image}
                      style={{
                        width: CASE_PAGE_WIDTH,
                        display: 'inline-flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: 24,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          alignSelf: 'stretch',
                          color: 'rgba(0, 0, 0, 0.50)',
                          fontSize: 15,
                          fontFamily: PINGFANG,
                          fontWeight: 400,
                          lineHeight: '22px',
                        }}
                      >
                        {item.description}
                      </div>

                      <img
                        src={publicAsset(item.image)}
                        alt=""
                        style={{
                          width: CASE_IMAGE_SIZE,
                          height: CASE_IMAGE_SIZE,
                          display: 'block',
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                        draggable={false}
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
            </FloatInItem>

            {/* Footnote */}
            <FloatInItem index={2} kind="item" style={{ width: '100%' }}>
              <div
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: 'rgba(0, 0, 0, 0.30)',
                    fontSize: 15,
                    fontFamily: PINGFANG,
                    fontWeight: 400,
                    textAlign: 'center',
                  }}
                >
                  *Catlien也会将喜爱的物品放在这里。
                </div>
              </div>
            </FloatInItem>
          </div>

          <FloatInItem index={3} kind="item">
            <PrimaryButton label="确定" onClick={handleConfirm} />
          </FloatInItem>
        </FloatInGroup>
      </div>
    </ShowcaseSheetShell>
  )
}

/* ── Main collection page ── */
export default function CollectionWaterfallPage({
  onBack,
  onConfirmDisplayCase,
}: {
  onBack: () => void
  onConfirmDisplayCase: (selectedCaseIndex: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const momentumRef = useRef<number | null>(null)
  const rubberOffsetRef = useRef(0)
  const rubberReturnRef = useRef<number | null>(null)

  const [chooseSheetOpen, setChooseSheetOpen] = useState(false)

  const closeShowcaseSheet = useCallback(() => {
    setChooseSheetOpen(false)
  }, [])

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    tapCreateShowcase: false,
  })

  const getMaxScroll = useCallback((el: HTMLDivElement) => {
    return Math.max(0, el.scrollHeight - el.clientHeight)
  }, [])

  const RUBBER_SPRING = 0.18
  const RUBBER_DAMPING = 0.72
  const MOMENTUM_TO_RUBBER = 0.42
  const RELEASE_TO_RUBBER = 0.35

  const cancelRubberReturn = useCallback(() => {
    if (rubberReturnRef.current !== null) {
      cancelAnimationFrame(rubberReturnRef.current)
      rubberReturnRef.current = null
    }
  }, [])

  const setRubberOffset = useCallback((offset: number) => {
    const content = contentRef.current
    rubberOffsetRef.current = offset

    if (!content) return

    if (Math.abs(offset) < 0.1) {
      content.style.transform = ''
      return
    }

    content.style.transform = `translateY(${offset}px)`
  }, [])

  const resetRubberOffset = useCallback((initialVelocity = 0) => {
    const content = contentRef.current
    if (!content) return

    cancelRubberReturn()

    let offset = rubberOffsetRef.current
    let velocity = initialVelocity * 16.67
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime) / 16.67
      lastTime = now

      velocity += -offset * RUBBER_SPRING * dt
      velocity *= Math.pow(RUBBER_DAMPING, dt)
      offset += velocity * dt

      rubberOffsetRef.current = offset

      if (Math.abs(offset) < 0.25 && Math.abs(velocity) < 0.25) {
        rubberOffsetRef.current = 0
        content.style.transform = ''
        rubberReturnRef.current = null
        return
      }

      content.style.transform = `translateY(${offset}px)`
      rubberReturnRef.current = requestAnimationFrame(step)
    }

    rubberReturnRef.current = requestAnimationFrame(step)
  }, [cancelRubberReturn])

  const cancelMomentum = useCallback(() => {
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }
  }, [])

  const startMomentum = useCallback((initialVelocity: number) => {
    const el = scrollRef.current
    if (!el) return

    let velocity = initialVelocity
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime)
      lastTime = now

      const maxScroll = getMaxScroll(el)
      const next = el.scrollTop + velocity * dt

      if (next < 0) {
        el.scrollTop = 0
        resetRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        momentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        resetRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        momentumRef.current = null
        return
      }

      el.scrollTop = next
      velocity *= Math.pow(0.95, dt / 16.67)

      if (Math.abs(velocity) < 0.02) {
        momentumRef.current = null
        return
      }

      momentumRef.current = requestAnimationFrame(step)
    }

    momentumRef.current = requestAnimationFrame(step)
  }, [getMaxScroll, resetRubberOffset])

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    const createCard = target.closest('[data-create-showcase-card]') as HTMLElement | null

    cancelMomentum()
    cancelRubberReturn()
    setRubberOffset(0)

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
      tapCreateShowcase: !!createCard,
    }

    el.setPointerCapture(e.pointerId)
  }, [cancelMomentum, cancelRubberReturn, setRubberOffset])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = scrollRef.current
    if (!el) return

    const now = performance.now()
    const dt = Math.max(1, now - state.lastTime)
    const dy = e.clientY - state.lastY

    const instantVelocity = -dy / dt
    state.velocity = state.velocity * 0.7 + instantVelocity * 0.3
    state.lastY = e.clientY
    state.lastTime = now

    const totalDeltaY = e.clientY - state.startY
    if (Math.abs(totalDeltaY) > 6) {
      state.moved = true
    }

    const rawScrollTop = state.startScrollTop - totalDeltaY
    const maxScroll = getMaxScroll(el)

    if (rawScrollTop < 0) {
      el.scrollTop = 0
      setRubberOffset(-rawScrollTop * 0.35)
    } else if (rawScrollTop > maxScroll) {
      el.scrollTop = maxScroll
      setRubberOffset(-(rawScrollTop - maxScroll) * 0.35)
    } else {
      el.scrollTop = rawScrollTop
      setRubberOffset(0)
    }

    e.preventDefault()
  }, [getMaxScroll, setRubberOffset])

  const stopDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = scrollRef.current
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }

    const wasCreateShowcaseTap = !state.moved && state.tapCreateShowcase
    const releaseVelocity = state.velocity

    dragRef.current.active = false
    dragRef.current.pointerId = -1
    dragRef.current.moved = false
    dragRef.current.tapCreateShowcase = false

    if (wasCreateShowcaseTap) {
      cancelMomentum()
      cancelRubberReturn()
      setRubberOffset(0)
      setChooseSheetOpen(true)
      return
    }

    const maxScroll = el ? getMaxScroll(el) : 0
    const atTop = !!el && el.scrollTop <= 0
    const atBottom = !!el && el.scrollTop >= maxScroll
    const flingOutward =
      (atTop && releaseVelocity < 0) ||
      (atBottom && releaseVelocity > 0)

    if (flingOutward) {
      resetRubberOffset(-releaseVelocity * RELEASE_TO_RUBBER)
    } else {
      resetRubberOffset()

      if (Math.abs(releaseVelocity) > 0.08) {
        startMomentum(releaseVelocity)
      }
    }
  }, [resetRubberOffset, startMomentum, getMaxScroll, cancelMomentum, cancelRubberReturn, setRubberOffset])

  useEffect(() => {
    return () => {
      cancelMomentum()
      cancelRubberReturn()
    }
  }, [cancelMomentum, cancelRubberReturn])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#EEEFF4' }} />

      <NavBar onHome={onBack} />

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
      >
        <div
          ref={contentRef}
          className="flex flex-col"
          style={{
            paddingTop: 126,
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 64,
            minHeight: '100%',
            gap: 40,
            willChange: 'transform',
          }}
        >
          <FloatInGroup startDelay={100} resetKey="collection-waterfall" step={0.14}>
            {/* ── Showcase 1 ── */}
            <div
              style={{
                width: 362,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <FloatInItem index={0} kind="item">
                  <div
                    style={{
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.90)',
                        fontSize: 28,
                        fontFamily: PINGFANG,
                        fontWeight: 600,
                      }}
                    >
                      Showcase 1
                    </div>
                  </div>
                </FloatInItem>

                <FloatInItem index={1} kind="card" style={{ alignSelf: 'stretch' }}>
                  <div
                    style={{
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.80)',
                        fontSize: 14,
                        fontFamily: PINGFANG,
                        fontWeight: 400,
                      }}
                    >
                      Calien新增了一个物件：我的正面照
                    </div>

                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 14,
                        fontFamily: PINGFANG,
                        fontWeight: 400,
                      }}
                    >
                      刚刚
                    </div>
                  </div>
                </FloatInItem>
              </div>

              <FloatInItem index={2} kind="image">
                <img
                  src={publicAsset('img/展柜_成品.png')}
                  alt=""
                  style={{
                    width: 362,
                    height: 362,
                    display: 'block',
                  }}
                  draggable={false}
                />
              </FloatInItem>

              <FloatInItem index={3} kind="item">
                <div
                  style={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 1000,
                      display: 'inline-flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 16,
                        fontFamily: SF,
                        fontWeight: 400,
                      }}
                    >
                      􀉞
                    </div>
                  </div>

                  <div
                    style={{
                      width: 134,
                      height: 56,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 1000,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.90)',
                        fontSize: 16,
                        fontFamily: PINGFANG,
                        fontWeight: 500,
                      }}
                    >
                      编辑
                    </div>
                  </div>

                  <div
                    style={{
                      width: 56,
                      height: 56,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 1000,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 16,
                        fontFamily: SF,
                        fontWeight: 400,
                      }}
                    >
                      􀰞
                    </div>
                  </div>
                </div>
              </FloatInItem>
            </div>

            {/* ── Showcase 2 ── */}
            <div
              style={{
                width: 362,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <FloatInItem index={4} kind="item">
                  <div
                    style={{
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.90)',
                        fontSize: 28,
                        fontFamily: PINGFANG,
                        fontWeight: 600,
                      }}
                    >
                      Showcase 2
                    </div>
                  </div>
                </FloatInItem>

                <FloatInItem index={5} kind="card" style={{ alignSelf: 'stretch' }}>
                  <div
                    style={{
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.80)',
                        fontSize: 14,
                        fontFamily: PINGFANG,
                        fontWeight: 400,
                      }}
                    >
                      Calien新增了一个物件：我的正面照
                    </div>

                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 14,
                        fontFamily: PINGFANG,
                        fontWeight: 400,
                      }}
                    >
                      刚刚
                    </div>
                  </div>
                </FloatInItem>
              </div>

              <FloatInItem index={6} kind="image">
                <img
                  src={publicAsset('img/洞洞板_成品.png')}
                  alt=""
                  style={{
                    width: 362,
                    height: 362,
                    display: 'block',
                  }}
                  draggable={false}
                />
              </FloatInItem>

              <FloatInItem index={7} kind="item">
                <div
                  style={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 1000,
                      display: 'inline-flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 16,
                        fontFamily: SF,
                        fontWeight: 400,
                      }}
                    >
                      􀉞
                    </div>
                  </div>

                  <div
                    style={{
                      width: 134,
                      height: 56,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 1000,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.90)',
                        fontSize: 16,
                        fontFamily: PINGFANG,
                        fontWeight: 500,
                      }}
                    >
                      编辑
                    </div>
                  </div>

                  <div
                    style={{
                      width: 56,
                      height: 56,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      background: 'rgba(255, 255, 255, 0.40)',
                      boxShadow: GLASS_CARD_SHADOW,
                      borderRadius: 1000,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 16,
                        fontFamily: SF,
                        fontWeight: 400,
                      }}
                    >
                      􀰞
                    </div>
                  </div>
                </div>
              </FloatInItem>
            </div>

            {/* ── Showcase 3 ── */}
            <div
              style={{
                width: 362,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <FloatInItem index={8} kind="item">
                  <div
                    style={{
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(0, 0, 0, 0.90)',
                        fontSize: 28,
                        fontFamily: PINGFANG,
                        fontWeight: 600,
                      }}
                    >
                      Showcase 3
                    </div>
                  </div>
                </FloatInItem>
              </div>

              <FloatInItem index={9} kind="card">
                <motion.div
                  data-create-showcase-card
                  style={{
                    width: 362,
                    height: 362,
                    position: 'relative',
                    cursor: 'pointer',
                    transformOrigin: 'center center',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    type: 'spring',
                    stiffness: 520,
                    damping: 34,
                    mass: 0.6,
                  }}
                >
                  <div
                    style={{
                      width: 362,
                      height: 362,
                      left: 0,
                      top: 0,
                      position: 'absolute',
                      borderRadius: 32,
                      border: '1px dashed rgba(0, 0, 0, 0.15)',
                    }}
                  />

                  <div
                    style={{
                      width: 127,
                      left: 117,
                      top: 150,
                      position: 'absolute',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: 'rgba(0, 0, 0, 0.50)',
                        fontSize: 28,
                        fontFamily: SF,
                        fontWeight: 274,
                      }}
                    >
                      􀁌
                    </div>

                    <div
                      style={{
                        alignSelf: 'stretch',
                        color: 'rgba(0, 0, 0, 0.80)',
                        fontSize: 14,
                        fontFamily: PINGFANG,
                        fontWeight: 400,
                      }}
                    >
                      创建新的 Showcase
                    </div>
                  </div>
                </motion.div>
              </FloatInItem>
            </div>
          </FloatInGroup>
        </div>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {chooseSheetOpen && (
          <motion.div
            key="showcase-sheet-backdrop"
            className="absolute inset-0 bg-black/50 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeShowcaseSheet}
          />
        )}
      </AnimatePresence>

      {/* Choose showcase sheet */}
      <AnimatePresence>
        {chooseSheetOpen && (
          <ChooseShowcaseSheet
            key="choose-showcase-sheet"
            onClose={closeShowcaseSheet}
            onConfirm={(index) => {
              setChooseSheetOpen(false)
              onConfirmDisplayCase(index)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
