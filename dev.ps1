# MD Reader 开发模式启动脚本
# 使用方法: .\dev.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  MD Reader 开发模式" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 设置 GOPATH
$env:GOPATH = go env GOPATH
$env:Path += ";$env:GOPATH\bin"

# 检查 wails 是否可用
try {
    $wailsVersion = wails version 2>&1 | Select-String "v\d+\.\d+\.\d+"
    Write-Host "✓ Wails 版本: $wailsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Wails 未找到，请先运行 go install github.com/wailsapp/wails/v2/cmd/wails@latest" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "启动开发服务器..." -ForegroundColor Yellow
Write-Host "前端开发服务器: http://localhost:34115" -ForegroundColor Gray
Write-Host "按 Ctrl+C 停止" -ForegroundColor Gray
Write-Host ""

# 启动开发模式
wails dev
