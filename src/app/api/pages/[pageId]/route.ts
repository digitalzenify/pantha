import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/pages/[pageId]
 * Get a single page by ID, including its content.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { pageId } = params;

  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      userId,
      isDeleted: false,
    },
    include: {
      children: {
        where: { isDeleted: false },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          icon: true,
        },
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}
