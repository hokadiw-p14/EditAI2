import React, { useState } from 'react';
import { ProjectFile } from '../types';
import { parseApkOrZipFile, exportModifiedZip, ApkAnalysisResult } from '../utils/apkReader';
import { buildRenpyApkBlob } from '../utils/apkBuilder';
import {
  Smartphone,
  Upload,
  FileCode,
  PackageCheck,
  ShieldAlert,
  Terminal,
  Type,
  Download,
  CheckCircle,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

interface Props {
  onOpenFileInEditor: (file: ProjectFile) => void;
  onAddFilesToProject: (files: ProjectFile[]) => void;
}

export const ApkModStudio: React.FC<Props> = ({ onOpenFileInEditor, onAddFilesToProject }) => {
  const [apkResult, setApkResult] = useState<ApkAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [activeGuideTab, setActiveGuideTab] = useState<'mt_manager' | 'pc_apktool' | 'rpyc_decompile' | 'thai_font'>('mt_manager');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusText('กำลังแกะโครงสร้างไฟล์ APK / ZIP...');

    try {
      const res = await parseApkOrZipFile(file);
      setApkResult(res);
      onAddFilesToProject(res.files);
      setStatusText(`วิเคราะห์สำเร็จ! พบไฟล์ทั้งหมด ${res.files.length} รายการ (ไฟล์เกม ${res.gameFilesCount} ไฟล์)`);
    } catch (err: any) {
      console.error(err);
      setStatusText('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Inject 00_mod_console.rpy patch into project files
  const handleInjectDeveloperConsole = () => {
    const patchContent = `# Ren'Py APK Developer Console Patch
# Created by Ren'Py & APK Code Studio
init 999 python:
    config.developer = True
    config.console = True
    config.fast_skipping = True
    config.rollback_enabled = True

screen mod_quick_touch_button():
    zorder 999
    frame:
        xalign 0.98
        yalign 0.02
        background "#000000aa"
        textbutton "⚡ DEV CONSOLE" action [Function(renpy.toggle_console)] text_color "#00ffcc" text_size 18
`;
    const newFile: ProjectFile = {
      name: '00_mod_dev_console.rpy',
      path: 'assets/x-game/game/00_mod_dev_console.rpy',
      content: patchContent,
      isBinary: false,
      modified: true,
    };

    onAddFilesToProject([newFile]);
    onOpenFileInEditor(newFile);
    setStatusText('สร้างไฟล์ 00_mod_dev_console.rpy สำเร็จ! เปิดในหน้า Editor ให้แล้ว');
  };

  // Inject Thai Font configuration
  const handleInjectThaiFont = () => {
    const fontPatch = `# Ren'Py Thai Font & UTF-8 Configuration
# นำฟอนต์ภาษาไทย เช่น sarabun.ttf หรือ kanit.ttf ไปวางใน game/fonts/
init -1 python:
    gui.text_font = "fonts/sarabun.ttf"
    gui.name_text_font = "fonts/sarabun.ttf"
    gui.interface_text_font = "fonts/sarabun.ttf"
    gui.button_text_font = "fonts/sarabun.ttf"
    gui.choice_button_text_font = "fonts/sarabun.ttf"
    gui.text_size = 28
`;
    const newFile: ProjectFile = {
      name: '00_thai_font_config.rpy',
      path: 'assets/x-game/game/00_thai_font_config.rpy',
      content: fontPatch,
      isBinary: false,
      modified: true,
    };

    onAddFilesToProject([newFile]);
    onOpenFileInEditor(newFile);
    setStatusText('สร้างไฟล์ 00_thai_font_config.rpy สำเร็จ! โปรดวางฟอนต์ภาษาไทยใน game/fonts/');
  };

  const handleDownloadZip = async () => {
    if (!apkResult) return;
    setStatusText('กำลังรวมไฟล์และสร้าง ZIP สำหรับดาวน์โหลด...');
    const blob = await exportModifiedZip(apkResult.files);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patched_renpy_assets_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusText('ดาวน์โหลด ZIP สำเร็จแล้ว!');
  };

  const handleDownloadApk = async () => {
    if (!apkResult) return;
    setStatusText('กำลังสร้างและแพ็กเกจไฟล์ Android APK (.apk)...');
    try {
      const blob = await buildRenpyApkBlob(apkResult.files, {
        appName: apkResult.packageName
          ? apkResult.packageName.split('.').pop() || 'RenPy Game'
          : 'RenPy Game',
        packageName: apkResult.packageName || 'com.renpy.modded',
        versionName: '1.0.0',
        versionCode: 1,
        orientation: 'sensorLandscape',
        includeDevConsole: true,
        includeThaiFont: true,
        minSdkVersion: 21,
        targetSdkVersion: 34,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renpy_modded_${Date.now()}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusText('ดาวน์โหลดไฟล์ .APK สำเร็จแล้ว!');
    } catch (err: any) {
      console.error(err);
      setStatusText('เกิดข้อผิดพลาดในการสร้าง APK: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              สตูดิโอตรวจสอบและ Modding ไฟล์ APK / Android Ren'Py
            </h2>
            <p className="text-xs text-slate-400">
              อัปโหลด APK เพื่อตรวจสอบโครงสร้าง assets/x-game/, ปลดล็อก Developer Console, แปลภาษา และใส่ Mod
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium cursor-pointer transition shadow-md">
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลด APK / ZIP</span>
            <input
              type="file"
              accept=".apk,.zip,.rpa"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {apkResult && (
            <>
              <button
                onClick={handleDownloadApk}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-md"
                title="ดาวน์โหลดโครงสร้างและเกมทั้งหมดเป็นไฟล์แพ็กเกจ .apk"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดเป็น .APK</span>
              </button>

              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition cursor-pointer border border-slate-700"
                title="ดาวน์โหลดไฟล์ทั้งหมดเป็น .ZIP"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>ดาวน์โหลด ZIP</span>
              </button>
            </>
          )}
        </div>
      </div>

      {statusText && (
        <div className="px-4 py-2 bg-indigo-950/60 border-b border-indigo-900/40 text-xs text-indigo-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>{statusText}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: APK Analysis or Upload Box */}
        <div className="lg:col-span-7 space-y-4">
          {!apkResult ? (
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-600/60 rounded-xl p-8 text-center bg-slate-900/40 transition flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400 mb-3">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                ลากไฟล์เกม .APK หรือ .ZIP มาวางที่นี่
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                ระบบจะวิเคราะห์ไฟล์ AndroidManifest.xml, โฟลเดอร์ assets/x-game/game, สคริปต์ .rpy และแพ็กเกจเกมให้โดยอัตโนมัติ
              </p>
              <label className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer transition">
                เลือกไฟล์จากอุปกรณ์
                <input
                  type="file"
                  accept=".apk,.zip,.rpa"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* APK Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-sm text-slate-100">
                      ข้อมูลแพ็กเกจ APK
                    </span>
                  </div>
                  {apkResult.isRenpyApp ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ ตรวจพบเอนจิน Ren'Py สำหรับ Android
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                      ไม่พบโครงสร้างมาตรฐาน Ren'Py
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    <span className="text-slate-400 block mb-0.5">Package Name:</span>
                    <span className="font-mono text-indigo-300 font-semibold truncate block">
                      {apkResult.packageName}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    <span className="text-slate-400 block mb-0.5">ไฟล์เกมทั้งหมด:</span>
                    <span className="font-mono text-emerald-300 font-semibold">
                      {apkResult.gameFilesCount} สคริปต์ (.rpy, .rpyc, .rpa)
                    </span>
                  </div>
                </div>

                {/* Permissions */}
                {apkResult.manifestSummary && apkResult.manifestSummary.permissions.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">
                      สิทธิ์ที่แอปขอใช้ (Permissions):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {apkResult.manifestSummary.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Game Files inside APK */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-xs text-slate-200">
                      ไฟล์สคริปต์ที่พบใน APK (คลิกเพื่อเปิดแก้ไขใน Editor)
                    </span>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {apkResult.files
                    .filter((f) => f.path.endsWith('.rpy') || f.path.endsWith('.xml') || f.path.endsWith('.py'))
                    .map((file, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenFileInEditor(file)}
                        className="flex items-center justify-between p-2 rounded bg-slate-950 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-300 truncate">
                            {file.path}
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                          <span>เปิดแก้ไข</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 1-Click Quick Patches Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wide">
                เครื่องมือสร้าง Patch & Mod อัตโนมัติ (1-Click Mod Injector)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleInjectDeveloperConsole}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    ปลดล็อก Developer Console
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  เปิดคอนโซลคำสั่งในเกม (Shift+O หรือแตะหน้าจอ 4 นิ้ว) เพื่อเสกค่าสถานะและข้ามฉาก
                </p>
              </button>

              <button
                onClick={handleInjectThaiFont}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    แพตช์ฟอนต์ภาษาไทย (Thai Font)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  แก้ปัญหาสระลอย และตัวหนังสือภาษาไทยไม่แสดงผลบน Android Ren'Py
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Modding Guide */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-100">
                คู่มือการ Mod & แก้ไขไฟล์ APK (Step-by-Step)
              </h3>
            </div>
          </div>

          {/* Subtabs for Guides */}
          <div className="flex items-center gap-1 mb-3 border-b border-slate-800/80 pb-2 text-[11px]">
            <button
              onClick={() => setActiveGuideTab('mt_manager')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                activeGuideTab === 'mt_manager'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MT Manager (มือถือ)
            </button>
            <button
              onClick={() => setActiveGuideTab('pc_apktool')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                activeGuideTab === 'pc_apktool'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              APKTool (คอมพิวเตอร์)
            </button>
            <button
              onClick={() => setActiveGuideTab('rpyc_decompile')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                activeGuideTab === 'rpyc_decompile'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              แกะไฟล์ .rpyc
            </button>
            <button
              onClick={() => setActiveGuideTab('thai_font')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                activeGuideTab === 'thai_font'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ฟอนต์ไทย
            </button>
          </div>

          <div className="flex-1 overflow-y-auto text-xs space-y-3 leading-relaxed text-slate-300">
            {activeGuideTab === 'mt_manager' && (
              <div className="space-y-2.5">
                <h4 className="font-semibold text-slate-100 text-xs">
                  📱 วิธี Mod เกม Ren'Py บน Android ด้วยแอป MT Manager:
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>เปิดแอป <b>MT Manager</b> และค้นหาไฟล์ <code>.apk</code> ของเกม</li>
                  <li>แตะที่ไฟล์ APK แล้วเลือก <b>View (ดู)</b></li>
                  <li>
                    เข้าไปที่โฟลเดอร์: <code>assets/x-game/game/</code> หรือ <code>assets/game/</code>
                  </li>
                  <li>
                    นำไฟล์ Mod (เช่น <code>00_mod_console.rpy</code> หรือสคริปต์ที่ดาวน์โหลดจากหน้านี้) โยนเข้าไปในโฟลเดอร์ดังกล่าว
                  </li>
                  <li>กดย้อนกลับออกมาจนถึงหน้าไฟล์ APK ด้านนอก</li>
                  <li>
                    เลือก <b>Sign APK (เซ็นชื่อลายเซ็นดิจิทัล V1/V2)</b> ก่อนติดตั้ง เพื่อป้องกันการติดตั้งไม่ผ่าน (App Not Installed)
                  </li>
                </ol>
              </div>
            )}

            {activeGuideTab === 'pc_apktool' && (
              <div className="space-y-2.5">
                <h4 className="font-semibold text-slate-100 text-xs">
                  💻 วิธีแก้ไขและ Re-Sign APK บนคอมพิวเตอร์ (PC):
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    แตกไฟล์ APK ด้วยคำสั่ง:
                    <code className="block bg-slate-950 p-1.5 rounded font-mono my-1 text-indigo-300">
                      apktool d game.apk -o output_dir
                    </code>
                  </li>
                  <li>
                    เข้าไปที่ <code>output_dir/assets/x-game/game/</code> เพื่อแก้ไขไฟล์ <code>.rpy</code> หรือใส่ไฟล์แปลภาษา
                  </li>
                  <li>
                    ประกอบไฟล์ APK คืนด้วยคำสั่ง:
                    <code className="block bg-slate-950 p-1.5 rounded font-mono my-1 text-indigo-300">
                      apktool b output_dir -o game_modded.apk
                    </code>
                  </li>
                  <li>
                    เซ็นชื่อด้วย <b>Uber APK Signer</b> หรือ apksigner:
                    <code className="block bg-slate-950 p-1.5 rounded font-mono my-1 text-indigo-300">
                      java -jar uber-apk-signer.jar -a game_modded.apk
                    </code>
                  </li>
                </ol>
              </div>
            )}

            {activeGuideTab === 'rpyc_decompile' && (
              <div className="space-y-2.5">
                <h4 className="font-semibold text-slate-100 text-xs">
                  🔓 การ Decompile ไฟล์ .rpyc กลับเป็นโค้ด .rpy ที่อ่านได้:
                </h4>
                <p className="text-[11px]">
                  ไฟล์ <code>.rpyc</code> คือไวยากรณ์ Ren'Py ที่ถูกคอมไพล์เป็น Bytecode แล้ว หากเกมไม่มีไฟล์ <code>.rpy</code> คุณสามารถดึงโค้ดกลับมาได้โดย:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  <li>
                    <b>วิธีที่ 1 (อัตโนมัติ):</b> ดาวน์โหลดสคริปต์ <code>un.rpyc</code> แล้วนำไปวางไว้ในโฟลเดอร์ <code>game/</code> ของเกม เมื่อเปิดเกม 1 ครั้ง ระบบจะถอดรหัสออกมาเป็น <code>.rpy</code> ให้ทันที!
                  </li>
                  <li>
                    <b>วิธีที่ 2:</b> ใช้เครื่องมือคอมมานด์ไลน์ <code>unrpyc</code> บน Python:
                    <code className="block bg-slate-950 p-1.5 rounded font-mono my-1 text-indigo-300">
                      python unrpyc.py script.rpyc
                    </code>
                  </li>
                </ul>
              </div>
            )}

            {activeGuideTab === 'thai_font' && (
              <div className="space-y-2.5">
                <h4 className="font-semibold text-slate-100 text-xs">
                  🇹🇭 การตั้งค่าฟอนต์ภาษาไทยไม่ให้สระลอย / ฟอนต์เพี้ยน:
                </h4>
                <p className="text-[11px]">
                  Ren'Py รองรับฟอนต์ <code>.ttf</code> และ <code>.otf</code> ทุกรูปแบบ แนะนำให้ใช้ฟอนต์ เช่น <b>Sarabun</b> หรือ <b>Kanit</b>:
                </p>
                <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-emerald-300 space-y-1">
                  <div>define gui.text_font = "fonts/sarabun.ttf"</div>
                  <div>define gui.name_text_font = "fonts/sarabun.ttf"</div>
                  <div>define gui.interface_text_font = "fonts/sarabun.ttf"</div>
                </div>
                <p className="text-[11px] text-slate-400">
                  สำหรับเกมที่แปลไทยด้วยระบบ <code>translate thai</code> สามารถใส่ไว้ใน <code>tl/thai/screens.rpy</code> ได้ทันที
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
