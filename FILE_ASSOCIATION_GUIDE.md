# MD Reader 文件关联设置指南

## 问题说明

修复了两个文件关联相关的bug：
1. ✅ 应用无法在Windows的"打开方式"列表中显示
2. ✅ 双击md文件打开应用后，文件没有被自动加载

## 使用方法

### 方法一：使用 PowerShell 脚本（推荐）

1. 首先编译应用：
   ```bash
   wails build
   ```

2. 以管理员身份运行 PowerShell

3. 执行注册脚本：
   ```powershell
   .\register-file-association.ps1
   ```

4. 现在可以：
   - 右键点击任意 .md 文件
   - 选择"打开方式" -> "选择其他应用"
   - 在列表中找到 "MD Reader"
   - 勾选"始终使用此应用打开 .md 文件"

### 方法二：手动设置

1. 右键点击任意 .md 文件
2. 选择"打开方式" -> "选择其他应用"
3. 点击"更多应用"
4. 滚动到底部，点击"在这台电脑上查找其他应用"
5. 浏览到 `build\bin\md-reader.exe`
6. 勾选"始终使用此应用打开 .md 文件"

### 取消注册

如果需要取消文件关联，运行：
```powershell
.\unregister-file-association.ps1
```

## 技术实现

### 后端修改 (Go)

1. **main.go**: 添加命令行参数处理
   ```go
   if len(os.Args) > 1 {
       initialFile = os.Args[1]
   }
   ```

2. **app.go**: 添加初始文件存储和获取方法
   ```go
   func (a *App) SetInitialFile(filePath string)
   func (a *App) GetInitialFile() string
   ```

### 前端修改 (JavaScript)

1. **main.js**: 添加初始文件加载逻辑
   ```javascript
   async loadInitialFile() {
       const initialFile = await window.go.main.App.GetInitialFile();
       if (initialFile) {
           await this.loadFile(initialFile);
       }
   }
   ```

### Windows 注册表

注册以下内容：
- `HKCU\Software\Classes\Applications\md-reader.exe` - 应用程序注册
- `HKCU\Software\Classes\.md\OpenWithProgids` - .md 文件关联
- `HKCU\Software\Classes\.markdown\OpenWithProgids` - .markdown 文件关联
- `HKCU\Software\Classes\MDReader.Document` - 文档类型定义

## 支持的文件格式

- `.md` - Markdown 文件
- `.markdown` - Markdown 文件
- `.txt` - 文本文件

## 注意事项

1. 如果修改没有立即生效，请尝试：
   - 重启 Windows 资源管理器
   - 注销并重新登录
   - 重启计算机

2. 如果应用路径改变，需要重新运行注册脚本

3. PowerShell 脚本会自动检测 exe 文件位置，无需手动修改路径
