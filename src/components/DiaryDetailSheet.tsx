import { motion } from 'framer-motion'
import type { DiaryEntry } from '../types/diary'
import { publicAsset } from '../utils/assets'

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 100,
        outline: '1px rgba(0, 0, 0, 0.10) solid',
        outlineOffset: -1,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'rgba(0, 0, 0, 0.50)',
          fontSize: 14,
          fontFamily: 'SF Pro, SF Pro Display, -apple-system',
          fontWeight: 400,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          color: 'rgba(0, 0, 0, 0.50)',
          fontSize: 14,
          fontFamily: 'PingFang SC, sans-serif',
          fontWeight: 400,
        }}
      >
        {text}
      </div>
    </div>
  )
}

export default function DiaryDetailSheet({
  entry,
  onClose,
}: {
  entry: DiaryEntry
  onClose: () => void
}) {
  return (
    <motion.div
      className="absolute left-0 right-0 bottom-0 z-[60] overflow-hidden flex flex-col items-center"
      style={{
        height: 812,
        background: 'white',
        boxShadow: '0px 15px 75px rgba(0, 0, 0, 0.18)',
        borderTopLeftRadius: 38,
        borderTopRightRadius: 38,
      }}
      initial={{ y: 812 }}
      animate={{ y: 0 }}
      exit={{ y: 812 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 1 }}
    >
      {/* ── Top handle + controls ── */}
      <div
        data-mode="Light"
        data-show-subtitle="true"
        data-style="Default"
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
          <div
            style={{
              width: 36,
              height: 5,
              borderRadius: 999,
              background: '#CCCCCC',
            }}
          />
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
            onClick={onClose}
            data-no-drag
            style={{
              width: 44,
              height: 44,
              paddingLeft: 4,
              paddingRight: 4,
              position: 'relative',
              borderRadius: 296,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              border: 'none',
              background: 'rgba(120, 120, 128, 0.16)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 36,
                alignSelf: 'stretch',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#727272',
                fontSize: 17,
                fontFamily: 'SF Pro, SF Pro Display, -apple-system',
                fontWeight: 510,
              }}
            >
              􀆄
            </span>
          </button>

          <div style={{ width: 8, alignSelf: 'stretch', position: 'relative' }} />
          <div style={{ width: 36, height: 22, left: 183, top: 13, position: 'absolute' }} />
        </div>
      </div>

      {/* ── Content area — scrollable internally ── */}
      <div
        className="overflow-y-auto overscroll-contain"
        style={{
          alignSelf: 'stretch',
          height: 742,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 24,
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {/* ── Header: date + time + pills ── */}
        <div
          style={{
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <div
            style={{
              alignSelf: 'stretch',
              display: 'inline-flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: 4,
              }}
            >
              <div
                style={{
                  color: 'rgba(0, 0, 0, 0.90)',
                  fontSize: 24,
                  fontFamily: 'PingFang SC, sans-serif',
                  fontWeight: 600,
                }}
              >
                {entry.date}
              </div>
              <div
                style={{
                  color: 'rgba(0, 0, 0, 0.50)',
                  fontSize: 15,
                  fontFamily: 'PingFang SC, sans-serif',
                  fontWeight: 400,
                }}
              >
                今天 {entry.time}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <InfoPill icon="􀉣" text={`${entry.linkCount}个链接`} />
              <InfoPill icon="􀏅" text={`${entry.imageCount}张配图`} />
            </div>
          </div>

          <div
            style={{
              color: '#605C94',
              fontSize: 15,
              fontFamily: 'PingFang SC, sans-serif',
              fontWeight: 400,
            }}
          >
            {entry.tags.map(tag => `#${tag}`).join('  ')}
          </div>
        </div>

        {/* ── 56px capsule module — player ── */}
        <div
          style={{
            alignSelf: 'stretch',
            height: 56,
            position: 'relative',
            background: 'rgba(238, 233, 227, 0.42)',
            overflow: 'hidden',
            borderRadius: 61,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={publicAsset('img/player.png')}
            alt=""
            style={{ width: 354, height: 56, objectFit: 'contain' }}
            draggable={false}
          />
        </div>

        {/* ── Full text ── */}
        <div
          style={{
            alignSelf: 'stretch',
            color: 'rgba(0, 0, 0, 0.70)',
            fontSize: 16,
            fontFamily: 'PingFang SC, sans-serif',
            fontWeight: 400,
            lineHeight: '28px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {entry.fullText}
        </div>

        {/* ── Article image ── */}
        <img
          src={publicAsset('img/content_image.png')}
          alt=""
          style={{
            alignSelf: 'stretch',
            borderRadius: 22,
            objectFit: 'cover',
          }}
          draggable={false}
        />
      </div>
    </motion.div>
  )
}
