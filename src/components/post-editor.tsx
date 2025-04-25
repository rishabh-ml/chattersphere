"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
}

export default function PostEditor({
  value,
  onChange,
  placeholder = "What's on your mind?",
  minHeight = "120px",
  maxHeight = "300px"
}: PostEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor content only on first render or when value is explicitly changed from outside
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim() && value) {
      // Only set initial content or when editor is empty
      editorRef.current.innerHTML = value;
    }
  }, [value]); // Include value in dependencies

  // Only update content from props when the editor is not focused
  // This prevents cursor position issues during typing
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  // Handle content changes with proper sanitization
  const handleInput = () => {
    if (editorRef.current) {
      // Get the raw HTML content
      let content = editorRef.current.innerHTML;

      // Use DOMPurify for comprehensive sanitization
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h3', 'h4', 'ul', 'ol', 'li', 'div', 'span'],
        ALLOWED_ATTR: ['style', 'class'],
      });

      // Only update if content has actually changed
      if (sanitizedContent !== value) {
        onChange(sanitizedContent);
      }
    }
  };

  // Handle paste events to ensure clean HTML
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');

    // Modern approach instead of document.execCommand
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    handleInput();
  };

  // Modern formatting functions that don't rely on document.execCommand
  const formatText = (formatter: () => void) => {
    // Save selection
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    // Apply formatting
    formatter();

    // Update content and restore focus
    handleInput();
    editorRef.current?.focus();

    // Restore selection if possible
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleBold = () => formatText(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const strongElement = document.createElement('strong');
      range.surroundContents(strongElement);
    }
  });

  const handleItalic = () => formatText(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const emElement = document.createElement('em');
      range.surroundContents(emElement);
    }
  });

  const handleBulletList = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const ul = document.createElement('ul');
      const li = document.createElement('li');
      li.appendChild(content);
      ul.appendChild(li);
      range.insertNode(ul);
    }
  });

  const handleNumberedList = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const ol = document.createElement('ol');
      const li = document.createElement('li');
      li.appendChild(content);
      ol.appendChild(li);
      range.insertNode(ol);
    }
  });

  const handleAlignLeft = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const div = document.createElement('div');
      div.style.textAlign = 'left';
      div.appendChild(content);
      range.insertNode(div);
    }
  });

  const handleAlignCenter = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.appendChild(content);
      range.insertNode(div);
    }
  });

  const handleAlignRight = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const div = document.createElement('div');
      div.style.textAlign = 'right';
      div.appendChild(content);
      range.insertNode(div);
    }
  });

  const handleHeading1 = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const h3 = document.createElement('h3');
      h3.appendChild(content);
      range.insertNode(h3);
    }
  });

  const handleHeading2 = () => formatText(() => {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const h4 = document.createElement('h4');
      h4.appendChild(content);
      range.insertNode(h4);
    }
  });

  return (
    <div className="w-full">
      <div className={cn(
        "flex flex-wrap gap-1 p-1 mb-2 bg-gray-50 border border-gray-200 rounded-md",
        isFocused && "border-[#00AEEF]"
      )}>
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
          onClick={handleHeading1}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading2}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="h-8 w-px bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAlignLeft}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAlignCenter}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAlignRight}
          className="h-8 px-2 text-gray-700 hover:bg-gray-200"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        aria-placeholder={placeholder}
        tabIndex={0}
        className={cn(
          "w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent overflow-auto",
          isFocused && "ring-2 ring-[#00AEEF] border-transparent",
          !value && "empty-editor"
        )}
        style={{ minHeight, maxHeight }}
        onInput={handleInput}
        onKeyDown={(e) => {
          // Handle keyboard shortcuts
          if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter to submit form
            e.preventDefault();
            const form = editorRef.current?.closest('form');
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(submitEvent);
            }
          }
        }}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}
