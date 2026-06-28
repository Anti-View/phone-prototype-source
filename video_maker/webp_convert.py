#!/usr/bin/env python
"""序列帧 → 动画 WebP 转换工具"""
from PIL import Image
import os, sys, time, argparse, re

def main():
    parser = argparse.ArgumentParser(description="序列帧 PNG → 动画 WebP")
    parser.add_argument("input_dir", help="序列帧文件夹路径")
    parser.add_argument("-o", "--output", default="output.webp", help="输出文件名 (默认 output.webp)")
    parser.add_argument("-s", "--size", type=int, default=0, help="缩放尺寸 (默认 0=原始尺寸，填单个数字即正方形)")
    parser.add_argument("-W", "--width", type=int, default=0, help="缩放宽度 (0=原始)")
    parser.add_argument("-H", "--height", type=int, default=0, help="缩放高度 (0=原始)")
    parser.add_argument("-f", "--fps", type=int, default=24, help="帧率 (默认 24)")
    parser.add_argument("-q", "--quality", type=int, default=90, help="有损质量 0-100 (默认 90)")
    parser.add_argument("-m", "--method", type=int, default=4, help="压缩级别 0-6 (默认 4, 6=最优最慢)")
    parser.add_argument("--lossless", action="store_true", help="无损模式")
    parser.add_argument("--min-size", action="store_true", help="最小化体积")
    parser.add_argument("--filter", default="", help="文件名过滤关键词 (默认空=所有png)")

    args = parser.parse_args()

    # 确定尺寸
    if args.size > 0:
        size = (args.size, args.size)
    elif args.width > 0 or args.height > 0:
        size = (args.width or 9999, args.height or 9999)
    else:
        size = None

    # 收集文件
    all_files = [f for f in os.listdir(args.input_dir) if f.endswith(".png")]
    if args.filter:
        all_files = [f for f in all_files if args.filter in f]
    all_files.sort(key=lambda x: int(re.search(r'(\d+)', x).group(1)) if re.search(r'(\d+)', x) else 0)

    if not all_files:
        print("❌ 未找到匹配的 PNG 文件")
        sys.exit(1)

    print(f"输入: {len(all_files)} 帧")
    print(f"尺寸: {size or '原始'}")
    print(f"帧率: {args.fps}fps ({1000//args.fps}ms/frame)")
    print(f"参数: lossless={args.lossless}, quality={args.quality}, method={args.method}")
    if args.min_size:
        print(f"      minimize_size=True")
    print()

    # 加载
    frames = []
    for i, fname in enumerate(all_files):
        if (i + 1) % 20 == 0 or i == 0:
            print(f"\r加载: {i+1}/{len(all_files)}", end="", flush=True)
        path = os.path.join(args.input_dir, fname)
        img = Image.open(path)
        if size:
            img = img.resize(size, Image.LANCZOS)
        frames.append(img)
    print(f"\r加载: {len(all_files)}/{len(all_files)} ✓")

    # 编码
    print(f"编码中...")
    t0 = time.time()
    save_kwargs = dict(
        format="WEBP", save_all=True,
        append_images=frames[1:],
        duration=int(1000 / args.fps),
        loop=0,
        lossless=args.lossless,
        quality=args.quality,
        method=args.method,
    )
    if args.min_size:
        save_kwargs["minimize_size"] = True

    frames[0].save(args.output, **save_kwargs)
    elapsed = time.time() - t0

    size_kb = os.path.getsize(args.output) / 1024
    print(f"完成: {args.output}  |  {size_kb:.0f}KB ({size_kb/1024:.1f}MB)  |  {elapsed:.1f}s")


if __name__ == "__main__":
    main()
