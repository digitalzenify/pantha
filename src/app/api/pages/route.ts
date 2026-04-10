import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/pages
 * List all pages for the current user's workspace.
 * Query params: workspaceId (optional), parentId (optional), includeDeleted (optional)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const parentId = searchParams.get("parentId");
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  // If no workspaceId provided, get user's first workspace
  let targetWorkspaceId = workspaceId;
  if (!targetWorkspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { userId },
    });
    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }
    targetWorkspaceId = workspace.id;
  }

  const pages = await prisma.page.findMany({
    where: {
      workspaceId: targetWorkspaceId,
      userId,
      parentId: parentId || null,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      icon: true,
      parentId: true,
      isFavorite: true,
      isDeleted: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      children: {
        where: includeDeleted ? {} : { isDeleted: false },
        select: {
          id: true,
          title: true,
          icon: true,
          parentId: true,
          isFavorite: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json(pages);
}

/**
 * POST /api/pages
 * Create a new page.
 * Body: { title?, icon?, parentId?, workspaceId? }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body: {
    title?: string;
    icon?: string;
    parentId?: string;
    workspaceId?: string;
    content?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Get workspace
  let workspaceId = body.workspaceId;
  if (!workspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { userId },
    });
    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }
    workspaceId = workspace.id;
  }

  // Get the next sort order
  const lastPage = await prisma.page.findFirst({
    where: {
      workspaceId,
      parentId: body.parentId || null,
      isDeleted: false,
    },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastPage?.sortOrder ?? -1) + 1;

  const page = await prisma.page.create({
    data: {
      title: body.title || "Untitled",
      icon: body.icon || "📄",
      parentId: body.parentId || null,
      content: body.content || null,
      workspaceId,
      userId,
      sortOrder,
    },
  });

  return NextResponse.json(page, { status: 201 });
}

/**
 * PATCH /api/pages
 * Update a page. Requires `id` in the body.
 * Body: { id, title?, content?, icon?, parentId?, isFavorite?, sortOrder? }
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body: {
    id: string;
    title?: string;
    content?: unknown;
    icon?: string;
    parentId?: string | null;
    isFavorite?: boolean;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json(
      { error: "Page ID is required" },
      { status: 400 }
    );
  }

  // Verify the page belongs to the user
  const existingPage = await prisma.page.findFirst({
    where: { id: body.id, userId },
  });

  if (!existingPage) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { id, ...updateData } = body;
  const page = await prisma.page.update({
    where: { id },
    data: updateData as Record<string, unknown>,
  });

  return NextResponse.json(page);
}

/**
 * DELETE /api/pages
 * Soft-delete a page. Requires `id` in the query string.
 * Query: ?id=<pageId>&permanent=true (optional, for hard delete)
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("id");
  const permanent = searchParams.get("permanent") === "true";

  if (!pageId) {
    return NextResponse.json(
      { error: "Page ID is required" },
      { status: 400 }
    );
  }

  // Verify the page belongs to the user
  const existingPage = await prisma.page.findFirst({
    where: { id: pageId, userId },
  });

  if (!existingPage) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (permanent) {
    await prisma.page.delete({ where: { id: pageId } });
    return NextResponse.json({ deleted: true });
  }

  // Soft delete
  const page = await prisma.page.update({
    where: { id: pageId },
    data: { isDeleted: true },
  });

  return NextResponse.json(page);
}
