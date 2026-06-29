import { motion } from 'framer-motion'
import { publicAsset } from '../utils/assets'
import { FloatInGroup, FloatInImage, FloatInItem } from './FloatIn'

const XMARK = String.fromCodePoint(0x100184)
const CHECKMARK = String.fromCodePoint(0x100062)
const SF = "'SF Pro Display', 'SF Pro', -apple-system"

interface UploadSheetProps {
  selectedImage: number | null
  onSelectImage: () => void
  onClose: () => void
}

export default function UploadSheet({ selectedImage, onSelectImage, onClose }: UploadSheetProps) {
  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Bottom sheet — Figma shadow: 0px 15px 75px rgba(0,0,0,0.18) */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-[702px] bg-white rounded-t-[38px] z-30 flex flex-col"
        style={{ boxShadow: '0px 15px 75px rgba(0, 0, 0, 0.18)', fontFamily: "var(--font-ui)" }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 1.1 }}
      >
        <FloatInGroup startDelay={100} resetKey="upload-sheet" step={0.18}>
          {/* Sheet handle + header */}
          <FloatInItem index={0} kind="item" className="flex flex-col items-center pb-[10px]">
            <div className="pt-[5px] pb-[10px]">
              <svg width="36" height="5" viewBox="0 0 36 5" fill="none">
                <path d="M0 2.5C0 1.11929 1.11929 0 2.5 0H33.5C34.8807 0 36 1.11929 36 2.5C36 3.88071 34.8807 5 33.5 5H2.5C1.11929 5 0 3.88071 0 2.5Z" fill="#CCCCCC" />
              </svg>
            </div>
            <div className="w-full px-4 flex justify-between items-center">
              {/* Close — SF Symbol xmark, 17px, color #727272 */}
              <button
                onClick={onClose}
                className="w-[44px] h-[44px] rounded-full bg-black/[0.08] flex items-center justify-center hover-darken active:scale-90 transition-transform cursor-pointer"
              >
                <span style={{ fontFamily: SF, fontSize: 17, color: '#727272', lineHeight: 1 }}>{XMARK}</span>
              </button>
              <div className="w-8" />
            </div>
          </FloatInItem>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between pb-9 px-8">
            <div className="flex flex-col items-center gap-6">
              <FloatInImage
                index={1}
                kind="image"
                src={publicAsset('img/characters.png')}
                alt=""
                className="w-[232px] h-[196px] object-contain"
                draggable={false}
              />

              <FloatInItem index={2} kind="text" className="text-center">
                <h2 className="text-[22px] font-semibold text-black">上传角色图片</h2>
                <p className="text-[15px] text-black/50 mt-2 leading-relaxed">
                  请上传一张清晰的全身照。HarmonyOS Vision 将为您生成定制化的主题角色。
                </p>
              </FloatInItem>

              <FloatInItem
                index={3}
                kind="card"
                className="w-full bg-[#F2F2F7]/80 rounded-2xl px-6 py-5 flex flex-col gap-5"
              >
                <p className="text-[15px] text-black/60 font-medium">要求</p>
                <div className="flex flex-col gap-[10px]">
                  {['四肢清晰可见，无严重遮挡', '纯色或简单背景为佳', '避免过于复杂的机甲或多臂角色'].map((text, i) => (
                    <div key={i} className="flex items-center gap-[10px]">
                      {/* SF Symbol checkmark, 19.2px, color #34C759 */}
                      <span style={{ fontFamily: SF, fontSize: 19.2, color: '#34C759', lineHeight: 1 }}>{CHECKMARK}</span>
                      <span className="text-[15px] text-black/60">{text}</span>
                    </div>
                  ))}
                </div>
              </FloatInItem>
            </div>

            {/* CTA — Figma shadow: 0px 8px 40px rgba(0,0,0,0.12) */}
            <FloatInItem index={4} kind="item">
              <button
                onClick={onSelectImage}
                className="w-full h-[52px] bg-[#0088FF] text-white text-[17px] font-medium rounded-[1000px] hover-darken active:scale-[0.98] transition-transform cursor-pointer mt-6 flex-shrink-0"
                style={{ boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)', fontFamily: "var(--font-ui)" }}
              >
                选择图片
              </button>
            </FloatInItem>
          </div>
        </FloatInGroup>
      </motion.div>
    </>
  )
}
