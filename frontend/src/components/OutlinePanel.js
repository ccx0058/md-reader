// 大纲面板组件
export class OutlinePanel {
    constructor(container) {
        this.container = container;
        this.itemClickCallback = null;
    }

    onItemClick(callback) {
        this.itemClickCallback = callback;
    }

    generate(contentElement) {
        if (!contentElement) {
            this.showEmpty();
            return;
        }

        const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

        if (headings.length === 0) {
            this.showEmpty();
            return;
        }

        this.container.innerHTML = '';

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent;
            const id = heading.id || `heading-${index}`;

            // 确保标题有 ID
            if (!heading.id) {
                heading.id = id;
            }

            const item = document.createElement('a');
            item.className = `outline-item level-${level}`;
            item.textContent = text;
            item.href = `#${id}`;
            item.title = text;

            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.itemClickCallback) {
                    this.itemClickCallback(id);
                }
            });

            this.container.appendChild(item);
        });
    }

    showEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <p>打开文档后显示大纲</p>
            </div>
        `;
    }

    // 提取标题列表（用于测试）
    static extractHeadings(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

        return Array.from(headings).map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent,
            id: h.id
        }));
    }
}
