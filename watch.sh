#!/bin/bash

set -u

cd "$(dirname "$0")" || exit 1

REMOTE="origin"
BRANCH="main"
INTERVAL=10

count_files() {
  local dir="$1"
  if [ -d "$dir" ]; then
    find "$dir" -type f | wc -l | tr -d ' '
  else
    echo "0"
  fi
}

print_counts() {
  echo "📊 文件数量："
  echo "  src:           $(count_files src)"
  echo "  public:        $(count_files public)"
  echo "  public/img:    $(count_files public/img)"
  echo "  public/videos: $(count_files public/videos)"
  echo "  public/icons:  $(count_files public/icons)"
}

check_dirs() {
  [ -d public ]       || echo "⚠️ public 不存在"
  [ -d public/img ]    || echo "⚠️ public/img 不存在，图片资源可能没有同步"
  [ -d public/videos ] || echo "⚠️ public/videos 不存在，动画资源可能没有同步"
  [ -d public/icons ]  || echo "⚠️ public/icons 不存在，图标资源可能没有同步"
}

check_lfs_pointers() {
  if [ ! -d public ]; then
    return 0
  fi

  local pointers
  pointers=$(grep -RIl "version https://git-lfs.github.com/spec/v1" public 2>/dev/null || true)

  if [ -n "$pointers" ]; then
    echo "⚠️ 发现 Git LFS 指针文件，说明真实资源可能没有拉下来："
    echo "$pointers"
    echo "👉 请在 Mac 上安装 Git LFS，并执行：git lfs install && git lfs pull"
  fi
}

sync_once() {
  echo ""
  echo "🔄 $(date '+%Y-%m-%d %H:%M:%S') 同步 $REMOTE/$BRANCH..."

  local before
  before=$(git rev-parse HEAD 2>/dev/null || echo "")

  git fetch "$REMOTE" "$BRANCH"

  git reset --hard "$REMOTE/$BRANCH"

  git clean -fd -e node_modules -e .env.local

  if command -v git-lfs >/dev/null 2>&1; then
    git lfs pull
  else
    echo "⚠️ git-lfs 未安装，如果图片或视频使用 LFS，资源可能不会完整。"
  fi

  local after
  after=$(git rev-parse HEAD 2>/dev/null || echo "")

  if [ "$before" != "$after" ]; then
    echo "✅ 已同步到最新提交：$after"
  else
    echo "✅ 已是最新提交：$after"
  fi

  check_dirs
  print_counts
  check_lfs_pointers
}

echo "👀 开始监听 GitHub $REMOTE/$BRANCH，每 ${INTERVAL}s 检查一次..."
echo "📌 本机目录：$(pwd)"
echo "📌 注意：本脚本会强制让 Mac 工作区与 GitHub main 一致，会丢弃 Mac 本地未提交修改。"

while true; do
  if ! sync_once; then
    echo "❌ 同步失败，将在下一轮重试。"
  fi

  sleep "$INTERVAL"
done
