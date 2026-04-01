"use client";

import { useEffect, useState } from "react";
import { Search, Tag } from "lucide-react";
import Link from "next/link";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
};

interface BlogSearchProps {
  currentSlug?: string;
}

export function BlogSearch({ currentSlug }: BlogSearchProps) {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all blog posts
  useEffect(() => {
    fetch("/api/blog?all=true")
      .then((r) => r.json())
      .then((data) => {
        setAllPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Filter posts based on search query and selected tag
  useEffect(() => {
    let filtered = allPosts;

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(
        (post) => Array.isArray(post.tags) && post.tags.includes(selectedTag),
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          (Array.isArray(post.tags) &&
            post.tags.some((tag) => tag.toLowerCase().includes(query))),
      );
    }

    // Exclude current post from search results
    if (currentSlug) {
      filtered = filtered.filter((post) => post.slug !== currentSlug);
    }

    setFilteredPosts(filtered.slice(0, 5)); // Show top 5 results
  }, [searchQuery, selectedTag, allPosts, currentSlug]);

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      allPosts
        .flatMap((post) => (Array.isArray(post.tags) ? post.tags : []))
        .filter((tag): tag is string => typeof tag === "string"),
    ),
  ).sort();

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <aside className="space-y-6">
      {/* Search Box */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTag(null);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>

        {/* Search Results */}
        {searchQuery && filteredPosts.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block rounded p-2 text-xs hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900 line-clamp-2">
                  {post.title}
                </p>
                <p className="text-slate-500 line-clamp-1">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        )}

        {searchQuery && filteredPosts.length === 0 && (
          <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
            No posts found matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Tags Cloud */}
      {allTags.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Tag className="h-4 w-4" />
            Browse by Tag
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(selectedTag === tag ? null : tag);
                  setSearchQuery("");
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedTag === tag
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      {allPosts.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Recent Posts
          </h3>
          <div className="space-y-2">
            {allPosts.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={`block rounded p-2 text-xs transition hover:bg-slate-50 ${
                  post.slug === currentSlug ? "bg-slate-50" : ""
                }`}
              >
                <p className="font-medium text-slate-900 line-clamp-2">
                  {post.title}
                </p>
                {post.publishedAt && (
                  <p className="text-slate-400">
                    {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
