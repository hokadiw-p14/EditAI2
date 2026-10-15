import React, { useState } from 'react';
import {
  BookOpen,
  Code,
  Smartphone,
  CheckCircle2,
  FileCode,
  Terminal,
  Type,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export const DocsGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'syntax' | 'apk_structure' | 'decompile' | 'thai_font'>('syntax');

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              คลังความรู้ & คู่มือไวยากรณ์ Ren'Py และการ Mod APK
            </h2>
            <p className="text-xs text-slate-400">
              เอกสารอ้างอิงไวยากรณ์ Ren'Py 8.x, โครงสร้างไฟล์ใน Android APK, และการแก้ปัญหาที่พบบ่อย
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveSection('syntax')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSection === 'syntax'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            ไวยากรณ์ Ren'Py
          </button>
          <button
            onClick={() => setActiveSection('apk_structure')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSection === 'apk_structure'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            โครงสร้าง APK
          </button>
          <button
            onClick={() => setActiveSection('decompile')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSection === 'decompile'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            การ Decompile .rpyc
          </button>
          <button
            onClick={() => setActiveSection('thai_font')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSection === 'thai_font'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            ฟอนต์ไทย & แปลภาษา
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6 text-sm text-slate-300 leading-relaxed">
        {activeSection === 'syntax' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Code className="w-5 h-5" />
                <span>1. กฎการย่อหน้า (Indentation) ใน Ren'Py</span>
              </div>
              <p className="text-xs text-slate-300">
                Ren'Py ใช้การจัดย่อหน้า (Indentation) ในการกำหนดขอบเขตของบล็อกคำสั่ง เช่นเดียวกับภาษา Python โดยแนะนำให้ใช้ <b>4 ช่องว่าง (Spaces)</b> ต่อหนึ่งระดับเสมอ:
              </p>
              <pre className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-emerald-300 border border-slate-800">
{`label start:
    # ระดับที่ 1: ย่อหน้า 4 เคาะ
    scene bg fantasy with fade
    e "ยินดีต้อนรับสู่โลกแฟนตาซี!"

    menu:
        # ระดับที่ 2: ย่อหน้า 8 เคาะ
        "สำรวจปราสาท":
            # ระดับที่ 3: ย่อหน้า 12 เคาะ
            jump castle_route
        "กลับไปพักผ่อน":
            jump home_route`}
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                <FileCode className="w-5 h-5" />
                <span>2. แท็กข้อความ (Text Tags) ที่ใช้บ่อย</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <code className="text-indigo-300 font-bold block mb-1">
                    {`{w}`} หรือ {`{w=1.5}`}
                  </code>
                  <span>หยุดรอให้ผู้เล่นคลิก หรือหน่วงเวลา 1.5 วินาที</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <code className="text-indigo-300 font-bold block mb-1">
                    {`{b}...{/b}`} / {`{i}...{/i}`}
                  </code>
                  <span>ตัวหนา (Bold) และ ตัวเอียง (Italic)</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <code className="text-indigo-300 font-bold block mb-1">
                    {`{color=#ff5555}...{/color}`}
                  </code>
                  <span>เปลี่ยนสีข้อความเฉพาะคำที่กำหนด</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <code className="text-indigo-300 font-bold block mb-1">
                    {`[player_name]`} หรือ {`[money]`}
                  </code>
                  <span>แทรกค่าตัวแปรลงในบทสนทนา</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-5 h-5" />
                <span>3. ข้อผิดพลาดที่พบบ่อยที่สุดและตัวตรวจไวยากรณ์ (Live Checker) คอยเตือน</span>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <b>ลืมโคลอน (:) ท้ายคำสั่ง:</b> คำสั่งเช่น <code>label start</code>, <code>menu</code>, <code>if condition</code> ต้องมีเครื่องหมาย <code>:</code> ต่อท้ายเสมอ
                </li>
                <li>
                  <b>อัญประกาศไม่ปิด:</b> ลืมใส่ <code>"</code> ปิดท้ายประโยคบทสนทนา
                </li>
                <li>
                  <b>คำสั่งสะกดผิด:</b> เช่น <code>scence</code> แทนที่จะเป็น <code>scene</code> หรือ <code>jummp</code> แทนที่จะเป็น <code>jump</code>
                </li>
                <li>
                  <b>ใช้ == ในคำสั่ง $ Python:</b> เช่น <code>$ money == 100</code> เป็นการเปรียบเทียบค่า ไม่ใช่การกำหนดค่า ที่ถูกต้องคือ <code>$ money = 100</code>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'apk_structure' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Smartphone className="w-5 h-5" />
                <span>โครงสร้างภายในของไฟล์ Android APK สำหรับเกม Ren'Py</span>
              </div>
              <p className="text-xs">
                เมื่อใช้เครื่องมือเปิดดูภายใน APK ของเกม Ren'Py (เช่น MT Manager หรือแตก zip) จะมีโครงสร้างโฟลเดอร์สำคัญดังนี้:
              </p>
              <pre className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 border border-slate-800 leading-relaxed">
{`app-release.apk
├── AndroidManifest.xml          # สิทธิ์, ชื่อแพ็กเกจ, Activity เริ่มต้น
├── classes.dex                  # โค้ด Java/Kotlin รันไทม์ของ Android
├── lib/
│   ├── arm64-v8a/librenpy.so    # เอนจินรันไทม์ Python & Ren'Py Native C
│   └── armeabi-v7a/librenpy.so
└── assets/
    ├── x-game/ (หรือ game/)      # << จุดเก็บไฟล์สคริปต์เกม Ren'Py ทั้งหมด!
    │   ├── script.rpy / script.rpyc
    │   ├── options.rpy / options.rpyc
    │   ├── screens.rpy / screens.rpyc
    │   ├── archive.rpa          # คลังไฟล์ภาพ เสียง สคริปต์ (ถ้าถูกแพ็กไว้)
    │   └── tl/thai/             # โฟลเดอร์แปลภาษาไทย
    └── private.mp3 / presplash.png`}
              </pre>
            </div>
          </div>
        )}

        {activeSection === 'decompile' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                <Terminal className="w-5 h-5" />
                <span>ความแตกต่างระหว่าง .rpy กับ .rpyc และวิธีแกะสคริปต์</span>
              </div>
              <p className="text-xs">
                <b>.rpy:</b> คือไฟล์ซอร์สโค้ดภาษา Ren'Py ข้อความปกติที่อ่านและแก้ไขได้<br />
                <b>.rpyc:</b> คือไฟล์ Bytecode คอมไพล์แล้วโดย Ren'Py เพื่อให้เกมโหลดเร็วขึ้น
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-200">วิธี Decompile ด้วย un.rpyc:</span>
                <p>
                  1. ดาวน์โหลดไฟล์ <code>un.rpyc</code><br />
                  2. คัดลอกไปวางไว้ในโฟลเดอร์ <code>game/</code> ของเกม<br />
                  3. เปิดเกมตามปกติ 1 ครั้ง ตัวเกมจะอ่านและถอดรหัสทุกไฟล์ <code>.rpyc</code> ออกมาเป็น <code>.rpy</code> ให้ทันที!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'thai_font' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Type className="w-5 h-5" />
                <span>การรองรับภาษาไทยใน Ren'Py (Thai Localization & Font)</span>
              </div>
              <p className="text-xs">
                Ren'Py 8 ขึ้นไปรองรับ UTF-8 เต็มรูปแบบ สำหรับภาษาไทยที่มีวรรณยุกต์และสระลอย สิ่งสำคัญคือการใช้ฟอนต์ TrueType (.ttf) หรือ OpenType (.otf) ที่มีตารางจัดเรียงวรรณยุกต์ภาษาไทยสมบูรณ์ เช่น:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-emerald-300 border border-slate-800">
{`# วางไว้ใน options.rpy หรือ gui.rpy
define gui.text_font = "fonts/sarabun.ttf"
define gui.name_text_font = "fonts/sarabun.ttf"
define gui.interface_text_font = "fonts/sarabun.ttf"

# ปรับขนาดตัวอักษรให้อ่านง่ายขึ้น
define gui.text_size = 30`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
