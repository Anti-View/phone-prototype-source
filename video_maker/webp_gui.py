#!/usr/bin/env python
"""序列帧 → WebP 小工具 (tkinter GUI)"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image
import os, re, time, threading, json

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webp_gui_config.json")
DEFAULTS = {
    "dir": "output_待机",
    "out": "output.webp",
    "filter": "",
    "size": "",
    "fps": 24,
    "quality": 90,
    "method": 4,
    "lossless": False,
    "minsize": False,
}

def load_config():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_config(data):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class WebpConverter:
    def __init__(self, root):
        self.root = root
        root.title("序列帧 → WebP")
        root.geometry("480x440")
        root.resizable(False, False)

        cfg = load_config()

        # ── 文件夹选择 ──
        ttk.Label(root, text="序列帧文件夹:").place(x=20, y=16)
        self.dir_var = tk.StringVar(value=cfg.get("dir", DEFAULTS["dir"]))
        ttk.Entry(root, textvariable=self.dir_var, width=42).place(x=128, y=16)
        ttk.Button(root, text="浏览", command=self.browse_dir, width=6).place(x=400, y=14)
        self.info_label = ttk.Label(root, text="")
        self.info_label.place(x=128, y=40)

        # ── 输出文件 ──
        ttk.Label(root, text="输出文件:").place(x=20, y=72)
        self.out_var = tk.StringVar(value=cfg.get("out", DEFAULTS["out"]))
        ttk.Entry(root, textvariable=self.out_var, width=42).place(x=128, y=72)

        # ── 文件名过滤 ──
        ttk.Label(root, text="文件过滤:").place(x=20, y=104)
        self.filter_var = tk.StringVar(value=cfg.get("filter", DEFAULTS["filter"]))
        ttk.Entry(root, textvariable=self.filter_var, width=20).place(x=128, y=104)
        ttk.Label(root, text="(留空=所有png)").place(x=300, y=104)

        # ── 尺寸 ──
        ttk.Label(root, text="输出尺寸:").place(x=20, y=136)
        self.size_var = tk.StringVar(value=cfg.get("size", DEFAULTS["size"]))
        ttk.Entry(root, textvariable=self.size_var, width=10).place(x=128, y=136)
        ttk.Label(root, text="填数字=正方形, 如 400。留空=原始尺寸。也可填 400x300").place(x=210, y=136)

        # ── 帧率 ──
        ttk.Label(root, text="帧率 (fps):").place(x=20, y=168)
        self.fps_var = tk.IntVar(value=cfg.get("fps", DEFAULTS["fps"]))
        ttk.Spinbox(root, textvariable=self.fps_var, from_=1, to=60, width=8).place(x=128, y=168)

        # ── 质量 ──
        ttk.Label(root, text="质量 (0-100):").place(x=20, y=200)
        self.q_var = tk.IntVar(value=cfg.get("quality", DEFAULTS["quality"]))
        q_scale = ttk.Scale(root, from_=0, to=100, variable=self.q_var, orient="horizontal", length=140, command=self.on_q_change)
        q_scale.place(x=128, y=200)
        self.q_label = ttk.Label(root, text=str(self.q_var.get()))
        self.q_label.place(x=275, y=200)
        ttk.Label(root, text="(lossless 勾选时忽略)").place(x=310, y=200)

        # ── 压缩级别 ──
        ttk.Label(root, text="压缩级别 (0-6):").place(x=20, y=232)
        self.m_var = tk.IntVar(value=cfg.get("method", DEFAULTS["method"]))
        ttk.Combobox(root, textvariable=self.m_var, values=[0,1,2,3,4,5,6], state="readonly", width=4).place(x=128, y=232)
        ttk.Label(root, text="0=最快  6=最优最慢").place(x=190, y=232)

        # ── 选项 ──
        self.lossless_var = tk.BooleanVar(value=cfg.get("lossless", DEFAULTS["lossless"]))
        ttk.Checkbutton(root, text="无损 (lossless)", variable=self.lossless_var).place(x=128, y=264)
        self.minsize_var = tk.BooleanVar(value=cfg.get("minsize", DEFAULTS["minsize"]))
        ttk.Checkbutton(root, text="最小体积 (minimize_size)", variable=self.minsize_var).place(x=280, y=264)

        # ── 转换按钮 ──
        self.go_btn = ttk.Button(root, text="▶ 开始转换", command=self.start_convert)
        self.go_btn.place(x=128, y=304, width=120)

        # ── 进度条 ──
        self.progress = ttk.Progressbar(root, mode="determinate", length=340)
        self.progress.place(x=20, y=350)

        # ── 状态 ──
        self.status_label = ttk.Label(root, text="就绪")
        self.status_label.place(x=20, y=376)

        # ── 结果 ──
        self.result_text = tk.Text(root, height=3, width=58, state="disabled", bg="#f5f5f5")
        self.result_text.place(x=20, y=400)

        # ── 退出时自动保存 ──
        root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.scan_dir()

    def on_q_change(self, *args):
        self.q_label.config(text=str(self.q_var.get()))

    def on_close(self):
        self.save_current()
        self.root.destroy()

    def save_current(self):
        save_config({
            "dir": self.dir_var.get(),
            "out": self.out_var.get(),
            "filter": self.filter_var.get(),
            "size": self.size_var.get(),
            "fps": self.fps_var.get(),
            "quality": self.q_var.get(),
            "method": self.m_var.get(),
            "lossless": self.lossless_var.get(),
            "minsize": self.minsize_var.get(),
        })

    def browse_dir(self):
        d = filedialog.askdirectory(initialdir=os.path.dirname(os.path.abspath(__file__)))
        if d:
            self.dir_var.set(d)
            self.scan_dir()

    def scan_dir(self, *args):
        d = self.dir_var.get()
        if not os.path.isdir(d):
            self.info_label.config(text="⚠ 文件夹不存在")
            return
        files = [f for f in os.listdir(d) if f.endswith(".png")]
        filt = self.filter_var.get()
        if filt:
            files = [f for f in files if filt in f]
        self.info_label.config(text=f"找到 {len(files)} 个 PNG")
        if self.out_var.get() == "output.webp" or self.out_var.get() == DEFAULTS["out"]:
            self.out_var.set(os.path.join(os.path.dirname(d) if os.path.dirname(d) else ".", "output.webp"))

    def start_convert(self):
        input_dir = self.dir_var.get()
        out_path = self.out_var.get()
        filt = self.filter_var.get()
        size_str = self.size_var.get().strip()
        fps = self.fps_var.get()
        quality = self.q_var.get()
        method = self.m_var.get()
        lossless = self.lossless_var.get()
        minsize = self.minsize_var.get()

        if not os.path.isdir(input_dir):
            messagebox.showerror("错误", "文件夹不存在")
            return

        # 保存当前配置
        self.save_current()

        # 解析尺寸
        size = None
        if size_str:
            if "x" in size_str:
                parts = size_str.split("x")
                try:
                    size = (int(parts[0]), int(parts[1]))
                except:
                    pass
            else:
                try:
                    s = int(size_str)
                    size = (s, s)
                except:
                    pass

        # 收集文件
        files = [f for f in os.listdir(input_dir) if f.endswith(".png")]
        if filt:
            files = [f for f in files if filt in f]
        files.sort(key=lambda x: int(re.search(r'(\d+)', x).group(1)) if re.search(r'(\d+)', x) else 0)

        if not files:
            messagebox.showerror("错误", "未找到匹配文件")
            return

        self.go_btn.config(state="disabled")
        self.progress["maximum"] = len(files) + 1
        self.progress["value"] = 0
        self.status_label.config(text="加载中...")
        self.result_text.config(state="normal")
        self.result_text.delete(1.0, tk.END)
        self.result_text.config(state="disabled")

        def run():
            frames = []
            for i, fname in enumerate(files):
                path = os.path.join(input_dir, fname)
                img = Image.open(path)
                if size:
                    img = img.resize(size, Image.LANCZOS)
                frames.append(img)
                self.root.after(0, lambda v=i+1: self.progress.configure(value=v))
                self.root.after(0, lambda v=i+1, n=len(files): self.status_label.configure(text=f"加载: {v}/{n}"))

            self.root.after(0, lambda: self.status_label.configure(text="编码中..."))
            t0 = time.time()

            kwargs = dict(
                format="WEBP", save_all=True, append_images=frames[1:],
                duration=int(1000/fps), loop=0,
                lossless=lossless, quality=quality, method=method,
            )
            if minsize:
                kwargs["minimize_size"] = True

            frames[0].save(out_path, **kwargs)
            elapsed = time.time() - t0
            kb = os.path.getsize(out_path) / 1024
            final_size = frames[0].size if not size else size
            result = (
                f"✓ {out_path}\n"
                f"  {len(files)} 帧 | {final_size[0]}×{final_size[1]} | {kb:.0f}KB ({kb/1024:.1f}MB) | {elapsed:.1f}s"
            )

            self.root.after(0, lambda: self.progress.configure(value=len(files)+1))
            self.root.after(0, lambda: self.status_label.configure(text="完成"))
            self.root.after(0, lambda: self.result_text.configure(state="normal"))
            self.root.after(0, lambda: self.result_text.insert(1.0, result))
            self.root.after(0, lambda: self.result_text.configure(state="disabled"))
            self.root.after(0, lambda: self.go_btn.config(state="normal"))

        threading.Thread(target=run, daemon=True).start()

if __name__ == "__main__":
    root = tk.Tk()
    app = WebpConverter(root)
    root.mainloop()
