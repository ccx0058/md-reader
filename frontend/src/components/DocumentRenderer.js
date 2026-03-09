// 文档渲染器组件
import { marked } from 'marked';
import hljs from 'highlight.js';
import katex from 'katex';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

export class DocumentRenderer {
    constructor(container) {
        this.container = container;
        this.setupMarked();
        this.setupMermaid();
    }

    setupMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });
    }

    setupMarked() {
        // 配置 marked
        marked.setOptions({
            gfm: true,           // GitHub Flavored Markdown
            breaks: true,        // 换行符转为 <br>
            headerIds: true,     // 为标题添加 ID
            mangle: false,       // 不转义标题 ID
        });

        // 自定义代码高亮渲染器
        const renderer = new marked.Renderer();

        renderer.code = (token) => {
            // marked 新版本传入的是 token 对象
            const code = typeof token === 'string' ? token : token.text;
            const language = typeof token === 'string' ? arguments[1] : token.lang;

            // Mermaid 图表
            if (language === 'mermaid') {
                return `<div class="mermaid">${code}</div>`;
            }

            const validLang = language && hljs.getLanguage(language);
            let highlighted;

            if (validLang) {
                highlighted = hljs.highlight(code, { language }).value;
            } else {
                highlighted = hljs.highlightAuto(code).value;
            }

            // 添加括号彩虹着色
            highlighted = this.addBracketColors(highlighted);

            return `<pre><code class="hljs ${language || ''}">${highlighted}</code></pre>`;
        };

        // 为标题添加锚点
        renderer.heading = (token) => {
            // marked 新版本传入的是 token 对象
            const text = typeof token === 'string' ? token : token.text;
            const level = typeof token === 'string' ? arguments[1] : token.depth;
            const id = text.toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '');
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        marked.use({ renderer });
    }

    render(content, fileType) {
        if (!content) {
            this.showWelcome();
            return;
        }

        switch (fileType) {
            case 'markdown':
                this.renderMarkdown(content);
                break;
            case 'text':
                this.renderPlainText(content);
                break;
            case 'html':
                this.renderHTML(content);
                break;
            default:
                this.showError('不支持的文件格式');
        }
    }

    renderMarkdown(content) {
        // 处理数学公式
        let processed = this.processLatex(content);
        const html = marked.parse(processed);
        this.container.innerHTML = `<div class="markdown-body">${html}</div>`;

        // 渲染 Mermaid 图表
        this.renderMermaidDiagrams();
    }

    processLatex(content) {
        // 块级公式 $$...$$
        content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
            } catch (e) {
                return `<span class="katex-error">${formula}</span>`;
            }
        });

        // 行内公式 $...$
        // 改进正则：允许公式中包含 $，但不能是连续的 $$
        content = content.replace(/\$((?:[^\$]|\\\$)+?)\$/g, (match, formula) => {
            // 跳过 $$ 开头的（块级公式的剩余部分）
            if (formula.startsWith('$') || formula.includes('$$')) {
                return match;
            }
            try {
                return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
            } catch (e) {
                return `<span class="katex-error">${formula}</span>`;
            }
        });

        return content;
    }

    async renderMermaidDiagrams() {
        const diagrams = this.container.querySelectorAll('.mermaid');
        for (let i = 0; i < diagrams.length; i++) {
            const element = diagrams[i];
            const code = element.textContent;
            try {
                const { svg } = await mermaid.render(`mermaid-${i}`, code);
                element.innerHTML = svg;
            } catch (e) {
                // 显示错误信息和原始代码
                element.innerHTML = `<pre class="mermaid-error">Mermaid 渲染错误: ${e.message}

原始代码:
${code}</pre>`;
            }
        }
    }

    renderPlainText(content) {
        // 保留原始格式，使用等宽字体
        const escaped = this.escapeHtml(content);
        this.container.innerHTML = `<pre class="plain-text">${escaped}</pre>`;
    }

    renderHTML(content) {
        // 使用 DOMPurify 或简单的过滤来防止 XSS
        // 这里使用简单的文本内容替换来处理
        // 实际生产环境建议使用 DOMPurify 库
        const sanitized = this.sanitizeHTML(content);
        this.container.innerHTML = `<div class="html-content">${sanitized}</div>`;
    }

    // HTML 内容过滤，防止 XSS
    sanitizeHTML(html) {
        // 使用 DOMPurify 过滤危险的 HTML 内容
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'del', 'ins',
                          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                          'ul', 'ol', 'li', 'dl', 'dt', 'dd',
                          'a', 'img', 'figure', 'figcaption',
                          'code', 'pre', 'kbd', 'samp', 'var',
                          'blockquote', 'q', 'cite',
                          'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
                          'div', 'span', 'section', 'article', 'header', 'footer', 'main', 'aside',
                          'hr', 'abbr', 'address', 'time', 'mark', 'sub', 'sup'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'width', 'height',
                          'target', 'rel', 'type', 'datetime', 'cite'],
            ALLOW_DATA_ATTR: false,
            FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
        });
    }

    showWelcome() {
        this.container.innerHTML = `
            <div class="welcome-screen">
                <h1>MD Reader</h1>
                <p>轻量级 Markdown 阅读器</p>
                <div class="welcome-actions">
                    <button id="btn-open-file" class="btn-primary">打开文件</button>
                    <button id="btn-open-folder-main" class="btn-secondary">打开文件夹</button>
                </div>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 括号彩虹着色
    addBracketColors(html) {
        const bracketColors = [
            'bracket-color-1',
            'bracket-color-2',
            'bracket-color-3',
            'bracket-color-4',
            'bracket-color-5',
            'bracket-color-6'
        ];

        let depth = 0;
        let result = '';
        let i = 0;

        while (i < html.length) {
            // 跳过 HTML 标签
            if (html[i] === '<') {
                let tagEnd = html.indexOf('>', i);
                if (tagEnd !== -1) {
                    result += html.substring(i, tagEnd + 1);
                    i = tagEnd + 1;
                    continue;
                }
            }

            // 跳过 HTML 实体
            if (html[i] === '&') {
                let entityEnd = html.indexOf(';', i);
                if (entityEnd !== -1 && entityEnd - i < 10) {
                    result += html.substring(i, entityEnd + 1);
                    i = entityEnd + 1;
                    continue;
                }
            }

            const char = html[i];

            // 开括号
            if (char === '(' || char === '[' || char === '{') {
                const colorClass = bracketColors[depth % bracketColors.length];
                result += `<span class="${colorClass}">${char}</span>`;
                depth++;
            }
            // 闭括号
            else if (char === ')' || char === ']' || char === '}') {
                depth = Math.max(0, depth - 1);
                const colorClass = bracketColors[depth % bracketColors.length];
                result += `<span class="${colorClass}">${char}</span>`;
            }
            else {
                result += char;
            }

            i++;
        }

        return result;
    }
}
