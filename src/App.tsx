import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
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
import AlbumWaterfallPage from './components/AlbumWaterfallPage'
import CollectionWaterfallPage from './components/CollectionWaterfallPage'
import CollectionItemResultSheet from './components/CollectionItemResultSheet'
import { FloatInGroup, FloatInItem } from './components/FloatIn'
import type { DiaryEntry } from './types/diary'

const diaryDetailFullText = `今天下了一整天雨，已经是第三天了。我坐在小屋的窗台上，看那个雨滴一滴滴往下滑，滑到屏幕边缘就不见了。说实话有点看腻了，但是我又懒得去换，就让它下着吧。

下午我上网冲浪的时候看到一条新闻，说什么科学家又发现了一颗新的行星。离我们几万光年。我看了半天那个图片，黑漆漆的，就一个小亮点。不知道那颗行星上有没有住着像我这样的邻居，也不知道他们那边的主题皮肤好不好看。

今天好像没什么特别的事。但我感觉日子就是这样，平平淡淡的，也还行吧。明天如果天气插件显示有月亮的话，我想坐在窗边好好看看。虽然是假的月亮，但它亮起来的时候，小屋里面真的很好看。`

// ── Diary entries mock data (module-level to avoid re-creation) ──
const diaryEntries: Record<string, DiaryEntry> = {
  '07-02': {
    id: '07-02',
    date: '7月2日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。',
    fullText: diaryDetailFullText,
    tags: ['毛线球', '阳光', '沙发', '沉睡'],
    linkCount: 1,
    imageCount: 0,
  },
  '06-30': {
    id: '06-30',
    date: '6月30日',
    time: '18:56',
    preview: '上午把客厅里那个会滚动的毛线球抓了十五遍。',
    fullText: diaryDetailFullText,
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
    fullText: diaryDetailFullText,
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
    fullText: diaryDetailFullText,
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
    fullText: diaryDetailFullText,
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
    fullText: diaryDetailFullText,
    tags: ['毛线球', '阳光', '沙发', '沉睡', '新月'],
    linkCount: 1,
    imageCount: 1,
    images: ['img/diary/image (1).png'],
  },
}

const DIARY_CARD_TAP_SCALE = 0.96

const DIARY_CARD_TAP_TRANSITION = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 34,
  mass: 0.6,
}

