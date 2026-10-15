import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  Code2,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  currentFileName: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAssistantDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentCode,
  currentFileName,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `สวัสดีครับ! ผมคือผู้ช่วย AI (โมเดล **Gemini 4 Argon** พร้อมโหมด **Thinking: High**) สำหรับงาน Ren'Py, Python, และ Android APK Modding
ท่านสามารถสอบถามเรื่อง:
1. การเขียนสคริปต์ Ren'Py, หน้าจอ Screens, และระบบ Choice / Variable
2. แก้ไข Bug หรือ Error ลึกลับในเกม เช่น Indentation, Rollback failure
3. การ Decompile ไฟล์ \`.rpyc\` และการแตกไฟล์ \`.rpa\`
4. การ Mod APK, ปรับแต่ง AndroidManifest.xml, และการ Re-sign APK บนมือถือ/PC
5. การแปลเกมภาษาไทย และการแก้ปัญหาสระลอย`,
      timestamp: 'เมื่อสักครู่',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeCurrentCode, setIncludeCurrentCode] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickPrompts = [
    'วิเคราะห์โค้ดปัจจุบันว่ามีจุดบกพร่อง (Bug) ตรงไหนบ้าง?',
    'วิธีใส่ระบบเลือกภาษาไทย/อังกฤษ ใน Ren\'Py',
    'วิธี Decompile ไฟล์ .rpyc โดยใช้ un.rpyc',
    'วิธีตั้งค่าฟอนต์ภาษาไทยไม่ให้สระลอยใน Ren\'Py 8',
    'แก้ปัญหา App Not Installed เวลาติดตั้ง APK ที่แก้ไขแล้ว',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: query,
          code: includeCurrentCode ? currentCode : '',
          fileName: currentFileName,
          context: 'Ren\'Py / Code / APK Studio Assistant (Thinking Mode: High)',
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.result,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ เกิดข้อผิดพลาดในการประมวลผล: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-slate-900/98 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">ผู้ช่วยอัจฉริยะ (AI Assistant)</span>
              <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">
                Gemini 4 Argon
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Thinking Mode: HIGH (วิเคราะห์เชิงลึก)</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Code Context Toggle */}
      <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>ไฟล์ปัจจุบัน: <code className="text-slate-200 font-mono">{currentFileName}</code></span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
          <input
            type="checkbox"
            checked={includeCurrentCode}
            onChange={(e) => setIncludeCurrentCode(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-0"
          />
          <span>แนบโค้ดไปด้วย</span>
        </label>
      </div>

      {/* Message Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed group relative select-text ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyMessage(msg.content, index)}
                      className="opacity-0 group-hover:opacity-100 transition hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-950 border border-purple-800/40 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Gemini 4 Argon กำลังใช้ Thinking Mode คิดวิเคราะห์เชิงลึก...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800">
        <span className="text-[10px] text-slate-500 block mb-1.5">คำถามแนะนำ:</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="พิมพ์คำถามเกี่ยวกับ Ren'Py, Code, หรือ APK ที่นี่..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none resize-none font-sans"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-40 cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
