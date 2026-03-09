# 📖 MD Reader

一个轻量级、功能丰富的 Markdown 阅读器，基于 Wails 框架开发。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ 特性

### 核心功能
- 📝 **多格式支持** - Markdown、纯文本、HTML 文件
- 🎨 **15+ 精美主题** - GitHub、Typora、VS Code、Dracula、Nord 等
- 🌓 **亮色/暗色模式** - 自动适配系统主题
- 🔍 **强大搜索** - 支持正则表达式、大小写敏感、全词匹配
- 📑 **智能大纲** - 自动生成文档大纲，快速导航
- 🌲 **文件树** - 浏览整个文件夹，快速切换文档

### 渲染能力
- 💻 **代码高亮** - 支持多种编程语言语法高亮
- 🎨 **括号彩虹** - 代码括号彩虹着色
- 📐 **数学公式** - KaTeX 数学公式渲染
- 📊 **图表支持** - Mermaid 流程图、时序图等
- 🖼️ **图片预览** - 点击图片放大查看
- 🔗 **链接跳转** - 支持文档内链接和相对路径跳转

### 实用工具
- 🔖 **书签管理** - 收藏常用文档
- 📜 **最近文件** - 快速访问最近打开的文档
- 📊 **字数统计** - 实时显示字数、字符数、行数
- 💾 **阅读进度** - 自动保存和恢复阅读位置
- 🖨️ **打印导出** - 打印文档或导出为 PDF/HTML
- ⌨️ **快捷键** - 丰富的键盘快捷键支持

## 🚀 快速开始

### 下载安装

从 [Releases](https://github.com/ccx0058/md-reader/releases) 页面下载最新版本。

**Windows 用户直接下载：**
- [md-reader-windows-amd64.exe](https://github.com/ccx0058/md-reader/releases/download/v1.0.0/md-reader-windows-amd64.exe)

### 从源码编译

#### 前置要求
- Go 1.18+
- Node.js 16+
- Wails CLI v2

#### 安装 Wails
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

#### 克隆项目
```bash
git clone https://github.com/yourusername/md-reader.git
cd md-reader
```

#### 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install
cd ..
```

#### 开发模式
```bash
wails dev
```

或使用便捷脚本：
```bash
# Windows
.\dev.ps1
# 或
.\开发模式.bat
```

#### 编译项目
```bash
wails build
```

或使用便捷脚本：
```bash
# Windows
.\build.ps1
# 或
.\构建项目.bat
```

编译后的可执行文件位于 `build/bin/` 目录。

## 📖 使用说明

### 打开文件
- **方式1**: 点击"打开文件"按钮
- **方式2**: 拖放文件到窗口
- **方式3**: 使用快捷键 `Ctrl+O`
- **方式4**: 双击 .md 文件（需配置文件关联）

### 文件关联
在 Windows 上设置 .md 文件关联：
```powershell
.\register-file-association.ps1
```

取消文件关联：
```powershell
.\unregister-file-association.ps1
```

详细说明请查看 [FILE_ASSOCIATION_GUIDE.md](FILE_ASSOCIATION_GUIDE.md)

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+Shift+O` | 打开文件夹 |
| `Ctrl+F` | 搜索 |
| `Ctrl+P` | 打印 |
| `Ctrl+E` | 导出 PDF |
| `Ctrl+=` | 放大字体 |
| `Ctrl+-` | 缩小字体 |
| `F11` | 全屏 |

## 🎨 主题预览

### 原有主题
- **GitHub** - 经典 GitHub 风格
- **Typora** - 简洁优雅
- **MarkText** - 现代设计
- **Obsidian** - 深色主题

### 编辑器主题
- **VS Code** - 微软 VS Code 风格
- **Notepad++** - 经典编辑器风格
- **Sublime** - Monokai 配色
- **JetBrains** - IntelliJ 风格

### 社区主题
- **Dracula** - 流行的暗色主题
- **Nord** - 北欧风格
- **One Dark** - Atom 编辑器风格
- **Solarized** - 护眼配色

### 高颜值主题
- **Material** - Material Design
- **Gruvbox** - 复古配色
- **Ayu** - 现代简约

## 🛠️ 技术栈

### 后端
- **Go** - 主要编程语言
- **Wails v2** - 桌面应用框架

### 前端
- **Vanilla JavaScript** - 无框架依赖
- **Vite** - 构建工具
- **Marked.js** - Markdown 解析
- **Highlight.js** - 代码高亮
- **KaTeX** - 数学公式渲染
- **Mermaid** - 图表渲染
- **DOMPurify** - XSS 防护

## 📁 项目结构

```
md-reader/
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── themes/       # 主题样式
│   │   ├── main.js       # 主应用
│   │   └── style.css     # 全局样式
│   ├── index.html        # HTML 模板
│   └── package.json      # 前端依赖
├── build/                # 构建配置
│   ├── windows/          # Windows 配置
│   └── darwin/           # macOS 配置
├── app.go                # 应用主逻辑
├── fileservice.go        # 文件服务
├── settings.go           # 设置服务
├── menu.go               # 菜单配置
├── main.go               # 入口文件
├── wails.json            # Wails 配置
└── README.md             # 项目说明
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Wails](https://wails.io/) - 优秀的 Go 桌面应用框架
- [Marked.js](https://marked.js.org/) - Markdown 解析器
- [Highlight.js](https://highlightjs.org/) - 代码高亮库
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Mermaid](https://mermaid-js.github.io/) - 图表渲染
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS 防护

## 📮 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/ccx0058/md-reader/issues)
- 发送邮件至 ccx0058@163.com

---

⭐ 如果这个项目对你有帮助，请给个 Star！
