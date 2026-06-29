import { useState, useEffect, useRef, useCallback, memo, type CSSProperties, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, animate } from 'framer-motion'
import DynamicIsland, { type IslandVariant } from './DynamicIsland'
import { publicAsset } from '../utils/assets'

const UNLOCK_THRESHOLD = 64
const PHONE_WIDTH = 402
const PHONE_HEIGHT = 874
const WALLPAPER_WIDTH = PHONE_WIDTH * 3
const DOCK_LEFT = 17
const DOCK_BOTTOM = 17
const DOCK_HEIGHT = 103
const DOCK_TOP = PHONE_HEIGHT - DOCK_BOTTOM - DOCK_HEIGHT
const DOCK_BLUR_PAD = 28


function AppIcon({ label, src }: { label?: string; src?: string }) {
  return (
    <div className="w-[64px] h-[64px] bg-white flex-shrink-0 relative overflow-hidden flex items-center justify-center" style={{ borderRadius: 16 }}>
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
      ) : label ? (
        <span className="text-black/40 text-[13px] font-semibold select-none">{label}</span>
      ) : null}
    </div>
  )
}

function IconGrid({ labels }: { labels: [string, string, string, string] }) {
  return (
    <div className="w-[159px] h-[159px] flex flex-col gap-[31px] items-center justify-center">
      <div className="flex gap-[31px]"><AppIcon label={labels[0]} /><AppIcon label={labels[1]} /></div>
      <div className="flex gap-[31px]"><AppIcon label={labels[2]} /><AppIcon label={labels[3]} /></div>
    </div>
  )
}

function WidgetLabel({ label }: { label: string }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center text-black/30 text-[15px] font-semibold select-none pointer-events-none">
      {label}
    </span>
  )
}

function Dock({ onOpenApp, onLock, onAction, onMusic }: { onOpenApp?: () => void; onLock?: () => void; onAction?: () => void; onMusic?: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-row items-center justify-between"
      style={{ padding: '0px 19px' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i}
          onClick={
            i === 0
              ? onLock
              : i === 1
                ? onAction
                : i === 2
                  ? onMusic
                  : i === 3
                    ? onOpenApp
                    : undefined
          }
          className={i === 0 || i === 1 || i === 2 || i === 3 ? 'cursor-pointer active:scale-90 transition-transform' : ''}>
          <AppIcon
            label={i === 0 ? '锁定' : i === 1 ? '吹气' : i === 2 ? '音乐' : '主题'}
            src={publicAsset(`img/应用${13 + i}.png`)}
          />
        </div>
      ))}
    </div>
  )
}

const MobileDockGlass = memo(function MobileDockGlass({
  bgPosition,
}: {
  bgPosition: any
}) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: -DOCK_BLUR_PAD,
          right: -DOCK_BLUR_PAD,
          top: -DOCK_BLUR_PAD,
          bottom: -DOCK_BLUR_PAD,
          backgroundImage: `url(${publicAsset('img/new_wallpaper_blur.jpg')})`,
          backgroundSize: `${WALLPAPER_WIDTH}px ${PHONE_HEIGHT}px`,
          backgroundPosition: bgPosition,
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0) scale(1.02)',
          transformOrigin: 'center',
          willChange: 'background-position',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(255, 255, 255, 0.20)' }}
      />
    </>
  )
})

/* ── Content panel (350×541) ── */
function ContentPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="w-[402px] h-full flex-shrink-0 flex justify-center" style={{ paddingTop: 86 }}>
      <div className="w-[350px] h-[541px] relative">
        {children}
      </div>
    </div>
  )
}

