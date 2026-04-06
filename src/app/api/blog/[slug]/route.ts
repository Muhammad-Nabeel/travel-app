import { NextRequest, NextResponse } from "next/server";
import { prisma, shouldBypassDatabase, markDatabaseUnavailable } from "@/lib/db";
import { DUMMY_BLOG_POSTS } from "../route";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;

  if (shouldBypassDatabase()) {
    const post = DUMMY_BLOG_POSTS.find((p) => p.slug === slug);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(post);
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      // Fall back to dummy data
      const dummyPost = DUMMY_BLOG_POSTS.find((p) => p.slug === slug);
      if (!dummyPost) {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(dummyPost);
    }

    return NextResponse.json(post);
  } catch (error) {
    markDatabaseUnavailable(error);
    const dummyPost = DUMMY_BLOG_POSTS.find((p) => p.slug === slug);
    if (!dummyPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(dummyPost);
  }
}
