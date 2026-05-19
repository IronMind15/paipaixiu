@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ╔════════════════════════════╗
echo ║    ✨ 拍拍秀 ✨            ║
echo ╚════════════════════════════╝
echo.

:: Build if not done
if not exist "dist\" (
    echo [1/2] 正在构建前端...
    call npm run build
    echo.
)

echo [2/2] 启动服务器...
echo.
echo 游戏地址: http://localhost:3001
echo 按 Ctrl+C 停止服务器
echo.

start http://localhost:3001

set NODE_ENV=production
node server/index.js

pause
