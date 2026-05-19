# ✨ 拍拍秀

双人策略对战游戏。回合制，石头剪刀布式克制系统，支持本地同屏和在线联机。

## 快速开始

```bash
npm install
npm run build
npm start
```

浏览器打开 `http://localhost:3001`

## 在线对战

1. 双方打开同一网址
2. 一方点「创建房间」→ 把房间号发给对方
3. 另一方输入房间号 → 点「加入」
4. 双方点「开始对战」

## 部署到 Railway

1. 把代码推送到 GitHub 仓库
2. 打开 [railway.com](https://railway.com) → New Project → Deploy from GitHub
3. 选择此仓库 → 自动构建部署

Railway 会自动读取 `railway.json` 和 `.nixpacks.toml` 完成配置。
