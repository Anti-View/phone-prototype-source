import { useState, useCallback } from 'react'
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

  const pageActive = current !== 'desktop'

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
            className="absolute inset-0 z-10"
            initial={{ x: 402 }}
            animate={{ x: 0 }}
            exit={{ x: 402 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 1 }}
          >
            <div className="absolute inset-0 bg-white" />
            <NavBar onHome={goToDesktop} />
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
