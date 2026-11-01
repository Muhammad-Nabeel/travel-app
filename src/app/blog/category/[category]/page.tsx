import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex } from "@/components/features/blog/blog-index";
import { getPublishedBlogPosts } from "@/lib/blog";
import {
  BLOG_CATEGORIES,
  getBlogCategoryPath,
  isBlogCategory,
} from "@/lib/blog-categories";
import { buildMetadata } from "@/lib/seo";

type BlogCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return Object.keys(BLOG_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: BlogCategoryPageProps): Promise<Metadata> {
  const { category } = await params;

  if (!isBlogCategory(category)) {
    return buildMetadata({
      title: "Category Not Found",
      description: "The requested blog category could not be found.",
      path: getBlogCategoryPath(category),
      noIndex: true,
    });
  }

  const config = BLOG_CATEGORIES[category];
  const posts = await getPublishedBlogPosts();
  const hasPosts = posts.some((post) => post.category === category);

  return buildMetadata({
    title: config.title,
    description: config.description,
    path: getBlogCategoryPath(category),
    // An empty hub is a thin page; index it once it has at least one article.
    noIndex: !hasPosts,
  });
}

export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const { category } = await params;

  if (!isBlogCategory(category)) {
    notFound();
  }

  const config = BLOG_CATEGORIES[category];
  const allPosts = await getPublishedBlogPosts();
  const posts = allPosts.filter((post) => post.category === category);

  return (
    <BlogIndex
      allPosts={allPosts}
      posts={posts}
      selectedCategory={category}
      heading={config.heading}
      intro={config.intro}
      seoTitle={config.title}
      seoDescription={config.description}
      path={getBlogCategoryPath(category)}
    />
  );
}
