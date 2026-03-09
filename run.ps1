# MD Reader 快速运行脚本
# 使用方法: .\run.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  MD Reader 快速运行" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查可执行文件是否存在
if (Test-Path ".\build\bin\md-reader.exe") {
    Write-Host "启动 MD Reader..." -ForegroundColor Green
    & ".\build\bin\md-reader.exe"
} else {
    Write-Host "✗ 可执行文件不存在" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先构建项目:" -ForegroundColor Yellow
    Write-Host "  .\build.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "或运行开发模式:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1" -ForegroundColor Cyan
    exit 1
}
