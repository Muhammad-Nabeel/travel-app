/**
 * @jest-environment node
 */
import { sanitizeBlogHtml } from "@/lib/sanitize-blog-html";

describe("sanitizeBlogHtml", () => {
    it("keeps the formatting blog posts use", () => {
        const html =
            '<h2>Visa</h2><p><strong>Bold</strong> <em>it</em> <a href="/visa/uk">link</a></p>' +
            "<ul><li>One</li></ul><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>";
        expect(sanitizeBlogHtml(html)).toBe(html);
    });

    it("removes scripts, event handlers and javascript: links", () => {
        const out = sanitizeBlogHtml(
            '<p onclick="steal()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><iframe src="https://evil"></iframe>',
        );
        expect(out).toBe("<p>Hi</p><a>x</a>");
    });

    it("adds noopener to links that open a new tab", () => {
        expect(sanitizeBlogHtml('<a href="https://x.com" target="_blank">x</a>')).toBe(
            '<a href="https://x.com" target="_blank" rel="noopener noreferrer">x</a>',
        );
    });
});
