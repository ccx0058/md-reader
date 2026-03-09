// Feature: md-reader, Property 5: 大纲生成包含所有标题
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { OutlinePanel } from './OutlinePanel.js';

describe('OutlinePanel Properties', () => {
    // Property 5: 大纲生成包含所有标题
    // For any 包含标题的 HTML 内容，生成的大纲应包含所有 h1-h6 标题，且顺序与文档中出现的顺序一致
    it('should extract all headings from HTML', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        level: fc.integer({ min: 1, max: 6 }),
                        text: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0 && !s.includes('<') && !s.includes('>'))
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (headingDefs) => {
                    // 生成 HTML
                    const html = headingDefs.map((h, i) =>
                        `<h${h.level} id="h-${i}">${h.text}</h${h.level}>`
                    ).join('\n');

                    // 提取标题
                    const extracted = OutlinePanel.extractHeadings(html);

                    // 验证数量一致
                    if (extracted.length !== headingDefs.length) {
                        return false;
                    }

                    // 验证顺序和内容一致
                    for (let i = 0; i < headingDefs.length; i++) {
                        if (extracted[i].level !== headingDefs[i].level) {
                            return false;
                        }
                        if (extracted[i].text !== headingDefs[i].text) {
                            return false;
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve heading order', () => {
        const html = `
            <h1 id="h1">First</h1>
            <h2 id="h2">Second</h2>
            <h3 id="h3">Third</h3>
            <h2 id="h4">Fourth</h2>
            <h1 id="h5">Fifth</h1>
        `;

        const headings = OutlinePanel.extractHeadings(html);

        expect(headings.length).toBe(5);
        expect(headings[0].text).toBe('First');
        expect(headings[1].text).toBe('Second');
        expect(headings[2].text).toBe('Third');
        expect(headings[3].text).toBe('Fourth');
        expect(headings[4].text).toBe('Fifth');
    });

    it('should extract correct heading levels', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 6 }),
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('<')),
                (level, text) => {
                    const html = `<h${level} id="test">${text}</h${level}>`;
                    const headings = OutlinePanel.extractHeadings(html);
                    return headings.length === 1 && headings[0].level === level;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return empty array for content without headings', () => {
        const html = '<p>No headings here</p><div>Just content</div>';
        const headings = OutlinePanel.extractHeadings(html);
        expect(headings.length).toBe(0);
    });
});
