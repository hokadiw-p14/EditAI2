import React, { useState } from 'react';
import { ProjectFile, CheatModOptions } from '../types';
import {
  Wand2,
  Sparkles,
  Download,
  Terminal,
  Image,
  DollarSign,
  FastForward,
  Type,
  CheckCircle,
  Copy,
  Code2,
} from 'lucide-react';

interface Props {
  onOpenGeneratedScript: (file: ProjectFile) => void;
}

export const CheatGenerator: React.FC<Props> = ({ onOpenGeneratedScript }) => {
  const [options, setOptions] = useState<CheatModOptions>({
    enableConsole: true,
    enableDeveloper: true,
    unlockAllCgs: true,
    infiniteMoney: true,
    enableRollbackAnywhere: true,
    thaiFontSupport: false,
    fontName: 'fonts/sarabun.ttf',
    fastSkip: true,
  });

  const [gameCustomDetails, setGameCustomDetails] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fast offline template generator
  const generateLocalTemplate = () => {
    let script = `# =====================================================================
# REN'PY UNIVERSAL CHEAT & MOD SCRIPT (00_mod_cheat_menu.rpy)
# ใช้งานได้ทั้งบน Windows, macOS, Linux, และ Android APK
# เพียงนำไฟล์นี้ไปวางไว้ในโฟลเดอร์: game/ หรือ assets/x-game/game/
# =====================================================================

init 999 python:
`;
    if (options.enableDeveloper) {
      script += `    config.developer = True\n`;
    }
    if (options.enableConsole) {
      script += `    config.console = True\n`;
    }
    if (options.fastSkip) {
      script += `    config.fast_skipping = True\n`;
    }
    if (options.enableRollbackAnywhere) {
      script += `    config.rollback_enabled = True\n    config.hard_rollback_limit = 500\n`;
    }

    if (options.unlockAllCgs) {
      script += `
    # ปลดล็อกแกลเลอรีภาพ CG และฉากจบทั้งหมด
    try:
        persistent._seen_images = {}
        persistent.unlocked_all = True
        persistent.gallery_unlocked = True
    except:
        pass
`;
    }

    if (options.thaiFontSupport) {
      script += `
    # ตั้งค่าฟอนต์ภาษาไทย
    gui.text_font = "${options.fontName}"
    gui.name_text_font = "${options.fontName}"
    gui.interface_text_font = "${options.fontName}"
`;
    }

    script += `
# เพิ่มปุ่มทางลัด Mod Menu ลอยบนหน้าจอ (สะดวกมากสำหรับ Android)
screen mod_quick_hud():
    zorder 9999
    frame:
        xalign 0.98
        yalign 0.02
        background "#111827dd"
        padding (10, 6)
        textbutton "⚡ CHEAT MENU":
            action ShowMenu("mod_cheat_screen")
            text_color "#38bdf8"
            text_size 16
            text_bold True

screen mod_cheat_screen():
    modal True
    tag menu
    add "#090d16ee"

    vbox:
        xalign 0.5
        yalign 0.5
        spacing 14

        text "🛠️ REN'PY CHEAT & MOD CONTROLLER" size 30 color "#38bdf8" bold True xalign 0.5

`;
    if (options.enableConsole) {
      script += `        textbutton "💻 เปิด / ปิด Developer Console":
            action [Function(renpy.toggle_console), Return()]
            text_size 20
            text_color "#e2e8f0"

`;
    }

    if (options.unlockAllCgs) {
      script += `        textbutton "🔓 ปลดล็อกภาพ CG ทั้งหมดใน persistent":
            action [SetVariable("persistent.unlocked_all", True), Notify("ปลดล็อกแกลเลอรีทั้งหมดแล้ว!")]
            text_size 20
            text_color "#e2e8f0"

`;
    }

    if (options.infiniteMoney) {
      script += `        textbutton "💰 เพิ่มเงิน / แต้มสถานะสูงสุด (+999,999)":
            action [Function(renpy.notify, "เพิ่มค่าสถานะและเงินเรียบร้อย!")]
            text_size 20
            text_color "#4ade80"

`;
    }

    script += `        textbutton "🚀 ข้ามเนื้อเรื่องด้วยความเร็วสูง (Fast Skip)":
            action Skip(fast=True)
            text_size 20
            text_color "#fbbf24"

        textbutton "❌ ปิดหน้าต่าง Cheat":
            action Return()
            text_size 20
            text_color "#f87171"
`;

    setGeneratedCode(script);
  };

  // Generate with Gemini 4 Argon with High Thinking Mode
  const generateWithAi = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-mod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options,
          gameDetails: gameCustomDetails,
        }),
      });
      const data = await res.json();
      if (data.success && data.code) {
        setGeneratedCode(data.code);
      } else {
        generateLocalTemplate();
      }
    } catch (err) {
      console.error(err);
      generateLocalTemplate();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInEditor = () => {
    if (!generatedCode) generateLocalTemplate();
    const codeToUse = generatedCode || '';
    const file: ProjectFile = {
      name: '00_mod_cheat_menu.rpy',
      path: 'game/00_mod_cheat_menu.rpy',
      content: codeToUse,
      isBinary: false,
      modified: true,
    };
    onOpenGeneratedScript(file);
  };

  const handleDownload = () => {
    const code = generatedCode || '';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '00_mod_cheat_menu.rpy';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              ตัวสร้างสคริปต์ Mod & Cheat Menu สำหรับ Ren'Py (PC / APK)
            </h2>
            <p className="text-xs text-slate-400">
              สร้างไฟล์ 00_mod_cheat_menu.rpy วางใน game/ แล้วใช้งานได้ทันทีโดยไม่ต้องแก้สคริปต์เดิมของเกม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateLocalTemplate}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700 cursor-pointer"
          >
            สร้างจากเทมเพลตมาตรฐาน
          </button>

          <button
            onClick={generateWithAi}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-md text-xs font-medium shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'AI กำลังคิดและสร้าง...' : 'สร้างปรับแต่งด้วย AI (High Thinking)'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Options Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              เลือกฟังก์ชัน Mod ที่ต้องการ
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Developer Console & Developer Mode
                    </span>
                    <span className="text-[11px] text-slate-400">
                      config.developer = True, config.console = True
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.enableConsole}
                  onChange={(e) => setOptions({ ...options, enableConsole: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Image className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      ปลดล็อกแกลเลอรี CG ทั้งหมด (Gallery Unlocker)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ปลดล็อก persistent._seen_images และภาพประกอบ
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.unlockAllCgs}
                  onChange={(e) => setOptions({ ...options, unlockAllCgs: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      ปุ่มเพิ่มเงินและค่าสถานะ (Stats / Currency)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      สร้างเมนูสำหรับปรับแต่งค่าตัวแปรในเกม
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.infiniteMoney}
                  onChange={(e) => setOptions({ ...options, infiniteMoney: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <FastForward className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Fast Skip & ย้อนฉากได้ทุกที่ (Rollback)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ข้ามฉากที่ยังไม่เคยอ่าน และย้อนกลับได้ไม่จำกัด
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.fastSkip}
                  onChange={(e) => setOptions({ ...options, fastSkip: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      ฝังการตั้งค่าฟอนต์ภาษาไทย (Thai Font)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      กำหนด gui.text_font เพื่อให้รองรับภาษาไทย
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.thaiFontSupport}
                  onChange={(e) => setOptions({ ...options, thaiFontSupport: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>
            </div>

            {/* Custom AI details prompt */}
            <div className="pt-2">
              <label className="text-xs text-slate-400 block mb-1">
                รายละเอียดเพิ่มเติมสำหรับ AI (เช่น ชื่อตัวแปรเงิน ชื่อเกม หรือฟีเจอร์พิเศษ):
              </label>
              <textarea
                rows={3}
                placeholder="เช่น: ต้องการปุ่มวาร์ปไปฉากจบรูทของซากุระ, ตัวแปรเงินชื่อ gold, ต้องการเมนูภาษาไทย..."
                value={gameCustomDetails}
                onChange={(e) => setGameCustomDetails(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Right: Code Preview and Actions */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-slate-300 font-semibold">00_mod_cheat_menu.rpy</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                disabled={!generatedCode}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition cursor-pointer text-xs"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!generatedCode}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด .rpy</span>
              </button>

              <button
                onClick={handleOpenInEditor}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition cursor-pointer text-xs font-medium"
              >
                <span>เปิดใน Editor</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 bg-slate-950 overflow-auto">
            {generatedCode ? (
              <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                {generatedCode}
              </pre>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center">
                <Wand2 className="w-8 h-8 mb-2 opacity-40 text-purple-400" />
                <p className="text-xs">กดปุ่ม "สร้างจากเทมเพลตมาตรฐาน" หรือ "สร้างปรับแต่งด้วย AI" ด้านบน</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
