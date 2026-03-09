package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
)

// Settings 用户设置
type Settings struct {
	Theme          string            `json:"theme"`          // 主题: github, typora, marktext, obsidian
	Mode           string            `json:"mode"`           // 模式: light, dark
	FontSize       int               `json:"fontSize"`       // 字体大小
	RecentFiles    []string          `json:"recentFiles"`    // 最近打开的文件列表
	Bookmarks      []string          `json:"bookmarks"`      // 书签列表
	ReadingProgress map[string]int   `json:"readingProgress"` // 阅读进度（文件路径 -> 滚动位置）
}

// MaxRecentFiles 最大最近文件数量
const MaxRecentFiles = 10

// WindowState 窗口状态
type WindowState struct {
	X      int  `json:"x"`
	Y      int  `json:"y"`
	Width  int  `json:"width"`
	Height int  `json:"height"`
	IsMax  bool `json:"isMax"`
}

// AppConfig 应用配置（包含设置和窗口状态）
type AppConfig struct {
	Settings    Settings    `json:"settings"`
	WindowState WindowState `json:"windowState"`
}

// DefaultSettings 默认设置
func DefaultSettings() Settings {
	return Settings{
		Theme:           "github", // 默认主题
		Mode:            "light",
		FontSize:        16,
		RecentFiles:     []string{},
		Bookmarks:       []string{},
		ReadingProgress: make(map[string]int),
	}
}

// DefaultWindowState 默认窗口状态（增加屏幕范围验证）
func DefaultWindowState() WindowState {
	// 使用系统默认的窗口位置，让系统自动决定
	return WindowState{
		X:      -1, // -1 表示使用系统默认值
		Y:      -1,
		Width:  1200,
		Height: 800,
		IsMax:  false,
	}
}

// DefaultAppConfig 默认应用配置
func DefaultAppConfig() AppConfig {
	return AppConfig{
		Settings:    DefaultSettings(),
		WindowState: DefaultWindowState(),
	}
}

// ValidateWindowState 验证窗口位置是否在有效屏幕范围内
// 如果窗口位置无效，返回默认窗口状态
func ValidateWindowState(state WindowState) WindowState {
	// 简单验证：确保窗口位置和大小为非负值
	if state.Width <= 0 || state.Height <= 0 {
		return DefaultWindowState()
	}
	// X 和 Y 为 -1 表示使用系统默认值，这是有效的
	if state.X >= 0 && state.Y >= 0 {
		// 基本范围检查（可以根据需要调整）
		if state.X > 10000 || state.Y > 10000 {
			return DefaultWindowState()
		}
	}
	return state
}

// SettingsService 设置服务
type SettingsService struct {
	ctx        context.Context
	config     AppConfig
	configPath string
}

// NewSettingsService 创建设置服务
func NewSettingsService() *SettingsService {
	configDir, _ := os.UserConfigDir()
	configPath := filepath.Join(configDir, "md-reader", "config.json")

	return &SettingsService{
		config:     DefaultAppConfig(),
		configPath: configPath,
	}
}

// SetContext 设置上下文
func (s *SettingsService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// Load 加载配置
func (s *SettingsService) Load() error {
	data, err := os.ReadFile(s.configPath)
	if err != nil {
		if os.IsNotExist(err) {
			// 文件不存在，使用默认配置
			s.config = DefaultAppConfig()
			return nil
		}
		return err
	}

	var config AppConfig
	if err := json.Unmarshal(data, &config); err != nil {
		// JSON 解析失败，使用默认配置
		s.config = DefaultAppConfig()
		return nil
	}

	// 设置加载的配置
	s.config.Settings = config.Settings
	// 验证窗口状态是否有效
	s.config.WindowState = ValidateWindowState(config.WindowState)
	return nil
}

// Save 保存配置
func (s *SettingsService) Save() error {
	// 确保目录存在
	dir := filepath.Dir(s.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s.config, "", "  ")
	if err != nil {
		return err
	}

	// 使用 0600 权限，只有所有者可读写（安全）
	return os.WriteFile(s.configPath, data, 0600)
}

// GetSettings 获取设置
func (s *SettingsService) GetSettings() Settings {
	return s.config.Settings
}

// SaveSettings 保存设置
func (s *SettingsService) SaveSettings(settings Settings) error {
	s.config.Settings = settings
	return s.Save()
}

// GetWindowState 获取窗口状态
func (s *SettingsService) GetWindowState() WindowState {
	return s.config.WindowState
}

// SaveWindowState 保存窗口状态
func (s *SettingsService) SaveWindowState(state WindowState) error {
	s.config.WindowState = state
	return s.Save()
}

// SetConfigPath 设置配置文件路径（用于测试）
func (s *SettingsService) SetConfigPath(path string) {
	s.configPath = path
}

// AddRecentFile 添加最近打开的文件
func (s *SettingsService) AddRecentFile(filePath string) error {
	// 去除已存在的相同路径
	var newRecentFiles []string
	for _, f := range s.config.Settings.RecentFiles {
		if f != filePath {
			newRecentFiles = append(newRecentFiles, f)
		}
	}
	// 添加到最前面
	newRecentFiles = append([]string{filePath}, newRecentFiles...)
	// 限制数量
	if len(newRecentFiles) > MaxRecentFiles {
		newRecentFiles = newRecentFiles[:MaxRecentFiles]
	}
	s.config.Settings.RecentFiles = newRecentFiles
	return s.Save()
}

// GetRecentFiles 获取最近打开的文件列表
func (s *SettingsService) GetRecentFiles() []string {
	return s.config.Settings.RecentFiles
}

// ClearRecentFiles 清除最近文件记录
func (s *SettingsService) ClearRecentFiles() error {
	s.config.Settings.RecentFiles = []string{}
	return s.Save()
}

// AddBookmark 添加书签
func (s *SettingsService) AddBookmark(filePath string) error {
	// 检查是否已存在
	for _, b := range s.config.Settings.Bookmarks {
		if b == filePath {
			return nil // 已存在，不重复添加
		}
	}
	s.config.Settings.Bookmarks = append(s.config.Settings.Bookmarks, filePath)
	return s.Save()
}

// RemoveBookmark 移除书签
func (s *SettingsService) RemoveBookmark(filePath string) error {
	var newBookmarks []string
	for _, b := range s.config.Settings.Bookmarks {
		if b != filePath {
			newBookmarks = append(newBookmarks, b)
		}
	}
	s.config.Settings.Bookmarks = newBookmarks
	return s.Save()
}

// GetBookmarks 获取书签列表
func (s *SettingsService) GetBookmarks() []string {
	return s.config.Settings.Bookmarks
}

// IsBookmarked 检查文件是否已收藏
func (s *SettingsService) IsBookmarked(filePath string) bool {
	for _, b := range s.config.Settings.Bookmarks {
		if b == filePath {
			return true
		}
	}
	return false
}

// SaveReadingProgress 保存阅读进度
func (s *SettingsService) SaveReadingProgress(filePath string, scrollPosition int) error {
	if s.config.Settings.ReadingProgress == nil {
		s.config.Settings.ReadingProgress = make(map[string]int)
	}
	s.config.Settings.ReadingProgress[filePath] = scrollPosition
	return s.Save()
}

// GetReadingProgress 获取阅读进度
func (s *SettingsService) GetReadingProgress(filePath string) int {
	if s.config.Settings.ReadingProgress == nil {
		return 0
	}
	return s.config.Settings.ReadingProgress[filePath]
}
