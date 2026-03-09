// MD Reader 主应用
import { FileTree } from './components/FileTree.js';
import { DocumentRenderer } from './components/DocumentRenderer.js';
import { OutlinePanel } from './components/OutlinePanel.js';
import { ThemeManager } from './components/ThemeManager.js';

class App {
    constructor() {
            this.fileTree = null;
            this.renderer = null;
            this.outline = null;
            this.themeManager = null;
            this.currentFile = null;
            this._menuEventsBound = false;

            // 搜索功能
            this.searchQuery = '';
            this.searchMatches = [];
            this.currentMatchIndex = -1;
            this.searchOptions = {
                caseSensitive: false,
                wholeWord: false,
                regex: false
            };

            // 书签功能
            this.bookmarks = [];

            // 阅读进度
            this.progressSaveTimer = null;

            // 事件处理器存储（用于清理）
            this._eventHandlers = {
                linkClick: null,
                imageClick: null,
                imageModalClose: null,
                imageModalEsc: null,
                dragenter: null,
                dragover: null,
                dragleave: null,
                drop: null,
                scrollSave: null
            };
        }

    async init() {
        // 初始化组件 - 传递 this 给 FileTree
        this.fileTree = new FileTree(document.getElementById('file-tree'), this);
        this.renderer = new DocumentRenderer(document.getElementById('document-content'));
        this.outline = new OutlinePanel(document.getElementById('outline-content'));
        this.themeManager = new ThemeManager();

        // 绑定事件
        this.bindEvents();
        
        // 绑定搜索事件
        this.bindSearchEvents();

        // 设置文档内链接处理（事件委托）
        this.setupLinkHandler();
        
        // 设置图片点击事件
        this.setupImageClickHandler();
        
        // 设置拖放功能
        this.setupDragDrop();

        // 加载设置
        await this.loadSettings();
        
        // 加载最近文件
        await this.loadRecentFiles();
        
        // 加载书签
        await this.loadBookmarks();

        // 检查是否有初始文件（通过文件关联打开）
        await this.loadInitialFile();

        console.log('MD Reader initialized');
    }

