package main

import (
	"context"
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 创建服务实例
	app := NewApp()
	fileService := NewFileService()
	settingsService := NewSettingsService()

	// 设置服务引用
	app.SetSettingsService(settingsService)
	fileService.SetSettingsService(settingsService)

	// 检查命令行参数（文件关联）
	var initialFile string
	if len(os.Args) > 1 {
		initialFile = os.Args[1]
	}

	// 加载设置
	settingsService.Load()
	windowState := settingsService.GetWindowState()

	// 处理窗口位置：-1 表示使用系统默认值
	windowWidth := windowState.Width
	windowHeight := windowState.Height
	if windowWidth <= 0 {
		windowWidth = 1200
	}
	if windowHeight <= 0 {
		windowHeight = 800
	}

	// 创建应用
	err := wails.Run(&options.App{
		Title:  "MD Reader",
		Width:  windowWidth,
		Height: windowHeight,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		Menu:             CreateMenu(app),
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			fileService.SetContext(ctx)
			settingsService.SetContext(ctx)
			
			// 如果有初始文件，加载它
			if initialFile != "" {
				app.SetInitialFile(initialFile)
			}
		},
		OnBeforeClose: app.beforeClose,
		Bind: []interface{}{
			app,
			fileService,
			settingsService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
