# 毕设项目 — 本地开发指南

## 首次拉取

Mac：
```bash
git clone https://github.com/Anti-View/phone-prototype-source.git
cd phone-prototype-source
npm install
```

Win：
```bash
git clone https://github.com/Anti-View/phone-prototype-source.git
cd phone-prototype-source
npm install
```

## 启动项目

Mac：
```bash
bash 启动项目.sh
```

Win：
```
双击 启动项目.bat
```

浏览器打开 `http://localhost:5173`。

## 实时同步更新（监听我 Win 端的推送）

开第二个终端 tab：
```bash
bash watch.sh
```

保持运行，每次我 push 新版本，你的终端会自动 git pull。刷新浏览器看最新效果。