    bindEvents() {
        // 打开文件按钮
        document.getElementById('btn-open-file')?.addEventListener('click', () => this.openFile());

        // 打开文件夹按钮
        document.getElementById('btn-open-folder')?.addEventListener('click', () => this.openFolder());
        document.getElementById('btn-open-folder-main')?.addEventListener('click', () => this.openFolder());

        // 侧边栏切换
        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const expandBtn = document.getElementById('btn-expand-sidebar');
            sidebar.classList.add('collapsed');
            expandBtn.style.display = 'flex';
        });

        // 侧边栏展开
        document.getElementById('btn-expand-sidebar')?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const expandBtn = document.getElementById('btn-expand-sidebar');
            sidebar.classList.remove('collapsed');
            expandBtn.style.display = 'none';
        });

        // 大纲面板切换
        document.getElementById('btn-toggle-outline')?.addEventListener('click', () => {
            const outline = document.getElementById('outline-panel');
            const expandBtn = document.getElementById('btn-expand-outline');
            outline.classList.add('collapsed');
            expandBtn.style.display = 'flex';
        });

        // 大纲面板展开
        document.getElementById('btn-expand-outline')?.addEventListener('click', () => {
            const outline = document.getElementById('outline-panel');
            const expandBtn = document.getElementById('btn-expand-outline');
            outline.classList.remove('collapsed');
            expandBtn.style.display = 'none';
        });

        // 大纲点击事件
        this.outline.onItemClick((headingId) => {
            const element = document.getElementById(headingId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 菜单事件监听
        this.bindMenuEvents();
        
        // 清除最近文件按钮
        document.getElementById('btn-clear-recent')?.addEventListener('click', () => this.clearRecentFiles());
        
        // 书签按钮
        document.getElementById('btn-toggle-bookmark')?.addEventListener('click', () => this.toggleBookmark());
    }
    
    // 绑定搜索相关事件
    bindSearchEvents() {
        const searchInput = document.getElementById('search-input');
        const searchCount = document.getElementById('search-count');
        const btnSearchPrev = document.getElementById('btn-search-prev');
        const btnSearchNext = document.getElementById('btn-search-next');
        const btnSearchClose = document.getElementById('btn-search-close');
        const btnSearchOptions = document.getElementById('btn-search-options');
        const optionsPanel = document.getElementById('search-options-panel');
        
        // 输入搜索内容
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.performSearch();
        });
        
        // 搜索框回车
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    this.prevSearchMatch();
                } else {
                    this.nextSearchMatch();
                }
            }
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
        
        // 上一个
        btnSearchPrev?.addEventListener('click', () => this.prevSearchMatch());
        
        // 下一个
        btnSearchNext?.addEventListener('click', () => this.nextSearchMatch());
        
        // 关闭搜索
        btnSearchClose?.addEventListener('click', () => this.closeSearch());
        
        // 搜索选项按钮 - 优化事件监听
        let optionsPanelCloseHandler = null;
        btnSearchOptions?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = optionsPanel.classList.toggle('show');
            
            // 移除旧的监听器
            if (optionsPanelCloseHandler) {
                document.removeEventListener('click', optionsPanelCloseHandler);
                optionsPanelCloseHandler = null;
            }
            
            // 只在面板打开时添加监听器
            if (isShown) {
                optionsPanelCloseHandler = (e) => {
                    if (!optionsPanel.contains(e.target) && e.target !== btnSearchOptions) {
                        optionsPanel.classList.remove('show');
                        document.removeEventListener('click', optionsPanelCloseHandler);
                        optionsPanelCloseHandler = null;
                    }
                };
                // 延迟添加，避免立即触发
                setTimeout(() => {
                    if (optionsPanelCloseHandler) {
                        document.addEventListener('click', optionsPanelCloseHandler);
                    }
                }, 0);
            }
        });
        
        // 搜索选项变化
        document.getElementById('search-case-sensitive')?.addEventListener('change', (e) => {
            this.searchOptions.caseSensitive = e.target.checked;
            this.performSearch();
        });
        
        document.getElementById('search-whole-word')?.addEventListener('change', (e) => {
            this.searchOptions.wholeWord = e.target.checked;
            this.performSearch();
        });
        
        document.getElementById('search-regex')?.addEventListener('change', (e) => {
            this.searchOptions.regex = e.target.checked;
            this.performSearch();
        });
    }
    
    // 执行搜索
    performSearch() {
        // 清除之前的搜索高亮
        this.clearSearchHighlight();
        
        const searchCount = document.getElementById('search-count');
        
        if (!this.searchQuery.trim()) {
            searchCount.textContent = '';
            this.searchMatches = [];
            this.currentMatchIndex = -1;
            return;
        }
        
        const content = document.getElementById('document-content');
        
        // 使用 TreeWalker 遍历所有文本节点
        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // 跳过脚本和样式标签
                    if (node.parentElement.tagName === 'SCRIPT' || 
                        node.parentElement.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const matches = [];
        let searchPattern;
        
        try {
            if (this.searchOptions.regex) {
                // 正则表达式搜索
                const flags = this.searchOptions.caseSensitive ? 'g' : 'gi';
                searchPattern = new RegExp(this.searchQuery, flags);
            } else {
                // 普通搜索
                let pattern = this.escapeRegex(this.searchQuery);
                
                if (this.searchOptions.wholeWord) {
                    pattern = `\\b${pattern}\\b`;
                }
                
                const flags = this.searchOptions.caseSensitive ? 'g' : 'gi';
                searchPattern = new RegExp(pattern, flags);
            }
        } catch (e) {
            // 正则表达式错误
            searchCount.textContent = '正则错误';
            return;
        }
        
        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent;
            let match;
            
            // 重置正则表达式的lastIndex
            searchPattern.lastIndex = 0;
            
            while ((match = searchPattern.exec(text)) !== null) {
                matches.push({
                    node: node,
                    index: match.index,
                    length: match[0].length
                });
                
                // 防止无限循环（零宽度匹配）
                if (match.index === searchPattern.lastIndex) {
                    searchPattern.lastIndex++;
                }
            }
        }
        
        this.searchMatches = matches;
        
        if (matches.length > 0) {
            this.currentMatchIndex = 0;
            this.highlightSearchMatches();
            this.scrollToCurrentMatch();
        }
        
        // 更新匹配数量显示
        if (this.searchQuery.trim()) {
            searchCount.textContent = matches.length > 0 ? `${this.currentMatchIndex + 1}/${matches.length}` : '0/0';
        } else {
            searchCount.textContent = '';
        }
    }
    
    // 转义正则表达式特殊字符
    escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    
    // 清除搜索高亮
    clearSearchHighlight() {
        const content = document.getElementById('document-content');
        const highlighted = content.querySelectorAll('.search-highlight, .search-current');
        highlighted.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });
    }
    
    // 高亮所有匹配
    highlightSearchMatches() {
        // 清除旧高亮
        this.clearSearchHighlight();
        
        if (this.searchMatches.length === 0) return;
        
        // 从后往前处理，避免索引变化
        for (let i = this.searchMatches.length - 1; i >= 0; i--) {
            const match = this.searchMatches[i];
            const node = match.node;
            const text = node.textContent;
            
            // 分割文本节点
            const before = text.substring(0, match.index);
            const matchText = text.substring(match.index, match.index + match.length);
            const after = text.substring(match.index + match.length);
            
            // 创建高亮元素
            const span = document.createElement('span');
            span.className = i === this.currentMatchIndex ? 'search-current' : 'search-highlight';
            span.textContent = matchText;
            
            // 替换文本节点
            const parent = node.parentNode;
            if (parent) {
                const fragment = document.createDocumentFragment();
                if (before) fragment.appendChild(document.createTextNode(before));
                fragment.appendChild(span);
                if (after) fragment.appendChild(document.createTextNode(after));
                
                parent.replaceChild(fragment, node);
                
                // 更新匹配对象的引用
                this.searchMatches[i].element = span;
            }
        }
    }
    
    // 滚动到当前匹配
    scrollToCurrentMatch() {
        if (this.searchMatches.length === 0 || this.currentMatchIndex < 0) return;
        
        const match = this.searchMatches[this.currentMatchIndex];
        
        // 如果有高亮元素，直接滚动到它
        if (match.element) {
            match.element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // 更新高亮样式
            const allHighlights = document.querySelectorAll('.search-highlight, .search-current');
            allHighlights.forEach(el => {
                el.className = 'search-highlight';
            });
            match.element.className = 'search-current';
        }
    }
    
    // 下一个匹配
    nextSearchMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
        this.scrollToCurrentMatch();
        
        document.getElementById('search-count').textContent = 
            `${this.currentMatchIndex + 1}/${this.searchMatches.length}`;
    }
    
    // 上一个匹配
    prevSearchMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
        this.scrollToCurrentMatch();
        
        document.getElementById('search-count').textContent = 
            `${this.currentMatchIndex + 1}/${this.searchMatches.length}`;
    }
    
    // 关闭搜索
    closeSearch() {
        const searchInput = document.getElementById('search-input');
        searchInput.value = '';
        searchInput.blur();
        this.searchQuery = '';
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.clearSearchHighlight();
        document.getElementById('search-count').textContent = '';
    }
    
    // 设置图片点击放大
    setupImageClickHandler() {
            const content = document.getElementById('document-content');
            const modal = document.getElementById('image-modal');
            const modalImg = document.getElementById('image-modal-img');

            // 移除旧的事件监听器
            if (this._eventHandlers.imageClick) {
                content.removeEventListener('click', this._eventHandlers.imageClick);
            }
            if (this._eventHandlers.imageModalClose) {
                modal.removeEventListener('click', this._eventHandlers.imageModalClose);
            }
            if (this._eventHandlers.imageModalEsc) {
                document.removeEventListener('keydown', this._eventHandlers.imageModalEsc);
            }

            // 图片点击事件
            this._eventHandlers.imageClick = (e) => {
                const img = e.target.closest('img');
                if (img) {
                    e.preventDefault();
                    e.stopPropagation();
                    modalImg.src = img.src;
                    modal.classList.add('active');
                }
            };
            content?.addEventListener('click', this._eventHandlers.imageClick);

            // 点击关闭
            this._eventHandlers.imageModalClose = () => {
                modal.classList.remove('active');
            };
            modal?.addEventListener('click', this._eventHandlers.imageModalClose);

            // ESC 关闭
            this._eventHandlers.imageModalEsc = (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            };
            document.addEventListener('keydown', this._eventHandlers.imageModalEsc);
        }
    
    // 设置拖放功能
    setupDragDrop() {
            const dropZone = document.getElementById('app');
            const dropOverlay = document.createElement('div');
            dropOverlay.className = 'drop-overlay';
            dropOverlay.innerHTML = `
                <div class="drop-overlay-content">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <p>拖放文件到这里打开</p>
                    <span>支持 .md, .markdown, .txt, .html 文件</span>
                </div>
            `;
            document.body.appendChild(dropOverlay);

            let dragCounter = 0;

            // 移除旧的事件监听器
            if (this._eventHandlers.dragenter) {
                dropZone.removeEventListener('dragenter', this._eventHandlers.dragenter);
            }
            if (this._eventHandlers.dragover) {
                dropZone.removeEventListener('dragover', this._eventHandlers.dragover);
            }
            if (this._eventHandlers.dragleave) {
                dropZone.removeEventListener('dragleave', this._eventHandlers.dragleave);
            }
            if (this._eventHandlers.drop) {
                dropZone.removeEventListener('drop', this._eventHandlers.drop);
            }

            // 拖入窗口
            this._eventHandlers.dragenter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter++;
                if (dragCounter === 1) {
                    dropOverlay.classList.add('active');
                }
            };
            dropZone.addEventListener('dragenter', this._eventHandlers.dragenter);

            // 在窗口内拖动
            this._eventHandlers.dragover = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };
            dropZone.addEventListener('dragover', this._eventHandlers.dragover);

            // 拖出窗口
            this._eventHandlers.dragleave = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter--;
                if (dragCounter === 0) {
                    dropOverlay.classList.remove('active');
                }
            };
            dropZone.addEventListener('dragleave', this._eventHandlers.dragleave);

            // 放下文件
            this._eventHandlers.drop = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter = 0;
                dropOverlay.classList.remove('active');

                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    const file = files[0];
                    // Electron/Wails 提供 path 属性
                    const filePath = file.path;

                    if (filePath) {
                        // 检查文件类型
                        const ext = filePath.split('.').pop().toLowerCase();
                        const supportedExts = ['md', 'markdown', 'txt', 'html', 'htm'];

                        if (supportedExts.includes(ext)) {
                            await this.loadFile(filePath);
                        } else {
                            alert('不支持的文件格式，仅支持 .md、.markdown、.txt、.html、.htm 文件');
                        }
                    } else {
                        alert('无法获取文件路径');
                    }
                }
            };
            dropZone.addEventListener('drop', this._eventHandlers.drop);
        }

    bindMenuEvents() {
        if (window.runtime) {
            // 检查是否已经绑定过，避免重复绑定
            if (this._menuEventsBound) {
                return;
            }
            this._menuEventsBound = true;

            window.runtime.EventsOn('menu:open-file', () => this.openFile());
            window.runtime.EventsOn('menu:open-folder', () => this.openFolder());
            window.runtime.EventsOn('menu:set-theme', (theme) => this.themeManager.setTheme(theme));
            window.runtime.EventsOn('menu:set-mode', (mode) => this.themeManager.setMode(mode));
            window.runtime.EventsOn('menu:font-increase', () => this.themeManager.increaseFontSize());
            window.runtime.EventsOn('menu:font-decrease', () => this.themeManager.decreaseFontSize());
            window.runtime.EventsOn('menu:toggle-fullscreen', () => this.toggleFullscreen());
            window.runtime.EventsOn('menu:print', () => this.printDocument());
            window.runtime.EventsOn('menu:export-pdf', () => this.exportToPDF());
            window.runtime.EventsOn('menu:export-html', () => this.exportToHTML());
            window.runtime.EventsOn('menu:copy-text', () => this.copyAsText());
        }
    }

    toggleFullscreen() {
        if (window.runtime) {
            window.runtime.WindowToggleMaximise();
        }
    }

    async loadSettings() {
        try {
            if (window.go?.main?.SettingsService) {
                const settings = await window.go.main.SettingsService.GetSettings();
                // 直接应用设置，不保存（避免启动时无意义保存）
                this.themeManager.applySettings(settings.theme || 'github', settings.mode || 'light', settings.fontSize || 16);
            } else {
                // 默认设置
                this.themeManager.applySettings('github', 'light', 16);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            // 出错时使用默认设置，不保存
            this.themeManager.applySettings('github', 'light', 16);
        }
    }
    
    // 加载初始文件（通过文件关联打开）
    async loadInitialFile() {
        try {
            if (window.go?.main?.App) {
                const initialFile = await window.go.main.App.GetInitialFile();
                if (initialFile) {
                    console.log('Loading initial file:', initialFile);
                    await this.loadFile(initialFile);
                }
            }
        } catch (err) {
            console.error('Failed to load initial file:', err);
        }
    }
    
    // 加载最近文件
    async loadRecentFiles() {
        try {
            if (window.go?.main?.SettingsService) {
                const recentFiles = await window.go.main.SettingsService.GetRecentFiles();
                this.renderRecentFiles(recentFiles);
            }
        } catch (err) {
            console.error('Failed to load recent files:', err);
        }
    }
    
    // 渲染最近文件列表
    renderRecentFiles(files) {
        const list = document.getElementById('recent-files-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (!files || files.length === 0) {
            list.innerHTML = '<li class="recent-file-item" style="color: var(--text-muted); font-size: 12px;">暂无最近文件</li>';
            return;
        }
        
        files.forEach(filePath => {
            const li = document.createElement('li');
            li.className = 'recent-file-item';
            li.title = filePath;
            
            const fileName = filePath.split(/[\\/]/).pop();
            const icon = this.getFileIcon(fileName);
            
            li.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name">${fileName}</span>`;
            
            li.addEventListener('click', () => this.loadFile(filePath));
            
            list.appendChild(li);
        });
    }
    
    // 获取文件图标
    getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['md', 'markdown'].includes(ext)) return '📝';
        if (['txt'].includes(ext)) return '📄';
        if (['html', 'htm'].includes(ext)) return '🌐';
        return '📄';
    }
    
    // 清除最近文件
    async clearRecentFiles() {
        try {
            if (window.go?.main?.SettingsService) {
                await window.go.main.SettingsService.ClearRecentFiles();
                this.renderRecentFiles([]);
            }
        } catch (err) {
            console.error('Failed to clear recent files:', err);
        }
    }
    
    // 加载书签
    async loadBookmarks() {
        try {
            if (window.go?.main?.SettingsService) {
                this.bookmarks = await window.go.main.SettingsService.GetBookmarks();
                this.renderBookmarks(this.bookmarks);
                this.updateBookmarkButton();
            }
        } catch (err) {
            console.error('Failed to load bookmarks:', err);
        }
    }
    
    // 渲染书签列表
    renderBookmarks(bookmarks) {
        const list = document.getElementById('bookmarks-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (!bookmarks || bookmarks.length === 0) {
            list.innerHTML = '<li class="bookmark-item" style="color: var(--text-muted); font-size: 12px;">暂无书签</li>';
            return;
        }
        
        bookmarks.forEach(filePath => {
            const li = document.createElement('li');
            li.className = 'bookmark-item';
            li.title = filePath;
            
            const fileName = filePath.split(/[\\/]/).pop();
            const icon = this.getFileIcon(fileName);
            
            li.innerHTML = `
                <span class="file-icon">${icon}</span>
                <span class="file-name">${fileName}</span>
                <button class="btn-remove-bookmark" title="移除书签">✕</button>
            `;
            
            // 点击打开文件
            li.querySelector('.file-name').addEventListener('click', () => this.loadFile(filePath));
            li.querySelector('.file-icon').addEventListener('click', () => this.loadFile(filePath));
            
            // 点击移除书签
            li.querySelector('.btn-remove-bookmark').addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.removeBookmark(filePath);
            });
            
            list.appendChild(li);
        });
    }
    
    // 切换书签状态
    async toggleBookmark() {
        if (!this.currentFile) {
            alert('请先打开一个文件');
            return;
        }
        
        const filePath = this.currentFile.path;
        
        try {
            if (window.go?.main?.SettingsService) {
                const isBookmarked = await window.go.main.SettingsService.IsBookmarked(filePath);
                
                if (isBookmarked) {
                    await window.go.main.SettingsService.RemoveBookmark(filePath);
                } else {
                    await window.go.main.SettingsService.AddBookmark(filePath);
                }
                
                await this.loadBookmarks();
            }
        } catch (err) {
            console.error('Failed to toggle bookmark:', err);
        }
    }
    
    // 移除书签
    async removeBookmark(filePath) {
        try {
            if (window.go?.main?.SettingsService) {
                await window.go.main.SettingsService.RemoveBookmark(filePath);
                await this.loadBookmarks();
            }
        } catch (err) {
            console.error('Failed to remove bookmark:', err);
        }
    }
    
    // 更新书签按钮状态
    async updateBookmarkButton() {
        const btn = document.getElementById('btn-toggle-bookmark');
        if (!btn || !this.currentFile) return;
        
        try {
            if (window.go?.main?.SettingsService) {
                const isBookmarked = await window.go.main.SettingsService.IsBookmarked(this.currentFile.path);
                
                if (isBookmarked) {
                    btn.classList.add('bookmarked');
                    btn.title = '取消收藏';
                } else {
                    btn.classList.remove('bookmarked');
                    btn.title = '收藏此文件';
                }
            }
        } catch (err) {
            console.error('Failed to update bookmark button:', err);
        }
    }
    
    // 恢复阅读进度
    async restoreReadingProgress() {
        if (!this.currentFile) return;
        
        try {
            if (window.go?.main?.SettingsService) {
                const scrollPosition = await window.go.main.SettingsService.GetReadingProgress(this.currentFile.path);
                
                if (scrollPosition > 0) {
                    const content = document.getElementById('document-content');
                    // 延迟恢复，确保内容已渲染
                    setTimeout(() => {
                        content.scrollTop = scrollPosition;
                    }, 100);
                }
            }
        } catch (err) {
            console.error('Failed to restore reading progress:', err);
        }
    }
    
    // 开始保存阅读进度
    startSavingProgress() {
            // 清除之前的定时器
            if (this.progressSaveTimer) {
                clearInterval(this.progressSaveTimer);
            }

            const content = document.getElementById('document-content');
            if (!content) return;

            // 移除旧的滚动监听器
            if (this._eventHandlers.scrollSave) {
                content.removeEventListener('scroll', this._eventHandlers.scrollSave);
            }

            // 监听滚动事件，防抖保存
            let saveTimeout;
            this._eventHandlers.scrollSave = () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.saveReadingProgress();
                }, 1000); // 1秒后保存
            };
            content.addEventListener('scroll', this._eventHandlers.scrollSave);
        }

    // 清理事件监听器（防止内存泄漏）
    cleanup() {
        const content = document.getElementById('document-content');
        const modal = document.getElementById('image-modal');
        const dropZone = document.getElementById('app');

        // 清理链接点击事件
        if (this._eventHandlers.linkClick && content) {
            content.removeEventListener('click', this._eventHandlers.linkClick);
        }

        // 清理图片点击事件
        if (this._eventHandlers.imageClick && content) {
            content.removeEventListener('click', this._eventHandlers.imageClick);
        }
        if (this._eventHandlers.imageModalClose && modal) {
            modal.removeEventListener('click', this._eventHandlers.imageModalClose);
        }
        if (this._eventHandlers.imageModalEsc) {
            document.removeEventListener('keydown', this._eventHandlers.imageModalEsc);
        }

        // 清理拖放事件
        if (dropZone) {
            if (this._eventHandlers.dragenter) {
                dropZone.removeEventListener('dragenter', this._eventHandlers.dragenter);
            }
            if (this._eventHandlers.dragover) {
                dropZone.removeEventListener('dragover', this._eventHandlers.dragover);
            }
            if (this._eventHandlers.dragleave) {
                dropZone.removeEventListener('dragleave', this._eventHandlers.dragleave);
            }
            if (this._eventHandlers.drop) {
                dropZone.removeEventListener('drop', this._eventHandlers.drop);
            }
        }

        // 清理滚动保存事件
        if (this._eventHandlers.scrollSave && content) {
            content.removeEventListener('scroll', this._eventHandlers.scrollSave);
        }

        // 清理定时器
        if (this.progressSaveTimer) {
            clearInterval(this.progressSaveTimer);
        }

        console.log('事件监听器已清理');
    }

    
    // 保存阅读进度
    async saveReadingProgress() {
        if (!this.currentFile) return;
        
        const content = document.getElementById('document-content');
        if (!content) return;
        
        const scrollPosition = content.scrollTop;
        
        try {
            if (window.go?.main?.SettingsService) {
                await window.go.main.SettingsService.SaveReadingProgress(this.currentFile.path, scrollPosition);
            }
        } catch (err) {
            console.error('Failed to save reading progress:', err);
        }
    }

    async openFile() {
        try {
            if (window.go?.main?.FileService) {
                const result = await window.go.main.FileService.OpenFile();
                if (result.error) {
                    if (result.error !== '未选择文件') {
                        alert(result.error);
                    }
                    return;
                }
                this.renderDocument(result);
                // 刷新最近文件
                this.loadRecentFiles();
            }
        } catch (err) {
            console.error('Failed to open file:', err);
        }
    }

    async openFolder() {
        try {
            if (window.go?.main?.FileService) {
                const result = await window.go.main.FileService.OpenFolder();
                if (result.error) {
                    if (result.error !== '未选择文件夹') {
                        alert(result.error);
                    }
                    return;
                }
                this.fileTree.render(result.tree);
            }
        } catch (err) {
            console.error('Failed to open folder:', err);
        }
    }

    async loadFile(filePath) {
        console.log('loadFile 被调用:', filePath);
        try {
            console.log('检查 FileService:', !!window.go, !!window.go?.main, !!window.go?.main?.FileService);
            if (window.go?.main?.FileService) {
                console.log('调用 ReadFile...');
                const result = await window.go.main.FileService.ReadFile(filePath);
                console.log('ReadFile 返回:', result);
                if (result.error) {
                    console.error('读取文件失败:', result.error);
                    return;
                }
                console.log('准备渲染文档...');
                this.renderDocument(result);
                console.log('渲染完成');
                
                // 添加到最近文件
                if (window.go?.main?.SettingsService) {
                    try {
                        await window.go.main.SettingsService.AddRecentFile(filePath);
                        // 刷新最近文件列表
                        this.loadRecentFiles();
                    } catch (err) {
                        console.error('添加最近文件失败:', err);
                    }
                }
            } else {
                console.error('FileService 不可用');
            }
        } catch (err) {
            console.error('加载文件失败:', err);
        }
    }

    renderDocument(fileResult) {
        this.currentFile = fileResult;
        this.renderer.render(fileResult.content, fileResult.fileType);

        // 更新大纲
        const contentElement = document.getElementById('document-content');
        this.outline.generate(contentElement);
        
        // 更新字数统计
        this.updateWordCount(fileResult.content);
        
        // 清除搜索
        this.closeSearch();
        
        // 更新书签按钮状态
        this.updateBookmarkButton();
        
        // 恢复阅读进度
        this.restoreReadingProgress();
        
        // 开始保存阅读进度
        this.startSavingProgress();
    }
    
    // 更新字数统计
    updateWordCount(content) {
        if (!content) {
            document.getElementById('word-count').textContent = '字数: 0';
            document.getElementById('char-count').textContent = '字符: 0';
            document.getElementById('line-count').textContent = '行数: 0';
            return;
        }
        
        // 中文字数
        const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        // 英文字数
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        // 总字符数
        const totalChars = content.length;
        // 行数
        const lines = content.split('\n').length;
        
        document.getElementById('word-count').textContent = `字数: ${chineseChars + englishWords}`;
        document.getElementById('char-count').textContent = `字符: ${totalChars}`;
        document.getElementById('line-count').textContent = `行数: ${lines}`;
    }
    
    // 打印文档
    printDocument() {
            if (!this.currentFile) {
                alert('请先打开一个文件');
                return;
            }

            // 直接使用浏览器打印功能
            // CSS中的 @media print 会自动处理打印样式
            window.print();
        }

    // 在 init 中设置事件委托，只需要设置一次
    setupLinkHandler() {
            const contentElement = document.getElementById('document-content');
            const self = this; // 保存 this 引用

            // 移除旧的事件监听器
            if (this._eventHandlers.linkClick) {
                contentElement.removeEventListener('click', this._eventHandlers.linkClick);
            }

            // 创建新的事件处理器
            this._eventHandlers.linkClick = async function (e) {
                // 查找被点击的链接
                const link = e.target.closest('a');
                if (!link) return;

                // 获取原始 href 属性
                const href = link.getAttribute('href');
                console.log('=== 链接点击事件 ===');
                console.log('原始 href:', href);

                if (!href) return;

                // 阻止默认行为
                e.preventDefault();
                e.stopPropagation();

                // 跳过外部链接
                if (href.startsWith('http://') || href.startsWith('https://')) {
                    console.log('外部链接，打开新窗口');
                    window.open(href, '_blank');
                    return;
                }

                // 处理锚点链接（只有 # 开头）
                if (href.startsWith('#')) {
                    const targetId = href.substring(1);
                    console.log('锚点链接，目标ID:', targetId);
                    const target = document.getElementById(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    return;
                }

                // 检查是否是 .md 文件链接
                const isMdLink = href.includes('.md');
                console.log('是否为 MD 链接:', isMdLink);

                if (isMdLink) {
                    const currentFilePath = self.currentFile?.path;
                    console.log('当前文件路径:', currentFilePath);
                    console.log('currentFile 对象:', self.currentFile);

                    if (!currentFilePath) {
                        console.warn('当前文件路径为空，无法处理相对链接');
                        alert('无法处理链接：当前文件路径未知');
                        return;
                    }

                    // 解析链接中的锚点
                    let filePath = href;
                    let anchor = null;
                    const hashIndex = href.indexOf('#');
                    if (hashIndex !== -1) {
                        filePath = href.substring(0, hashIndex);
                        anchor = href.substring(hashIndex + 1);
                    }
                    console.log('文件路径:', filePath, '锚点:', anchor);

                    // 处理 URL 编码的文件名
                    try {
                        filePath = decodeURIComponent(filePath);
                    } catch (e) {
                        console.log('URL 解码失败，使用原始路径');
                    }

                    // 使用 path.join 兼容不同操作系统的路径分隔符
                    // 先获取当前文件所在目录
                    const pathSeparator = currentFilePath.includes('/') ? '/' : '\\';
                    const lastSepIndex = Math.max(currentFilePath.lastIndexOf('/'), currentFilePath.lastIndexOf('\\'));
                    const currentDir = currentFilePath.substring(0, lastSepIndex + 1);
                    console.log('当前目录:', currentDir);
                    console.log('路径分隔符:', pathSeparator);

                    let absolutePath;

                    if (filePath.startsWith('./')) {
                        absolutePath = currentDir + filePath.substring(2);
                    } else if (filePath.startsWith('../')) {
                        let dir = currentDir.replace(/[\\/]+$/, ''); // 移除末尾的分隔符
                        let path = filePath;
                        while (path.startsWith('../')) {
                            const lastSep = Math.max(dir.lastIndexOf('/'), dir.lastIndexOf('\\'));
                            if (lastSep === -1) break; // 防止越界
                            dir = dir.substring(0, lastSep);
                            path = path.substring(3);
                        }
                        absolutePath = dir + pathSeparator + path;
                    } else {
                        absolutePath = currentDir + filePath;
                    }

                    // 标准化路径：解析 .. 和 . 并处理路径分隔符
                    absolutePath = absolutePath.replace(/[\\/]+/g, pathSeparator);

                    console.log('计算出的绝对路径:', absolutePath);

                    try {
                        await self.loadFile(absolutePath);
                        console.log('文件加载成功');

                        // 滚动到顶部
                        contentElement.scrollTop = 0;

                        // 如果有锚点，滚动到对应位置
                        if (anchor) {
                            setTimeout(() => {
                                const target = document.getElementById(anchor);
                                if (target) {
                                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 200);
                        }
                    } catch (err) {
                        console.error('加载链接文件失败:', err);
                        alert('加载文件失败: ' + err.message);
                    }
                } else {
                    console.log('非 MD 链接，忽略');
                }
            };

            contentElement.addEventListener('click', this._eventHandlers.linkClick);
        }

    handleKeyboard(e) {
        // Ctrl+O: 打开文件
        if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
            e.preventDefault();
            this.openFile();
        }
        // Ctrl+Shift+O: 打开文件夹
        if (e.ctrlKey && e.shiftKey && e.key === 'O') {
            e.preventDefault();
            this.openFolder();
        }
        // Ctrl+F: 搜索
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('search-input').focus();
            document.getElementById('search-input').select();
        }
        // Ctrl+P: 打印
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            this.printDocument();
        }
        // Ctrl+E: 导出PDF
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            this.exportToPDF();
        }
    }
    
    // 导出为 PDF
    exportToPDF() {
        if (!this.currentFile) {
            alert('请先打开一个文件');
            return;
        }
        
        // 使用浏览器打印功能导出PDF
        window.print();
    }
    
    // 导出为 HTML
    async exportToHTML() {
        if (!this.currentFile) {
            alert('请先打开一个文件');
            return;
        }
        
        const content = document.getElementById('document-content');
        const markdownBody = content.querySelector('.markdown-body');
        
        if (!markdownBody) {
            alert('没有可导出的内容');
            return;
        }
        
        // 获取当前主题样式
        const themeCSS = this.getThemeCSS();
        
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentFile.name}</title>
    <style>
        body {
            max-width: 860px;
            margin: 40px auto;
            padding: 0 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
        ${themeCSS}
    </style>
</head>
<body>
    <div class="markdown-body">
        ${markdownBody.innerHTML}
    </div>
</body>
</html>`;
        
        // 创建 Blob 并下载
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.name.replace(/\.[^.]+$/, '.html');
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // 复制为纯文本
    copyAsText() {
        if (!this.currentFile) {
            alert('请先打开一个文件');
            return;
        }
        
        const content = document.getElementById('document-content');
        const text = content.innerText || content.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            // 显示提示
            this.showToast('已复制到剪贴板');
        }).catch(err => {
            console.error('Failed to copy text:', err);
            alert('复制失败');
        });
    }
    
    // 获取当前主题CSS
    getThemeCSS() {
        const theme = this.themeManager.currentTheme;
        const mode = this.themeManager.currentMode;
        
        // 获取主题样式表
        const themeLink = document.querySelector(`link[href*="${theme}.css"]`);
        if (!themeLink) return '';
        
        // 这里简化处理，返回基本样式
        // 实际应用中可以读取样式表内容
        return `
            /* 基本样式 */
            .markdown-body { line-height: 1.6; }
            .markdown-body h1 { font-size: 2em; margin: 0.67em 0; }
            .markdown-body h2 { font-size: 1.5em; margin: 0.75em 0; }
            .markdown-body h3 { font-size: 1.25em; margin: 0.83em 0; }
            .markdown-body p { margin: 1em 0; }
            .markdown-body code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            .markdown-body pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
            .markdown-body blockquote { border-left: 4px solid #ddd; padding-left: 16px; color: #666; }
            .markdown-body table { border-collapse: collapse; width: 100%; }
            .markdown-body th, .markdown-body td { border: 1px solid #ddd; padding: 8px 12px; }
            .markdown-body img { max-width: 100%; }
        `;
    }
    
    // 显示提示消息
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
