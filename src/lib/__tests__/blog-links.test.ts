import { unlinkUnpublishedPosts } from "@/lib/blog";

describe("unlinkUnpublishedPosts", () => {
    const published = new Set(["live-post"]);

    it("keeps links to published posts and other pages", () => {
        const html = '<a href="/blog/live-post">Live</a> and <a href="/umrah-packages">packages</a>';
        expect(unlinkUnpublishedPosts(html, published)).toBe(html);
    });

    it("unwraps links to posts that are not published", () => {
        const html = 'Read <a href="/blog/draft-post">our <strong>guide</strong></a>.';
        expect(unlinkUnpublishedPosts(html, published)).toBe("Read our <strong>guide</strong>.");
    });

    it("leaves blog category links alone", () => {
        const html = '<a href="/blog/category/umrah">Umrah</a>';
        expect(unlinkUnpublishedPosts(html, published)).toBe(html);
    });
});
