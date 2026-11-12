import sanitizeHtml from "sanitize-html";

/**
 * Blog posts are stored as HTML and rendered raw, so they are cleaned with an
 * allow-list both when saved and when rendered: scripts, event handlers,
 * iframes and javascript: links never reach a visitor, even if an admin
 * account is compromised or a post was saved before this existed.
 */
const OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [
        "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
        "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup", "span",
        "ul", "ol", "li", "blockquote", "pre", "code",
        "a", "img", "figure", "figcaption",
        "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td",
    ],
    allowedAttributes: {
        a: ["href", "title", "target", "rel"],
        img: ["src", "alt", "title", "width", "height", "loading"],
        th: ["colspan", "rowspan", "scope"],
        td: ["colspan", "rowspan"],
        ol: ["start"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
        // Links opening a new tab must not get a handle on this window.
        a: (tagName, attribs) =>
            attribs.target === "_blank"
                ? { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } }
                : { tagName, attribs },
    },
};

export function sanitizeBlogHtml(html: string): string {
    return sanitizeHtml(html, OPTIONS);
}
