# PowerShell 脚本：注册 MD Reader 文件关联
# 使用方法：以管理员身份运行此脚本

# 获取当前 exe 文件的完整路径
$exePath = Join-Path $PSScriptRoot "build\bin\md-reader.exe"

if (-not (Test-Path $exePath)) {
    Write-Host "错误: 找不到 md-reader.exe，请先编译应用" -ForegroundColor Red
    Write-Host "路径: $exePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "正在注册 MD Reader 文件关联..." -ForegroundColor Green
Write-Host "应用路径: $exePath" -ForegroundColor Cyan

# 转义路径中的反斜杠
$exePathEscaped = $exePath -replace '\\', '\\'

# 注册应用程序
$appKey = "HKCU:\Software\Classes\Applications\md-reader.exe"
New-Item -Path $appKey -Force | Out-Null
Set-ItemProperty -Path $appKey -Name "(Default)" -Value "MD Reader"

# 注册 shell\open\command
$commandKey = "$appKey\shell\open\command"
New-Item -Path $commandKey -Force | Out-Null
Set-ItemProperty -Path $commandKey -Name "(Default)" -Value "`"$exePath`" `"%1`""

# 注册支持的文件类型
$extensions = @(".md", ".markdown", ".txt")
foreach ($ext in $extensions) {
    $openWithKey = "HKCU:\Software\Classes\$ext\OpenWithProgids"
    New-Item -Path $openWithKey -Force | Out-Null
    Set-ItemProperty -Path $openWithKey -Name "MDReader.Document" -Value ([byte[]]@()) -Type Binary
}

# 定义文件类型
$docKey = "HKCU:\Software\Classes\MDReader.Document"
New-Item -Path $docKey -Force | Out-Null
Set-ItemProperty -Path $docKey -Name "(Default)" -Value "Markdown Document"

# 设置图标
$iconKey = "$docKey\DefaultIcon"
New-Item -Path $iconKey -Force | Out-Null
Set-ItemProperty -Path $iconKey -Name "(Default)" -Value "$exePath,0"

# 设置打开命令
$docCommandKey = "$docKey\shell\open\command"
New-Item -Path $docCommandKey -Force | Out-Null
Set-ItemProperty -Path $docCommandKey -Name "(Default)" -Value "`"$exePath`" `"%1`""

Write-Host "`n注册完成！" -ForegroundColor Green
Write-Host "现在你可以：" -ForegroundColor Cyan
Write-Host "1. 右键点击 .md 文件" -ForegroundColor White
Write-Host "2. 选择 '打开方式' -> '选择其他应用'" -ForegroundColor White
Write-Host "3. 在列表中找到 'MD Reader'" -ForegroundColor White
Write-Host "4. 勾选 '始终使用此应用打开 .md 文件'" -ForegroundColor White
Write-Host "`n提示: 如果没有立即生效，请重启资源管理器或注销重新登录" -ForegroundColor Yellow
