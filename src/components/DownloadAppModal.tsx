import React, { useState } from 'react';
import { ProjectFile } from '../types';
import {
  buildRenpyApkBlob,
  buildRenpyProjectZipBlob,
  ApkBuildOptions,
  DEFAULT_APK_OPTIONS,
} from '../utils/apkBuilder';
import {
  Download,
  Smartphone,
  FolderArchive,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Settings2,
  Terminal,
  Type,
  HelpCircle,
  FileCode,
  Laptop,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  activeFileName?: string;
  onShowToast: (msg: string) => void;
}

export const DownloadAppModal: React.FC<Props> = ({
  isOpen,
  onClose,
  files,
  activeFileName,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'zip' | 'pwa'>('apk');
  const [apkOptions, setApkOptions] = useState<ApkBuildOptions>(() => ({
    ...DEFAULT_APK_OPTIONS,
    appName: activeFileName
      ? activeFileName.replace(/\.(rpy|py|txt)$/, '').replace(/_/g, ' ')
      : "Ren'Py Game",
    packageName: `com.renpy.${(activeFileName || 'game')
      .replace(/\.(rpy|py|txt)$/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase() || 'customgame'}`,
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler for downloading APK
  const handleDownloadApk = async () => {
    setIsGenerating(true);
    setDownloadSuccess(null);
    onShowToast('กำลังรวมโครงสร้างและคอมไพล์ไฟล์ .APK...');

    try {
      const blob = await buildRenpyApkBlob(files, apkOptions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = apkOptions.appName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'renpy_app';
      a.download = `${cleanName}_v${apkOptions.versionName}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(`ดาวน์โหลด ${a.download} สำเร็จแล้ว!`);
      onShowToast(`ดาวน์โหลดไฟล์ .APK (${a.download}) สำเร็จแล้ว!`);
    } catch (err: any) {
      console.error(err);
      onShowToast('เกิดข้อผิดพลาดในการสร้างไฟล์ APK: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler for downloading project ZIP
  const handleDownloadZip = async () => {
    setIsGenerating(true);
    setDownloadSuccess(null);
    onShowToast('กำลังบีบอัดไฟล์โปรเจกต์เป็น .ZIP...');

    try {
      const blob = await buildRenpyProjectZipBlob(files, apkOptions.appName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = apkOptions.appName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'renpy_project';
      a.download = `${cleanName}_project_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(`ดาวน์โหลด ${a.download} สำเร็จแล้ว!`);
      onShowToast(`ดาวน์โหลดไฟล์ .ZIP (${a.download}) สำเร็จแล้ว!`);
    } catch (err: any) {
      console.error(err);
      onShowToast('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  ดาวน์โหลดตัวแอพ (Download App / APK / ZIP)
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded font-mono font-semibold">
                  Android &amp; PC Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                เลือกรูปแบบไฟล์ที่ต้องการดาวน์โหลด: แพ็กเกจ Android APK, ไฟล์โปรเจกต์ ZIP, หรือติดตั้งเว็บแอพ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 text-xs font-medium bg-slate-950/60">
          <button
            onClick={() => {
              setActiveTab('apk');
              setDownloadSuccess(null);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'apk'
                ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. ไฟล์ .APK (สำหรับมือถือ Android)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('zip');
              setDownloadSuccess(null);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'zip'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>2. ไฟล์ .ZIP (โปรเจกต์ Ren'Py รวมทุกไฟล์)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pwa');
              setDownloadSuccess(null);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'pwa'
                ? 'border-purple-500 text-purple-400 font-semibold bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>3. ติดตั้งเว็บแอพลงเครื่อง (PWA)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 rounded-xl flex items-center gap-2 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{downloadSuccess}</span>
            </div>
          )}

          {/* TAB 1: APK BUILDER */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">
                      ตั้งค่าข้อมูลแพ็กเกจ Android APK (.apk)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {files.length} ไฟล์ที่จะถูกแพ็กเกจ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      ชื่อแอพพลิเคชัน (App Name)
                    </label>
                    <input
                      type="text"
                      value={apkOptions.appName}
                      onChange={(e) =>
                        setApkOptions((prev) => ({ ...prev, appName: e.target.value }))
                      }
                      placeholder="My Ren'Py Game"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Package Name (ID ประจำแอพ)
                    </label>
                    <input
                      type="text"
                      value={apkOptions.packageName}
                      onChange={(e) =>
                        setApkOptions((prev) => ({ ...prev, packageName: e.target.value }))
                      }
                      placeholder="com.renpy.mygame"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      เวอร์ชันแอพ (Version Name)
                    </label>
                    <input
                      type="text"
                      value={apkOptions.versionName}
                      onChange={(e) =>
                        setApkOptions((prev) => ({ ...prev, versionName: e.target.value }))
                      }
                      placeholder="1.0.0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      ทิศทางหน้าจอ (Screen Orientation)
                    </label>
                    <select
                      value={apkOptions.orientation}
                      onChange={(e) =>
                        setApkOptions((prev) => ({
                          ...prev,
                          orientation: e.target.value as any,
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="sensorLandscape">แนวนอน (Landscape - มาตรฐาน Visual Novel)</option>
                      <option value="sensorPortrait">แนวตั้ง (Portrait - เหมาะกับเกมสไตล์มือถือ)</option>
                      <option value="sensor">หมุนอัตโนมัติตามเซนเซอร์ (Auto-rotate)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Mod & Font Injections */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={apkOptions.includeDevConsole}
                      onChange={(e) =>
                        setApkOptions((prev) => ({
                          ...prev,
                          includeDevConsole: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium">
                        ฝัง Developer Console &amp; ปุ่มลอยสำหรับแตะเปิดคอนโซลบนมือถือ
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={apkOptions.includeThaiFont}
                      onChange={(e) =>
                        setApkOptions((prev) => ({
                          ...prev,
                          includeThaiFont: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Type className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-medium">
                        ฝังแพตช์รองรับฟอนต์ภาษาไทยและ UTF-8 (ป้องกันสระลอย / ฟอนต์เพี้ยนบน Android)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Big Action Download APK Button */}
              <button
                onClick={handleDownloadApk}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
                <span>
                  {isGenerating
                    ? 'กำลังประมวลผลและแพ็กเกจไฟล์ .APK...'
                    : 'ดาวน์โหลดไฟล์ .APK เดี๋ยวนี้ (Download .apk)'}
                </span>
              </button>

              {/* Android Installation Instructions */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>วิธีนำไฟล์ .APK ไปติดตั้งและเล่นบนมือถือ Android:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    หลังดาวน์โหลดไฟล์ <b>.apk</b> สำเร็จ ส่งไฟล์ไปยังมือถือของคุณ (ผ่านสาย USB, Google Drive, LINE, หรือดาวน์โหลดผ่านเบราว์เซอร์บนมือถือโดยตรง)
                  </li>
                  <li>
                    แตะที่ไฟล์ <code>.apk</code> เพื่อทำการติดตั้ง
                  </li>
                  <li>
                    หากขึ้นแจ้งเตือนความปลอดภัย <i>"ไม่อนุญาตให้ติดตั้งแอปจากแหล่งที่ไม่รู้จัก"</i> ให้กด <b>การตั้งค่า (Settings)</b> แล้วเปิด <b>อนุญาตจากแหล่งนี้ (Allow from this source)</b>
                  </li>
                  <li>
                    กด <b>ติดตั้ง (Install)</b> รอสักครู่แล้วเปิดเล่นเกมได้ทันที!
                  </li>
                  <li>
                    <b>คำแนะนำเพิ่มเติม:</b> หากต้องการดัดแปลงไฟล์ใน APK เพิ่มเติม สามารถใช้แอป <b>MT Manager</b> บน Android เปิดดูและแก้ไขไฟล์ใน <code>assets/x-game/game/</code> ได้ตลอดเวลา
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: ZIP ARCHIVE */}
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">
                      แพ็กเกจไฟล์โปรเจกต์เกม (.zip)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {files.length} ไฟล์
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  ไฟล์ .ZIP นี้จะรวบรวมโค้ดสสคริปต์ Ren'Py ทั้งหมดของคุณ (<code>script.rpy</code>, <code>options.rpy</code>, <code>screens.rpy</code>, <code>gui.rpy</code>, ไฟล์แปลภาษา, และซอร์สโค้ดที่สร้างไว้) ในโครงสร้างโฟลเดอร์ <code>game/</code> ตามมาตรฐานของ Ren'Py Engine
                </p>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400">เนื้อหาที่จะถูกดาวน์โหลด:</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {files.slice(0, 8).map((f, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[10px] border border-slate-800"
                      >
                        {f.name}
                      </span>
                    ))}
                    {files.length > 8 && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-500 font-mono text-[10px]">
                        +{files.length - 8} ไฟล์อื่นๆ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Big Action Download ZIP Button */}
              <button
                onClick={handleDownloadZip}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
                <span>
                  {isGenerating
                    ? 'กำลังรวมไฟล์และบีบอัด .ZIP...'
                    : 'ดาวน์โหลดไฟล์โปรเจกต์ .ZIP เดี๋ยวนี้ (Download .zip)'}
                </span>
              </button>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  <span>วิธีนำไปเปิดและพัฒนาต่อบน PC / Mac / Linux:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li>แตกไฟล์ .ZIP ออกมาไว้ในโฟลเดอร์โปรเจกต์ของ Ren'Py SDK</li>
                  <li>เปิดโปรแกรม Ren'Py Launcher ในคอมพิวเตอร์</li>
                  <li>เลือกโปรเจกต์แล้วกด "Launch Project" เพื่อทดสอบเล่น หรือ "Build Distributions" เพื่อส่งออกเป็นไฟล์สำหรับ Windows, Mac, Linux หรือ Android APK อย่างเป็นทางการ</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: PWA / INSTALL AS APP */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Laptop className="w-5 h-5" />
                  <span className="font-semibold text-sm text-slate-100">
                    ติดตั้งสตูดิโอเป็นแอพบนเครื่อง (Progressive Web App)
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  คุณสามารถติดตั้ง Ren'Py &amp; APK Code Studio เป็นแอพพลิเคชันอิสระบนหน้าจอโฮมของมือถือ หรือหน้าจอ Desktop ของคอมพิวเตอร์ เพื่อเปิดใช้งานได้รวดเร็วแบบเต็มหน้าจอ (Standalone) และใช้งานออฟไลน์ได้
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>บนมือถือ (Android / Chrome)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      1. แตะเมนู <b>จุด 3 จุด (⋮)</b> ที่มุมขวาบนของเบราว์เซอร์ Chrome<br />
                      2. เลือก <b>"ติดตั้งแอป"</b> หรือ <b>"เพิ่มลงในหน้าจอหลัก (Add to Home Screen)"</b><br />
                      3. ไอคอนแอพจะปรากฏบนหน้าจอมือถือของคุณทันที
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span>บน iPhone / iPad (iOS Safari)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      1. แตะปุ่ม <b>แชร์ (Share)</b> ที่แถบด้านล่างของ Safari<br />
                      2. เลื่อนลงแล้วแตะ <b>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</b><br />
                      3. แตะ "เพิ่ม (Add)" ที่มุมขวาบน
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-xs text-slate-300 block">
                  คุณสามารถกดดาวน์โหลดไฟล์ <b>.APK</b> หรือ <b>.ZIP</b> ได้จากแท็บด้านบนทันที
                </span>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('apk')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>ไปที่หน้าดาวน์โหลด .APK</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('zip')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>ไปที่หน้าดาวน์โหลด .ZIP</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>พร้อมสร้างและดาวน์โหลดไฟล์ APK และ ZIP ทันทีในเบราว์เซอร์</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
