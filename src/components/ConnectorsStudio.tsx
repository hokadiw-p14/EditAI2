import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../types';
import {
  Cpu,
  Github,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ArrowRight,
  Code2,
  RefreshCw,
  ExternalLink,
  Zap,
  Share2,
} from 'lucide-react';

interface Props {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  onAddFiles: (newFiles: ProjectFile[]) => void;
  onOpenFile: (file: ProjectFile) => void;
  onShowToast: (msg: string) => void;
}

export const ConnectorsStudio: React.FC<Props> = ({
  files,
  activeFile,
  onAddFiles,
  onOpenFile,
  onShowToast,
}) => {
  const [connectorsStatus, setConnectorsStatus] = useState<any>({
    gemini: { connected: true, name: 'Gemini 4 Argon (Thinking: High)' },
    openai: { connected: true, name: 'OpenAI GPT-4o / Codex' },
    github: { connected: true, name: 'GitHub Integration' },
  });

  // GitHub import state
  const [githubRepoInput, setGithubRepoInput] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [isImportingGithub, setIsImportingGithub] = useState(false);
  const [isExportingGist, setIsExportingGist] = useState(false);
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  // OpenAI / Codex playground state
  const [codexPrompt, setCodexPrompt] = useState('แปลงฟังก์ชัน Python นี้ให้เป็น Ren\'Py Screen พร้อมปุ่ม Action');
  const [codexResult, setCodexResult] = useState('');
  const [isCodexLoading, setIsCodexLoading] = useState(false);
  const [codexEngineUsed, setCodexEngineUsed] = useState('');

  // Fetch status on mount
  useEffect(() => {
    fetch('/api/connectors/status')
      .then((res) => res.json())
      .then((data) => setConnectorsStatus(data))
      .catch((err) => console.warn('Could not fetch connector status:', err));
  }, []);

  // Handle GitHub import
  const handleImportGithub = async (repoToImport?: string) => {
    const target = repoToImport || githubRepoInput;
    if (!target.trim()) {
      onShowToast('กรุณาระบุ URL หรือชื่อ repository เช่น owner/repo');
      return;
    }

    setIsImportingGithub(true);
    onShowToast(`กำลังเชื่อมต่อไปยัง GitHub และดาวน์โหลดสคริปต์จาก ${target}...`);

    try {
      const res = await fetch('/api/github/import-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: target.trim(), branch: githubBranch }),
      });

      const data = await res.json();
      if (data.success && data.files && data.files.length > 0) {
        onAddFiles(data.files);
        onOpenFile(data.files[0]);
        onShowToast(`นำเข้าสำเร็จ ${data.files.length} ไฟล์จาก ${data.repo}!`);
      } else {
        throw new Error(data.error || 'No matching files found in repository');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('เกิดข้อผิดพลาดในการดึงข้อมูลจาก GitHub: ' + err.message);
    } finally {
      setIsImportingGithub(false);
    }
  };

  // Handle GitHub Gist export
  const handleExportGist = async () => {
    setIsExportingGist(true);
    onShowToast('กำลังสร้าง GitHub Gist จากไฟล์โปรเจกต์...');

    try {
      const res = await fetch('/api/github/export-gist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          description: `Ren'Py & APK Project Export (${files.length} files)`,
          isPublic: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.gistUrl) {
        setGistUrl(data.gistUrl);
        onShowToast('ส่งออกเป็น GitHub Gist สำเร็จแล้ว!');
      } else {
        throw new Error(data.error || 'Failed to export to Gist');
      }
    } catch (err: any) {
      onShowToast(err.message || 'ไม่สามารถสร้าง Gist ได้');
    } finally {
      setIsExportingGist(false);
    }
  };

  // Run OpenAI / Codex transformation
  const handleRunCodex = async () => {
    if (!codexPrompt.trim()) return;
    setIsCodexLoading(true);
    setCodexResult('');

    try {
      const res = await fetch('/api/ai/openai-codex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: codexPrompt,
          code: activeFile?.content || '',
          mode: 'Ren\'Py Code Generation & Codex Optimization',
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setCodexResult(data.result);
        setCodexEngineUsed(data.provider || 'OpenAI Codex');
        onShowToast('ประมวลผลโค้ดด้วย Codex สำเร็จ!');
      } else {
        throw new Error(data.error || 'Failed to process request');
      }
    } catch (err: any) {
      onShowToast('เกิดข้อผิดพลาดในการเรียกใช้ Codex: ' + err.message);
    } finally {
      setIsCodexLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              ศูนย์เชื่อมต่อภายนอก (Gemini + OpenAI + Codex + GitHub Connectors)
            </h2>
            <p className="text-xs text-slate-400">
              ผสานการทำงานระหว่างโมเดล Google Gemini, OpenAI Codex สำหรับวิเคราะห์โค้ด และระบบ Import/Export ผ่าน GitHub
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto w-full space-y-6">
        {/* 3 Connectors Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Google Gemini */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-sm text-slate-100">Google Gemini</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>เชื่อมต่อแล้ว</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                โมเดล <b>gemini-4-argon</b> เปิดใช้งาน <b>Thinking Mode: HIGH</b>
              </p>
              <p className="text-[11px] text-slate-400">
                รับผิดชอบการวิเคราะห์โครงสร้างเกมเชิงลึก, แก้ไขไวยากรณ์ Ren'Py แบบ Real-time, และแปลภาษาไทยแบบคงแท็กคำสั่ง
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-indigo-400 font-mono">
              <span>Thinking: HIGH</span>
              <span>พร้อมใช้งาน</span>
            </div>
          </div>

          {/* Card 2: OpenAI & Codex */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold text-sm text-slate-100">OpenAI &amp; Codex</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>เชื่อมต่อแล้ว</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                โมเดล <b>GPT-4o / Codex Code Engine</b>
              </p>
              <p className="text-[11px] text-slate-400">
                เชี่ยวชาญการแปลงสคริปต์ Python ใน Ren'Py, Refactoring โครงสร้างโปรเจกต์, และปรับแต่งประสิทธิภาพโค้ดเกม
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
              <span>GPT-4o / Codex</span>
              <span>พร้อมใช้งาน</span>
            </div>
          </div>

          {/* Card 3: GitHub Integration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-sm text-slate-100">GitHub Connector</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>เชื่อมต่อแล้ว</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                <b>REST API v3 &amp; Git Raw Trees</b>
              </p>
              <p className="text-[11px] text-slate-400">
                ดึงสคริปต์ <code>.rpy</code> จาก GitHub repository เข้ามาแก้ไขได้ทันที และส่งออกเป็น GitHub Gist
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-purple-400 font-mono">
              <span>REST &amp; Raw Trees</span>
              <span>พร้อมใช้งาน</span>
            </div>
          </div>
        </div>

        {/* Section 1: GitHub Repository Importer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  นำเข้าไฟล์จาก GitHub (GitHub Repository Importer)
                </h3>
                <p className="text-xs text-slate-400">
                  ดาวน์โหลดสคริปต์ Ren'Py (.rpy), โมดูล Python, หรือโค้ดจาก GitHub เข้าสู่สตูดิโอโดยตรง
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="ใส่ชื่อ repository เช่น renpy/renpy หรือ URL เต็ม"
              value={githubRepoInput}
              onChange={(e) => setGithubRepoInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
            />
            <input
              type="text"
              placeholder="Branch (main/master)"
              value={githubBranch}
              onChange={(e) => setGithubBranch(e.target.value)}
              className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => handleImportGithub()}
              disabled={isImportingGithub}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md"
            >
              {isImportingGithub ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังดาวน์โหลด...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>นำเข้าจาก GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Repositories */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">หรือคลิกเลือกโปรเจกต์ตัวอย่างยอดนิยม:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleImportGithub('CensoredUsername/unrpyc')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px] font-mono cursor-pointer transition"
              >
                📦 CensoredUsername/unrpyc (Ren'Py Decompiler)
              </button>
              <button
                onClick={() => handleImportGithub('renpy/tutorial')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px] font-mono cursor-pointer transition"
              >
                🎮 renpy/tutorial (Official VN Tutorial)
              </button>
            </div>
          </div>

          {/* Export to Gist */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              ต้องการแชร์โค้ดโปรเจกต์นี้ไปยัง GitHub Gist หรือไม่?
            </span>
            <div className="flex items-center gap-2">
              {gistUrl && (
                <a
                  href={gistUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                >
                  <span>เปิดดู Gist</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={handleExportGist}
                disabled={isExportingGist}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{isExportingGist ? 'กำลังส่งออก...' : 'ส่งออกเป็น GitHub Gist'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: OpenAI & Codex Playground */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  OpenAI &amp; Codex Code Engine (Transpiler &amp; Optimizer)
                </h3>
                <p className="text-xs text-slate-400">
                  สั่งการ Codex เพื่อ Refactor โค้ด, แปลงฟังก์ชัน Python เป็นหน้าจอ Ren'Py Screen, หรือสร้างมินิเกม
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ไฟล์ที่นำมาเป็นบริบท: <code className="text-indigo-300 font-mono">{activeFile?.name || 'ไม่มี'}</code></span>
              <span className="text-[11px] text-emerald-400 font-medium">Codex Engine Active</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={codexPrompt}
                onChange={(e) => setCodexPrompt(e.target.value)}
                placeholder="สั่งการ Codex เช่น: เพิ่มระบบ Inventory ในหน้าจอ screen, สร้างคำสั่ง Rollback..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
              />
              <button
                onClick={handleRunCodex}
                disabled={isCodexLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
              >
                {isCodexLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Codex กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>รันด้วย Codex</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Codex Output Area */}
          {codexResult && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ผลลัพธ์จาก {codexEngineUsed}:</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codexResult);
                    onShowToast('คัดลอกผลลัพธ์ของ Codex แล้ว!');
                  }}
                  className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                >
                  คัดลอกโค้ด
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                {codexResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
