import type { Metadata } from "next";

import { BlogIndex } from "@/components/features/blog/blog-index";
import {
  buildStaticPageMetadata,
  getStaticPageSeo,
} from "@/lib/admin-settings/seo-settings";
import { getPublishedBlogPosts } from "@/lib/blog";

// /blog?category=x is redirected to /blog/category/x in next.config.ts.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("blog");
}

export default async function BlogPage() {
  const [posts, seo] = await Promise.all([
    getPublishedBlogPosts(),
    getStaticPageSeo("blog"),
  ]);

  return (
    <BlogIndex
      allPosts={posts}
      posts={posts}
      heading="Umrah & Travel Blog"
      intro="Step-by-step Umrah guides, visa updates, packing lists and destination advice from our travel experts, written for travellers planning their next journey."
      seoTitle={seo.title}
      seoDescription={seo.description}
      path="/blog"
    />
  );
}
