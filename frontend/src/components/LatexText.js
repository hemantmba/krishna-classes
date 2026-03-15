import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function LatexText({ text }) {
  if (!text) return null;

  // Split text by $...$ pattern
  const parts = text.split(/\$([^$]+)\$/g);

  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <InlineMath key={i} math={part} />
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}