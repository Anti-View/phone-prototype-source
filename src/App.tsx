import { useState, useCallback, useRef, type PointerEvent } from 'react'
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

  const handleApply = useCallback(async () => {
    const result = await applyAndDismiss()
    if (result) showToast()
  }, [applyAndDismiss, showToast])

  const diaryScrollRef = useRef<HTMLDivElement | null>(null)

  const diaryDragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
  })

  const handleDiaryPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = diaryScrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    diaryDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
    }

    el.setPointerCapture(e.pointerId)
  }, [])

  const handleDiaryPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = diaryDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = diaryScrollRef.current
    if (!el) return

    const deltaY = e.clientY - state.startY
    el.scrollTop = state.startScrollTop - deltaY

    e.preventDefault()
  }, [])

  const stopDiaryDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = diaryDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = diaryScrollRef.current
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }

    diaryDragRef.current.active = false
    diaryDragRef.current.pointerId = -1
  }, [])

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
                className="flex justify-center items-start"
                style={{
                  gap: 16,
                  paddingTop: 130,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingBottom: 40,
                  minHeight: '100%',
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
                <div className="flex flex-col gap-3" style={{
                  padding: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
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
                <div className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
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
                <div className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
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
                <div className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
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
                <div className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
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
                <div className="flex flex-col gap-3" style={{
                  paddingTop: 24, paddingLeft: 24, paddingRight: 24,
                  background: 'rgba(255, 255, 255, 0.40)',
                  boxShadow: '0px 2px 1px rgba(211.66, 215.20, 232.93, 0.50) inset, 0px -2px 1px rgba(255, 255, 255, 0.85) inset',
                  borderRadius: 40,
                  overflow: 'hidden', height: 263, flexShrink: 0,
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
