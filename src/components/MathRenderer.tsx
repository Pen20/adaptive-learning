import React from "react";
import { BlockMath, InlineMath } from "react-katex";

interface MathRendererProps {
  content: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split by supported delimiters:
  // $$ ... $$ (Display)
  // \[ ... \] (Display)
  // \( ... \) (Inline)
  // $ ... $ (Inline, assuming no escaped \$ inside for simplicity or handled by lookbehind)
  
  // Regex explanation:
  // 1. \$\$[\s\S]+?\$\$  -> Matches $$...$$
  // 2. \\\[[\s\S]+?\\\]  -> Matches \[...\]
  // 3. \\\([\s\S]+?\\\   -> Matches \(...\)
  // 4. (?<!\\)\$[\s\S]+?(?<!\\)\$ -> Matches $...$ but ensures not preceded by \
  
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$[\s\S]+?(?<!\\)\$)/g;
  
  const parts = content.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          // Display Math $$...$$
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith("\\[") && part.endsWith("\\]")) {
          // Display Math \[...\]
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
          // Inline Math \(...\)
          return <InlineMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
           // Inline Math $...$
           // Handle case where it might just be a single $ or invalid
           if (part.length <= 2) return <span key={index}>{part}</span>;
           return <InlineMath key={index} math={part.slice(1, -1)} />;
        } else {
          // Plain Text
          // Preserving newlines as line breaks could be nice
          return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        }
      })}
    </span>
  );
};
