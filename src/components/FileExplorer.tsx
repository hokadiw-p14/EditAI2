import React, { useState } from 'react';
import { ProjectFile } from '../types';
import {
  FileCode,
  Folder,
  FilePlus,
  Trash2,
  File,
  Code2,
  ChevronRight,
  Search,
} from 'lucide-react';

interface Props {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (path: string) => void;
}

export const FileExplorer: React.FC<Props> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [filterText, setFilterText] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(filterText.toLowerCase()) ||
    f.path.toLowerCase().includes(filterText.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.rpy')) return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    if (fileName.endsWith('.py')) return <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (fileName.endsWith('.xml')) return <Code2 className="w-4 h-4 text-amber-400 shrink-0" />;
    if (fileName.endsWith('.rpyc') || fileName.endsWith('.rpa')) return <File className="w-4 h-4 text-purple-400 shrink-0" />;
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-slate-200 select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-300">
          <Folder className="w-4 h-4 text-indigo-400" />
          <span>ไฟล์ในโปรเจกต์ ({files.length})</span>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition cursor-pointer"
          title="สร้างไฟล์ใหม่"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาชื่อไฟล์..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-transparent text-slate-200 outline-none text-xs"
          />
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="e.g. script.rpy"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 outline-none font-mono"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filteredFiles.map((file) => {
          const isActive = activeFile?.path === file.path;
          return (
            <div
              key={file.path}
              onClick={() => onSelectFile(file)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition text-xs ${
                isActive
                  ? 'bg-indigo-950/70 text-indigo-200 font-medium border border-indigo-800/50'
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.name)}
                <span className="truncate font-mono">{file.name}</span>
                {file.modified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </div>

              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition cursor-pointer"
                  title="ลบไฟล์"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
