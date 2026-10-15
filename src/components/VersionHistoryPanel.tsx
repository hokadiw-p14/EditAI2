import React, { useState } from 'react';
import { ProjectFile, VersionCommit } from '../types';
import {
  History,
  GitCommit,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  FileCode,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  GitCompare,
  Tag,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commits: VersionCommit[];
  currentFiles: ProjectFile[];
  activeFile: ProjectFile | null;
  onCommit: (message: string, tag?: string) => void;
  onRevert: (commit: VersionCommit) => void;
  onDeleteCommit: (id: string) => void;
  onClearHistory: () => void;
}

export const VersionHistoryPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  commits,
  currentFiles,
  activeFile,
  onCommit,
  onRevert,
  onDeleteCommit,
  onClearHistory,
}) => {
  const [newCommitMessage, setNewCommitMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Checkpoint');
  const [viewingDiffCommitId, setViewingDiffCommitId] = useState<string | null>(null);
  const [diffSelectedFilePath, setDiffSelectedFilePath] = useState<string>(activeFile?.path || '');

  if (!isOpen) return null;

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = newCommitMessage.trim() || `บันทึกเวอร์ชัน (${new Date().toLocaleTimeString()})`;
    onCommit(msg, selectedTag);
    setNewCommitMessage('');
  };

  const viewingCommit = commits.find((c) => c.id === viewingDiffCommitId);

  // Compute simple line-based diff between current file and snapshot file
  const renderDiff = () => {
    if (!viewingCommit) return null;

    const currentTargetFile = currentFiles.find(
      (f) => f.path === (diffSelectedFilePath || activeFile?.path)
    );
    const snapshotTargetFile = viewingCommit.filesSnapshot.find(
      (f) => f.path === (diffSelectedFilePath || activeFile?.path)
    );

    if (!currentTargetFile && !snapshotTargetFile) {
      return (
        <div className="p-4 text-xs text-slate-500 text-center">
          ไม่พบไฟล์นี้ในเวอร์ชันเปรียบเทียบ
        </div>
      );
    }

    const currentLines = (currentTargetFile?.content || '').split('\n');
    const snapshotLines = (snapshotTargetFile?.content || '').split('\n');

    return (
      <div className="bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] overflow-hidden max-h-96 flex flex-col">
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-200">
              เปรียบเทียบ: {diffSelectedFilePath || activeFile?.name}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            แดง = เวอร์ชั่นในอดีต / เขียว = ปัจจุบัน
          </span>
        </div>

        <div className="overflow-y-auto p-2 space-y-0.5 divide-y divide-slate-900">
          {snapshotLines.length === currentLines.length &&
          snapshotLines.join('') === currentLines.join('') ? (
            <div className="p-4 text-center text-emerald-400 text-xs">
              ✓ ไฟล์นี้เหมือนกับเวอร์ชันปัจจุบันทุกประการ ไม่มีการเปลี่ยนแปลง
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 pb-1">
                -- เวอร์ชั่นใน Commit [{viewingCommit.message}] ({snapshotLines.length} บรรทัด):
              </div>
              <div className="bg-rose-950/20 text-rose-300 p-2 rounded border border-rose-900/30 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {snapshotTargetFile?.content || '(ไฟล์ไม่มีอยู่)'}
              </div>

              <div className="text-[10px] text-slate-500 pt-2 pb-1">
                ++ เวอร์ชั่นปัจจุบัน ({currentLines.length} บรรทัด):
              </div>
              <div className="bg-emerald-950/20 text-emerald-300 p-2 rounded border border-emerald-900/30 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {currentTargetFile?.content || '(ไฟล์ไม่มีอยู่)'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] lg:w-[580px] bg-slate-900/98 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-100">
                ประวัติเวอร์ชัน (Version History)
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                {commits.length} commits
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              สร้างจุดย้อนกลับ (Checkpoints) และกู้คืนโค้ดสคริปต์เมื่อต้องการ
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Commit Form */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
          <span>บันทึกสถานะปัจจุบัน (Commit Checkpoint)</span>
        </span>

        <form onSubmit={handleCreateCommit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ระบุข้อความ เช่น: เพิ่มรูทตัวละคร, แก้บั๊ก syntax..."
              value={newCommitMessage}
              onChange={(e) => setNewCommitMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-sans"
            />

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="Checkpoint">Checkpoint</option>
              <option value="Feature">Feature</option>
              <option value="Bugfix">Bugfix</option>
              <option value="AI-Fix">AI-Fix</option>
              <option value="Release">Release</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Commit</span>
            </button>
          </div>
        </form>
      </div>

      {/* Commit List Timeline */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {commits.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center p-6">
            <History className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
            <p className="text-xs text-slate-300 font-medium">ยังไม่มีประวัติ Commit ในเครื่อง</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              พิมพ์ข้อความและกด "Commit" ด้านบนเพื่อบันทึกจุดย้อนกลับของโปรเจกต์
            </p>
          </div>
        ) : (
          commits.map((commit, idx) => {
            const isViewingDiff = viewingDiffCommitId === commit.id;
            const isLatest = idx === 0;

            const getTagColor = (tag?: string) => {
              switch (tag) {
                case 'Bugfix':
                  return 'bg-rose-950/70 text-rose-300 border-rose-800/50';
                case 'Feature':
                  return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50';
                case 'AI-Fix':
                  return 'bg-purple-950/70 text-purple-300 border-purple-800/50';
                case 'Release':
                  return 'bg-amber-950/70 text-amber-300 border-amber-800/50';
                default:
                  return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/50';
              }
            };

            return (
              <div
                key={commit.id}
                className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 space-y-2.5 transition"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      #{commit.id.slice(-6)}
                    </span>
                    {commit.tag && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTagColor(
                          commit.tag
                        )}`}
                      >
                        {commit.tag}
                      </span>
                    )}
                    {isLatest && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                        ล่าสุด (Latest)
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{commit.formattedTime}</span>
                  </span>
                </div>

                {/* Commit Message */}
                <div className="text-xs text-slate-100 font-medium leading-relaxed">
                  {commit.message}
                </div>

                {/* Meta & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>{commit.filesSnapshot.length} ไฟล์ที่บันทึกไว้</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Diff button */}
                    <button
                      onClick={() =>
                        setViewingDiffCommitId(isViewingDiff ? null : commit.id)
                      }
                      className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                        isViewingDiff
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <GitCompare className="w-3 h-3" />
                      <span>{isViewingDiff ? 'ซ่อน Diff' : 'ดู Diff'}</span>
                    </button>

                    {/* Revert Button */}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `คุณต้องการย้อนกลับโค้ดทั้งหมดไปยังเวอร์ชัน "${commit.message}" หรือไม่?`
                          )
                        ) {
                          onRevert(commit);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                      title="กู้คืนโค้ดทั้งหมดในเวอร์ชันนี้"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ย้อนกลับ (Revert)</span>
                    </button>

                    {/* Delete commit */}
                    <button
                      onClick={() => onDeleteCommit(commit.id)}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                      title="ลบ Commit นี้"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Diff Viewer if expanded */}
                {isViewingDiff && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-slate-400">เลือกไฟล์เพื่อดู Diff:</span>
                      <select
                        value={diffSelectedFilePath || activeFile?.path || ''}
                        onChange={(e) => setDiffSelectedFilePath(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none font-mono"
                      >
                        {commit.filesSnapshot.map((f) => (
                          <option key={f.path} value={f.path}>
                            {f.path}
                          </option>
                        ))}
                      </select>
                    </div>
                    {renderDiff()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {commits.length > 0 && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>ประวัติทั้งหมดบันทึกลงใน LocalStorage</span>
          <button
            onClick={() => {
              if (window.confirm('คุณต้องการล้างประวัติ Commit ทั้งหมดใช่หรือไม่?')) {
                onClearHistory();
              }
            }}
            className="text-rose-400 hover:text-rose-300 text-xs cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างประวัติทั้งหมด</span>
          </button>
        </div>
      )}
    </div>
  );
};
