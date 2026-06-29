import { useState, useCallback, useRef, useEffect } from 'react'

export type AppState = 'idle' | 'upload' | 'gallery' | 'loading' | 'ready' | 'diary' | 'desktop'

export function useAppState() {
  const [current, setCurrent] = useState<AppState>('desktop')
  const currentRef = useRef<AppState>('idle')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const transitioning = useRef(false)
  const loadingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Keep ref in sync with state
  useEffect(() => { currentRef.current = current }, [current])

  const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

  const openTheme = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'desktop') return
    transitioning.current = true
    setCurrent('idle')
    await wait(350)
    transitioning.current = false
  }, [])

  const goToUpload = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'idle') return
    transitioning.current = true
    setCurrent('upload')
    await wait(500)
    transitioning.current = false
  }, [])

  const goToGallery = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'upload') return
    transitioning.current = true
    setCurrent('gallery')
    await wait(450)
    transitioning.current = false
  }, [])

  const selectFromGallery = useCallback(async (photoIndex: number) => {
    if (transitioning.current || currentRef.current !== 'gallery') return
    transitioning.current = true
    setSelectedImage(photoIndex)
    // Go directly to loading — skip upload sheet reappearance
    setCurrent('loading')
    await wait(450)
    transitioning.current = false
    // Auto-transition to ready after 3s
    loadingTimer.current = setTimeout(() => {
      if (currentRef.current !== 'loading') return
      goToReady()
    }, 3000)
  }, [])

  const goToReady = useCallback(async () => {
    if (currentRef.current !== 'loading') return
    transitioning.current = true
    setCurrent('ready')
    await wait(550)
    transitioning.current = false
  }, [])

  const backFromGallery = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'gallery') return
    transitioning.current = true
    setCurrent('upload')
    await wait(350)
    transitioning.current = false
  }, [])

  const backFromLoading = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'loading') return
    if (loadingTimer.current) clearTimeout(loadingTimer.current)
    transitioning.current = true
    setCurrent('upload')
    await wait(350)
    transitioning.current = false
  }, [])

  const dismissToIdle = useCallback(async () => {
    const s = currentRef.current
    if (transitioning.current || s === 'idle' || s === 'gallery' || s === 'loading') return
    if (loadingTimer.current) clearTimeout(loadingTimer.current)
    transitioning.current = true
    setCurrent('idle')
    setSelectedImage(null)
    await wait(400)
    transitioning.current = false
  }, [])

  const dismissDesktop = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'desktop') return
    transitioning.current = true
    setCurrent('idle')
    await wait(400)
    transitioning.current = false
  }, [])

  const applyAndDismiss = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'ready') return
    transitioning.current = true
    setCurrent('idle')
    setSelectedImage(null)
    await wait(400)
    transitioning.current = false
    return true
  }, [])

  const goToDesktop = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'idle') return
    transitioning.current = true
    setCurrent('desktop')
    await wait(400)
    transitioning.current = false
  }, [])

  const openDiary = useCallback(async () => {
    if (transitioning.current || currentRef.current !== 'desktop') return
    transitioning.current = true
    setCurrent('diary')
    await wait(400)
    transitioning.current = false
  }, [])

  return {
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
  }
}
