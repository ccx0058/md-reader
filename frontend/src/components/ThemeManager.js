// 主题管理器组件
export class ThemeManager {
    constructor() {
        this.currentTheme = 'github';
        this.currentMode = 'light';
        this.currentFontSize = 16;
        // 支持的主题列表
        this.themes = [
            'github', 'typora', 'marktext', 'obsidian',  // 原有主题
            'vscode', 'notepad++', 'sublime', 'jetbrains',  // 编辑器主题
            'dracula', 'nord', 'onedark', 'solarized',  // 社区主题
            'material', 'gruvbox', 'ayu'  // 新增高颜值主题
        ];
        this.modes = ['light', 'dark'];
    }

    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn(`Unknown theme: ${theme}`);
            return;
        }
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.saveSettings();
    }

    setMode(mode) {
        if (!this.modes.includes(mode)) {
            console.warn(`Unknown mode: ${mode}`);
            return;
        }
        this.currentMode = mode;
        document.documentElement.setAttribute('data-mode', mode);
        this.saveSettings();
    }

    toggleMode() {
        const newMode = this.currentMode === 'light' ? 'dark' : 'light';
        this.setMode(newMode);
    }

    setFontSize(size) {
        const fontSize = Math.max(12, Math.min(24, size));
        this.currentFontSize = fontSize;
        document.documentElement.style.setProperty('--content-font-size', `${fontSize}px`);

        const content = document.querySelector('.markdown-body');
        if (content) {
            content.style.fontSize = `${fontSize}px`;
        }
        this.saveSettings();
    }

    increaseFontSize() {
        this.setFontSize(this.currentFontSize + 2);
    }

    decreaseFontSize() {
        this.setFontSize(this.currentFontSize - 2);
    }

    getAvailableThemes() {
        return this.themes.map(theme => ({
            id: theme,
            name: this.getThemeName(theme)
        }));
    }

    getThemeName(theme) {
        const names = {
            'github': 'GitHub',
            'typora': 'Typora',
            'marktext': 'MarkText',
            'obsidian': 'Obsidian',
            'vscode': 'VS Code',
            'notepad++': 'Notepad++',
            'sublime': 'Sublime (Monokai)',
            'jetbrains': 'JetBrains',
            'dracula': 'Dracula',
            'nord': 'Nord',
            'onedark': 'One Dark',
            'solarized': 'Solarized',
            'material': 'Material',
            'gruvbox': 'Gruvbox',
            'ayu': 'Ayu'
        };
        return names[theme] || theme;
    }

    getCurrentSettings() {
        return {
            theme: this.currentTheme,
            mode: this.currentMode,
            fontSize: this.currentFontSize
        };
    }

    // 应用设置但不保存（用于加载设置时）
    applySettings(theme, mode, fontSize) {
        if (this.themes.includes(theme)) {
            this.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);
        }
        if (this.modes.includes(mode)) {
            this.currentMode = mode;
            document.documentElement.setAttribute('data-mode', mode);
        }
        const validFontSize = Math.max(12, Math.min(24, fontSize));
        this.currentFontSize = validFontSize;
        document.documentElement.style.setProperty('--content-font-size', `${validFontSize}px`);

        const content = document.querySelector('.markdown-body');
        if (content) {
            content.style.fontSize = `${validFontSize}px`;
        }
    }

    async saveSettings() {
        try {
            if (window.go?.main?.SettingsService) {
                await window.go.main.SettingsService.SaveSettings({
                    theme: this.currentTheme,
                    mode: this.currentMode,
                    fontSize: this.currentFontSize
                });
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    }

    async loadSettings() {
        try {
            if (window.go?.main?.SettingsService) {
                const settings = await window.go.main.SettingsService.GetSettings();
                this.setTheme(settings.theme);
                this.setMode(settings.mode);
                this.setFontSize(settings.fontSize);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }
}
