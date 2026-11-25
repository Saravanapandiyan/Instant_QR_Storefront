import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Eraser,
  FileCode,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write helpful guide content here...',
  minHeight = '240px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value);

  // Sync editor content with value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    setHtmlContent(value || '');
  }, [value]);

  const exec = (command: string, val: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, val);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      onChange(html);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      onChange(html);
    }
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextHtml = e.target.value;
    setHtmlContent(nextHtml);
    onChange(nextHtml);
  };

  const insertLink = () => {
    const url = prompt('Enter destination URL (e.g. https://example.com):', 'https://');
    if (url && url !== 'https://') {
      exec('createLink', url);
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col transition-all focus-within:border-primary"
      style={{
        backgroundColor: 'var(--adm-surface)',
        borderColor: 'var(--adm-border)',
      }}
    >
      {/* Summernote-Style Rich Text Toolbar */}
      <div
        className="px-2.5 py-1.5 border-b flex flex-wrap items-center gap-1 bg-surface-2/60 select-none"
        style={{
          borderColor: 'var(--adm-border)',
          backgroundColor: 'var(--adm-surface-2)',
        }}
      >
        {/* Headings */}
        <div className="flex items-center border-r pr-1 mr-1 gap-0.5" style={{ borderColor: 'var(--adm-border)' }}>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<h1>')}
            className="p-1.5 rounded hover:bg-surface text-xs font-bold text-muted hover:text-text cursor-pointer transition-colors"
            title="Heading 1"
          >
            <Heading1 size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<h2>')}
            className="p-1.5 rounded hover:bg-surface text-xs font-bold text-muted hover:text-text cursor-pointer transition-colors"
            title="Heading 2"
          >
            <Heading2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<h3>')}
            className="p-1.5 rounded hover:bg-surface text-xs font-bold text-muted hover:text-text cursor-pointer transition-colors"
            title="Heading 3"
          >
            <Heading3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<p>')}
            className="px-1.5 py-1 rounded hover:bg-surface text-[11px] font-bold text-muted hover:text-text cursor-pointer transition-colors"
            title="Paragraph"
          >
            ¶ Normal
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center border-r pr-1 mr-1 gap-0.5" style={{ borderColor: 'var(--adm-border)' }}>
          <button
            type="button"
            onClick={() => exec('bold')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center border-r pr-1 mr-1 gap-0.5" style={{ borderColor: 'var(--adm-border)' }}>
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Bullet List"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<blockquote>')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Blockquote"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<pre>')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Code Block"
          >
            <Code size={15} />
          </button>
        </div>

        {/* Link & Divider */}
        <div className="flex items-center border-r pr-1 mr-1 gap-0.5" style={{ borderColor: 'var(--adm-border)' }}>
          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Insert Hyperlink"
          >
            <Link size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('insertHorizontalRule')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Horizontal Divider"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-danger cursor-pointer transition-colors"
            title="Clear Formatting"
          >
            <Eraser size={15} />
          </button>
        </div>

        {/* History & Mode */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            onClick={() => exec('undo')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Undo"
          >
            <Undo size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            className="p-1.5 rounded hover:bg-surface text-muted hover:text-text cursor-pointer transition-colors"
            title="Redo"
          >
            <Redo size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isHtmlMode
                ? 'bg-primary text-white'
                : 'hover:bg-surface text-muted hover:text-text border border-border/40'
            }`}
            title="Toggle HTML Source Code View"
          >
            <FileCode size={13} />
            <span>{isHtmlMode ? 'WYSIWYG' : 'HTML'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Box */}
      {isHtmlMode ? (
        <textarea
          value={htmlContent}
          onChange={handleHtmlChange}
          placeholder="Edit raw HTML source code..."
          className="w-full p-4 font-mono text-xs focus:outline-none resize-y"
          style={{
            minHeight,
            backgroundColor: 'var(--adm-surface)',
            color: 'var(--adm-text)',
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          className="p-4 text-xs focus:outline-none overflow-y-auto prose dark:prose-invert max-w-none leading-relaxed"
          style={{
            minHeight,
            color: 'var(--adm-text)',
          }}
        />
      )}
    </div>
  );
};
