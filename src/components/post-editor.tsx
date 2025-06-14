"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import createDOMPurify from "dompurify";
import MediaUploader from "@/components/media-uploader";

interface PostEditorProps {
  value: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  enableMediaUpload?: boolean;
}

export default function PostEditor({
  value,
  onChangeAction,
  placeholder = "What's on your mind?",
  minHeight = "120px",
  maxHeight = "300px",
  enableMediaUpload = true,
}: PostEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showMediaUploader, setShowMediaUploader] = useState<boolean>(false);

  // Initialize DOMPurify once
  const DOMPurify = typeof window !== "undefined" ? createDOMPurify(window) : null;

  // Sync incoming `value` → editor when empty or blurred
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isFocused]);

  // Handle content changes, sanitize with DOMPurify
  const handleInput = () => {
    if (!editorRef.current || !DOMPurify) return;
    const rawContent = editorRef.current.innerHTML;
    const clean = DOMPurify.sanitize(rawContent, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "h3", "h4", "ul", "ol", "li", "div", "span"],
      ALLOWED_ATTR: ["style", "class"],
    });
    if (clean !== value) {
      onChangeAction(clean);
    }
  };

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
      handleInput();
    }
  };

  // Utility that wraps a formatting callback
  const withFormat = (formatter: () => void) => {
    const sel = window.getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
    formatter();
    handleInput();
    editorRef.current?.focus();
    if (range && sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // Formatting commands
  const handleBold = () =>
    withFormat(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const el = document.createElement("strong");
        range.surroundContents(el);
      }
    });

  const handleItalic = () =>
    withFormat(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const el = document.createElement("em");
        range.surroundContents(el);
      }
    });

  const handleBulletList = () =>
    withFormat(() => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const ul = document.createElement("ul");
      const li = document.createElement("li");
      li.appendChild(fragment);
      ul.appendChild(li);
      range.insertNode(ul);
    });

  const handleNumberedList = () =>
    withFormat(() => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const ol = document.createElement("ol");
      const li = document.createElement("li");
      li.appendChild(fragment);
      ol.appendChild(li);
      range.insertNode(ol);
    });

  const handleAlign = (align: "left" | "center" | "right") =>
    withFormat(() => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const div = document.createElement("div");
      div.style.textAlign = align;
      div.appendChild(fragment);
      range.insertNode(div);
    });

  const handleHeading = (tag: "h3" | "h4") =>
    withFormat(() => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const el = document.createElement(tag);
      el.appendChild(fragment);
      range.insertNode(el);
    });

  // Handle media upload completion
  const handleMediaUpload = (url: string) => {
    // Insert the image at the current cursor position or at the end
    if (editorRef.current) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const imgElement = document.createElement("img");
        imgElement.src = url;
        imgElement.alt = "Uploaded image";
        imgElement.style.maxWidth = "100%";
        imgElement.className = "my-2 rounded-md";

        range.insertNode(imgElement);
        range.setStartAfter(imgElement);
        range.setEndAfter(imgElement);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // If no selection, append to the end
        const imgElement = document.createElement("img");
        imgElement.src = url;
        imgElement.alt = "Uploaded image";
        imgElement.style.maxWidth = "100%";
        imgElement.className = "my-2 rounded-md";

        editorRef.current.appendChild(imgElement);
      }

      // Trigger input event to update the value
      handleInput();

      // Hide the media uploader
      setShowMediaUploader(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex flex-wrap gap-1 p-1 mb-2 bg-gray-50 border border-gray-200 rounded-md",
          isFocused && "border-[#00AEEF]"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBulletList}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNumberedList}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="h-8 w-px bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleHeading("h3")}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleHeading("h4")}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="h-8 w-px bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAlign("left")}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAlign("center")}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAlign("right")}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        {enableMediaUpload && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMediaUploader(!showMediaUploader)}
            className="h-8 px-2 text-gray-700 hover:bg-gray-200 ml-auto"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showMediaUploader && enableMediaUpload && (
        <div className="mb-3">
          <MediaUploader onUploadComplete={handleMediaUpload} type="post" className="mt-2" />
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        tabIndex={0}
        className={cn(
          "w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF] overflow-auto",
          isFocused && "ring-2 ring-[#00AEEF] border-transparent",
          !value && "empty-editor"
        )}
        style={{ minHeight, maxHeight }}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
