import { motion } from 'framer-motion'
import { publicAsset } from '../utils/assets'
import { FloatInGroup, FloatInItem } from './FloatIn'

const SF = "'SF Pro Display', 'SF Pro', -apple-system"
const PINGFANG = "'PingFang SC', sans-serif"
const SHEET_SHADOW = '0px 15px 75px rgba(0, 0, 0, 0.18)'
const XMARK = String.fromCodePoint(0x100184)

interface CollectionItemResultSheetProps {
  selectedCaseImage: string
  onClose: () => void
  onSave: () => void
}

export default function CollectionItemResultSheet({
  selectedCaseImage,
  onClose,
  onSave,
}: CollectionItemResultSheetProps) {
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-black/50 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div
        className="absolute left-0 bottom-0 w-full bg-[#EEEFF4] rounded-t-[38px] z-30 flex flex-col items-center overflow-hidden"
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
        <FloatInGroup startDelay={100} resetKey="collection-item-result-sheet" step={0.16}>
          {/* Header */}
          <FloatInItem index={0} kind="item" style={{ alignSelf: 'stretch' }}>
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
                    {XMARK}
                  </div>
                </button>

                <div style={{ width: 8, alignSelf: 'stretch', position: 'relative' }} />
                <div style={{ width: 36, height: 22 }} />
              </div>
            </div>
          </FloatInItem>

          {/* Body */}
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
            <div
              style={{
                alignSelf: 'stretch',
                paddingLeft: 32,
                paddingRight: 32,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <FloatInItem index={1} kind="item">
                <div
                  style={{
                    color: 'black',
                    fontSize: 22,
                    fontFamily: PINGFANG,
                    fontWeight: 600,
                  }}
                >
                  物品已放入
                </div>
              </FloatInItem>

              <FloatInItem index={2} kind="item" style={{ alignSelf: 'stretch' }}>
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
                  物品模型已收入展柜。保存当前设置，稍后即可将其添加至桌面。
                </div>
              </FloatInItem>

              <FloatInItem index={3} kind="image">
                <div
                  style={{
                    width: 322,
                    height: 322,
                    position: 'relative',
                  }}
                >
                  <img
                    src={publicAsset(selectedCaseImage)}
                    alt=""
                    style={{
                      width: 322,
                      height: 322,
                      left: 0,
                      top: 0,
                      position: 'absolute',
                    }}
                    draggable={false}
                  />

                  <img
                    src={publicAsset('img/小挂件.png')}
                    alt=""
                    style={{
                      width: 90,
                      height: 123,
                      left: 116,
                      top: 64,
                      position: 'absolute',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />
                </div>
              </FloatInItem>
            </div>

            <FloatInItem index={4} kind="item">
              <button
                type="button"
                onClick={onSave}
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
                    保存
                  </div>
                </div>
              </button>
            </FloatInItem>
          </div>
        </FloatInGroup>
      </motion.div>
    </>
  )
}
