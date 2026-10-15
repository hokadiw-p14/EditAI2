import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ProjectFile, EditorTab, SyntaxDiagnostic, VersionCommit } from './types';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { SyntaxDiagnosticsPanel } from './components/SyntaxDiagnosticsPanel';
import { FileExplorer } from './components/FileExplorer';
import { DialogueTranslator } from './components/DialogueTranslator';
import { ApkModStudio } from './components/ApkModStudio';
import { CheatGenerator } from './components/CheatGenerator';
import { ConnectorsStudio } from './components/ConnectorsStudio';
import { DocsGuide } from './components/DocsGuide';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { VersionHistoryPanel } from './components/VersionHistoryPanel';
import { AuthModal } from './components/AuthModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { auth } from './services/firebase';
import {
  syncCurrentProjectToFirestore,
  loadProjectFromFirestore,
  subscribeToCloudProject,
  DEFAULT_PROJECT_ID,
  CloudProject,
} from './services/projectSyncService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SAMPLE_PROJECTS } from './components/SampleProjects';
import { checkRenpySyntax } from './utils/renpySyntaxChecker';
import { parseApkOrZipFile, exportModifiedZip } from './utils/apkReader';
import {
  saveProjectToStorage,
  loadProjectFromStorage,
  clearProjectStorage,
  loadVersionHistoryFromStorage,
  saveVersionHistoryToStorage,
} from './utils/storage';
import { PanelLeftClose, PanelLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Initialize files from localStorage if available, otherwise fallback to syntax error sample
  const [files, setFiles] = useState<ProjectFile[]>(() => {
    const saved = loadProjectFromStorage();
    if (saved && saved.files && saved.files.length > 0) {
      return saved.files;
    }
    return SAMPLE_PROJECTS['syntax_error_test'];
  });

  const [activeFilePath, setActiveFilePath] = useState<string>(() => {
    const saved = loadProjectFromStorage();
    if (saved && saved.activeFilePath) {
      return saved.activeFilePath;
    }
    return SAMPLE_PROJECTS['syntax_error_test'][0].path;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    const saved = loadProjectFromStorage();
    return saved?.lastSaved || null;
  });

  const [commits, setCommits] = useState<VersionCommit[]>(() => {
    return loadVersionHistoryFromStorage();
  });

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('editor');
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showDownloadAppModal, setShowDownloadAppModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudSyncedTime, setLastCloudSyncedTime] = useState<string | null>(null);
  const [autoCloudSync, setAutoCloudSync] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedErrorLine, setSelectedErrorLine] = useState<number | null>(null);
  const [isAiFixing, setIsAiFixing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Cross-Device Sync: Check and subscribe when user logs in
  useEffect(() => {
    if (!currentUser) {
      setLastCloudSyncedTime(null);
      return;
    }

    let isMounted = true;

    // Check if user has an existing project in Firestore on this account
    loadProjectFromFirestore(currentUser.uid, activeProjectId)
      .then((cloudProj) => {
        if (!isMounted || !cloudProj) return;

        if (cloudProj.files && cloudProj.files.length > 0) {
          const time = cloudProj.updatedAt
            ? new Date(cloudProj.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '';
          setLastCloudSyncedTime(time);
          showToast(
            `เชื่อมต่อโปรเจกต์บน Firestore "${cloudProj.name}" สำเร็จ (${cloudProj.files.length} ไฟล์)`
          );
        }
      })
      .catch((err) => {
        console.warn('Initial cloud load notice:', err);
      });

    // Real-time listener for remote changes from other devices
    const unsubscribeSnapshot = subscribeToCloudProject(
      currentUser.uid,
      activeProjectId,
      (remoteProject) => {
        if (!isMounted || !remoteProject) return;
        const time = remoteProject.updatedAt
          ? new Date(remoteProject.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '';
        setLastCloudSyncedTime(time);
      }
    );

    return () => {
      isMounted = false;
      unsubscribeSnapshot();
    };
  }, [currentUser, activeProjectId, showToast]);

  // Debounced auto-sync to Firestore using authenticated user ID so projects persist across devices
  useEffect(() => {
    if (!currentUser || !autoCloudSync) return;

    const cloudDebounce = setTimeout(async () => {
      setIsCloudSyncing(true);
      try {
        const res = await syncCurrentProjectToFirestore(
          currentUser.uid,
          files,
          activeFilePath,
          {
            projectId: activeProjectId,
          }
        );
        if (res.success) {
          setLastCloudSyncedTime(res.lastSynced);
        }
      } catch (err: any) {
        console.warn('Auto Firestore sync issue:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 2500);

    return () => clearTimeout(cloudDebounce);
  }, [files, activeFilePath, currentUser, autoCloudSync, activeProjectId]);

  // On mount, notify if project was restored from localStorage
  useEffect(() => {
    const saved = loadProjectFromStorage();
    if (saved && saved.files.length > 0) {
      showToast(`กู้คืนโปรเจกต์ล่าสุดจากการบันทึกอัตโนมัติ (${saved.files.length} ไฟล์)`);
    }
  }, [showToast]);

  // Periodic and debounced auto-save to localStorage
  useEffect(() => {
    setIsAutoSaving(true);
    const debounceTimer = setTimeout(() => {
      const res = saveProjectToStorage(files, activeFilePath);
      if (res.success) {
        setLastSavedTime(res.lastSaved);
      }
      setIsAutoSaving(false);
    }, 1200);

    return () => clearTimeout(debounceTimer);
  }, [files, activeFilePath]);

  // Periodic interval save every 15 seconds to ensure sync
  useEffect(() => {
    const interval = setInterval(() => {
      const res = saveProjectToStorage(files, activeFilePath);
      if (res.success) {
        setLastSavedTime(res.lastSaved);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [files, activeFilePath]);

  // Manual save trigger to localStorage
  const handleManualSave = useCallback(() => {
    setIsAutoSaving(true);
    const res = saveProjectToStorage(files, activeFilePath);
    if (res.success) {
      setLastSavedTime(res.lastSaved);
      showToast(`บันทึกโปรเจกต์ลง LocalStorage สำเร็จแล้ว (${res.lastSaved})`);
    } else {
      showToast('ไม่สามารถบันทึกได้: ' + (res.error || ''));
    }
    setIsAutoSaving(false);
  }, [files, activeFilePath, showToast]);

  // Manual trigger to sync current files to Firestore using authenticated user ID
  const handleManualCloudSync = useCallback(async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('กรุณาเข้าสู่ระบบก่อนเพื่อซิงค์โปรเจกต์ไปยัง Firestore');
      return;
    }

    setIsCloudSyncing(true);
    try {
      const res = await syncCurrentProjectToFirestore(
        currentUser.uid,
        files,
        activeFilePath,
        {
          projectId: activeProjectId,
        }
      );
      if (res.success) {
        setLastCloudSyncedTime(res.lastSynced);
        showToast(
          `ซิงค์โปรเจกต์ไปยัง Firestore สำเร็จ (${res.filesCount} ไฟล์ เมื่อ ${res.lastSynced})`
        );
      }
    } catch (err: any) {
      showToast('การซิงค์ไปยัง Firestore ขัดข้อง: ' + err.message);
    } finally {
      setIsCloudSyncing(false);
    }
  }, [currentUser, files, activeFilePath, activeProjectId, showToast]);

  // Load a project retrieved from Firestore into current editor
  const handleLoadCloudProject = useCallback(
    (project: CloudProject) => {
      if (!project.files || project.files.length === 0) return;
      setFiles(project.files);
      const targetPath = project.activeFilePath || project.files[0].path;
      setActiveFilePath(targetPath);
      saveProjectToStorage(project.files, targetPath);
      const timeStr = project.updatedAt
        ? new Date(project.updatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
      setLastCloudSyncedTime(timeStr);
    },
    []
  );

  // Clear storage and reset
  const handleClearStorage = useCallback(() => {
    clearProjectStorage();
    const defaultFiles = SAMPLE_PROJECTS['syntax_error_test'];
    setFiles(defaultFiles);
    setActiveFilePath(defaultFiles[0].path);
    setLastSavedTime(null);
    showToast('รีเซ็ตโปรเจกต์และล้างข้อมูลเซฟใน LocalStorage เรียบร้อยแล้ว');
  }, [showToast]);

  // Active file lookup
  const activeFile = useMemo(() => {
    return files.find((f) => f.path === activeFilePath) || files[0] || null;
  }, [files, activeFilePath]);

  // Real-time syntax diagnostics calculation as user types!
  const diagnostics = useMemo<SyntaxDiagnostic[]>(() => {
    if (!activeFile || activeFile.isBinary) return [];
    if (activeFile.name.endsWith('.rpy') || activeFile.name.endsWith('.py')) {
      return checkRenpySyntax(activeFile.content);
    }
    return [];
  }, [activeFile]);

  // Update current file content
  const handleUpdateCode = useCallback((newContent: string) => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.path === activeFile.path ? { ...f, content: newContent, modified: true } : f
      )
    );
  }, [activeFile]);

  // Handle single diagnostic quick fix
  const handleApplyFix = (diag: SyntaxDiagnostic) => {
    if (!diag.fixSuggestion || !activeFile) return;

    const lines = activeFile.content.split('\n');
    const lineIndex = diag.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines[lineIndex] = diag.fixSuggestion.newText;
      const newCode = lines.join('\n');
      handleUpdateCode(newCode);
      showToast(`แก้ไขบรรทัดที่ ${diag.line} เรียบร้อยแล้ว (${diag.fixSuggestion.labelTh})`);
    }
  };

  // Create commit checkpoint
  const handleCreateCommit = useCallback((message: string, tag: string = 'Checkpoint') => {
    const newCommit: VersionCommit = {
      id: `commit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      author: 'Web Studio',
      filesSnapshot: JSON.parse(JSON.stringify(files)),
      activeFilePath,
      tag,
    };
    setCommits((prev) => {
      const updated = [newCommit, ...prev];
      saveVersionHistoryToStorage(updated);
      return updated;
    });
    showToast(`บันทึกจุดย้อนกลับ (Commit): "${message}" เรียบร้อยแล้ว`);
  }, [files, activeFilePath, showToast]);

  // Revert to commit
  const handleRevertCommit = useCallback((commit: VersionCommit) => {
    // Save safety commit of current state before reverting
    const safetyCommit: VersionCommit = {
      id: `safety-${Date.now()}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: `[จุดปลอดภัยก่อน Revert] สู่ "${commit.message}"`,
      author: 'Auto Backup',
      filesSnapshot: JSON.parse(JSON.stringify(files)),
      activeFilePath,
      tag: 'Checkpoint',
    };
    setCommits((prev) => {
      const updated = [safetyCommit, ...prev];
      saveVersionHistoryToStorage(updated);
      return updated;
    });

    const restoredFiles: ProjectFile[] = JSON.parse(JSON.stringify(commit.filesSnapshot));
    setFiles(restoredFiles);
    setActiveFilePath(commit.activeFilePath || restoredFiles[0]?.path || '');
    saveProjectToStorage(restoredFiles, commit.activeFilePath);
    showToast(`ย้อนกลับไปยังเวอร์ชัน "${commit.message}" สำเร็จแล้ว!`);
  }, [files, activeFilePath, showToast]);

  // Delete commit
  const handleDeleteCommit = useCallback((id: string) => {
    setCommits((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveVersionHistoryToStorage(updated);
      return updated;
    });
    showToast('ลบ Commit เรียบร้อยแล้ว');
  }, [showToast]);

  // Clear all version history
  const handleClearHistory = useCallback(() => {
    setCommits([]);
    saveVersionHistoryToStorage([]);
    showToast('ล้างประวัติ Commit ทั้งหมดเรียบร้อยแล้ว');
  }, [showToast]);

  // Fix all syntax issues using Gemini 4 Argon with High Thinking Mode
  const handleAiFixAll = async () => {
    if (!activeFile || isAiFixing) return;

    // Automatically create a version snapshot before AI edits
    handleCreateCommit('[Auto Checkpoint] ก่อนแก้ไขด้วย AI', 'AI-Fix');

    setIsAiFixing(true);
    showToast('กำลังส่งให้ Gemini 4 Argon วิเคราะห์และแก้ไขข้อผิดพลาดไวยากรณ์ด้วย High Thinking...');

    try {
      const res = await fetch('/api/ai/fix-syntax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          diagnostics,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.fixedCode) {
        handleUpdateCode(data.data.fixedCode);
        const fixesCount = data.data.fixesApplied?.length || 'หลาย';
        showToast(`AI ได้แก้ไขข้อผิดพลาดแล้ว ${fixesCount} จุดอย่างสมบูรณ์!`);
      } else {
        throw new Error(data.error || 'Failed to fix code');
      }
    } catch (err: any) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการแก้ไขด้วย AI: ' + err.message);
    } finally {
      setIsAiFixing(false);
    }
  };

  // Load sample presets
  const handleSelectSamplePreset = (presetKey: string) => {
    if (SAMPLE_PROJECTS[presetKey]) {
      const presetFiles = SAMPLE_PROJECTS[presetKey];
      setFiles(presetFiles);
      setActiveFilePath(presetFiles[0].path);
      setActiveTab('editor');
      showToast(`โหลดชุดตัวอย่าง "${presetKey}" เรียบร้อยแล้ว`);
    }
  };

  // Handle file upload (.rpy, .py, .apk, .zip, etc.)
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.apk') || file.name.endsWith('.zip') || file.name.endsWith('.rpa')) {
      showToast(`กำลังเปิดและแกะโครงสร้างไฟล์ ${file.name}...`);
      try {
        const result = await parseApkOrZipFile(file);
        if (result.files.length > 0) {
          setFiles(result.files);
          const firstRpy = result.files.find((f) => f.path.endsWith('.rpy')) || result.files[0];
          setActiveFilePath(firstRpy.path);
          setActiveTab('apk');
          showToast(`เปิดไฟล์ ${file.name} สำเร็จ! พบไฟล์ทั้งหมด ${result.files.length} รายการ`);
        }
      } catch (err: any) {
        showToast('เกิดข้อผิดพลาดในการอ่านไฟล์ archive: ' + err.message);
      }
    } else {
      const text = await file.text();
      const newFile: ProjectFile = {
        name: file.name,
        path: file.name,
        content: text,
        isBinary: false,
        modified: false,
      };
      setFiles((prev) => [newFile, ...prev.filter((f) => f.path !== newFile.path)]);
      setActiveFilePath(newFile.path);
      setActiveTab('editor');
      showToast(`เปิดไฟล์ ${file.name} เรียบร้อยแล้ว`);
    }
  };

  // Add files to project (from APK, GitHub, or Mod generator)
  const handleAddFilesToProject = (newFiles: ProjectFile[]) => {
    setFiles((prev) => {
      const paths = new Set(newFiles.map((f) => f.path));
      const filtered = prev.filter((f) => !paths.has(f.path));
      return [...newFiles, ...filtered];
    });
  };

  // Create new blank file
  const handleCreateFile = (name: string) => {
    const defaultContent = name.endsWith('.rpy')
      ? `# ไฟล์ ${name} สำหรับเกม Ren'Py\n\nlabel ${name.replace(/\.rpy$/, '')}_start:\n    "ข้อความเริ่มต้น..."\n    return\n`
      : '';
    const newFile: ProjectFile = {
      name,
      path: `game/${name}`,
      content: defaultContent,
      isBinary: false,
      modified: true,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFilePath(newFile.path);
    setActiveTab('editor');
  };

  // Delete file
  const handleDeleteFile = (path: string) => {
    const remaining = files.filter((f) => f.path !== path);
    setFiles(remaining);
    if (activeFilePath === path && remaining.length > 0) {
      setActiveFilePath(remaining[0].path);
    }
  };

  // Download entire project as zip
  const handleDownloadProjectZip = async () => {
    showToast('กำลังเตรียมไฟล์ ZIP สำหรับดาวน์โหลด...');
    const blob = await exportModifiedZip(files);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renpy_project_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลด ZIP สำเร็จแล้ว!');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar with Auto-Save and Connectors */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAiAssistant={() => setShowAiAssistant(true)}
        onOpenVersionHistory={() => setShowVersionHistory(true)}
        versionCount={commits.length}
        onSelectSamplePreset={handleSelectSamplePreset}
        onUploadFile={handleUploadFile}
        onDownloadProjectZip={handleDownloadProjectZip}
        fileName={activeFile?.name || 'ไม่มีไฟล์'}
        lastSavedTime={lastSavedTime}
        isAutoSaving={isAutoSaving}
        onManualSave={handleManualSave}
        onClearStorage={handleClearStorage}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenCloudSync={() => setShowCloudSyncModal(true)}
        lastCloudSyncedTime={lastCloudSyncedTime}
        isCloudSyncing={isCloudSyncing}
        onTriggerCloudSync={handleManualCloudSync}
        onOpenDownloadApp={() => setShowDownloadAppModal(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600/95 text-white text-xs font-medium rounded-full shadow-xl shadow-indigo-500/20 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Code Editor & Live Syntax Diagnostics */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Collapsible File Explorer Sidebar */}
            {showFileExplorer && (
              <div className="w-56 sm:w-64 h-full shrink-0 border-r border-slate-800">
                <FileExplorer
                  files={files}
                  activeFile={activeFile}
                  onSelectFile={(f) => setActiveFilePath(f.path)}
                  onCreateFile={handleCreateFile}
                  onDeleteFile={handleDeleteFile}
                />
              </div>
            )}

            {/* Toggle File Explorer Button */}
            <div className="relative">
              <button
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                className="absolute top-2 left-2 z-10 p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800 shadow transition cursor-pointer"
                title={showFileExplorer ? 'ซ่อนรายการไฟล์' : 'แสดงรายการไฟล์'}
              >
                {showFileExplorer ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Main Code Editor Center */}
            <div className="flex-1 h-full min-w-0">
              {activeFile ? (
                <CodeEditor
                  code={activeFile.content}
                  fileName={activeFile.name}
                  onChange={handleUpdateCode}
                  diagnostics={diagnostics}
                  selectedLine={selectedErrorLine}
                  onSelectLine={(line) => setSelectedErrorLine(line)}
                  lastSavedTime={lastSavedTime}
                  isAutoSaving={isAutoSaving}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  ไม่มีไฟล์ที่เปิดอยู่
                </div>
              )}
            </div>

            {/* Right: Live Syntax Diagnostics Panel */}
            <div className="w-80 lg:w-96 h-full shrink-0 hidden md:block">
              <SyntaxDiagnosticsPanel
                diagnostics={diagnostics}
                onSelectLine={(line) => setSelectedErrorLine(line)}
                onApplyFix={handleApplyFix}
                onAiFixAll={handleAiFixAll}
                isAiFixing={isAiFixing}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Dialogue & Thai Translation Studio */}
        {activeTab === 'translator' && (
          <div className="flex-1 h-full overflow-hidden">
            <DialogueTranslator
              code={activeFile?.content || ''}
              fileName={activeFile?.name || 'script.rpy'}
              onUpdateCode={handleUpdateCode}
            />
          </div>
        )}

        {/* Tab 3: APK & Android Mod Studio */}
        {activeTab === 'apk' && (
          <div className="flex-1 h-full overflow-hidden">
            <ApkModStudio
              onOpenFileInEditor={(file) => {
                setActiveFilePath(file.path);
                setActiveTab('editor');
              }}
              onAddFilesToProject={handleAddFilesToProject}
            />
          </div>
        )}

        {/* Tab 4: Cheat Menu & Console Generator */}
        {activeTab === 'cheat_generator' && (
          <div className="flex-1 h-full overflow-hidden">
            <CheatGenerator
              onOpenGeneratedScript={(file) => {
                handleAddFilesToProject([file]);
                setActiveFilePath(file.path);
                setActiveTab('editor');
              }}
            />
          </div>
        )}

        {/* Tab 5: Connectors Studio (Gemini + OpenAI + Codex + GitHub) */}
        {activeTab === 'connectors' && (
          <div className="flex-1 h-full overflow-hidden">
            <ConnectorsStudio
              files={files}
              activeFile={activeFile}
              onAddFiles={handleAddFilesToProject}
              onOpenFile={(file) => {
                setActiveFilePath(file.path);
                setActiveTab('editor');
              }}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* Tab 6: Docs & Knowledge Guide */}
        {activeTab === 'docs' && (
          <div className="flex-1 h-full overflow-hidden">
            <DocsGuide />
          </div>
        )}

        {/* AI Assistant Drawer (Gemini 4 Argon with High Thinking Mode) */}
        <AiAssistantDrawer
          isOpen={showAiAssistant}
          onClose={() => setShowAiAssistant(false)}
          currentCode={activeFile?.content || ''}
          currentFileName={activeFile?.name || 'script.rpy'}
        />

        {/* Version History Drawer (Local Commit, Checkpoint & Revert) */}
        <VersionHistoryPanel
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          commits={commits}
          currentFiles={files}
          activeFile={activeFile}
          onCommit={handleCreateCommit}
          onRevert={handleRevertCommit}
          onDeleteCommit={handleDeleteCommit}
          onClearHistory={handleClearHistory}
        />

        {/* User Authentication & Custom Domain Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          currentUser={currentUser}
          onShowToast={showToast}
          onOpenCloudSync={() => setShowCloudSyncModal(true)}
        />

        {/* Firestore Cross-Device Cloud Sync Modal */}
        <CloudSyncModal
          isOpen={showCloudSyncModal}
          onClose={() => setShowCloudSyncModal(false)}
          currentUser={currentUser}
          currentFiles={files}
          activeFilePath={activeFilePath}
          activeProjectId={activeProjectId}
          onSetActiveProjectId={setActiveProjectId}
          onLoadCloudProject={handleLoadCloudProject}
          onOpenAuth={() => setShowAuthModal(true)}
          onShowToast={showToast}
          lastCloudSyncedTime={lastCloudSyncedTime}
          isCloudSyncing={isCloudSyncing}
          onTriggerSync={handleManualCloudSync}
          autoCloudSync={autoCloudSync}
          onToggleAutoCloudSync={setAutoCloudSync}
        />

        {/* Download App (APK / ZIP) Modal */}
        <DownloadAppModal
          isOpen={showDownloadAppModal}
          onClose={() => setShowDownloadAppModal(false)}
          files={files}
          activeFileName={activeFile?.name}
          onShowToast={showToast}
        />
      </div>
    </div>
  );
}
