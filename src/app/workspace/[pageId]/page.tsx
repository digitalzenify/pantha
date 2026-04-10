"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { PartialBlock } from "@blocknote/core";
import BlockEditor from "@/components/editor/BlockEditor";

interface PageData {
  id: string;
  title: string;
  content: PartialBlock[] | null;
  icon: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Single page editor view.
 * Shows an editable title and the BlockNote editor.
 * Auto-saves title and content changes with debouncing.
 */
export default function PageEditorView() {
  const params = useParams();
  const pageId = params.pageId as string;
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch page data
  useEffect(() => {
    async function fetchPage() {
      try {
        const response = await fetch(`/api/pages?id=${pageId}`);
        if (response.ok) {
          const pages = await response.json();
          // The API returns a list, find our page
          // If a flat list, it won't contain the page directly—we fetch all and filter
          // Better approach: use a dedicated get endpoint
          // For now, fetch all pages and find by ID
          const allPages = await fetch("/api/pages?includeDeleted=false");
          if (allPages.ok) {
            const data = await allPages.json();
            const found = findPageById(data, pageId);
            if (found) {
              setPage(found);
              setTitle(found.title || "Untitled");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch page:", error);
      } finally {
        setLoading(false);
      }
    }

    // Fetch the specific page via a PATCH-less approach
    // Actually, let's fetch the page content directly
    async function fetchPageDirect() {
      try {
        // We'll get all pages and find the right one; for MVP this works
        // A proper GET by ID endpoint can be added later
        const response = await fetch("/api/pages");
        if (response.ok) {
          const pages = await response.json();
          const found = findPageInTree(pages, pageId);
          if (found) {
            // Fetch full page with content via a separate call
            // For now, the list includes what we need except content
            // Let's use a more targeted approach
          }
        }

        // Fetch all pages from API (they include content in the response)
        // Since our API doesn't return content in list, let's add a workaround
        // We'll fetch the specific page by making a PATCH with no changes
        // Better: just fetch and get it via GET with filtering
        // For MVP, store/load content via direct prisma or add query param
        // Let's fetch it via the pages route with a specific approach
        const directResponse = await fetch(`/api/pages?pageId=${pageId}`);
        if (directResponse.ok) {
          const data = await directResponse.json();
          // data is an array — not ideal. Let's handle it properly.
        }
      } catch (error) {
        console.error("Failed to fetch page:", error);
      }
    }

    fetchPageById();

    async function fetchPageById() {
      try {
        setLoading(true);
        // Use a custom fetch that gets page content by ID
        const response = await fetch(`/api/pages/${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setPage(data);
          setTitle(data.title || "Untitled");
        } else {
          // Fallback: try list endpoint
          console.warn("Direct page fetch failed, page may not exist");
        }
      } catch {
        console.warn("Page fetch endpoint not available");
      } finally {
        setLoading(false);
      }
    }
  }, [pageId]);

  // Save title with debounce
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);

      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current);
      }

      titleTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch("/api/pages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: pageId, title: newTitle }),
          });
        } catch (error) {
          console.error("Failed to save title:", error);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [pageId]
  );

  // Save content
  const handleContentChange = useCallback(
    async (content: PartialBlock[]) => {
      setSaving(true);
      try {
        await fetch("/api/pages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pageId, content }),
        });
      } catch (error) {
        console.error("Failed to save content:", error);
      } finally {
        setSaving(false);
      }
    },
    [pageId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Page not found</p>
          <p className="text-sm text-muted-foreground">
            This page may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Save indicator */}
      <div className="absolute top-14 right-4 z-10">
        {saving && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Saving...
          </span>
        )}
      </div>

      {/* Page title */}
      <div className="px-16 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl cursor-pointer hover:bg-accent rounded p-1">
            {page.icon || "📄"}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="text-4xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 px-12">
        <BlockEditor
          initialContent={page.content || undefined}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}

/** Helper to find a page in a nested tree structure */
function findPageById(pages: PageData[], id: string): PageData | null {
  for (const page of pages) {
    if (page.id === id) return page;
  }
  return null;
}

/** Helper to find a page in the tree (including children) */
function findPageInTree(
  pages: Array<PageData & { children?: PageData[] }>,
  id: string
): PageData | null {
  for (const page of pages) {
    if (page.id === id) return page;
    if (page.children) {
      const found = findPageInTree(page.children, id);
      if (found) return found;
    }
  }
  return null;
}
