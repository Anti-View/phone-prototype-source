import { useDragScroll } from '../hooks/useDragScroll'
import { publicAsset } from '../utils/assets'

interface ThemeDetailProps {
  onApply: () => void
}

export default function ThemeDetail({ onApply }: ThemeDetailProps) {
  const scrollRef = useDragScroll()

  return (
    <div className="absolute inset-0 z-0 select-none">
      {/* Theme Title + Meta */}
      <div className="absolute left-4 top-[122px] flex flex-col gap-2" style={{ fontFamily: "var(--font-ui)" }}>
        <h1 className="text-[28px] font-semibold text-black leading-tight">主题名称</h1>
        <div className="flex items-center gap-1">
          <span className="text-[15px] text-black/50">150.73MB | 耗电等级</span>
          <span className="w-4 h-4 bg-[#63CC2B] rounded-full flex items-center justify-center">
            <span className="text-white text-[12px] font-medium">1</span>
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="absolute left-4 top-[206px] flex items-center gap-2" style={{ fontFamily: "var(--font-ui)" }}>
        {['趣味', '个性', '3D'].map(tag => (
          <span key={tag} className="px-3 py-1 bg-black/[0.05] rounded-[100px] text-[14px] text-black/50">
            {tag}
          </span>
        ))}
      </div>

      {/* Preview Cards — mouse-drag to scroll, no scrollbar */}
      <div
        ref={scrollRef}
        className="absolute top-[258px] left-0 w-full overflow-x-auto"
        style={{ paddingLeft: 16, paddingRight: 16 }}
      >
        <div className="flex gap-[16px] w-max">
          <img src={publicAsset('img/主题详情页1.png')} alt="" className="w-[228px] h-[396px] rounded-[32px] flex-shrink-0 object-cover hover-darken" draggable={false} />
          <img src={publicAsset('img/主题详情页2.png')} alt="" className="w-[228px] h-[396px] rounded-[32px] flex-shrink-0 object-cover hover-darken" draggable={false} />
          <img src={publicAsset('img/主题详情页3.png')} alt="" className="w-[228px] h-[396px] rounded-[32px] flex-shrink-0 object-cover hover-darken" draggable={false} />
        </div>
      </div>

      {/* Content Description */}
      <div className="absolute left-4 top-[678px] flex flex-col gap-2" style={{ fontFamily: "var(--font-ui)" }}>
        <h3 className="text-[17px] font-medium text-black">内容简介</h3>
        <p
          className="w-[370px] text-[14px] text-black/80 leading-relaxed"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          HarmonyOS 6.1 及以上版本适用。萌主全新升级，互动焕新登场！为萌主换上专属套装，一起闯入奇妙小世界
        </p>
      </div>

      {/* CTA Button — Figma shadow: 0px 8px 40px rgba(0,0,0,0.12) */}
      <div className="absolute left-4 right-4 bottom-8 flex justify-center">
        <button
          onClick={onApply}
          className="w-[370px] h-[52px] bg-[#0088FF] text-white text-[17px] font-medium rounded-[1000px] hover-darken active:scale-[0.98] transition-transform cursor-pointer"
          style={{ boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)', fontFamily: "var(--font-ui)" }}
        >
          去应用
        </button>
      </div>
    </div>
  )
}