/* ── Glass icon button ── */
function GlassIcon({ char }: { char: string }) {
  return (
    <div
      className="flex flex-row items-center justify-center flex-shrink-0 relative rounded-full"
      style={{
        width: 56, height: 56, padding: 15, gap: 10,
        background: 'rgba(255, 255, 255, 0.02)',
        boxShadow: '-1px -1px 1px 0 rgba(255,255,255,0.5) inset, 1px 1px 1px 0 rgba(255,255,255,0.5) inset',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div className="flex flex-col items-center justify-center flex-shrink-0 relative" style={{ padding: 2.4, gap: 12 }}>
        <span style={{
          color: '#ffffff', textAlign: 'center',
          fontFamily: "'SF Pro Display', 'SF Pro', -apple-system",
          fontSize: 21.6, lineHeight: '19.2px', fontWeight: 400,
          width: 19.2, height: 19.2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {char}
        </span>
      </div>
    </div>
  )
}

/* ── Camera island — live feed, capture, flash animation ── */
function CameraIsland({ onCapture }: { onCapture: (dataURL: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const gifRef = useRef<HTMLImageElement>(null)
  const [fallback, setFallback] = useState(false)
  const [flash, setFlash] = useState(false)

  // Camera init + cleanup
  useEffect(() => {
    let stream: MediaStream | null = null
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch {
        setFallback(true)
      }
    }
    start()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const shutter = () => {
    if (flash) return
    const video = videoRef.current
    if (video && video.videoWidth) {
      const VW = video.videoWidth
      const VH = video.videoHeight

      // Render at viewfinder scale (4x for quality)
      const S = 4
      const VP_W = 220 * S
      const VP_H = 164 * S

      // Step 1: Mirrored video canvas
      const mirror = document.createElement('canvas')
      mirror.width = VW
      mirror.height = VH
      const mCtx = mirror.getContext('2d')!
      mCtx.translate(VW, 0)
      mCtx.scale(-1, 1)
      mCtx.drawImage(video, 0, 0, VW, VH)

      // Step 2: Viewfinder canvas — draw mirrored video with object-cover
      const vp = document.createElement('canvas')
      vp.width = VP_W
      vp.height = VP_H
      const vpCtx = vp.getContext('2d')!
      const videoAspect = VW / VH
      const vpAspect = VP_W / VP_H
      if (videoAspect > vpAspect) {
        // Video wider — match height, crop sides
        const dw = VP_H * videoAspect
        vpCtx.drawImage(mirror, 0, 0, VW, VH, (VP_W - dw) / 2, 0, dw, VP_H)
      } else {
        // Video taller — match width, crop top/bottom
        const dh = VP_W / videoAspect
        vpCtx.drawImage(mirror, 0, 0, VW, VH, 0, (VP_H - dh) / 2, VP_W, dh)
      }

      // Step 3: Draw GIF at exact CSS position (scaled by S)
      const gif = gifRef.current
      if (gif) {
        const gL = VP_W - 80 * S - 178 * S  // left edge
        const gT = 40 * S
        const gW = 178 * S
        const gH = 178 * S
        const gCX = gL + gW / 2
        const gCY = gT + gH / 2
        vpCtx.save()
        vpCtx.translate(gCX, gCY)
        vpCtx.rotate((15 * Math.PI) / 180)
        vpCtx.drawImage(gif, -gW / 2, -gH / 2, gW, gH)
        vpCtx.restore()
      }

      // Step 4: Crop left 1:1 square
      const sqSize = Math.min(VP_W, VP_H)
      const square = document.createElement('canvas')
      square.width = sqSize
      square.height = sqSize
      square.getContext('2d')!.drawImage(vp, 0, 0, sqSize, sqSize, 0, 0, sqSize, sqSize)

      onCapture(square.toDataURL('image/jpeg', 0.9))
    }
    // Flash animation
    setFlash(true)
    setTimeout(() => setFlash(false), 50)
  }

  return (
    <div className="flex flex-col items-center" style={{ width: 220, paddingTop: 22, margin: '0 auto', gap: 6 }}>
      {/* Viewfinder */}
      <motion.div
        className="w-full flex-shrink-0 overflow-hidden relative"
        style={{ height: 164, background: '#c3c3c3', borderRadius: 36 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.25, ease: 'easeOut' }}
      >
        {fallback ? (
          <img src={publicAsset('img/camera/fallback.png')} alt="" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} muted playsInline />
        )}
        {/* Black flash */}
        {flash && (
          <div className="absolute inset-0 bg-black z-10" />
        )}
        {/* Pet sticker — appears after viewfinder animation ends */}
        <motion.div
          className="absolute"
          style={{ top: 40, right: 80, width: 178, height: 178, rotate: '15deg' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, type: 'spring', stiffness: 120, damping: 12, mass: 1.2 }}
        >
          <img
            ref={gifRef}
            src={publicAsset('videos/待机.gif')}
            alt=""
            className="w-full h-full"
            draggable={false}
          />
        </motion.div>
      </motion.div>

      {/* Button row */}
      <motion.div
        className="flex items-center gap-[26px] flex-shrink-0"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.25, ease: 'easeOut' }}
      >
        <img src={publicAsset('img/camera/left.png')} alt="" className="w-[28px] h-[28px] object-cover" draggable={false} />
        <div className="cursor-pointer active:scale-90 transition-transform" onClick={shutter}>
          <img src={publicAsset('img/camera/middle.png')} alt="" className="w-[76px] h-[56px] object-cover" draggable={false} />
        </div>
        <img src={publicAsset('img/camera/right.png')} alt="" className="w-[28px] h-[28px] object-cover" draggable={false} />
      </motion.div>
    </div>
  )
}

/* ── Tap vs drag helper ── */
function useTap(onTap: () => void) {
  const pos = useRef({ x: 0, y: 0 })
  return {
    onPointerDown: (e: React.PointerEvent) => { pos.current = { x: e.clientX, y: e.clientY } },
    onPointerUp: (e: React.PointerEvent) => {
      const dx = e.clientX - pos.current.x
      const dy = e.clientY - pos.current.y
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) onTap()
    },
  }
}

/* ── Panel 1 ── */
function Panel1({ onWidgetClick, photos, onOpenDiary, onOpenAlbum }: {
  onWidgetClick: (type: string, variant: IslandVariant) => void
  photos: string[]
  onOpenDiary?: () => void
  onOpenAlbum?: () => void
}) {
  const tapA = useTap(() => onOpenAlbum?.())
  const tapB = useTap(() => onWidgetClick('camera', 'square'))
  const tapC = useTap(() => onOpenDiary?.())

  return (
    <ContentPanel>
      <div className="flex flex-col gap-[32px]">
        <div className="w-[350px] h-[159px] relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" style={{ borderRadius: 28 }} {...tapA}>
          {/* Layer 4: 底层 */}
          <img src={publicAsset('img/小组件A/底层.png')} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          {/* Layer 3: 染色层 */}
          <img src={publicAsset('img/小组件A/染色层.png')} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          {/* Layer 2: Three polaroids, 4px visual gap, centered as group */}
          <div className="absolute inset-0 flex items-center justify-center gap-[16px]">
            {[1, 2, 3].map((i, idx) => (
              <div
                key={i}
                className="w-[88px] h-[121px] bg-white rounded-[4px] relative flex-shrink-0"
                style={{ transform: `rotate(${[12, -7, 6][idx]}deg)` }}
              >
                <img
                  src={photos[i - 1] || publicAsset(`img/小组件A/照片${i}.png`)}
                  alt=""
                  className="absolute rounded-[2px]"
                  style={{ left: 5.5, top: 5.5, width: 77, height: 77 }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
          {/* Layer 1: 高光层 (top) */}
          <img src={publicAsset('img/小组件A/高光层.png')} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        </div>
        <div className="flex gap-[32px]">
          <div className="w-[159px] h-[159px] bg-white relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" style={{ borderRadius: 28 }} {...tapB}>
            <img src={publicAsset('img/小组件B.png')} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
          <div className="w-[159px] h-[159px] relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" style={{ borderRadius: 28 }} {...tapC}>
            <img src={publicAsset('img/小组件C.png')} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="px-[28px] pt-[28px]">
                <p className="text-white text-[12px] leading-[20px] opacity-90 line-clamp-4" style={{ fontFamily: 'PingFang SC, sans-serif' }}>
                  上午把客厅里那个会滚动的毛线球抓了十五遍，确认它没有反抗能力。 阳光移到了沙发左侧，这是全屋最完美的温度。我把自己盘成一个完美的圆圈，陷入沉睡。梦里我抓到了一只比拖鞋还大的飞蛾。
                </p>
              </div>
              <div className="flex justify-between items-center px-[18px] pb-[14px]">
                <div className="flex items-center gap-[5px]">
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="3" cy="3" r="3" fill="#28AF28"/>
                  </svg>
                  <span className="text-[#70675B] text-[14px] leading-[20px]" style={{ fontFamily: 'PingFang SC, sans-serif' }}>未读</span>
                </div>
                <span className="text-[#70675B] text-[14px] leading-[20px]" style={{ fontFamily: 'PingFang SC, sans-serif' }}>{new Date().getMonth() + 1}.{new Date().getDate()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}

/* ── Panel 2 ── */
function Panel2() {
  return (
    <ContentPanel>
      <div className="w-[350px] h-[350px] bg-white relative" style={{ borderRadius: 28 }}>
        <WidgetLabel label="小组件E" />
      </div>
      <div className="absolute left-0 top-[382px]"><IconGrid labels={['应用5', '应用6', '应用7', '应用8']} /></div>
      <div className="absolute left-[191px] top-[382px]"><IconGrid labels={['应用9', '应用10', '应用11', '应用12']} /></div>
    </ContentPanel>
  )
}

/* ── Panel 3 ── */
function Panel3() {
  return (
    <ContentPanel>
      <div className="w-[350px] h-[350px] bg-white relative" style={{ borderRadius: 28 }}>
        <WidgetLabel label="小组件E" />
      </div>
      <div className="absolute left-0 top-[382px]"><IconGrid labels={['应用17', '应用18', '应用19', '应用20']} /></div>
      <div className="absolute left-[191px] top-[382px]"><IconGrid labels={['应用21', '应用22', '应用23', '应用24']} /></div>
    </ContentPanel>
  )
}

/* ── Desktop ── */
type CharacterAnimRequest = {
  id: number
  name: string
}

interface DesktopProps { onOpenApp?: () => void; onOpenDiary?: () => void; onOpenAlbum?: () => void; onAlbumCapture?: (dataURL: string) => void; characterAnimRequest?: CharacterAnimRequest | null }

export default function Desktop({
  onOpenApp,
  onOpenDiary,
  onOpenAlbum,
  onAlbumCapture,
  characterAnimRequest,
}: DesktopProps) {
  const [isLocked, setIsLocked] = useState(true)
  const [unlockedPage, setUnlockedPage] = useState(0)
  /* ── Dynamic Island: single instance, switched by widget tap ── */
  type IslandType = 'album' | 'camera' | 'diary'
  const [activeIsland, setActiveIsland] = useState<IslandType | null>(null)

  /* ── Polaroid photos — camera captures fill in widget A's three slots ── */
  const [polaroidPhotos, setPolaroidPhotos] = useState<string[]>([])
  const polaroidIndexRef = useRef(0)

  const handleCapture = useCallback((dataURL: string) => {
    setPolaroidPhotos(prev => {
      const next = [...prev]
      next[polaroidIndexRef.current] = dataURL
      return next
    })

    polaroidIndexRef.current = (polaroidIndexRef.current + 1) % 3

    onAlbumCapture?.(dataURL)
  }, [onAlbumCapture])

  /* ── Character animation state (durations from actual WebP files in public/videos/) ── */
  const ANIM: Record<string, number> = {
    '待机': 3993,    // 121f × 33ms (30fps) — read from file
    '吹气': 3234,    //  97f × 33ms (30fps) — read from file
    '点击': 3234,    //  97f × 33ms (30fps) — read from file
    '听音乐': 3993,   // 121f × 33ms (30fps) — read from file
    '写日记': 6369,   // 193f × 33ms (30fps) — read from file
  }
  const DEFAULT_ANIM = '待机'
  const [charAnim, setCharAnim] = useState(DEFAULT_ANIM)
  const [charCycle, setCharCycle] = useState(() => Date.now())
  const charTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Play `name` once, then return to default (待机).
  // Waits for current loop to finish before switching.
  const playAnim = (name: string) => {
    // clear pending
    if (charTimerRef.current) clearTimeout(charTimerRef.current)

    const step1 = () => {
      setCharAnim(name)
      setCharCycle(Date.now())
      // after one loop of target, return to default
      const targetDur = ANIM[name] || ANIM[DEFAULT_ANIM]
      charTimerRef.current = setTimeout(() => {
        setCharAnim(DEFAULT_ANIM)
        setCharCycle(Date.now())
        charTimerRef.current = null
      }, targetDur)
    }

    if (charAnim === name) {
      // already playing target — re-extend: wait for current cycle then go back
      const elapsed = (Date.now() - charCycle) % (ANIM[name] || ANIM[DEFAULT_ANIM])
      const remaining = (ANIM[name] || ANIM[DEFAULT_ANIM]) - elapsed
      charTimerRef.current = setTimeout(step1, remaining)
    } else {
      // playing something else — finish current loop, then play target once
      const curDur = ANIM[charAnim] || ANIM[DEFAULT_ANIM]
      const elapsed = (Date.now() - charCycle) % curDur
      const remaining = curDur - elapsed
      charTimerRef.current = setTimeout(step1, remaining)
    }
  }

  // cleanup timer on unmount
  useEffect(() => () => { if (charTimerRef.current) clearTimeout(charTimerRef.current) }, [])

  // respond to external character animation requests (e.g. from diary back-to-desktop)
  useEffect(() => {
    if (!characterAnimRequest) return
    playAnim(characterAnimRequest.name)
  }, [characterAnimRequest?.id])

  /* ── Motion values ── */
  const unlockY = useMotionValue(0)
  const pageX = useMotionValue(0)
  const wallX = useMotionValue(0)
  const wallSpring = useSpring(wallX, { stiffness: 200, damping: 30, mass: 0.5 })

  const dockBgX = useTransform(
    wallSpring,
    (v) => `${v - DOCK_LEFT + DOCK_BLUR_PAD}px`,
  )
  const dockBgPosition = useMotionTemplate`${dockBgX} ${-DOCK_TOP + DOCK_BLUR_PAD}px`

  // iOS-like nonlinear opacity: barely fades in first 40%, drops fast near threshold
  const unlockOpacity = useTransform(unlockY,
    [-UNLOCK_THRESHOLD, -UNLOCK_THRESHOLD * 0.4, 0],
    [0.3, 0.95, 1],
  )

  // Return-to-lock fade multiplier: 1 normally, animated 0→1 during lockScreen
  const lockFade = useMotionValue(1)
  const displayOpacity = useTransform([unlockOpacity, lockFade], ([uo, lf]: number[]) => uo * lf)

  const lgRef = useRef<any>(null)
  const [lgFailed, setLgFailed] = useState(() =>
    typeof window !== 'undefined' && 'ontouchstart' in window,
  )

  /* ── LiquidGlass init (desktop only) ── */
  useEffect(() => {
    if (lgFailed) return
    let instance: any = null
    let cancelled = false
    const init = async () => {
      try {
        const mod: any = await (async () => {
          const src = 'https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js'
          return import(/* @vite-ignore */ src)
        })()
        if (cancelled || !mod.LiquidGlass) return
        const dockEl = document.querySelector('[data-glass="dock"]') as HTMLElement | null
        if (!dockEl) return
        dockEl.dataset.config = JSON.stringify({
          blurAmount: 0.5, refraction: 0.5, chromAberration: 0.05,
          edgeHighlight: 0.15, specular: 0, fresnel: 1, distortion: 0,
          cornerRadius: 40, zRadius: 40, opacity: 1, saturation: 0,
          brightness: 0, shadowOpacity: 0, shadowSpread: 10, bevelMode: 0,
        })
        instance = await mod.LiquidGlass.init({
          root: document.querySelector('#liquid-root'),
          glassElements: [dockEl],
        })
        lgRef.current = instance
      } catch (e) {
        console.warn('LiquidGlass init failed, using CSS fallback:', e)
        setLgFailed(true)
      }
    }
    init()
    return () => { cancelled = true; instance?.destroy() }
  }, [])

  /* ── Lock screen: vertical drag, wallpaper stays at A segment until unlock ── */
  const handleUnlockDrag = (_: any, _info: { offset: { y: number } }) => {
    lgRef.current?.markChanged()
  }

  const handleUnlockDragEnd = (_: any, info: { offset: { y: number } }) => {
    if (info.offset.y < -UNLOCK_THRESHOLD) {
      // ── Unlock: fly off, wallpaper stays at A segment ──
      animate(unlockY, -874, { type: 'spring', stiffness: 300, damping: 28, mass: 1 })
      setIsLocked(false)
      setUnlockedPage(0)
      lgRef.current?.markChanged()
    } else {
      // ── Snap back ──
      animate(unlockY, 0, { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 })
      animate(wallX, 0, { type: 'spring', stiffness: 200, damping: 30, mass: 0.5 })
    }
  }

  /* ── Unlocked: horizontal page drag → wallpaper sync (A–C segments) ── */
  const handlePageDrag = (_: any, info: { offset: { x: number } }) => {
    const startWallX = -unlockedPage * 402
    const raw = startWallX + info.offset.x
    wallX.set(Math.max(-804, Math.min(0, raw)))
    lgRef.current?.markChanged()
  }

  const handlePageDragEnd = (_: any, info: { offset: { x: number } }) => {
    const threshold = 50
    let target = unlockedPage
    if (info.offset.x < -threshold && unlockedPage < 2) target = unlockedPage + 1
    else if (info.offset.x > threshold && unlockedPage > 0) target = unlockedPage - 1
    setUnlockedPage(target)
    animate(pageX, -target * 402, { type: 'spring', stiffness: 300, damping: 28, mass: 1 })
    animate(wallX, -target * 402, { type: 'spring', stiffness: 200, damping: 30, mass: 0.5 }).then(() => lgRef.current?.markChanged())
  }

  /* ── Character tap detection (root capture, doesn't interfere with drag) ── */
  const characterTapRef = useRef({ x: 0, y: 0 })

  const isPointInCharacter = useCallback((clientX: number, clientY: number) => {
    const root = document.getElementById('liquid-root')
    if (!root) return false

    const rect = root.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const characterLeft = 1 + wallSpring.get()
    const characterTop = PHONE_HEIGHT - 80 - 400
    const characterRight = characterLeft + 400
    const characterBottom = characterTop + 400

    return (
      x >= characterLeft &&
      x <= characterRight &&
      y >= characterTop &&
      y <= characterBottom
    )
  }, [wallSpring])

  const handleRootPointerDownCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    characterTapRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleRootPointerUpCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - characterTapRef.current.x
    const dy = e.clientY - characterTapRef.current.y

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return
    if (!isPointInCharacter(e.clientX, e.clientY)) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    playAnim('点击')
  }, [isPointInCharacter])

  /* ── Return to lock screen (dock first icon) ── */
  const lockScreen = () => {
    if (isLocked) return
    setUnlockedPage(0)
    animate(pageX, 0, { type: 'spring', stiffness: 300, damping: 28, mass: 1 })
    animate(wallX, 0, { type: 'spring', stiffness: 200, damping: 30, mass: 0.5 })
    setIsLocked(true)
    unlockY.set(-350)
    lockFade.set(0)
    animate(unlockY, 0, { type: 'spring', stiffness: 250, damping: 25, mass: 1 })
    animate(lockFade, 1, { duration: 0.75, ease: 'easeOut' })
    lgRef.current?.markChanged()
  }

  const SF = "'SF Pro Display', 'SF Pro', -apple-system"

  return (
    <div id="liquid-root" className="absolute inset-0 z-50 overflow-hidden bg-black"
      onPointerDownCapture={handleRootPointerDownCapture}
      onPointerUpCapture={handleRootPointerUpCapture}>
      {/* ── Wallpaper (single, always rendered, spring-smoothed) ── */}
      <motion.img
        src={publicAsset('img/new_wallpaper.jpg')}
        alt=""
        data-dynamic=""
        className="absolute left-0 top-0 pointer-events-none select-none"
        style={{ width: 1206, height: 874, maxWidth: 'none', x: wallSpring }}
        draggable={false}
      />

      {/* ── b-layer character (page 1 / B segment, 400×400, centered horizontally, 80px from bottom) ── */}
      <motion.div
        className="absolute pointer-events-none select-none z-[1]"
        style={{
          left: 1, bottom: 80, width: 400, height: 400,
          x: wallSpring,
        }}
      >
        {/* Floor shadow — radial gradient, no CSS filter */}
        <div
          className="absolute"
          style={{
            left: 105, bottom: 46, width: 190, height: 24,
            background: 'radial-gradient(ellipse at center, rgba(194, 151, 108, 0.72) 0%, rgba(194, 151, 108, 0.34) 45%, rgba(194, 151, 108, 0) 72%)',
            borderRadius: '50%',
          }}
        />
        <img src={publicAsset(`videos/${charAnim}.webp`)} alt="" className="w-full h-full object-cover relative" draggable={false} style={{ position: 'relative', zIndex: 1 }} />
      </motion.div>

      {/* ── Unlock Div: lock icon + time + bottom glass icons (370×731, bottom=48) ── */}
      <motion.div
        className="absolute z-30"
        style={{
          left: 16, top: 95, width: 370, height: 731,
          y: unlockY, opacity: displayOpacity,
        }}
        drag="y"
        dragConstraints={{ top: -400, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={handleUnlockDrag}
        onDragEnd={handleUnlockDragEnd}
      >
        {/* Lock icon + time */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center gap-[24px]">
          <span style={{
            fontFamily: SF, fontSize: '28.8px', color: 'white', fontWeight: 400,
            lineHeight: 1, width: 25.6, height: 25.6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {String.fromCodePoint(0x1003A1)}
          </span>
          <img src={publicAsset('icons/time.svg')} alt="" style={{ width: 154, height: 225 }} draggable={false} className="select-none pointer-events-none" />
        </div>

        {/* Bottom glass icons — flush with bottom of 731px div */}
        <div className="absolute" style={{ left: 0, bottom: 0 }}>
          <GlassIcon char={String.fromCodePoint(0x100000)} />
        </div>
        <div className="absolute" style={{ left: 314, bottom: 0 }}>
          <GlassIcon char={String.fromCodePoint(0x10031F)} />
        </div>
      </motion.div>

      {/* ── a-layer: 3-page horizontal swipe (pages 1–3, only when unlocked) ── */}
      <motion.div
        className="absolute inset-0 flex z-[5]"
        drag={isLocked ? false : "x"}
        dragConstraints={{ left: -804, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        style={{ x: pageX, width: 1206 }}
        animate={{ opacity: isLocked ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        onDrag={handlePageDrag}
        onDragEnd={handlePageDragEnd}
      >
        <div className="w-[402px] h-full flex-shrink-0"><Panel1 onWidgetClick={(type) => setActiveIsland(type as IslandType)} photos={polaroidPhotos} onOpenDiary={onOpenDiary} onOpenAlbum={onOpenAlbum} /></div>
        <div className="w-[402px] h-full flex-shrink-0"><Panel2 /></div>
        <div className="w-[402px] h-full flex-shrink-0"><Panel3 /></div>
      </motion.div>

      {/* ── Dock: visible when unlocked, slides up from below ── */}
      {lgFailed ? (
        /* Mobile Safari: render the live glass background ourselves.
           Native backdrop-filter can freeze when the backdrop is a transformed layer. */
        <motion.div
          className="absolute bottom-[17px] left-[17px] right-[17px] z-20"
          animate={{ opacity: isLocked ? 0 : 1, y: isLocked ? 40 : 0 }}
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 28, mass: 1 },
            opacity: { duration: 0.05 },
          }}
          style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
        >
          <div
            className="relative"
            style={{
              borderRadius: 38,
              height: DOCK_HEIGHT,
              padding: '0px 19px',
              isolation: 'isolate',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ borderRadius: 38, zIndex: 0 }}
            >
              <MobileDockGlass bgPosition={dockBgPosition} />
            </div>

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: 38,
                zIndex: 1,
                boxShadow: [
                  'inset 1px 1px 2px rgba(255, 255, 255, 0.95)',
                  'inset -0.5px -0.5px 1px rgba(255, 255, 255, 0.75)',
                  '0 0 10px rgba(255, 255, 255, 0.30)',
                  '0 8px 24px rgba(255, 255, 255, 0.14)',
                ].join(', '),
              }}
            />

            <div className="absolute inset-0" style={{ zIndex: 2 }}>
              <Dock onOpenApp={onOpenApp} onLock={lockScreen} onAction={() => playAnim('吹气')} onMusic={() => playAnim('听音乐')} />
            </div>
          </div>
        </motion.div>
      ) : (
        /* Desktop: LiquidGlass, glass on same element as animation */
        <motion.div
          className="absolute bottom-[17px] left-[17px] right-[17px] z-20"
          data-glass="dock"
          animate={{ opacity: isLocked ? 0 : 1, y: isLocked ? 40 : 0 }}
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 28, mass: 1 },
            opacity: { duration: 0.15, delay: isLocked ? 0 : 0.12 },
          }}
          style={{
            pointerEvents: isLocked ? 'none' : 'auto',
            background: 'rgba(255, 255, 255, 0.20)',
            borderRadius: 38,
            height: 103,
            padding: '0px 19px',
          }}
        >
          <Dock onOpenApp={onOpenApp} onLock={lockScreen} onAction={() => playAnim('吹气')} onMusic={() => playAnim('听音乐')} />
        </motion.div>
      )}

      {/* ── Dynamic Island — single instance, content switched by activeIsland ── */}
      {(() => {
        const cfg = activeIsland && ({
          album:  { variant: 'wide' as const,   style: {} as CSSProperties, content: null as ReactNode },
          camera: { variant: 'square' as const, style: { background: '#191B1D', boxShadow: 'inset 0 0 0 12px #000000' } as CSSProperties, content: <CameraIsland onCapture={handleCapture} /> as ReactNode },
          diary:  { variant: 'wide' as const,   style: {} as CSSProperties, content: null as ReactNode },
        })[activeIsland!]
        return cfg ? (
          <DynamicIsland
            expanded={true}
            variant={cfg.variant}
            style={cfg.style}
            onClose={() => setActiveIsland(null)}
          >
            {cfg.content}
          </DynamicIsland>
        ) : (
          <DynamicIsland
            expanded={false}
            variant="square"
            onClose={() => {}}
          />
        )
      })()}
    </div>
  )
}
