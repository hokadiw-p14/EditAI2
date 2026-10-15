import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  CloudProject,
  syncCurrentProjectToFirestore,
  loadProjectFromFirestore,
  listUserProjectsFromFirestore,
  deleteProjectFromFirestore,
  DEFAULT_PROJECT_ID,
} from '../services/projectSyncService';
import { ProjectFile } from '../types';
import {
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  Trash2,
  Plus,
  RefreshCw,
  FolderCode,
  Laptop,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  LogIn,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentFiles: ProjectFile[];
  activeFilePath: string;
  activeProjectId: string;
  onSetActiveProjectId: (id: string) => void;
  onLoadCloudProject: (project: CloudProject) => void;
  onOpenAuth: () => void;
  onShowToast: (msg: string) => void;
  lastCloudSyncedTime: string | null;
  isCloudSyncing: boolean;
  onTriggerSync: () => void;
  autoCloudSync: boolean;
  onToggleAutoCloudSync: (enabled: boolean) => void;
}

export const CloudSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  currentFiles,
  activeFilePath,
  activeProjectId,
  onSetActiveProjectId,
  onLoadCloudProject,
  onOpenAuth,
  onShowToast,
  lastCloudSyncedTime,
  isCloudSyncing,
  onTriggerSync,
  autoCloudSync,
  onToggleAutoCloudSync,
}) => {
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch list of user's cloud projects
  const fetchProjects = useCallback(async () => {
    if (!currentUser) {
      setProjects([]);
      return;
    }
    setLoadingList(true);
    try {
      const list = await listUserProjectsFromFirestore(currentUser.uid);
      setProjects(list);
    } catch (err: any) {
      console.error('Failed to list cloud projects:', err);
    } finally {
      setLoadingList(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchProjects();
    }
  }, [isOpen, currentUser, fetchProjects]);

  if (!isOpen) return null;

  // Create & save as a new cloud project
  const handleSaveAsNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newProjectName.trim()) return;

    const newId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setActionInProgress(newId);
    try {
      const res = await syncCurrentProjectToFirestore(
        currentUser.uid,
        currentFiles,
        activeFilePath,
        {
          projectId: newId,
          projectName: newProjectName.trim(),
        }
      );

      if (res.success) {
        onSetActiveProjectId(newId);
        setNewProjectName('');
        setShowNewProjectInput(false);
        await fetchProjects();
        onShowToast(`สร้างและบันทึกโปรเจกต์ "${newProjectName.trim()}" บนคลาวด์สำเร็จ!`);
      }
    } catch (err: any) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึกโปรเจกต์ใหม่: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Load selected project into workspace
  const handleLoadProject = async (project: CloudProject) => {
    setActionInProgress(project.id);
    try {
      if (
        window.confirm(
          `คุณต้องการเปิดโปรเจกต์ "${project.name}" จาก Firestore หรือไม่? (ไฟล์ปัจจุบันในเครื่องจะถูกแทนที่ด้วยไฟล์จากคลาวด์)`
        )
      ) {
        onSetActiveProjectId(project.id);
        onLoadCloudProject(project);
        onShowToast(`โหลดโปรเจกต์ "${project.name}" (${project.files.length} ไฟล์) เรียบร้อยแล้ว`);
        onClose();
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete project from cloud
  const handleDeleteProject = async (projectId: string, name: string) => {
    if (!currentUser) return;
    if (
      !window.confirm(
        `ยืนยันการลบโปรเจกต์ "${name}" ออกจาก Firestore หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`
      )
    ) {
      return;
    }

    setActionInProgress(projectId);
    try {
      await deleteProjectFromFirestore(currentUser.uid, projectId);
      await fetchProjects();
      onShowToast(`ลบโปรเจกต์ "${name}" ออกจากคลาวด์แล้ว`);
    } catch (err: any) {
      onShowToast('เกิดข้อผิดพลาดในการลบโปรเจกต์: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  ระบบซิงค์โปรเจกต์ข้ามอุปกรณ์ (Cloud Sync)
                </h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded font-mono">
                  Firestore DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ซิงค์และบันทึกไฟล์สคริปต์ Ren'Py อัตโนมัติด้วย User ID เพื่อเปิดใช้งานต่อเนื่องทุกอุปกรณ์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {!currentUser ? (
            /* Not logged in view */
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  เข้าสู่ระบบเพื่อใช้งานคลาวด์ซิงค์
                </h4>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                  เมื่อเข้าสู่ระบบด้วย Google หรืออีเมล ไฟล์โปรเจกต์ของคุณจะถูกบันทึกลงในฐานข้อมูล Firestore ภายใต้ User ID ของคุณโดยอัตโนมัติ ทำให้คุณสามารถทำงานต่อบนอุปกรณ์อื่นได้ทันที
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl text-xs shadow-lg transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบหรือสมัครสมาชิก (1-Click Google)</span>
              </button>
            </div>
          ) : (
            /* Logged in view */
            <>
              {/* Current Status Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">
                        {currentUser.displayName || currentUser.email}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        UID: {currentUser.uid}
                      </div>
                    </div>
                  </div>

                  {/* Sync Trigger Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onTriggerSync}
                      disabled={isCloudSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-md disabled:opacity-50"
                      title="ส่งไฟล์ปัจจุบันทั้งหมดขึ้นคลาวด์ทันที"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`}
                      />
                      <span>{isCloudSyncing ? 'กำลังซิงค์...' : 'ซิงค์ขึ้นคลาวด์เดี๋ยวนี้'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-300">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">สถานะการเชื่อมต่อ:</div>
                    <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-medium">
                      <CloudCheck className="w-4 h-4 text-emerald-400" />
                      <span>พร้อมใช้งาน (Online)</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">ซิงค์ล่าสุดเมื่อ:</div>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lastCloudSyncedTime || 'ยังไม่ได้ซิงค์รอบนี้'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">ไฟล์ในโปรเจกต์ปัจจุบัน:</div>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-medium">
                      <FolderCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentFiles.length} ไฟล์</span>
                    </div>
                  </div>
                </div>

                {/* Auto Cloud Sync Switch */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-200">
                      ระบบบันทึกคลาวด์อัตโนมัติ (Auto-Sync to Firestore)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ส่งข้อมูลขึ้น Firestore อัตโนมัติเมื่อมีการแก้ไขโค้ดหรือเพิ่มไฟล์
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleAutoCloudSync(!autoCloudSync)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoCloudSync ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoCloudSync ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Cloud Projects Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-semibold text-slate-200 text-xs">
                      โปรเจกต์ทั้งหมดของคุณบน Firestore ({projects.length})
                    </h4>
                  </div>

                  <button
                    onClick={() => setShowNewProjectInput(!showNewProjectInput)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>เซฟเป็นโปรเจกต์ใหม่</span>
                  </button>
                </div>

                {/* Save as new project form */}
                {showNewProjectInput && (
                  <form
                    onSubmit={handleSaveAsNewProject}
                    className="p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-xl space-y-2 animate-in fade-in"
                  >
                    <label className="text-[11px] font-medium text-slate-300 block">
                      ระบุชื่อโปรเจกต์ใหม่:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="เช่น My RenPy Visual Novel Episode 1"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={actionInProgress !== null || !newProjectName.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        บันทึกทันที
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewProjectInput(false)}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </form>
                )}

                {/* Projects List */}
                {loadingList ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>กำลังโหลดรายการโปรเจกต์จากคลาวด์...</span>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800/80 text-center space-y-2">
                    <p className="text-slate-400 text-xs">
                      ยังไม่มีโปรเจกต์อื่นที่บันทึกไว้ในบัญชีของคุณ
                    </p>
                    <p className="text-[11px] text-slate-500">
                      กดปุ่ม "ซิงค์ขึ้นคลาวด์เดี๋ยวนี้" เพื่อบันทึกไฟล์สคริปต์ปัจจุบันลง Firestore เป็นโปรเจกต์หลักของคุณ
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {projects.map((proj) => {
                      const isCurrent = proj.id === activeProjectId;
                      const formattedUpdated = proj.updatedAt
                        ? new Date(proj.updatedAt).toLocaleString()
                        : 'ไม่ระบุ';

                      return (
                        <div
                          key={proj.id}
                          className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                            isCurrent
                              ? 'bg-indigo-950/30 border-indigo-600/60'
                              : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200 text-xs truncate">
                                {proj.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono">
                                  โปรเจกต์ปัจจุบัน
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                              <span>{proj.filesCount || proj.files?.length || 0} ไฟล์</span>
                              <span>•</span>
                              <span>อัปเดตล่าสุด: {formattedUpdated}</span>
                              {proj.lastSyncedDevice && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500 truncate max-w-[140px]">
                                    {proj.lastSyncedDevice}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleLoadProject(proj)}
                              disabled={actionInProgress !== null}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                              title="เปิดโปรเจกต์นี้ลงใน Editor"
                            >
                              <CloudDownload className="w-3.5 h-3.5 text-indigo-400" />
                              <span>เปิดโปรเจกต์</span>
                            </button>

                            <button
                              onClick={() => handleDeleteProject(proj.id, proj.name)}
                              disabled={actionInProgress !== null}
                              className="p-1.5 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                              title="ลบโปรเจกต์นี้ออกจากคลาวด์"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>เชื่อมต่อกับ Firestore: {currentUser ? 'พร้อมใช้งาน' : 'ต้องเข้าสู่ระบบ'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
