import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const formatMarkdown = (text: string): string => {
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Numbered lists: 1. item
    .replace(/^(\d+)\.\s+(.*)$/gm, '<li>$2</li>')
    // Bullet lists: - item
    .replace(/^-\s+(.*)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
};

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  return (
    <div 
      className={cn(
        "text-sm leading-relaxed prose prose-sm max-w-none",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
        "prose-strong:font-semibold prose-em:italic",
        className
      )}
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} 
    />
  );
};