function DiaryCardPressable({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <motion.div
      className={className}
      style={{
        ...style,
        transformOrigin: 'center center',
      }}
      whileTap={{ scale: DIARY_CARD_TAP_SCALE }}
      transition={DIARY_CARD_TAP_TRANSITION}
    >
      {children}
    </motion.div>
  )
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
    openAlbum,
    openCollection,
  } = useAppState()

  const [toastVisible, setToastVisible] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const [albumPhotos, setAlbumPhotos] = useState<string[]>([])
  const [collectionGalleryOpen, setCollectionGalleryOpen] = useState(false)
  const [collectionLoadingOpen, setCollectionLoadingOpen] = useState(false)
  const [collectionResultOpen, setCollectionResultOpen] = useState(false)
  const [collectionSelectedCaseIndex, setCollectionSelectedCaseIndex] = useState(0)
  const collectionLoadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const COLLECTION_DISPLAY_CASE_IMAGES = [
    'img/洞洞板.png',
    'img/木制柜台.png',
    'img/亚克力.png',
  ] as const

  const handleAlbumCapture = useCallback((dataURL: string) => {
    setAlbumPhotos(prev => [dataURL, ...prev].slice(0, 10))
  }, [])

  const [characterAnimRequest, setCharacterAnimRequest] = useState<{
    id: number
    name: string
  } | null>(null)

  const requestCharacterAnim = useCallback((name: string) => {
    setCharacterAnimRequest({
      id: Date.now(),
      name,
    })
  }, [])

  const handleDiaryBackToDesktop = useCallback(async () => {
    await goToDesktop()
    requestCharacterAnim('写日记')
  }, [goToDesktop, requestCharacterAnim])

  const showToast = useCallback(() => {
    setToastKey(k => k + 1)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }, [])

  const startCollectionItemUpload = useCallback((selectedCaseIndex: number) => {
    setCollectionSelectedCaseIndex(selectedCaseIndex)
    setCollectionResultOpen(false)
    setCollectionLoadingOpen(false)
    setCollectionGalleryOpen(true)
  }, [])

  const handleCollectionPhotoSelect = useCallback((_photoIndex: number) => {
    setCollectionGalleryOpen(false)
    setCollectionLoadingOpen(true)

    if (collectionLoadingTimer.current) {
      clearTimeout(collectionLoadingTimer.current)
    }

    collectionLoadingTimer.current = setTimeout(() => {
      setCollectionLoadingOpen(false)
      setCollectionResultOpen(true)
      collectionLoadingTimer.current = null
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (collectionLoadingTimer.current) {
        clearTimeout(collectionLoadingTimer.current)
      }
    }
  }, [])

  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null)

  const handleApply = useCallback(async () => {
    const result = await applyAndDismiss()
    if (result) showToast()
  }, [applyAndDismiss, showToast])

  const diaryScrollRef = useRef<HTMLDivElement | null>(null)
  const diaryContentRef = useRef<HTMLDivElement | null>(null)
  const diaryMomentumRef = useRef<number | null>(null)
  const diaryRubberOffsetRef = useRef(0)
  const diaryRubberReturnRef = useRef<number | null>(null)

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

  const RUBBER_SPRING = 0.18
  const RUBBER_DAMPING = 0.72
  const MOMENTUM_TO_RUBBER = 0.42
  const RELEASE_TO_RUBBER = 0.35

  const cancelDiaryRubberReturn = useCallback(() => {
    if (diaryRubberReturnRef.current !== null) {
      cancelAnimationFrame(diaryRubberReturnRef.current)
      diaryRubberReturnRef.current = null
    }
  }, [])

  const setDiaryRubberOffset = useCallback((offset: number) => {
    const content = diaryContentRef.current
    diaryRubberOffsetRef.current = offset

    if (!content) return

    if (Math.abs(offset) < 0.1) {
      content.style.transform = ''
      return
    }

    content.style.transform = `translateY(${offset}px)`
  }, [])

  const resetDiaryRubberOffset = useCallback((initialVelocity = 0) => {
    const content = diaryContentRef.current
    if (!content) return

    cancelDiaryRubberReturn()

    let offset = diaryRubberOffsetRef.current
    let velocity = initialVelocity * 16.67
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime) / 16.67
      lastTime = now

      velocity += -offset * RUBBER_SPRING * dt
      velocity *= Math.pow(RUBBER_DAMPING, dt)
      offset += velocity * dt

      diaryRubberOffsetRef.current = offset

      if (Math.abs(offset) < 0.25 && Math.abs(velocity) < 0.25) {
        diaryRubberOffsetRef.current = 0
        content.style.transform = ''
        diaryRubberReturnRef.current = null
        return
      }

      content.style.transform = `translateY(${offset}px)`
      diaryRubberReturnRef.current = requestAnimationFrame(step)
    }

    diaryRubberReturnRef.current = requestAnimationFrame(step)
  }, [cancelDiaryRubberReturn])

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
        resetDiaryRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        diaryMomentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        resetDiaryRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
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
  }, [getMaxScroll, resetDiaryRubberOffset])

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
    cancelDiaryRubberReturn()
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
  }, [cancelDiaryMomentum, cancelDiaryRubberReturn, setDiaryRubberOffset])

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

    if (wasTap && tappedEntryId) {
      const entry = diaryEntries[tappedEntryId]
      if (entry) {
        cancelDiaryMomentum()
        cancelDiaryRubberReturn()
        setDiaryRubberOffset(0)
        setSelectedDiaryEntry(entry)
      }
      return
    }

    const maxScroll = el ? getMaxScroll(el) : 0
    const atTop = !!el && el.scrollTop <= 0
    const atBottom = !!el && el.scrollTop >= maxScroll
    const flingOutward =
      (atTop && releaseVelocity < 0) ||
      (atBottom && releaseVelocity > 0)

    if (flingOutward) {
      resetDiaryRubberOffset(-releaseVelocity * RELEASE_TO_RUBBER)
    } else {
      resetDiaryRubberOffset()

      if (Math.abs(releaseVelocity) > 0.08) {
        startDiaryMomentum(releaseVelocity)
      }
    }
  }, [resetDiaryRubberOffset, startDiaryMomentum, cancelDiaryMomentum, cancelDiaryRubberReturn, setDiaryRubberOffset, getMaxScroll])

  useEffect(() => {
    return () => {
      cancelDiaryMomentum()
      cancelDiaryRubberReturn()
    }
  }, [cancelDiaryMomentum, cancelDiaryRubberReturn])

  const pageActive =
    current !== 'desktop' &&
    current !== 'diary' &&
    current !== 'album' &&
    current !== 'collection'

  return (
    <PhoneFrame>
      {/* ── Desktop — always rendered, shifts left when theme pushes in ── */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ x: pageActive ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
      >
        <Desktop
          onOpenApp={openTheme}
          onOpenDiary={openDiary}
          onOpenAlbum={openAlbum}
          onOpenCollection={openCollection}
          onAlbumCapture={handleAlbumCapture}
          characterAnimRequest={characterAnimRequest}
        />
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
            <NavBar onHome={handleDiaryBackToDesktop} />
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
              <FloatInGroup startDelay={100} resetKey={current} step={0.2}>
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
                <FloatInItem index={0} kind="card" data-diary-entry-id="07-02">
                  <DiaryCardPressable className="flex flex-col gap-3" style={{
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
                  </DiaryCardPressable>
                </FloatInItem>

                {/* B3 — left */}
                <FloatInItem index={1} kind="card" data-diary-entry-id="06-30">
                  <DiaryCardPressable className="flex flex-col gap-3" style={{
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
                  </DiaryCardPressable>
                </FloatInItem>

                {/* B5 — left */}
                <FloatInItem index={2} kind="card" data-diary-entry-id="06-28">
                  <DiaryCardPressable className="flex flex-col gap-3" style={{
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
                  </DiaryCardPressable>
                </FloatInItem>
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
                <FloatInItem index={0} kind="card" data-diary-entry-id="07-01">
                  <DiaryCardPressable className="flex flex-col gap-3" style={{
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
                  </DiaryCardPressable>
                </FloatInItem>

                {/* B2 — right */}
                <FloatInItem index={1} kind="card" data-diary-entry-id="06-29">
                  <DiaryCardPressable className="flex flex-col gap-3" style={{
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
                  </DiaryCardPressable>
                </FloatInItem>

                {/* B4 — right */}
                <FloatInItem index={2} kind="card" data-diary-entry-id="06-27">
                  <DiaryCardPressable className="flex flex-col gap-3" style={{
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
                  </DiaryCardPressable>
                </FloatInItem>
              </div>
              </FloatInGroup>
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

      {/* ── Album waterfall page — slides in from right ── */}
      <AnimatePresence>
        {current === 'album' && (
          <motion.div
            key="album-page"
            className="absolute inset-0 z-20"
            initial={{ x: 402 }}
            animate={{ x: 0 }}
            exit={{ x: 402 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
          >
            <AlbumWaterfallPage
            onBack={goToDesktop}
            photos={albumPhotos}
          />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collection waterfall page — slides in from right ── */}
      <AnimatePresence>
        {current === 'collection' && (
          <motion.div
            key="collection-page"
            className="absolute inset-0 z-20"
            initial={{ x: 402 }}
            animate={{ x: 0 }}
            exit={{ x: 402 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
          >
            <CollectionWaterfallPage
              onBack={goToDesktop}
              onStartItemUpload={startCollectionItemUpload}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collection gallery overlay ── */}
      <AnimatePresence>
        {collectionGalleryOpen && (
          <GalleryPage
            key="collection-gallery-page"
            state="gallery"
            onSelect={handleCollectionPhotoSelect}
            onCancel={() => setCollectionGalleryOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Collection loading overlay ── */}
      <AnimatePresence>
        {collectionLoadingOpen && (
          <LoadingCard
            key="collection-loading-card"
            state="loading"
            title="正在构建 3D 模型..."
            description="HarmonyOS Vision 正在为你构建模型，只需几秒。"
            onClose={() => {
              if (collectionLoadingTimer.current) {
                clearTimeout(collectionLoadingTimer.current)
                collectionLoadingTimer.current = null
              }
              setCollectionLoadingOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Collection result sheet ── */}
      <AnimatePresence>
        {collectionResultOpen && (
          <CollectionItemResultSheet
            key="collection-item-result-sheet"
            selectedCaseImage={COLLECTION_DISPLAY_CASE_IMAGES[collectionSelectedCaseIndex]}
            onClose={() => setCollectionResultOpen(false)}
            onSave={() => {
              setCollectionResultOpen(false)
              // TODO: 保存后的真实逻辑稍后再做
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Global StatusBar ── */}
      <StatusBar />

      {/* ── Success toast ── */}
      <SuccessToast key={toastKey} visible={toastVisible} />
    </PhoneFrame>
  )
}
