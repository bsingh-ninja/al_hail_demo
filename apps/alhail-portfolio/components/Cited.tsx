"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDocSheet } from "@/components/DocumentSheet";
import { API } from "@/lib/api";

// [D4p1] → link to page 1 of document 4, rendered as a small citation chip
const linkCitations = (text: string) =>
  text.replace(/\[D(\d+)p(\d+)\]/g, (_, d, p) => `[D${d} p${p}](${API}/alhail/documents/${d}/file#page=${p})`);

export default function Cited({ text, className = "" }: { text: string; className?: string }) {
  const { openDoc } = useDocSheet();
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const m = href?.match(/\/alhail\/documents\/(\d+)\/file#page=(\d+)/);
            return m ? (
              <a
                href={href}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return; // keep "open in new tab"
                  e.preventDefault();
                  openDoc({ id: Number(m[1]), page: Number(m[2]) });
                }}
                title="Show the source document"
                className="pressable mx-0.5 inline-block whitespace-nowrap rounded bg-accent-soft px-1 py-px align-middle text-[10.5px] font-semibold tracking-[0.01em] text-primary no-underline hover:bg-accent/40"
                dir="ltr"
              >
                {children}
              </a>
            ) : (
              <a href={href} className="underline" target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {linkCitations(text)}
      </ReactMarkdown>
    </div>
  );
}
