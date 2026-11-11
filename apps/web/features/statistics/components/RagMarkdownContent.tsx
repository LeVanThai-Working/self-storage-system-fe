"use client";

import React from "react";
import { FileText } from "lucide-react";
import { sanitizeVietnameseText } from "../utils/sanitizeText";

interface RagMarkdownContentProps {
  content: string;
  onCitationClick?: (chunkId: string) => void;
}

/**
 * A lightweight, safe Markdown renderer tailored for RAG responses.
 * Parses headers, bold, bullet points, numbers, inline code, and [CHUNK-...] citations.
 */
export function RagMarkdownContent({ content, onCitationClick }: RagMarkdownContentProps) {
  if (!content) return null;

  const sanitized = sanitizeVietnameseText(content);

  // Helper to parse inline styles (bold, code, and citations)
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex splits by:
    // 1. Citation badges: [CHUNK-...]
    // 2. Bold: **...**
    // 3. Inline code: `...`
    const regex = /(\[CHUNK-[A-Z0-9_\-]+\]|\*\*[^*]+\*\*|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Citation matching [CHUNK-XYZ]
      if (part.startsWith("[CHUNK-") && part.endsWith("]")) {
        const chunkId = part.slice(1, -1);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onCitationClick?.(chunkId)}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold hover:bg-teal-100 transition-colors align-middle cursor-pointer"
            title={`Trích dẫn: ${chunkId}`}
          >
            <FileText className="w-3 h-3 text-teal-600" />
            <span>{chunkId}</span>
          </button>
        );
      }

      // Bold **text**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={idx} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Inline code `code`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-xs border border-slate-200/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  const lines = sanitized.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="my-2 space-y-1 pl-4 list-disc text-slate-700 text-xs sm:text-sm"
        >
          {currentList.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="my-2 space-y-1 pl-4 list-decimal text-slate-700 text-xs sm:text-sm"
        >
          {currentList.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={i} className="text-sm font-bold text-slate-900 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={i}
          className="text-base font-bold text-slate-900 mt-3.5 mb-1.5 border-b border-slate-100 pb-1"
        >
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={i} className="text-lg font-extrabold text-slate-900 mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={i}
          className="border-l-3 border-teal-500 pl-3 py-1 my-2 bg-slate-50 text-xs text-slate-700 italic rounded-r"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet points: '-' or '*'
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(renderInline(line.slice(2)));
      continue;
    }

    // Numbered list: '1. ', '2. ', etc.
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(renderInline(numberedMatch[2]));
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={i} className="my-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}
