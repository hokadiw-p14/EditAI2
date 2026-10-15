import React from 'react';
import { SyntaxDiagnostic } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, Wand2, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  diagnostics: SyntaxDiagnostic[];
  onSelectLine: (line: number) => void;
  onApplyFix: (diagnostic: SyntaxDiagnostic) => void;
  onAiFixAll: () => void;
  isAiFixing: boolean;
}

export const SyntaxDiagnosticsPanel: React.FC<Props> = ({
  diagnostics,
  onSelectLine,
  onApplyFix,
  onAiFixAll,
  isAiFixing,
}) => {
  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-l border-slate-800 text-slate-200">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ตัวตรวจไวยากรณ์ Ren'Py (Live Checker)</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                errors.length > 0 ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {errors.length} ข้อผิดพลาด
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                warnings.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {warnings.length} คำเตือน
            </span>
          </div>
        </div>

        {diagnostics.length > 0 && (
          <button
            onClick={onAiFixAll}
            disabled={isAiFixing}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-md text-xs font-medium shadow-md transition disabled:opacity-50 cursor-pointer"
            title="ใช้ AI (Gemini 4 Argon Thinking Mode) แก้ไขข้อผิดพลาดทั้งหมดอัตโนมัติ"
          >
            {isAiFixing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI กำลังวิเคราะห์ & แก้ไข...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>แก้ทั้งหมดด้วย AI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Diagnostics List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {diagnostics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-slate-200 font-medium text-sm">ไม่พบข้อผิดพลาดในสคริปต์</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              ไวยากรณ์ Ren'Py ถูกต้อง การย่อหน้า เครื่องหมายคำพูด และแท็กข้อความสมบูรณ์แบบ
            </p>
          </div>
        ) : (
          diagnostics.map((diag) => {
            const isError = diag.severity === 'error';
            return (
              <div
                key={diag.id}
                onClick={() => onSelectLine(diag.line)}
                className={`group p-2.5 rounded-lg border transition cursor-pointer ${
                  isError
                    ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                    : 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                      บรรทัด {diag.line}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">[{diag.rule}]</span>
                  </div>

                  {diag.fixSuggestion && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyFix(diag);
                      }}
                      className="opacity-90 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 rounded text-[11px] font-medium transition cursor-pointer"
                      title={diag.fixSuggestion.labelTh}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      <span>{diag.fixSuggestion.labelTh}</span>
                    </button>
                  )}
                </div>

                <div className="mt-1.5 text-xs text-slate-200 leading-relaxed font-sans">
                  {diag.messageTh}
                </div>

                <div className="mt-1 text-[11px] text-slate-400 font-mono">
                  {diag.messageEn}
                </div>

                {diag.fixSuggestion && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                    <span className="text-slate-400">แก้ไขเป็น:</span>
                    <span className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded truncate">
                      {diag.fixSuggestion.newText}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer tips */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>💡 คลิกที่การ์ดเพื่อข้ามไปยังบรรทัดที่เกิดข้อผิดพลาด</span>
        <span className="text-slate-500">Ren'Py 8.x Compatible</span>
      </div>
    </div>
  );
};
