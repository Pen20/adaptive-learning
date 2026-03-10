import React from "react";
import { BlockMath, InlineMath } from "react-katex";

interface MathRendererProps {
  content: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  if (!content) return null;

  // Safety net for raw LaTeX in plain text parts
  const wrapRawLatex = (text: string) => {
    // 1. Wrap blocks like \begin{...} ... \end{...}
    let processed = text.replace(/\\begin\{[a-z\*]+\}[\s\S]+?\\end\{[a-z\*]+\}/g, (match) => `$$${match}$$`);
    
    // 2. Wrap common inline commands (handling multiple {braced} blocks for commands like \frac)
    const inlineKeywords = ["boldsymbol", "mathbb", "frac", "det", "lambda", "alpha", "beta", "gamma", "delta", "mathbf", "times"];
    inlineKeywords.forEach(kw => {
      // Matches \kw followed by one or more {braced} blocks
      const regexKw = new RegExp(`(?<![\\w\\$])\\\\${kw}(\\{[^\\}]+\\})+`, "g");
      processed = processed.replace(regexKw, (match) => `$${match}$`);
      
      // Also catch simple commands like \lambda without braces
      const simpleRegex = new RegExp(`(?<![\\w\\$])\\\\${kw}(?![\\w\\{\\$])`, "g");
      processed = processed.replace(simpleRegex, (match) => `$${match}$`);
    });
    
    return processed;
  };

  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$[\s\S]+?(?<!\\)\$)/g;
  const parts = content.split(regex);

  return (
    <span className="max-w-full overflow-x-auto inline-block align-middle">
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          // Display Math $$...$$
          return (
            <div key={index} className="overflow-x-auto py-2 max-w-full">
              <BlockMath math={part.slice(2, -2)} />
            </div>
          );
        } else if (part.startsWith("\\[") && part.endsWith("\\]")) {
          // Display Math \[...\]
          return (
            <div key={index} className="overflow-x-auto py-2 max-w-full">
              <BlockMath math={part.slice(2, -2)} />
            </div>
          );
        } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
          // Inline Math \(...\)
          return <InlineMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
           // Inline Math $...$
           // Handle case where it might just be a single $ or invalid
           if (part.length <= 2) return <span key={index}>{part}</span>;
           return <InlineMath key={index} math={part.slice(1, -1)} />;
        } else {
          // Plain Text - Apply safety net and process basic markdown bold
          const rawProcessed = wrapRawLatex(part);
          if (rawProcessed !== part) {
             return <MathRenderer key={index} content={rawProcessed} />;
          }
          const formatted = part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <span 
              key={index} 
              className="whitespace-pre-wrap" 
              dangerouslySetInnerHTML={{ __html: formatted }} 
            />
          );
        }
      })}
    </span>
  );
};
