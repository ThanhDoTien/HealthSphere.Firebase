import React from 'react';

/**
 * Lightweight inline Markdown renderer.
 * Supports: **bold**, *italic*, and line breaks.
 */
export function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  
  // Normalize escaped newlines
  const normalized = text.replace(/\\n/g, '\n').replace(/<br\s*\/?>/g, '\n');
  
  return normalized.split('\n').map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[1] !== undefined) {
        parts.push(<strong key={`b-${lineIdx}-${match.index}`} className="font-bold">{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        parts.push(<em key={`i-${lineIdx}-${match.index}`} className="italic">{match[2]}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <span key={lineIdx} className="block">
        {parts.length > 0 ? parts : '\u00A0'}
      </span>
    );
  });
}
