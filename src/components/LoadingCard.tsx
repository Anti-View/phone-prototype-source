import { publicAsset } from '../utils/assets'
import { motion } from 'framer-motion'
import type { AppState } from '../hooks/useAppState'

const XMARK = String.fromCodePoint(0x100184)
const SF = "'SF Pro Display', 'SF Pro', -apple-system"

interface LoadingCardProps {
  state: AppState
  onClose: () => void
}

export default function LoadingCard({ state, onClose }: LoadingCardProps) {
  const isVisible = state === 'loading'

  return (
    <>
      {isVisible && (
        <motion.div
          className="absolute inset-0 bg-black/50 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {isVisible && (
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-white rounded-t-[38px] z-30 flex flex-col"
          style={{ boxShadow: '0px -15px 75px rgba(0, 0, 0, 0.18)', fontFamily: "var(--font-ui)" }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 1.1 }}
        >
          {/* Handle + close button row */}
          <div className="flex flex-col items-center pb-[10px]">
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
          </div>

          {/* Content */}
          <div className="px-8 pb-12 flex flex-col items-center gap-6">
            {/* Loading video — inverted + cropped + scaled from mine/loading.mp4 */}
            <div className="w-[200px] h-[200px] relative flex items-center justify-center">
              <video
                src={publicAsset('videos/loading.mp4')}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain relative z-10"
              />
            </div>

            {/* Text */}
            <div className="text-center">
              <h2 className="text-[22px] font-semibold text-black">正在构建 3D 模型...</h2>
              <p className="text-[15px] text-black/50 mt-2 leading-relaxed">
                生成模型网格并绑定动画骨骼，这可能需要几秒钟。
              </p>
            </div>

            {/* Progress bar */}
            <motion.div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#0088FF] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  )
}
