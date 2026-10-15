import React, { useState, useRef, useEffect } from 'react';
import { SyntaxDiagnostic } from '../types';
import {
  Copy,
  Download,
  Search,
  Replace,
  Check,
  Code2,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  code: string;
  fileName: string;
  onChange: (newCode: string) => void;
  diagnostics: SyntaxDiagnostic[];
  selectedLine?: number | null;
  onSelectLine?: (line: number) => void;
  lastSavedTime?: string | null;
  isAutoSaving?: boolean;
}

export const CodeEditor: React.FC<Props> = ({
  code,
  fileName,
  onChange,
  diagnostics,
  selectedLine,
  onSelectLine,
  lastSavedTime,
  isAutoSaving = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');

  // Map diagnostics by line number for fast gutter lookup
  const lineDiagnosticMap = React.useMemo(() => {
    const map = new Map<number, SyntaxDiagnostic>();
    diagnostics.forEach((d) => {
      // Prioritize error over warning if multiple on same line
      if (!map.has(d.line) || d.severity === 'error') {
        map.set(d.line, d);
      }
    });
    return map;
  }, [diagnostics]);

  // Scroll to selected line when clicked in diagnostics panel
  useEffect(() => {
    if (selectedLine && textareaRef.current) {
      const lineHeight = fontSize * 1.5;
      const targetScroll = (selectedLine - 3) * lineHeight;
      textareaRef.current.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [selectedLine, fontSize]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleTextareaClickOrKeyUp = () => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      const textUpToCursor = code.substring(0, pos);
      const linesUpToCursor = textUpToCursor.split('\n');
      const curLine = linesUpToCursor.length;
      const curCol = linesUpToCursor[linesUpToCursor.length - 1].length + 1;
      setCursorPos({ line: curLine, col: curCol });
      if (onSelectLine) {
        onSelectLine(curLine);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'script.rpy';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchReplace = (all: boolean = false) => {
    if (!searchQuery) return;
    if (all) {
      const updated = code.replaceAll(searchQuery, replaceQuery);
      onChange(updated);
    } else {
      const updated = code.replace(searchQuery, replaceQuery);
      onChange(updated);
    }
  };

  // Quick Snippet Insert
  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    onChange(newCode);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + snippet.length;
      }
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Editor Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            {fileName}
          </span>
          <span className="text-xs text-slate-500 font-mono">({lines.length} บรรทัด)</span>
        </div>

        {/* Quick Snippets Bar */}
        <div className="hidden lg:flex items-center gap-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1">แทรกด่วน:</span>
          <button
            onClick={() => insertSnippet('\n    s "สวัสดี! ยินดีที่ได้รู้จักนะ"\n')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 cursor-pointer"
          >
            + บทสนทนา
          </button>
          <button
            onClick={() => insertSnippet('\n    menu:\n        "ตัวเลือก 1":\n            jump choice_1\n        "ตัวเลือก 2":\n            jump choice_2\n')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 cursor-pointer"
          >
            + Menu เมนู
          </button>
          <button
            onClick={() => insertSnippet('\n    scene bg classroom with fade\n')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 cursor-pointer"
          >
            + Scene ฉาก
          </button>
          <button
            onClick={() => insertSnippet('\n    $ money += 100\n')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 cursor-pointer"
          >
            + $ Python
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded hover:bg-slate-800 transition cursor-pointer ${
              showSearch ? 'bg-indigo-900/50 text-indigo-300' : 'text-slate-400'
            }`}
            title="ค้นหาและแทนที่ (Search & Replace)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center border border-slate-700 rounded bg-slate-800/80 px-1">
            <button
              onClick={() => setFontSize(Math.max(11, fontSize - 1))}
              className="p-1 hover:text-white text-slate-400 cursor-pointer"
              title="ลดขนาดตัวอักษร"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-300">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(22, fontSize + 1))}
              className="p-1 hover:text-white text-slate-400 cursor-pointer"
              title="เพิ่มขนาดตัวอักษร"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition cursor-pointer"
            title="คัดลอกโค้ดทั้งหมด"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>

          <button
            onClick={downloadFile}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition cursor-pointer"
            title="ดาวน์โหลดไฟล์สคริปต์นี้"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด .rpy</span>
          </button>
        </div>
      </div>

      {/* Search & Replace Floating Bar */}
      {showSearch && (
        <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-slate-200 w-36 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
            <Replace className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="แทนที่ด้วย..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent outline-none text-slate-200 w-36 text-xs"
            />
          </div>

          <button
            onClick={() => handleSearchReplace(false)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
          >
            แทนที่
          </button>
          <button
            onClick={() => handleSearchReplace(true)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
          >
            แทนที่ทั้งหมด
          </button>
        </div>
      )}

      {/* Main Editor Body with Gutter */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="select-none bg-slate-950 border-r border-slate-800/80 text-slate-600 font-mono py-3 px-2 flex flex-col overflow-hidden text-right"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize * 1.5}px`,
            minWidth: '3.8rem',
          }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const diag = lineDiagnosticMap.get(lineNum);
            const isSelected = selectedLine === lineNum;

            return (
              <div
                key={i}
                onClick={() => onSelectLine && onSelectLine(lineNum)}
                className={`flex items-center justify-end gap-1 px-1 cursor-pointer transition ${
                  isSelected ? 'bg-indigo-950/60 text-indigo-300 font-bold' : 'hover:text-slate-400'
                }`}
                title={diag ? `${diag.severity.toUpperCase()}: ${diag.messageTh}` : undefined}
              >
                {diag && (
                  diag.severity === 'error' ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  )
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area for Editing */}
        <div className="relative flex-1 h-full overflow-hidden bg-slate-950">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onClick={handleTextareaClickOrKeyUp}
            onKeyUp={handleTextareaClickOrKeyUp}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full p-3 bg-transparent text-slate-100 font-mono resize-none outline-none overflow-auto border-none focus:ring-0"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: `${fontSize * 1.5}px`,
              tabSize: 4,
            }}
          />
        </div>
      </div>

      {/* Editor Footer Status Bar */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-mono">
            แถว {cursorPos.line}, คอลัมน์ {cursorPos.col}
          </span>
          <span className="text-slate-600">|</span>
          <span>ช่องไฟ: 4 ช่อง (Space Tab)</span>
          <span className="text-slate-600">|</span>
          <span>UTF-8</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
            {isAutoSaving ? (
              <span className="text-indigo-400 animate-pulse">💾 กำลังเซฟ...</span>
            ) : lastSavedTime ? (
              <span className="text-emerald-400">💾 เซฟอัตโนมัติ ({lastSavedTime})</span>
            ) : (
              <span>💾 LocalStorage</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {diagnostics.length === 0 ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>ไวยากรณ์สมบูรณ์ (No syntax errors)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium">
              <span className="text-rose-400 flex items-center gap-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {diagnostics.filter((d) => d.severity === 'error').length} ข้อผิดพลาด
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {diagnostics.filter((d) => d.severity === 'warning').length} คำเตือน
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
