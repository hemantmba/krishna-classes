import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function LatexText({ text }) {
  if (!text) return null;

  // Handle both \(...\) and $...$ formats
  // Split by \(...\) first
  const processText = (input) => {
    if (!input) return null;

    // Pattern to match \( ... \) — inline LaTeX
    const latexPattern = /\\\([\s\S]*?\\\)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    const regex = new RegExp(latexPattern.source, 'g');

    while ((match = regex.exec(input)) !== null) {
      // Add plain text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {input.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Extract math content between \( and \)
      const mathContent = match[0].slice(2, -2).trim();

      try {
        parts.push(
          <InlineMath key={`math-${match.index}`} math={mathContent} />
        );
      } catch (e) {
        // If rendering fails show raw text
        parts.push(
          <span key={`raw-${match.index}`}>{match[0]}</span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining plain text
    if (lastIndex < input.length) {
      parts.push(
        <span key={`text-end`}>{input.slice(lastIndex)}</span>
      );
    }

    // If no LaTeX found, try $...$ format
    if (parts.length === 0 || (parts.length === 1 && parts[0].props?.children === input)) {
      const dollarParts = input.split(/\$([^$]+)\$/g);
      if (dollarParts.length > 1) {
        return dollarParts.map((part, i) =>
          i % 2 === 1
            ? (() => { try { return <InlineMath key={i} math={part} />; } catch(e) { return <span key={i}>{part}</span>; } })()
            : <span key={i}>{part}</span>
        );
      }
    }

    return parts.length > 0 ? parts : <span>{input}</span>;
  };

  return <span>{processText(text)}</span>;
}