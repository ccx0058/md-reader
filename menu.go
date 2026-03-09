package main

import (
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// CreateMenu 创建应用菜单
func CreateMenu(app *App) *menu.Menu {
	appMenu := menu.NewMenu()

	// 文件菜单
	fileMenu := appMenu.AddSubmenu("文件")
	fileMenu.AddText("打开文件", keys.CmdOrCtrl("o"), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:open-file")
	})
	fileMenu.AddText("打开文件夹", keys.Combo("o", keys.CmdOrCtrlKey, keys.ShiftKey), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:open-folder")
	})
	fileMenu.AddSeparator()
	
	// 导出子菜单
	exportMenu := fileMenu.AddSubmenu("导出")
	exportMenu.AddText("导出为 PDF", keys.CmdOrCtrl("e"), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:export-pdf")
	})
	exportMenu.AddText("导出为 HTML", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:export-html")
	})
	exportMenu.AddText("复制为纯文本", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:copy-text")
	})
	
	fileMenu.AddSeparator()
	fileMenu.AddText("退出", keys.CmdOrCtrl("q"), func(cd *menu.CallbackData) {
		runtime.Quit(app.ctx)
	})

	// 视图菜单
	viewMenu := appMenu.AddSubmenu("视图")

	// 主题子菜单
	themeMenu := viewMenu.AddSubmenu("主题")
	
	// 原有主题
	themeMenu.AddText("GitHub", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "github")
	})
	themeMenu.AddText("Typora", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "typora")
	})
	themeMenu.AddText("MarkText", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "marktext")
	})
	themeMenu.AddText("Obsidian", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "obsidian")
	})
	
	themeMenu.AddSeparator()
	
	// 编辑器主题
	themeMenu.AddText("VS Code", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "vscode")
	})
	themeMenu.AddText("Notepad++", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "notepad++")
	})
	themeMenu.AddText("Sublime (Monokai)", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "sublime")
	})
	themeMenu.AddText("JetBrains", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "jetbrains")
	})
	
	themeMenu.AddSeparator()
	
	// 社区主题
	themeMenu.AddText("Dracula", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "dracula")
	})
	themeMenu.AddText("Nord", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "nord")
	})
	themeMenu.AddText("One Dark", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "onedark")
	})
	themeMenu.AddText("Solarized", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "solarized")
	})
	
	themeMenu.AddSeparator()
	
	// 高颜值新主题
	themeMenu.AddText("Material", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "material")
	})
	themeMenu.AddText("Gruvbox", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "gruvbox")
	})
	themeMenu.AddText("Ayu", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-theme", "ayu")
	})

	viewMenu.AddSeparator()

	// 模式切换
	viewMenu.AddText("亮色模式", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-mode", "light")
	})
	viewMenu.AddText("暗色模式", nil, func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:set-mode", "dark")
	})

	viewMenu.AddSeparator()

	// 字体大小
	viewMenu.AddText("放大字体", keys.CmdOrCtrl("="), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:font-increase")
	})
	viewMenu.AddText("缩小字体", keys.CmdOrCtrl("-"), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:font-decrease")
	})

	viewMenu.AddSeparator()

	// 打印
	viewMenu.AddText("打印", keys.CmdOrCtrl("p"), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:print")
	})

	viewMenu.AddSeparator()

	// 全屏
	viewMenu.AddText("全屏", keys.Key("f11"), func(cd *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:toggle-fullscreen")
	})

	return appMenu
}
