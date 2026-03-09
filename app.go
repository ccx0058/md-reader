package main

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	settingsService *SettingsService
	initialFile     string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// SetSettingsService 设置设置服务引用
func (a *App) SetSettingsService(s *SettingsService) {
	a.settingsService = s
}

// SetInitialFile 设置初始文件路径
func (a *App) SetInitialFile(filePath string) {
	a.initialFile = filePath
}

// GetInitialFile 获取初始文件路径
func (a *App) GetInitialFile() string {
	return a.initialFile
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 在应用启动后应用窗口最大化状态
	if a.settingsService != nil {
		windowState := a.settingsService.GetWindowState()
		if windowState.IsMax {
			runtime.WindowToggleMaximise(ctx)
		}
	}
}

// beforeClose 在窗口关闭前保存窗口状态
func (a *App) beforeClose(ctx context.Context) bool {
	if a.settingsService != nil {
		// 获取当前窗口位置和大小
		x, y := runtime.WindowGetPosition(ctx)
		w, h := runtime.WindowGetSize(ctx)
		isMax := runtime.WindowIsMaximised(ctx)

		state := WindowState{
			X:      x,
			Y:      y,
			Width:  w,
			Height: h,
			IsMax:  isMax,
		}
		// 保存窗口状态，忽略错误以允许窗口关闭
		_ = a.settingsService.SaveWindowState(state)
	}
	return false // 返回 false 允许关闭
}

// ToggleFullscreen 切换全屏
func (a *App) ToggleFullscreen() {
	runtime.WindowToggleMaximise(a.ctx)
}
