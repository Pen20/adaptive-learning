import React, { memo } from "react";
import { BlockMath, InlineMath } from "react-katex";

interface MathRendererProps {
  content: string;
}

// Error boundary for KaTeX rendering failures
class MathErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <code className="text-red-500 text-xs">{this.props.fallback}</code>;
    }
    return this.props.children;
  }
}

// Render bold markdown safely without dangerouslySetInnerHTML
function renderBold(text: string, key: number): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) {
    return (
      <span key={key} className="whitespace-pre-wrap">
        {text}
      </span>
    );
  }
  return (
    <span key={key} className="whitespace-pre-wrap">
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p))}
    </span>
  );
}

// Safety net for raw LaTeX in plain text parts.
// Wraps any \command{...} sequences and bare \command words that are not already
// inside \( \) or \[ \] delimiters.
function wrapRawLatex(text: string): string {
  // Block: \begin{...}...\end{...}
  let processed = text.replace(
    /\\begin\{[a-z\*]+\}[\s\S]+?\\end\{[a-z\*]+\}/g,
    (match) => `\\[${match}\\]`
  );
  // Inline: \command{arg}{arg}... (one or more brace groups)
  processed = processed.replace(
    /(?<!\\[\(\[])\\([a-zA-Z]+)(\{[^}]*\})+/g,
    (match) => `\\(${match}\\)`
  );
  // Inline: bare \command (no braces) — e.g. \alpha, \vec, \in, \leq
  processed = processed.replace(
    /(?<!\\[\(\[])\\([a-zA-Z]+)(?!\{)/g,
    (match) => `\\(${match}\\)`
  );
  return processed;
}

// Normalize AI output: convert $...$ → \(...\) and $$...$$ → \[...\]
// Also unescape \$ that AIs sometimes emit when confused about double-escaping
function normalizeDelimiters(text: string): string {
  // Unescape \$ → $ first (AI sometimes over-escapes dollar signs)
  let s = text.replace(/\\\$/g, "$");
  // Convert $$...$$ → \[...\] (block math)
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => `\\[${inner}\\]`);
  // Convert $...$ → \(...\) (inline math), avoiding already-converted \[ \]
  s = s.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (_, inner) => `\\(${inner}\\)`);
  return s;
}

const MathRendererInner: React.FC<MathRendererProps> = ({ content }) => {
  if (!content) return null;

  const normalized = normalizeDelimiters(content);

  const regex =
    /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  const parts = normalized.split(regex);

  return (
    <span className="max-w-full overflow-x-auto inline-block align-middle">
      {parts.map((part, index) => {
        if (part.startsWith("\\[") && part.endsWith("\\]")) {
          return (
            <MathErrorBoundary key={index} fallback={part}>
              <div className="overflow-x-auto py-2 max-w-full">
                <BlockMath math={part.slice(2, -2)} />
              </div>
            </MathErrorBoundary>
          );
        } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
          return (
            <MathErrorBoundary key={index} fallback={part}>
              <InlineMath math={part.slice(2, -2)} />
            </MathErrorBoundary>
          );
        } else {
          const rawProcessed = wrapRawLatex(part);
          if (rawProcessed !== part) {
            return <MathRendererInner key={index} content={rawProcessed} />;
          }
          return renderBold(part, index);
        }
      })}
    </span>
  );
};

export const MathRenderer = memo(MathRendererInner);
