@echo off
chcp 65001 >nul
title MD Reader - 开发模式

echo ====================================
echo   MD Reader 开发模式
echo ====================================
echo.
echo 正在启动开发服务器...
echo 前端开发服务器: http://localhost:34115
echo 按 Ctrl+C 停止
echo.

powershell -ExecutionPolicy Bypass -File "dev.ps1"
