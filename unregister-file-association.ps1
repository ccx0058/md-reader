# PowerShell 脚本：取消注册 MD Reader 文件关联
# 使用方法：以管理员身份运行此脚本

Write-Host "正在取消注册 MD Reader 文件关联..." -ForegroundColor Yellow

# 删除应用程序注册
$appKey = "HKCU:\Software\Classes\Applications\md-reader.exe"
if (Test-Path $appKey) {
    Remove-Item -Path $appKey -Recurse -Force
    Write-Host "已删除应用程序注册" -ForegroundColor Green
}

# 删除文件类型关联
$extensions = @(".md", ".markdown", ".txt")
foreach ($ext in $extensions) {
    $openWithKey = "HKCU:\Software\Classes\$ext\OpenWithProgids"
    if (Test-Path $openWithKey) {
        Remove-ItemProperty -Path $openWithKey -Name "MDReader.Document" -ErrorAction SilentlyContinue
        Write-Host "已删除 $ext 文件关联" -ForegroundColor Green
    }
}

# 删除文档类型定义
$docKey = "HKCU:\Software\Classes\MDReader.Document"
if (Test-Path $docKey) {
    Remove-Item -Path $docKey -Recurse -Force
    Write-Host "已删除文档类型定义" -ForegroundColor Green
}

Write-Host "`n取消注册完成！" -ForegroundColor Green
