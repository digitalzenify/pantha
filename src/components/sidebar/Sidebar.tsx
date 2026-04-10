"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  Trash2,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  isFavorite: boolean;
  sortOrder: number;
  children?: Page[];
}

interface SidebarProps {
  className?: string;
}

/**
 * Navigation sidebar with page tree.
 * Shows all pages in a nested tree structure.
 * Supports creating new pages, favorites, and deletion.
 */
export default function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pages, setPages] = useState<Page[]>([]);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch pages
  const fetchPages = useCallback(async () => {
    try {
      const response = await fetch("/api/pages");
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Create a new page
  const handleCreatePage = useCallback(
    async (parentId?: string) => {
      try {
        const response = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Untitled",
            parentId: parentId || null,
          }),
        });

        if (response.ok) {
          const newPage = await response.json();
          await fetchPages();

          // If created under a parent, expand the parent
          if (parentId) {
            setExpandedPages((prev) => new Set(prev).add(parentId));
          }

          // Navigate to the new page
          router.push(`/workspace/${newPage.id}`);
        }
      } catch (error) {
        console.error("Failed to create page:", error);
      }
    },
    [fetchPages, router]
  );

  // Delete a page (soft delete)
  const handleDeletePage = useCallback(
    async (pageId: string) => {
      try {
        const response = await fetch(`/api/pages?id=${pageId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchPages();
          // If we're on the deleted page, navigate to workspace home
          if (pathname === `/workspace/${pageId}`) {
            router.push("/workspace");
          }
        }
      } catch (error) {
        console.error("Failed to delete page:", error);
      }
    },
    [fetchPages, pathname, router]
  );

  // Toggle favorite
  const handleToggleFavorite = useCallback(
    async (pageId: string, currentFavorite: boolean) => {
      try {
        await fetch("/api/pages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: pageId,
            isFavorite: !currentFavorite,
          }),
        });
        await fetchPages();
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
      }
    },
    [fetchPages]
  );

  // Toggle expand/collapse
  const toggleExpand = useCallback((pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }, []);

  // Render a page item in the tree
  const renderPageItem = (page: Page, depth: number = 0) => {
    const isActive = pathname === `/workspace/${page.id}`;
    const hasChildren = page.children && page.children.length > 0;
    const isExpanded = expandedPages.has(page.id);

    return (
      <div key={page.id}>
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1 rounded-sm text-sm cursor-pointer hover:bg-accent/50 transition-colors",
            isActive && "bg-accent text-accent-foreground",
            depth > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {/* Expand/collapse button */}
          <button
            className="p-0.5 rounded hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(page.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )
            ) : (
              <span className="w-3.5" />
            )}
          </button>

          {/* Page icon & title */}
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0"
            onClick={() => router.push(`/workspace/${page.id}`)}
          >
            <span className="text-base flex-shrink-0">
              {page.icon || "📄"}
            </span>
            <span className="truncate">{page.title || "Untitled"}</span>
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-0.5 rounded hover:bg-accent">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleCreatePage(page.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add sub-page
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleToggleFavorite(page.id, page.isFavorite)
                  }
                >
                  <Star
                    className={cn(
                      "h-4 w-4 mr-2",
                      page.isFavorite && "fill-yellow-400 text-yellow-400"
                    )}
                  />
                  {page.isFavorite ? "Remove favorite" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeletePage(page.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="p-0.5 rounded hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                handleCreatePage(page.id);
              }}
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {page.children!.map((child) =>
              renderPageItem(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-secondary/30 border-r w-60",
        className
      )}
    >
      {/* Workspace header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="font-semibold text-sm">My Workspace</span>
        </div>
      </div>

      {/* Page tree */}
      <ScrollArea className="flex-1 px-2 py-2">
        {/* Favorites section */}
        {pages.some((p) => p.isFavorite) && (
          <div className="mb-4">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Favorites
            </p>
            {pages
              .filter((p) => p.isFavorite)
              .map((page) => renderPageItem(page))}
          </div>
        )}

        {/* All pages */}
        <div>
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pages
          </p>
          {loading ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : pages.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-center">No pages yet</p>
            </div>
          ) : (
            pages.map((page) => renderPageItem(page))
          )}
        </div>
      </ScrollArea>

      {/* New page button */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          onClick={() => handleCreatePage()}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </div>
    </div>
  );
}
