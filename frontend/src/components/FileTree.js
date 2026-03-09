// 文件树组件
export class FileTree {
    constructor(container, app) {
        this.container = container;
        this.app = app; // 保存 app 引用
        this.selectedPath = null;
        this.expandedNodes = new Set();
    }

    render(treeData) {
        if (!treeData) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>打开文件夹以浏览文件</p>
                    <button id="btn-open-folder" class="btn-primary">打开文件夹</button>
                </div>
            `;
            return;
        }

        this.container.innerHTML = '';
        const treeElement = this.createTreeNode(treeData, 0);
        this.container.appendChild(treeElement);
    }

    createTreeNode(node, level) {
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-node';
        wrapper.dataset.path = node.path;

        const item = document.createElement('div');
        item.className = 'tree-item';
        item.style.paddingLeft = `${12 + level * 16}px`;

        // 图标
        const icon = document.createElement('span');
        icon.className = 'tree-item-icon';

        if (node.isDir) {
            const isExpanded = this.expandedNodes.has(node.path);
            icon.innerHTML = isExpanded ? this.getFolderOpenIcon() : this.getFolderIcon();
        } else {
            icon.innerHTML = this.getFileIcon(node.name);
        }

        // 名称
        const name = document.createElement('span');
        name.className = 'tree-item-name';
        name.textContent = node.name;

        item.appendChild(icon);
        item.appendChild(name);
        wrapper.appendChild(item);

        // 保存 this 引用
        const self = this;
        const filePath = node.path;
        const isDir = node.isDir;

        // 单击事件
        item.addEventListener('click', async function (e) {
            e.stopPropagation();
            console.log('点击事件触发:', filePath, 'isDir:', isDir);
            if (isDir) {
                self.toggleFolder(filePath, wrapper, icon);
            } else {
                self.selectFile(filePath, item);
                console.log('准备加载文件, app:', !!self.app, 'loadFile:', !!(self.app && self.app.loadFile));
                // 调用 app 的 loadFile 方法
                if (self.app && self.app.loadFile) {
                    try {
                        await self.app.loadFile(filePath);
                        console.log('文件加载完成');
                    } catch (err) {
                        console.error('文件加载失败:', err);
                    }
                } else {
                    console.error('app 或 loadFile 不存在');
                }
            }
        });

        // 子节点容器
        if (node.isDir && node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = this.expandedNodes.has(node.path) ? 'block' : 'none';

            for (const child of node.children) {
                childrenContainer.appendChild(this.createTreeNode(child, level + 1));
            }

            wrapper.appendChild(childrenContainer);
        }

        return wrapper;
    }

    toggleFolder(path, wrapper, icon) {
        const childrenContainer = wrapper.querySelector('.tree-children');
        if (!childrenContainer) return;

        if (this.expandedNodes.has(path)) {
            this.expandedNodes.delete(path);
            childrenContainer.style.display = 'none';
            icon.innerHTML = this.getFolderIcon();
        } else {
            this.expandedNodes.add(path);
            childrenContainer.style.display = 'block';
            icon.innerHTML = this.getFolderOpenIcon();
        }
    }

    selectFile(path, itemElement) {
        // 移除之前的选中状态
        const previousSelected = this.container.querySelector('.tree-item.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // 设置新的选中状态
        itemElement.classList.add('selected');
        this.selectedPath = path;
    }

    getFolderIcon() {
        return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V5.5A1.5 1.5 0 0 0 14.5 4H7.707l-1-1H1.5z"/>
        </svg>`;
    }

    getFolderOpenIcon() {
        return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v.64c.57.265.94.876.856 1.546l-.64 5.124A2.5 2.5 0 0 1 12.733 15H3.266a2.5 2.5 0 0 1-2.481-2.19l-.64-5.124A1.5 1.5 0 0 1 1 6.14V3.5z"/>
        </svg>`;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const color = {
            'md': '#519aba',
            'markdown': '#519aba',
            'txt': '#6d8086',
            'html': '#e34c26',
            'htm': '#e34c26'
        }[ext] || '#6d8086';

        return `<svg width="16" height="16" viewBox="0 0 16 16" fill="${color}">
            <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0H4z"/>
        </svg>`;
    }
}
