const fs = require('fs');
const path = require('path');

const utilsCode = fs.readFileSync(path.resolve(__dirname, 'utils.js'), 'utf-8');

// Mock simple DOM for testing sanitizeInput
global.document = {
    createElement: function(tag) {
        if (tag === 'div') {
            return {
                _textContent: '',
                set textContent(val) {
                    this._textContent = val;
                },
                get innerHTML() {
                    // simple mock of what browser does
                    return this._textContent
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }
            };
        }
    }
};

global.window = {};

eval(utilsCode);

describe('Utility Functions', () => {
    describe('escapeHTML', () => {
        test('escapes basic HTML tags', () => {
            const input = '<div>Test</div>';
            const expected = '&lt;div&gt;Test&lt;/div&gt;';
            expect(escapeHTML(input)).toBe(expected);
        });

        test('escapes quotes and ampersands', () => {
            const input = 'This & that "quoted" and \'single\'';
            const expected = 'This &amp; that &quot;quoted&quot; and &#039;single&#039;';
            expect(escapeHTML(input)).toBe(expected);
        });

        test('handles empty or null input', () => {
            expect(escapeHTML(null)).toBe("");
            expect(escapeHTML("")).toBe("");
        });
    });

    describe('sanitizeInput', () => {
        test('removes html tags and keeps text content', () => {
            const input = '<b>Bold text</b><script>alert("xss")</script>';
            const expected = '&lt;b&gt;Bold text&lt;/b&gt;&lt;script&gt;alert("xss")&lt;/script&gt;';
            expect(sanitizeInput(input)).toBe(expected);
        });
    });
});
