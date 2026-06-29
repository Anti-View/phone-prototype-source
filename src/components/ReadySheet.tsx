import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import '@google/model-viewer'
import { publicAsset } from '../utils/assets'
import type { AppState } from '../hooks/useAppState'
import { FloatInGroup, FloatInItem } from './FloatIn'

const XMARK = String.fromCodePoint(0x100184)
const SF = "'SF Pro Display', 'SF Pro', -apple-system"

/* Inject cursor: none into model-viewer's shadow DOM */
function useModelViewerCursor() {
  useEffect(() => {
    const id = setInterval(() => {
      const mv = document.querySelector('model-viewer') as any
      if (mv?.shadowRoot) {
        const style = document.createElement('style')
        style.textContent = '* { cursor: none !important; }'
        mv.shadowRoot.appendChild(style)
        clearInterval(id)
      }
    }, 100)
    return () => clearInterval(id)
  }, [])
}

interface ReadySheetProps {
  state: AppState
  selectedImage: number | null
  onApply: () => void
  onClose: () => void
}

export default function ReadySheet({ state, selectedImage, onApply, onClose }: ReadySheetProps) {
  const isVisible = state === 'ready'
  useModelViewerCursor()

  return (
    <>
      {isVisible && (
        <motion.div
          className="absolute inset-0 bg-black/50 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />
      )}
      {isVisible && (
        <motion.div
          className="absolute bottom-0 left-0 w-full h-[637px] bg-white rounded-t-[38px] z-30 flex flex-col"
          style={{ boxShadow: '0px 15px 75px rgba(0, 0, 0, 0.18)', fontFamily: "var(--font-ui)" }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 1.1 }}
        >
          <FloatInGroup startDelay={100} resetKey={state} step={0.18}>
            <FloatInItem index={0} kind="item" className="flex flex-col items-center pb-[10px]">
              <div className="pt-[5px] pb-[10px]">
                <svg width="36" height="5" viewBox="0 0 36 5" fill="none">
                  <path d="M0 2.5C0 1.11929 1.11929 0 2.5 0H33.5C34.8807 0 36 1.11929 36 2.5C36 3.88071 34.8807 5 33.5 5H2.5C1.11929 5 0 3.88071 0 2.5Z" fill="#CCCCCC" />
                </svg>
              </div>
              <div className="w-full px-4 flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="w-[44px] h-[44px] rounded-full bg-black/[0.08] flex items-center justify-center hover-darken active:scale-90 transition-transform cursor-pointer"
                >
                  <span style={{ fontFamily: SF, fontSize: 17, color: '#727272', lineHeight: 1 }}>{XMARK}</span>
                </button>
                <div className="w-8" />
              </div>
            </FloatInItem>

            <div className="flex-1 flex flex-col justify-between pb-9 px-8">
              <div className="flex flex-col items-center gap-6">
                <FloatInItem
                  index={1}
                  kind="image"
                  className="w-[330px] h-[330px] rounded-2xl overflow-hidden"
                  style={{ background: '#F2F2F2' }}
                >
                  {React.createElement('model-viewer', {
                    src: publicAsset('videos/model.glb'),
                    'camera-controls': '',
                    'auto-rotate': '',
                    'disable-zoom': '',
                    'touch-action': 'pan-y',
                    'camera-orbit': '0deg 75deg 200%',
                    'min-camera-orbit': '-Infinity auto 150%',
                    'max-camera-orbit': 'Infinity auto 150%',
                    'shadow-intensity': '0.4',
                    'shadow-softness': '0.8',
                    'environment-image': 'neutral',
                    'exposure': '1',
                    style: { width: '100%', height: '100%', background: 'linear-gradient(180deg, #f8f8fa 0%, #e8e8ed 100%)', cursor: 'none' },
                  })}
                </FloatInItem>

                <FloatInItem index={2} kind="text" className="text-center">
                  <h2 className="text-[22px] font-semibold text-black">角色已就绪</h2>
                  <p className="text-[15px] text-black/50 mt-2 leading-relaxed">
                    该角色已成功适配骨骼动画系统，你可以通过手指拖动预览不同角度的模型。
                  </p>
                </FloatInItem>
              </div>

              <FloatInItem index={3} kind="item">
                <button
                  onClick={onApply}
                  className="w-full h-[52px] bg-[#0088FF] text-white text-[17px] font-medium rounded-[1000px] hover-darken active:scale-[0.98] transition-transform cursor-pointer mt-6 flex-shrink-0"
                  style={{ boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)', fontFamily: "var(--font-ui)" }}
                >
                  应用主题
                </button>
              </FloatInItem>
            </div>
          </FloatInGroup>
        </motion.div>
      )}
    </>
  )
}
