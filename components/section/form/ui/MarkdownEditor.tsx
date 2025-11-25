import { useRef, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import { TextArea } from "./TextArea.styles";
type MarkdownEditorProps = {
  id: string;
  name: string;
  value: string;
  placeholder?: string;
  rows?: number;
  width?: "full" | "1/2" | "1/3";
  hasError?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function MarkdownEditor({
  id,
  name,
  value,
  placeholder,
  rows,
  hasError,
  onChange,
  onBlur,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const applyWrap = (prefix: string, suffix: string = prefix) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = value ?? "";
    const before = current.slice(0, start);
    const selected = current.slice(start, end);
    const after = current.slice(end);

    const next = before + prefix + selected + suffix + after;
    onChange(next);

    // restore selection roughly around the wrapped content
    const newStart = before.length + prefix.length;
    const newEnd = newStart + selected.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    });
  };

  const applyBlockPrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = value ?? "";

    // Apply to whole line of the current selection
    const before = current.slice(0, start);
    // const after = current.slice(end);

    // find start of the current line
    const lineStart = before.lastIndexOf("\n") + 1;
    const line = current.slice(lineStart, end);
    const lineRest = current.slice(end);

    const hasPrefix = line.trimStart().startsWith(prefix.trim());
    const updatedLine = hasPrefix ? line.replace(prefix, "") : `${prefix}${line}`;

    const next = current.slice(0, lineStart) + updatedLine + lineRest;
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
    });
  };

  const handleBold = () => applyWrap("**");
  const handleItalic = () => applyWrap("*");
  const handleCode = () => applyWrap("`");
  const handleHeading = () => applyBlockPrefix("# ");
  const handleBulletList = () => applyBlockPrefix("- ");
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") {
        e.preventDefault();
        handleBold();
      }
      if (e.key === "i") {
        e.preventDefault();
        handleItalic();
      }
      if (e.key === "e") {
        e.preventDefault();
        handleCode();
      }
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1 text-xs">
        <button
          type="button"
          className="border-border hover:bg-muted rounded border px-2 py-1"
          onClick={handleBold}
        >
          **B**
        </button>
        <button
          type="button"
          className="border-border hover:bg-muted rounded border px-2 py-1 italic"
          onClick={handleItalic}
        >
          *i*
        </button>
        <button
          type="button"
          className="border-border hover:bg-muted rounded border px-2 py-1"
          onClick={handleHeading}
        >
          H1
        </button>
        <button
          type="button"
          className="border-border hover:bg-muted rounded border px-2 py-1"
          onClick={handleBulletList}
        >
          • List
        </button>
        <button
          type="button"
          className="border-border hover:bg-muted rounded border px-2 py-1 font-mono"
          onClick={handleCode}
        >
          {"</>"}
        </button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        <div className="flex-1">
          <TextArea
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            hasError={hasError}
            rows={rows ?? 10}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="border-border bg-muted/40 flex-1 rounded-md border p-2 text-xs md:text-sm">
          <ReactMarkdown>{value || "*Nothing to preview yet.*"}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
export default MarkdownEditor;
