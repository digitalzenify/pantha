"use client";

import React, { useCallback, useState } from "react";
import { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles, Download, Upload } from "lucide-react";

interface BlockEditorProps {
  /** Initial content as BlockNote JSON */
  initialContent?: PartialBlock[];
  /** Called when content changes (debounced) */
  onChange?: (content: PartialBlock[]) => void;
  /** Whether the editor is editable */
  editable?: boolean;
}

/**
 * BlockNote editor wrapper component.
 * Supports headings, paragraphs, lists, to-do items, code blocks, and more.
 * Includes auto-save (debounced 1 second), AI assistant, and Markdown export.
 */
export default function BlockEditor({
  initialContent,
  onChange,
  editable = true,
}: BlockEditorProps) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Create the BlockNote editor instance using the recommended hook
  const editor = useCreateBlockNote({
    initialContent:
      initialContent && initialContent.length > 0
        ? initialContent
        : undefined,
  });

  // Handle content change with debounce (1 second auto-save)
  const handleChange = useCallback(() => {
    if (!onChange) return;

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    const timer = setTimeout(() => {
      const content = editor.document;
      onChange(content as PartialBlock[]);
    }, 1000);

    setSaveTimer(timer);
  }, [editor, onChange, saveTimer]);

  // Export as Markdown
  const handleExportMarkdown = useCallback(async () => {
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  // Import Markdown
  const handleImportMarkdown = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const blocks = await editor.tryParseMarkdownToBlocks(text);
      editor.replaceBlocks(editor.document, blocks);

      if (onChange) {
        onChange(blocks as PartialBlock[]);
      }
    };
    input.click();
  }, [editor, onChange]);

  // AI completion handler
  const handleAskAI = useCallback(async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiError(null);

    try {
      // Get current document as context
      const markdown = await editor.blocksToMarkdownLossy(editor.document);

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: markdown.slice(0, 2000),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "AI request failed");
      }

      const data = await response.json();

      // Insert AI response as new blocks
      if (data.text) {
        const blocks = await editor.tryParseMarkdownToBlocks(data.text);
        const lastBlock = editor.document[editor.document.length - 1];
        editor.insertBlocks(blocks, lastBlock, "after");

        if (onChange) {
          onChange(editor.document as PartialBlock[]);
        }
      }

      setAiDialogOpen(false);
      setAiPrompt("");
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, editor, onChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAiDialogOpen(true)}
          title="Ask AI"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Ask AI
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportMarkdown}
          title="Export as Markdown"
        >
          <Download className="h-4 w-4 mr-1" />
          Export MD
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImportMarkdown}
          title="Import Markdown"
        >
          <Upload className="h-4 w-4 mr-1" />
          Import MD
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <BlockNoteView
          editor={editor}
          editable={editable}
          onChange={handleChange}
          theme="light"
        />
      </div>

      {/* AI Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Ask AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ask AI to help you write, edit, or generate content. The current
              page content will be sent as context.
            </p>
            <Input
              placeholder="e.g., Summarize this page, Write a conclusion, Fix grammar..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAskAI();
                }
              }}
            />
            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAiDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAskAI}
              disabled={aiLoading || !aiPrompt.trim()}
            >
              {aiLoading ? "Thinking..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
