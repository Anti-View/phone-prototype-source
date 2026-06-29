import { useState, useCallback, useRef, useEffect, type PointerEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PhoneFrame from './components/PhoneFrame'
import StatusBar from './components/StatusBar'
import NavBar from './components/NavBar'
import ThemeDetail from './components/ThemeDetail'
import UploadSheet from './components/UploadSheet'
import GalleryPage from './components/GalleryPage'
import LoadingCard from './components/LoadingCard'
import ReadySheet from './components/ReadySheet'
import SuccessToast from './components/SuccessToast'
import Desktop from './components/Desktop'
import { publicAsset } from './utils/assets'
import { useAppState } from './hooks/useAppState'
import DiaryDetailSheet from './components/DiaryDetailSheet'
import type { DiaryEntry } from './types/diary'

// ── Diary entries mock data (module-level to avoid re-creation) ──
const diaryEntries: Record<string, DiaryEntry> = {
  '07-02': {
    id: '07-02',
    date: '7月2日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。',
    fullText: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。\n\n阳光移到了沙发左侧，这是全屋最完美的温度。我把自己盘成一个完美的圆圈，陷入沉睡。\n\n梦里我抓到了一只比拖鞋还大的飞蛾。醒来后发现那其实是窗帘的影子，我有六秒觉得自己被命运戏弄了。',
    tags: ['毛线球', '阳光', '沙发', '沉睡'],
    linkCount: 1,
    imageCount: 0,
  },
  '06-30': {
    id: '06-30',
    date: '6月30日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍。',
    fullText: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。\n\n阳光移到了沙发左侧，这是全屋最完美的温度。我把自己盘成一个完美的圆圈，陷入沉睡。\n\n梦里我抓到了一只比拖鞋还大的飞蛾。它翅膀上的粉末在月光下闪烁着诡异的蓝光，我追了它整整三个街区，最后它停在了一盏坏掉的路灯上。',
    tags: ['毛线球', '阳光', '飞蛾'],
    linkCount: 0,
    imageCount: 1,
    images: ['img/diary/image (2).png'],
  },
  '06-29': {
    id: '06-29',
    date: '6月29日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。',
    fullText: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。\n\n今天在窗台上发现了一只迷路的瓢虫。它沿着窗框爬了七圈，最终选择了左边的方向。我不知道左边有什么，但希望那是它想要去的地方。',
    tags: ['毛线球', '瓢虫', '窗台'],
    linkCount: 0,
    imageCount: 1,
    images: ['img/diary/image (3).png'],
  },
  '06-28': {
    id: '06-28',
    date: '6月28日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。',
    fullText: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。阳光移到了沙发左侧，这是全屋最完美的温度。\n\n下午三点，一只鸽子停在了空调外机上。它歪着头看了我很久，然后飞走了。我忽然意识到，在它的眼中，我才是那个被关在玻璃后面的生物。\n\n晚上翻到了去年冬天的照片，那时候窗台上还有积雪。时间过得比毛线球滚得还快。',
    tags: ['毛线球', '阳光', '沙发', '鸽子'],
    linkCount: 1,
    imageCount: 1,
    images: ['img/diary/image (4).png'],
  },
  '06-27': {
    id: '06-27',
    date: '6月27日',
    time: '18:56',
    preview: '陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。',
    fullText: '陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。\n\n它的翅膀是半透明的琥珀色，每一次扇动都会落下细碎的金粉。我伸手去够，却怎么也够不着——它在嘲笑我，用那种只有猫才能听懂的频率。\n\n醒来时嘴角还挂着笑，窗帘的影子正好落在枕头旁边，形状像一只飞蛾。',
    tags: ['飞蛾', '梦', '窗帘'],
    linkCount: 2,
    imageCount: 1,
    images: ['img/diary/image (4).png'],
  },
  '07-01': {
    id: '07-01',
    date: '7月1日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍。',
    fullText: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。阳光移到了沙发左侧，这是全屋最完美的温度。\n\n我把自己盘成一个完美的圆圈，陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。\n\n新的一月开始了，我决定做一只更勇敢的猫。起码在梦里面，我已经征服了全世界。',
    tags: ['毛线球', '阳光', '沙发', '沉睡', '新月'],
    linkCount: 1,
    imageCount: 1,
    images: ['img/diary/image (1).png'],
  },
}

export default function App() {
  const {
    current,
    selectedImage,
    openTheme,
    goToUpload,
    goToGallery,
    selectFromGallery,
    backFromGallery,
    backFromLoading,
    dismissToIdle,
    applyAndDismiss,
    goToDesktop,
    openDiary,
  } = useAppState()

  const [toastVisible, setToastVisible] = useState(false)
  const [toastKey, setToastKey] = useState(0)

  const showToast = useCallback(() => {
    setToastKey(k => k + 1)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }, [])

  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null)

  const handleApply = useCallback(async () => {
    const result = await applyAndDismiss()
    if (result) showToast()
  }, [applyAndDismiss, showToast])

  const diaryScrollRef = useRef<HTMLDivElement | null>(null)
  const diaryContentRef = useRef<HTMLDivElement | null>(null)
  const diaryMomentumRef = useRef<number | null>(null)

  const diaryDragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    tapEntryId: null as string | null,
  })

  const getMaxScroll = useCallback((el: HTMLDivElement) => {
    return Math.max(0, el.scrollHeight - el.clientHeight)
  }, [])

  const setDiaryRubberOffset = useCallback((offset: number) => {
    const content = diaryContentRef.current
    if (!content) return
    content.style.transform = `translateY(${offset}px)`
  }, [])

  const resetDiaryRubberOffset = useCallback(() => {
    const content = diaryContentRef.current
    if (!content) return

    const currentTransform = content.style.transform
    if (!currentTransform || currentTransform === 'translateY(0px)') {
      content.style.transform = ''
      return
    }

    content.animate(
      [
        { transform: currentTransform },
        { transform: 'translateY(0px)' },
      ],
      {
        duration: 420,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    )

    content.style.transform = ''
  }, [])

  const cancelDiaryMomentum = useCallback(() => {
    if (diaryMomentumRef.current !== null) {
      cancelAnimationFrame(diaryMomentumRef.current)
      diaryMomentumRef.current = null
    }
  }, [])

  const startDiaryMomentum = useCallback((initialVelocity: number) => {
    const el = diaryScrollRef.current
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
        setDiaryRubberOffset(24)
        resetDiaryRubberOffset()
        diaryMomentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        setDiaryRubberOffset(-24)
        resetDiaryRubberOffset()
        diaryMomentumRef.current = null
        return
      }

      el.scrollTop = next

      velocity *= Math.pow(0.95, dt / 16.67)

      if (Math.abs(velocity) < 0.02) {
        diaryMomentumRef.current = null
        return
      }

      diaryMomentumRef.current = requestAnimationFrame(step)
    }

    diaryMomentumRef.current = requestAnimationFrame(step)
  }, [getMaxScroll, resetDiaryRubberOffset, setDiaryRubberOffset])

  const handleDiaryPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = diaryScrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    const card = target.closest('[data-diary-entry-id]') as HTMLElement | null
    const tapEntryId = card?.dataset.diaryEntryId ?? null

    cancelDiaryMomentum()
    setDiaryRubberOffset(0)

    diaryDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
      tapEntryId,
    }

    el.setPointerCapture(e.pointerId)
  }, [cancelDiaryMomentum, setDiaryRubberOffset])

  const handleDiaryPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = diaryDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = diaryScrollRef.current
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
      setDiaryRubberOffset(-rawScrollTop * 0.35)
    } else if (rawScrollTop > maxScroll) {
      el.scrollTop = maxScroll
      setDiaryRubberOffset(-(rawScrollTop - maxScroll) * 0.35)
    } else {
      el.scrollTop = rawScrollTop
      setDiaryRubberOffset(0)
    }

    e.preventDefault()
  }, [getMaxScroll, setDiaryRubberOffset])

  const stopDiaryDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = diaryDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = diaryScrollRef.current
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }

    const wasTap = !state.moved && !!state.tapEntryId
    const tappedEntryId = state.tapEntryId
    const releaseVelocity = state.velocity

    diaryDragRef.current.active = false
    diaryDragRef.current.pointerId = -1
    diaryDragRef.current.tapEntryId = null
    diaryDragRef.current.moved = false

    resetDiaryRubberOffset()

    if (wasTap && tappedEntryId) {
      const entry = diaryEntries[tappedEntryId]
      if (entry) {
        cancelDiaryMomentum()
        setDiaryRubberOffset(0)
        setSelectedDiaryEntry(entry)
      }
      return
    }

    if (Math.abs(releaseVelocity) > 0.08) {
      startDiaryMomentum(releaseVelocity)
    }
  }, [resetDiaryRubberOffset, startDiaryMomentum, cancelDiaryMomentum, setDiaryRubberOffset])

  useEffect(() => {
    return () => {
      cancelDiaryMomentum()
    }
  }, [cancelDiaryMomentum])

  const pageActive = current !== 'desktop' && current !== 'diary'

  return (
    <PhoneFrame>
      {/* ── Desktop — always rendered, shifts left when theme pushes in ── */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ x: pageActive ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
      >
        <Desktop onOpenApp={openTheme} onOpenDiary={openDiary} />
      </motion.div>

      {/* ── Theme page — slides in from right ── */}
      <AnimatePresence>
        {pageActive && (
          <motion.div
            key="theme-page"
            className="absolute inset-0 z-10"
            initial={{ x: 402 }}
            animate={{ x: 0 }}
            exit={{ x: 402 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
          >
            {/* Theme page background — white to cover desktop */}
            <div className="absolute inset-0 bg-white" />

            {/* NavBar — home button returns to desktop */}
            <NavBar onHome={goToDesktop} />

            {/* Theme detail content */}
            <ThemeDetail onApply={goToUpload} />

            {/* ── Overlays ── */}
            <AnimatePresence>
              {current === 'upload' && (
                <UploadSheet
                  key="upload-sheet"
                  selectedImage={selectedImage}
                  onSelectImage={goToGallery}
                  onClose={dismissToIdle}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {current === 'gallery' && (
                <GalleryPage
                  key="gallery-page"
                  state={current}
                  onSelect={selectFromGallery}
                  onCancel={backFromGallery}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {current === 'loading' && (
                <LoadingCard
                  key="loading-card"
                  state={current}
                  onClose={backFromLoading}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {current === 'ready' && (
                <ReadySheet
                  key="ready-sheet"
                  state={current}
                  selectedImage={selectedImage}
                  onApply={handleApply}
                  onClose={dismissToIdle}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Diary page — slides in from right ── */}
      <AnimatePresence>
        {current === 'diary' && (
          <motion.div
            key="diary-page"
            className="absolute inset-0 z-20"
            initial={{ x: 402 }}
            animate={{ x: 0 }}
            exit={{ x: 402 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
          >
            {/* Solid bg */}
            <div className="absolute inset-0" style={{ background: '#EEEFF4' }} />
            {/* Fixed NavBar */}
            <NavBar onHome={goToDesktop} />
            {/* Scrollable waterfall content */}
            <div
              ref={diaryScrollRef}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
              style={{
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
              }}
              onPointerDown={handleDiaryPointerDown}
              onPointerMove={handleDiaryPointerMove}
              onPointerUp={stopDiaryDrag}
              onPointerCancel={stopDiaryDrag}
              onLostPointerCapture={stopDiaryDrag}
            >
              <div
                ref={diaryContentRef}
                className="flex justify-center items-start"
                style={{
                  gap: 16,
                  paddingTop: 130,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingBottom: 40,
                  minHeight: '100%',
                  willChange: 'transform',
                }}
              >
              {/* Left column */}
              <div
                className="flex flex-col"
                style={{
                  width: 177,
                  gap: 24,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                {/* Card A */}
                <div data-diary-entry-id="07-02" className="flex flex-col gap-3" style={{
                  padding: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  cursor: 'pointer',
                }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-black/50" style={{ fontFamily: 'PingFang SC, sans-serif' }}>18:56</span>
                    <span className="text-[22px] text-black/90 font-semibold" style={{ fontFamily: 'PingFang SC, sans-serif' }}>7月2日</span>
                  </div>
                  <div className="text-[14px] text-black/50 line-clamp-6" style={{ width: 120, fontFamily: 'PingFang SC, sans-serif' }}>
                    上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。 阳光移到了沙发左侧，这是全屋最完美的温度。我把自己盘成一个完美的圆圈，陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。
                  </div>
                </div>

                {/* B3 — left */}
                <div data-diary-entry-id="06-30" className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-black/50" style={{ fontFamily: 'PingFang SC, sans-serif' }}>18:56</span>
                    <span className="text-[22px] text-black/90 font-semibold" style={{ fontFamily: 'PingFang SC, sans-serif' }}>6月30日</span>
                  </div>
                  <div className="text-[14px] text-black/50 line-clamp-3" style={{ width: 129, fontFamily: 'PingFang SC, sans-serif' }}>
                    上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。 阳光移到了沙发左侧，这是全屋最完美的温度。我把自己盘成一个完美的圆圈，陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。
                  </div>
                  <div className="relative" style={{ alignSelf: 'stretch', height: 96 }}>
                    <img src={publicAsset('img/diary/image (2).png')} alt="" className="absolute left-0 top-0" style={{ width: 129, height: 96, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} draggable={false} />
                    <div className="absolute left-0" style={{ width: 129, height: 32, top: 64, background: 'linear-gradient(180deg, rgba(238, 239, 244, 0) 0%, #EEEFF4 100%)' }} />
                  </div>
                </div>

                {/* B5 — left */}
                <div data-diary-entry-id="06-28" className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-black/50" style={{ fontFamily: 'PingFang SC, sans-serif' }}>18:56</span>
                    <span className="text-[22px] text-black/90 font-semibold" style={{ fontFamily: 'PingFang SC, sans-serif' }}>6月28日</span>
                  </div>
                  <div className="text-[14px] text-black/50 line-clamp-3" style={{ width: 129, fontFamily: 'PingFang SC, sans-serif' }}>
                    上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。 阳光移到了沙发左侧，这是全屋最完美的温度。
                  </div>
                  <div className="relative" style={{ alignSelf: 'stretch', height: 96 }}>
                    <img src={publicAsset('img/diary/image (4).png')} alt="" className="absolute left-0 top-0" style={{ width: 129, height: 96, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} draggable={false} />
                    <div className="absolute left-0" style={{ width: 129, height: 32, top: 64, background: 'linear-gradient(180deg, rgba(238, 239, 244, 0) 0%, #EEEFF4 100%)' }} />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div
                className="flex flex-col"
                style={{
                  width: 177,
                  gap: 24,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                {/* B1 — right */}
                <div data-diary-entry-id="07-01" className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-black/50" style={{ fontFamily: 'PingFang SC, sans-serif' }}>18:56</span>
                    <span className="text-[22px] text-black/90 font-semibold" style={{ fontFamily: 'PingFang SC, sans-serif' }}>7月1日</span>
                  </div>
                  <div className="text-[14px] text-black/50 line-clamp-3" style={{ width: 129, fontFamily: 'PingFang SC, sans-serif' }}>
                    上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。 阳光移到了沙发左侧，这是全屋最完美的温度。我把自己盘成一个完美的圆圈，陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。
                  </div>
                  <div className="relative" style={{ alignSelf: 'stretch', height: 96 }}>
                    <img src={publicAsset('img/diary/image (1).png')} alt="" className="absolute left-0 top-0" style={{ width: 129, height: 96, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} draggable={false} />
                    <div className="absolute left-0" style={{ width: 129, height: 32, top: 64, background: 'linear-gradient(180deg, rgba(238, 239, 244, 0) 0%, #EEEFF4 100%)' }} />
                  </div>
                </div>

                {/* B2 — right */}
                <div data-diary-entry-id="06-29" className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-black/50" style={{ fontFamily: 'PingFang SC, sans-serif' }}>18:56</span>
                    <span className="text-[22px] text-black/90 font-semibold" style={{ fontFamily: 'PingFang SC, sans-serif' }}>6月29日</span>
                  </div>
                  <div className="text-[14px] text-black/50 line-clamp-3" style={{ width: 129, fontFamily: 'PingFang SC, sans-serif' }}>
                    上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。
                  </div>
                  <div className="relative" style={{ alignSelf: 'stretch', height: 96 }}>
                    <img src={publicAsset('img/diary/image (3).png')} alt="" className="absolute left-0 top-0" style={{ width: 129, height: 96, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} draggable={false} />
                    <div className="absolute left-0" style={{ width: 129, height: 32, top: 64, background: 'linear-gradient(180deg, rgba(238, 239, 244, 0) 0%, #EEEFF4 100%)' }} />
                  </div>
                </div>

                {/* B4 — right */}
                <div data-diary-entry-id="06-27" className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-black/50" style={{ fontFamily: 'PingFang SC, sans-serif' }}>18:56</span>
                    <span className="text-[22px] text-black/90 font-semibold" style={{ fontFamily: 'PingFang SC, sans-serif' }}>6月27日</span>
                  </div>
                  <div className="text-[14px] text-black/50 line-clamp-3" style={{ width: 129, fontFamily: 'PingFang SC, sans-serif' }}>
                    陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。
                  </div>
                  <div className="relative" style={{ alignSelf: 'stretch', height: 96 }}>
                    <img src={publicAsset('img/diary/image (4).png')} alt="" className="absolute left-0 top-0" style={{ width: 129, height: 96, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} draggable={false} />
                    <div className="absolute left-0" style={{ width: 129, height: 32, top: 64, background: 'linear-gradient(180deg, rgba(238, 239, 244, 0) 0%, #EEEFF4 100%)' }} />
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* ── Diary detail sheet ── */}
            <AnimatePresence>
              {selectedDiaryEntry && (
                <DiaryDetailSheet
                  key="diary-detail-sheet"
                  entry={selectedDiaryEntry}
                  onClose={() => setSelectedDiaryEntry(null)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global StatusBar ── */}
      <StatusBar />

      {/* ── Success toast ── */}
      <SuccessToast key={toastKey} visible={toastVisible} />
    </PhoneFrame>
  )
}
