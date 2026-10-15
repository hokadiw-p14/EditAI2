import React, { useState, useMemo } from 'react';
import { DialogueItem } from '../types';
import { extractDialoguesFromRpy, generateTranslationFile, applyTranslationsToScript } from '../utils/renpyParser';
import {
  Languages,
  Sparkles,
  Download,
  CheckCheck,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  FileText,
  Volume2,
} from 'lucide-react';

interface Props {
  code: string;
  fileName: string;
  onUpdateCode: (newCode: string) => void;
}

export const DialogueTranslator: React.FC<Props> = ({ code, fileName, onUpdateCode }) => {
  const { dialogues: initialDialogues, characters } = useMemo(
    () => extractDialoguesFromRpy(code),
    [code]
  );

  const [dialogues, setDialogues] = useState<DialogueItem[]>(initialDialogues);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingLineId, setTranslatingLineId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync if code changes externally
  React.useEffect(() => {
    setDialogues(initialDialogues);
  }, [initialDialogues]);

  const filteredDialogues = useMemo(() => {
    return dialogues.filter((d) => {
      const matchChar = selectedCharacter === 'all' || d.character === selectedCharacter;
      const matchSearch =
        !searchQuery ||
        d.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.translatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.character.toLowerCase().includes(searchQuery.toLowerCase());
      return matchChar && matchSearch;
    });
  }, [dialogues, selectedCharacter, searchQuery]);

  const translatedCount = dialogues.filter((d) => d.translatedText.trim() !== '').length;
  const progressPercent = dialogues.length > 0 ? Math.round((translatedCount / dialogues.length) * 100) : 0;

  const handleUpdateTranslation = (id: string, text: string) => {
    setDialogues((prev) =>
      prev.map((d) => (d.id === id ? { ...d, translatedText: text } : d))
    );
  };

  // Translate a single line with Gemini 4 Argon
  const handleTranslateSingleLine = async (item: DialogueItem) => {
    setTranslatingLineId(item.id);
    try {
      const response = await fetch('/api/ai/translate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogues: [{ id: item.id, text: item.originalText, character: item.character }],
          targetLanguage: 'Thai',
        }),
      });
      const data = await response.json();
      if (data.success && data.translations?.[0]?.translatedText) {
        handleUpdateTranslation(item.id, data.translations[0].translatedText);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('เกิดข้อผิดพลาดในการแปล: ' + err.message);
    } finally {
      setTranslatingLineId(null);
    }
  };

  // Batch translate all untranslated lines with Gemini 4 Argon
  const handleBatchTranslate = async () => {
    const untranslated = dialogues.filter((d) => !d.translatedText.trim());
    if (untranslated.length === 0) {
      setStatusMessage('แปลครบทุกบรรทัดแล้ว!');
      return;
    }

    setIsTranslating(true);
    setStatusMessage(`กำลังแปลบทสนทนา ${untranslated.length} บรรทัดด้วย Gemini 4 Argon (Thinking: High)...`);

    try {
      // Chunk into batches of 15 for optimal speed and context retention
      const batchSize = 15;
      const newDialogues = [...dialogues];

      for (let i = 0; i < untranslated.length; i += batchSize) {
        const batch = untranslated.slice(i, i + batchSize).map((d) => ({
          id: d.id,
          text: d.originalText,
          character: d.character,
        }));

        const response = await fetch('/api/ai/translate-dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dialogues: batch, targetLanguage: 'Thai' }),
        });

        const data = await response.json();
        if (data.success && data.translations) {
          data.translations.forEach((t: { id: string; translatedText: string }) => {
            const idx = newDialogues.findIndex((d) => d.id === t.id);
            if (idx !== -1) {
              newDialogues[idx].translatedText = t.translatedText;
            }
          });
          setDialogues([...newDialogues]);
        }
      }

      setStatusMessage('แปลบทสนทนาเรียบร้อยทั้งหมดแล้ว!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('เกิดข้อผิดพลาดในการแปล: ' + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleApplyToScript = () => {
    const updated = applyTranslationsToScript(code, dialogues);
    onUpdateCode(updated);
    setStatusMessage('อัปเดตบทแปลลงในโค้ดสคริปต์หลักเรียบร้อยแล้ว!');
  };

  const handleExportTranslationFile = () => {
    const tlContent = generateTranslationFile(fileName, dialogues, 'thai');
    const blob = new Blob([tlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tl_thai_${fileName}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Header & Translation Controls */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                ระบบแปลบทสนทนาเกม Ren'Py (Visual Novel Translation Studio)
              </h2>
              <p className="text-xs text-slate-400">
                แยกบทพูดตัวละคร แปลภาษาไทยโดยยังคงแท็ก Ren'Py ({`{b}, {w}, [player_name]`}) และส่งออกไฟล์ tl/thai/
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchTranslate}
              disabled={isTranslating || dialogues.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-md text-xs font-medium shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังแปลอัตโนมัติ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>แปลทั้งหมดด้วย AI (High Thinking)</span>
                </>
              )}
            </button>

            <button
              onClick={handleApplyToScript}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition cursor-pointer"
              title="นำบทแปลภาษาไทยไปแทนที่ในไฟล์สคริปต์ปัจจุบัน"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>อัปเดตลงสคริปต์หลัก</span>
            </button>

            <button
              onClick={handleExportTranslationFile}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition border border-slate-700 cursor-pointer"
              title="ส่งออกเป็นไฟล์สำหรับโฟลเดอร์ game/tl/thai/"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก tl/thai/.rpy</span>
            </button>
          </div>
        </div>

        {/* Progress & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-36 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-300">
              แปลแล้ว {translatedCount}/{dialogues.length} ({progressPercent}%)
            </span>
            {statusMessage && (
              <span className="text-xs text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                {statusMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Character Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs"
              >
                <option value="all">ตัวละครทั้งหมด ({dialogues.length})</option>
                {characters.map((c) => (
                  <option key={c} value={c}>
                    {c} ({dialogues.filter((d) => d.character === c).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาข้อความ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs w-32"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogues Table */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredDialogues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">ไม่พบบทสนทนาในไฟล์นี้ หรือไม่มีรายการที่ตรงกับการค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDialogues.map((item) => {
              const isTranslatingCurrent = translatingLineId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg transition grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
                >
                  {/* Meta / Character */}
                  <div className="md:col-span-3 flex md:flex-col justify-between items-start gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        L{item.lineIndex}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                        {item.character}
                      </span>
                    </div>

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-mono bg-purple-950/60 text-purple-300 px-1 rounded border border-purple-800/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Original Text */}
                  <div className="md:col-span-4 bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed select-text">
                    {item.originalText}
                  </div>

                  {/* Translated Text Input */}
                  <div className="md:col-span-5 flex items-start gap-2">
                    <textarea
                      rows={2}
                      value={item.translatedText}
                      placeholder="ใส่คำแปลภาษาไทย..."
                      onChange={(e) => handleUpdateTranslation(item.id, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded p-2 text-xs text-slate-100 font-sans outline-none resize-none"
                    />

                    <button
                      onClick={() => handleTranslateSingleLine(item)}
                      disabled={isTranslatingCurrent}
                      className="p-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded transition disabled:opacity-50 cursor-pointer shrink-0"
                      title="แปลเฉพาะบรรทัดนี้ด้วย Gemini 4 Argon"
                    >
                      {isTranslatingCurrent ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
