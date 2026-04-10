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
        setLoading(true);
        const response = await fetch(`/api/pages/${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setPage(data);
          setTitle(data.title || "Untitled");
        }
      } catch (error) {
        console.error("Failed to fetch page:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
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
