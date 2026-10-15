import React from 'react';
import { EditorTab } from '../types';
import {
  Code2,
  Languages,
  Smartphone,
  Wand2,
  BookOpen,
  BrainCircuit,
  Upload,
  Download,
  FolderArchive,
  Sparkles,
  Layers,
  Save,
  Check,
  RotateCcw,
  Zap,
  History,
  Globe,
  User,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
} from 'lucide-react';

interface Props {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onOpenAiAssistant: () => void;
  onOpenVersionHistory?: () => void;
  versionCount?: number;
  onSelectSamplePreset: (presetKey: string) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadProjectZip: () => void;
  fileName: string;
  lastSavedTime?: string | null;
  isAutoSaving?: boolean;
  onManualSave?: () => void;
  onClearStorage?: () => void;
  currentUser?: any;
  onOpenAuth?: () => void;
  onOpenCloudSync?: () => void;
  lastCloudSyncedTime?: string | null;
  isCloudSyncing?: boolean;
  onTriggerCloudSync?: () => void;
  onOpenDownloadApp?: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenAiAssistant,
  onOpenVersionHistory,
  versionCount = 0,
  onSelectSamplePreset,
  onUploadFile,
  onDownloadProjectZip,
  fileName,
  lastSavedTime,
  isAutoSaving = false,
  onManualSave,
  onClearStorage,
  currentUser,
  onOpenAuth,
  onOpenCloudSync,
  lastCloudSyncedTime,
  isCloudSyncing = false,
  onTriggerCloudSync,
  onOpenDownloadApp,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 select-none">
      {/* Upper Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100 tracking-tight">
                Ren'Py &amp; APK Code Studio
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-semibold">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ผู้ช่วย อ่าน/แก้ไข สคริปต์ Ren'Py, โค้ดเกม, และโครงสร้าง APK พร้อมระบบตรวจไวยากรณ์เรียลไทม์
            </p>
          </div>
        </div>

        {/* Center / Right: Presets & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Samples Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 hidden sm:inline">โหลดตัวอย่าง:</span>
            <select
              onChange={(e) => {
                if (e.target.value) onSelectSamplePreset(e.target.value);
              }}
              defaultValue=""
              className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer font-medium"
            >
              <option value="" disabled>-- เลือกสคริปต์ตัวอย่าง --</option>
              <option value="syntax_error_test">🔴 ทดสอบตัวตรวจไวยากรณ์ (Syntax Errors Demo)</option>
              <option value="clean_vn_script">🟢 โค้ดเกม Visual Novel มาตรฐาน (Clean Script)</option>
              <option value="android_apk_mod">📱 เทมเพลต Android APK Modding</option>
            </select>
          </div>

          {/* Upload Button */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>เปิดไฟล์ / APK</span>
            <input
              type="file"
              accept=".rpy,.py,.txt,.xml,.json,.apk,.zip,.rpa"
              onChange={onUploadFile}
              className="hidden"
            />
          </label>

          {/* Main Download App (APK / ZIP) Trigger */}
          <button
            onClick={onOpenDownloadApp || onDownloadProjectZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/20 transition border border-emerald-500/50 cursor-pointer"
            title="ดาวน์โหลดตัวแอพ: ไฟล์แพ็กเกจ .APK สำหรับ Android หรือไฟล์ .ZIP ทั้งหมด"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="font-bold">ดาวน์โหลดแอพ (APK / ZIP)</span>
          </button>

          {/* Auto-Save Status Badge & Manual Trigger */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            {isAutoSaving ? (
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[11px] font-medium">กำลังบันทึก...</span>
              </div>
            ) : lastSavedTime ? (
              <div
                className="flex items-center gap-1 text-emerald-400 cursor-help"
                title={`บันทึกอัตโนมัติลง LocalStorage ล่าสุดเมื่อ ${lastSavedTime}`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-slate-300 font-mono hidden md:inline">
                  เซฟอัตโนมัติ: <span className="text-emerald-400 font-bold">{lastSavedTime}</span>
                </span>
                <span className="text-[11px] text-emerald-400 md:hidden font-mono font-bold">
                  {lastSavedTime}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">ยังไม่ได้เซฟ</span>
            )}

            {onManualSave && (
              <button
                onClick={onManualSave}
                className="ml-1 p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
                title="กดเพื่อบันทึกลงในเครื่องเดี๋ยวนี้ (Save Now)"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            )}

            {onClearStorage && (
              <button
                onClick={() => {
                  if (window.confirm('คุณต้องการรีเซ็ตโปรเจกต์ที่เซฟไว้ และกลับไปใช้ค่าเริ่มต้นหรือไม่?')) {
                    onClearStorage();
                  }
                }}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                title="ล้างข้อมูลที่บันทึกไว้ใน LocalStorage และเริ่มใหม่"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Cloud Sync Status Badge & Button */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            {currentUser ? (
              <div
                onClick={onOpenCloudSync}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition"
                title="คลิกเพื่อจัดการโปรเจกต์และการซิงค์บน Firestore"
              >
                {isCloudSyncing ? (
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[11px] font-medium hidden sm:inline">กำลังซิงค์คลาวด์...</span>
                  </div>
                ) : lastCloudSyncedTime ? (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-slate-300 font-mono hidden md:inline">
                      คลาวด์: <span className="text-emerald-400 font-bold">{lastCloudSyncedTime}</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 md:hidden font-mono font-bold">
                      {lastCloudSyncedTime}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400">
                    <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px]">คลาวด์: พร้อมซิงค์</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenCloudSync || onOpenAuth}
                className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                title="เข้าสู่ระบบเพื่อเปิดใช้งานการซิงค์ไฟล์โปรเจกต์ผ่าน Firestore ข้ามอุปกรณ์"
              >
                <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] hidden sm:inline">ซิงค์คลาวด์ (ยังไม่ล็อกอิน)</span>
                <span className="text-[11px] sm:hidden">คลาวด์</span>
              </button>
            )}

            {currentUser && onTriggerCloudSync && (
              <button
                onClick={onTriggerCloudSync}
                disabled={isCloudSyncing}
                className="ml-0.5 p-1 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 rounded transition cursor-pointer disabled:opacity-50"
                title="กดเพื่อส่งไฟล์ปัจจุบันขึ้น Firestore ทันที (Cloud Sync Now)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Version History Button */}
          {onOpenVersionHistory && (
            <button
              onClick={onOpenVersionHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="เปิดแผงประวัติเวอร์ชัน (Commit & Revert History)"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">ประวัติเวอร์ชัน</span>
              {versionCount > 0 && (
                <span className="bg-indigo-950 text-indigo-300 font-mono text-[10px] px-1.5 py-0.2 rounded-full border border-indigo-700/50">
                  {versionCount}
                </span>
              )}
            </button>
          )}

          {/* AI Thinking Mode Badge & Button */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-purple-600/20 transition cursor-pointer"
          >
            <div className="relative">
              <BrainCircuit className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span>AI Thinking Assistant</span>
            <span className="text-[10px] bg-purple-950/80 px-1 py-0.5 rounded border border-purple-400/40 font-mono">
              HIGH
            </span>
          </button>

          {/* User Account & Login / Domain Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                currentUser
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-md'
              }`}
              title={currentUser ? 'จัดการบัญชีและโดเมน' : 'เข้าสู่ระบบหรือสมัครสมาชิก'}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold">
                {currentUser?.displayName
                  ? currentUser.displayName[0].toUpperCase()
                  : currentUser?.email
                  ? currentUser.email[0].toUpperCase()
                  : <User className="w-3 h-3 text-slate-300" />}
              </div>
              <span className="max-w-[100px] truncate">
                {currentUser
                  ? currentUser.displayName || currentUser.email?.split('@')[0]
                  : 'เข้าสู่ระบบ / สมัคร'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="px-4 flex items-center space-x-1 overflow-x-auto text-xs font-medium border-t border-slate-900 bg-slate-950/90 scrollbar-none">
        <button
          onClick={() => onTabChange('editor')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'editor'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Editor &amp; ตัวตรวจไวยากรณ์ (Syntax Checker)</span>
        </button>

        <button
          onClick={() => onTabChange('translator')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'translator'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>แปลบทสนทนา Visual Novel (tl/thai/)</span>
        </button>

        <button
          onClick={() => onTabChange('apk')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'apk'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>โครงสร้าง APK &amp; Modding บน Android</span>
        </button>

        <button
          onClick={() => onTabChange('cheat_generator')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'cheat_generator'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>ตัวสร้าง Cheat Menu &amp; Console</span>
        </button>

        <button
          onClick={() => onTabChange('connectors')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'connectors'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>เชื่อมต่อภายนอก (Gemini+OpenAI+Codex+GitHub)</span>
        </button>

        <button
          onClick={() => onTabChange('docs')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'docs'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>คู่มือและคลังความรู้ Ren'Py</span>
        </button>
      </div>
    </header>
  );
};
