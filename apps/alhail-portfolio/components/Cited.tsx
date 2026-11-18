"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API } from "@/lib/api";

// [D4p1] → link to page 1 of document 4, rendered as a small citation chip
const linkCitations = (text: string) =>
  text.replace(/\[D(\d+)p(\d+)\]/g, (_, d, p) => `[D${d} p${p}](${API}/alhail/documents/${d}/file#page=${p})`);

export default function Cited({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href?.includes("/alhail/documents/") ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                title="Open the source document"
                className="mx-0.5 inline-block whitespace-nowrap rounded bg-accent-soft px-1 py-px align-middle text-[10.5px] font-semibold text-primary no-underline hover:bg-accent/40"
                dir="ltr"
              >
                {children}
              </a>
            ) : (
              <a href={href} className="underline" target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {linkCitations(text)}
      </ReactMarkdown>
    </div>
  );
}
