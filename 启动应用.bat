@echo off
chcp 65001 >nul
title MD Reader

echo ====================================
echo   MD Reader 启动
echo ====================================
echo.

if exist "build\bin\md-reader.exe" (
    echo 正在启动 MD Reader...
    echo.
    start "" "build\bin\md-reader.exe"
    timeout /t 2 >nul
) else (
    echo [错误] 可执行文件不存在！
    echo.
    echo 请先构建项目:
    echo   1. 右键点击 build.ps1
    echo   2. 选择"使用 PowerShell 运行"
    echo.
    pause
)
