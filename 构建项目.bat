@echo off
chcp 65001 >nul
title MD Reader - 构建项目

echo ====================================
echo   MD Reader 构建项目
echo ====================================
echo.

powershell -ExecutionPolicy Bypass -File "build.ps1"
pause
