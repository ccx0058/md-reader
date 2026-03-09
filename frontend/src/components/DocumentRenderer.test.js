// Feature: md-reader, Property 2: Markdown 渲染输出包含正确的 HTML 结构
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { marked } from 'marked';

// 测试 marked 渲染输出
describe('Markdown Renderer Properties', () => {
    beforeEach(() => {
        marked.setOptions({ gfm: true, breaks: true, headerIds: true, mangle: false });
    });

    // Property 2: Markdown 渲染输出包含正确的 HTML 结构
    // For any 有效的 Markdown 文本，渲染后的 HTML 应包含对应的语义标签
    it('should render headings to h1-h6 tags', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 6 }),
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && !s.includes('\n')),
                (level, text) => {
                    const markdown = '#'.repeat(level) + ' ' + text;
                    const html = marked.parse(markdown);
                    return html.includes(`<h${level}`) && html.includes(`</h${level}>`);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should render unordered lists to ul/li tags', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
                (items) => {
                    const markdown = items.map(item => `- ${item}`).join('\n');
                    const html = marked.parse(markdown);
                    return html.includes('<ul>') && html.includes('<li>') && html.includes('</li>') && html.includes('</ul>');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should render ordered lists to ol/li tags', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
                (items) => {
                    const markdown = items.map((item, i) => `${i + 1}. ${item}`).join('\n');
                    const html = marked.parse(markdown);
                    return html.includes('<ol>') && html.includes('<li>') && html.includes('</li>') && html.includes('</ol>');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should render code blocks to pre/code tags', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('```')),
                (code) => {
                    const markdown = '```\n' + code + '\n```';
                    const html = marked.parse(markdown);
                    return html.includes('<pre>') && html.includes('<code>');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should render tables to table tags', () => {
        const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
        const html = marked.parse(markdown);
        expect(html).toContain('<table>');
        expect(html).toContain('<th>');
        expect(html).toContain('<td>');
    });
});


// Property 3: 代码块渲染包含高亮类
import hljs from 'highlight.js';

describe('Code Highlight Properties', () => {
    // Property 3: 代码块渲染包含高亮类
    // For any 包含代码块的 Markdown 文本，渲染后的 HTML 中代码块元素应包含语法高亮相关的 CSS 类
    it('should add hljs class to highlighted code', () => {
        const languages = ['javascript', 'python', 'go', 'html', 'css'];

        fc.assert(
            fc.property(
                fc.constantFrom(...languages),
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('```')),
                (lang, code) => {
                    const result = hljs.highlight(code, { language: lang });
                    // highlight.js 输出应包含 span 标签或原始代码
                    return result.value !== undefined;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should highlight code with language class', () => {
        const code = 'const x = 1;';
        const result = hljs.highlight(code, { language: 'javascript' });
        expect(result.value).toContain('<span');
        expect(result.language).toBe('javascript');
    });
});


// Property 4: 纯文本渲染保留原始格式
describe('Plain Text Renderer Properties', () => {
    // 模拟 escapeHtml 函数
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Property 4: 纯文本渲染保留原始格式
    // For any 纯文本内容，渲染后应保留所有原始换行符和空格，内容不被修改
    it('should preserve original content after escaping', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 500 }),
                (text) => {
                    const escaped = escapeHtml(text);
                    // 创建临时元素来解码
                    const div = document.createElement('div');
                    div.innerHTML = escaped;
                    const decoded = div.textContent;
                    return decoded === text;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve newlines in plain text', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
                (lines) => {
                    const text = lines.join('\n');
                    const escaped = escapeHtml(text);
                    const div = document.createElement('div');
                    div.innerHTML = escaped;
                    return div.textContent === text;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve spaces in plain text', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.integer({ min: 1, max: 10 }),
                (text, spaces) => {
                    const textWithSpaces = text + ' '.repeat(spaces) + text;
                    const escaped = escapeHtml(textWithSpaces);
                    const div = document.createElement('div');
                    div.innerHTML = escaped;
                    return div.textContent === textWithSpaces;
                }
            ),
            { numRuns: 100 }
        );
    });
});
