import { useMemo } from 'react';

const TECHNICAL_KEYWORDS = [
  'React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'API', 'JSON', 'Node.js',
  'Component', 'Props', 'State', 'Hook', 'Effect', 'Context', 'Reducer', 'Interface',
  'Type', 'Function', 'Variable', 'Async', 'Await', 'Promise', 'Array', 'Object',
  'Vite', 'Tailwind', 'SQL', 'Database', 'Git', 'GitHub', 'CLI', 'ESLint', 'Prettier'
];

const CODE_KEYWORDS = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'export', 'from', 'default', 'class', 'extends', 'super', 'this',
  'new', 'try', 'catch', 'finally', 'throw', 'await', 'async', 'yield', 'type',
  'interface', 'enum', 'implements', 'readonly', 'private', 'protected', 'public',
  'static', 'as', 'any', 'unknown', 'never', 'void', 'number', 'string', 'boolean'
];

export function FlashcardSurface({ content, className }: { content: string, className?: string }) {
  const formattedContent = useMemo(() => {
    try {
      // 1. Handle Code Blocks (triple backticks)
      let processedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        let highlightedCode = code.trim();
        
        // Highlight strings
        highlightedCode = highlightedCode.replace(/(['"`])(.*?)\1/g, '<span class="text-emerald-500 dark:text-emerald-400">$1$2$1</span>');
        
        // Highlight keywords
        CODE_KEYWORDS.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'g');
          highlightedCode = highlightedCode.replace(regex, `<span class="text-sky-600 dark:text-sky-400 font-semibold">${keyword}</span>`);
        });

        // Highlight comments
        highlightedCode = highlightedCode.replace(/\/\/(.*)/g, '<span class="text-zinc-500 italic">//$1</span>');

        return `<pre class="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto border border-zinc-200 dark:border-zinc-800 shadow-inner"><code>${highlightedCode}</code></pre>`;
      });

      // 2. Handle technical keywords in text
      // We only apply this to text NOT already inside a tag
      const parts = processedContent.split(/(<[^>]*>)/g);
      processedContent = parts.map(part => {
        if (part.startsWith('<')) return part;
        
        let partProcessed = part;
        TECHNICAL_KEYWORDS.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'g');
          partProcessed = partProcessed.replace(regex, `<span class="bg-primary/5 text-primary font-semibold px-1 rounded-sm border-b border-primary/20 transition-colors cursor-default">${keyword}</span>`);
        });
        return partProcessed;
      }).join('');

      // 3. Parser for Rich Text and Markdown-lite
      processedContent = processedContent
        // Support Markdown-lite for backward compatibility and quick typing
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-border">$1</code>')
        
        // Ensure HTML tags from the rich editor are styled correctly
        .replace(/<strong>(.*?)<\/strong>/g, '<strong class="text-primary font-bold">$1</strong>')
        .replace(/<em>(.*?)<\/em>/g, '<em class="italic opacity-90">$1</em>')
        .replace(/<mark>(.*?)<\/mark>/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 px-1 rounded-sm">$1</mark>')
        .replace(/<code class="inline-code">(.*?)<\/code>/g, '<code class="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-border">$1</code>')
        .replace(/<span class="(.*?)">(.*?)<\/span>/g, '<span class="$1">$2</span>')
        
        // Handle newlines if they are not already handled by HTML tags
        .replace(/\n/g, (match, offset, string) => {
          const preStart = string.lastIndexOf('<pre', offset);
          const preEnd = string.lastIndexOf('</pre>', offset);
          if (preStart > preEnd) return match;
          
          // If the content looks like it has HTML blocks (div, p, br), don't add extra <br>
          if (string.includes('<div') || string.includes('<p') || string.includes('<br')) return match;
          
          return '<br />';
        });

      return <div className={cn("rich-text-content", className)} dangerouslySetInnerHTML={{ __html: processedContent }} />;
    } catch (e) {
      console.error('FlashcardSurface rendering error:', e);
      return <div className={className}>{content}</div>;
    }
  }, [content, className]);

  return formattedContent;
}

// Small helper to avoid importing cn everywhere in this file if not needed
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
