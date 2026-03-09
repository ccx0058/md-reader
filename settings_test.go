package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"testing/quick"
)

// Feature: md-reader, Property 6: 设置保存和加载的 Round-Trip
// For any 有效的 Settings 对象，保存后再加载应得到等价的对象
func TestSettings_RoundTrip(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "mdreader_settings_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	configPath := filepath.Join(tempDir, "config.json")

	// 测试不同的设置组合
	testCases := []Settings{
		{Theme: "github", Mode: "light", FontSize: 14},
		{Theme: "typora", Mode: "dark", FontSize: 18},
		{Theme: "marktext", Mode: "light", FontSize: 12},
		{Theme: "obsidian", Mode: "dark", FontSize: 20},
	}

	for _, original := range testCases {
		// 保存设置
		svc1 := NewSettingsService()
		svc1.SetConfigPath(configPath)
		err := svc1.SaveSettings(original)
		if err != nil {
			t.Fatalf("Failed to save settings: %v", err)
		}

		// 加载设置
		svc2 := NewSettingsService()
		svc2.SetConfigPath(configPath)
		err = svc2.Load()
		if err != nil {
			t.Fatalf("Failed to load settings: %v", err)
		}

		loaded := svc2.GetSettings()

		// 验证 Round-Trip
		if !reflect.DeepEqual(original, loaded) {
			t.Errorf("Round-trip failed: original=%+v, loaded=%+v", original, loaded)
		}

		// 清理
		os.Remove(configPath)
	}
}

// 属性测试：WindowState Round-Trip
func TestWindowState_RoundTrip(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "mdreader_settings_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	configPath := filepath.Join(tempDir, "config.json")

	testCases := []WindowState{
		{X: 0, Y: 0, Width: 800, Height: 600, IsMax: false},
		{X: 100, Y: 100, Width: 1920, Height: 1080, IsMax: true},
		{X: -10, Y: -10, Width: 1200, Height: 800, IsMax: false},
	}

	for _, original := range testCases {
		svc1 := NewSettingsService()
		svc1.SetConfigPath(configPath)
		err := svc1.SaveWindowState(original)
		if err != nil {
			t.Fatalf("Failed to save window state: %v", err)
		}

		svc2 := NewSettingsService()
		svc2.SetConfigPath(configPath)
		err = svc2.Load()
		if err != nil {
			t.Fatalf("Failed to load window state: %v", err)
		}

		loaded := svc2.GetWindowState()

		if !reflect.DeepEqual(original, loaded) {
			t.Errorf("Round-trip failed: original=%+v, loaded=%+v", original, loaded)
		}

		os.Remove(configPath)
	}
}

// 使用 quick.Check 进行属性测试
func TestSettings_RoundTrip_QuickCheck(t *testing.T) {
	themes := []string{"github", "typora", "marktext", "obsidian"}
	modes := []string{"light", "dark"}

	f := func(themeIdx, modeIdx uint8, fontSize uint8) bool {
		tempDir, _ := os.MkdirTemp("", "mdreader_test")
		defer os.RemoveAll(tempDir)
		configPath := filepath.Join(tempDir, "config.json")

		original := Settings{
			Theme:    themes[int(themeIdx)%len(themes)],
			Mode:     modes[int(modeIdx)%len(modes)],
			FontSize: int(fontSize%30) + 10, // 10-39
		}

		svc1 := NewSettingsService()
		svc1.SetConfigPath(configPath)
		svc1.SaveSettings(original)

		svc2 := NewSettingsService()
		svc2.SetConfigPath(configPath)
		svc2.Load()
		loaded := svc2.GetSettings()

		return reflect.DeepEqual(original, loaded)
	}

	if err := quick.Check(f, &quick.Config{MaxCount: 100}); err != nil {
		t.Error(err)
	}
}

// 测试配置文件不存在时使用默认值
func TestSettings_DefaultOnMissing(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "mdreader_test")
	defer os.RemoveAll(tempDir)
	configPath := filepath.Join(tempDir, "nonexistent", "config.json")

	svc := NewSettingsService()
	svc.SetConfigPath(configPath)
	err := svc.Load()

	if err != nil {
		t.Errorf("Expected no error, got: %v", err)
	}

	settings := svc.GetSettings()
	defaults := DefaultSettings()

	if !reflect.DeepEqual(settings, defaults) {
		t.Errorf("Expected defaults, got: %+v", settings)
	}
}
