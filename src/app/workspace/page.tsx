import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileText, Plus } from "lucide-react";

/**
 * Workspace home page.
 * Shows a list of all pages with links to navigate to each.
 */
export default async function WorkspacePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id;

  // Get user's workspace and pages
  const workspace = await prisma.workspace.findFirst({
    where: { userId },
  });

  const pages = workspace
    ? await prisma.page.findMany({
        where: {
          workspaceId: workspace.id,
          isDeleted: false,
          parentId: null,
        },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          icon: true,
          isFavorite: true,
          updatedAt: true,
        },
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {workspace?.icon} {workspace?.name || "My Workspace"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </p>
          </div>
        </div>

        {/* Page grid */}
        {pages.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <h2 className="text-lg font-semibold">No pages yet</h2>
              <p className="text-muted-foreground">
                Create your first page to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/workspace/${page.id}`}
                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <span className="text-2xl">{page.icon || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {page.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {new Date(page.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {page.isFavorite && (
                  <span className="text-yellow-400" title="Favorite">
                    ⭐
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions hint */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs">
              +
            </kbd>{" "}
            in the sidebar or click{" "}
            <span className="inline-flex items-center gap-1">
              <Plus className="h-3 w-3" />
              New Page
            </span>{" "}
            to create a new page.
          </p>
        </div>
      </div>
    </div>
  );
}
