# MD Reader 构建脚本
# 使用方法: .\build.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  MD Reader 构建脚本" -ForegroundColor Cyan
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
Write-Host "开始构建..." -ForegroundColor Yellow
Write-Host ""

# 清理并构建
wails build -clean

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "  构建成功！" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "可执行文件位置: build\bin\md-reader.exe" -ForegroundColor Cyan
    Write-Host ""
    
    # 询问是否运行
    $run = Read-Host "是否立即运行? (Y/N)"
    if ($run -eq "Y" -or $run -eq "y") {
        Write-Host "启动应用..." -ForegroundColor Yellow
        & ".\build\bin\md-reader.exe"
    }
} else {
    Write-Host ""
    Write-Host "构建失败，请检查错误信息" -ForegroundColor Red
    exit 1
}
