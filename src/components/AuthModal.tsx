import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  syncUserProfile,
} from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  LogOut,
  Copy,
  Check,
  Cloud,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onShowToast: (msg: string) => void;
  onOpenCloudSync?: () => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
  onOpenCloudSync,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'domain'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedAuthDomain, setCopiedAuthDomain] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        await syncUserProfile(cred.user, customDomain);
        onShowToast(`ยินดีต้อนรับคุณ ${displayName || email}! สมัครสมาชิกสำเร็จ`);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(cred.user);
        onShowToast(`เข้าสู่ระบบสำเร็จ! สวัสดีคุณ ${cred.user.displayName || cred.user.email}`);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let thError = err.message;
      if (err.code === 'auth/email-already-in-use') {
        thError = 'อีเมลนี้ถูกใช้งานแล้วในระบบ โปรดเข้าสู่ระบบแทน';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        thError = 'รหัสผ่านหรืออีเมลไม่ถูกต้อง';
      } else if (err.code === 'auth/weak-password') {
        thError = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      } else if (err.code === 'auth/invalid-email') {
        thError = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
      setErrorMsg(thError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(cred.user);
      onShowToast(`เข้าสู่ระบบด้วย Google สำเร็จ! สวัสดีคุณ ${cred.user.displayName || cred.user.email}`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onShowToast('ออกจากระบบเรียบร้อยแล้ว');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      await syncUserProfile(currentUser, customDomain.trim());
      onShowToast(`บันทึกการตั้งค่าโดเมน "${customDomain}" สำเร็จ!`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">
                {currentUser
                  ? 'บัญชีผู้ใช้งาน & ตั้งค่าเว็บไซต์'
                  : mode === 'signup'
                  ? 'สมัครสมาชิกเข้าใช้งานสตูดิโอ'
                  : 'เข้าสู่ระบบ (Sign In)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser ? currentUser.email : 'เชื่อมต่อบัญชีเพื่อเซฟโปรเจกต์บนคลาวด์และจัดการโดเมน'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        {!currentUser ? (
          <div className="flex border-b border-slate-800 text-xs font-medium bg-slate-950/40">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'signin'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'signup'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              สมัครสมาชิกใหม่
            </button>
            <button
              onClick={() => {
                setMode('domain');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'domain'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 คู่มือโดเมน
            </button>
          </div>
        ) : (
          <div className="flex border-b border-slate-800 text-xs font-medium bg-slate-950/40">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'signin'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              โปรไฟล์ผู้ใช้
            </button>
            <button
              onClick={() => setMode('domain')}
              className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'domain'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 เชื่อมต่อโดเมนส่วนตัว
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Already Logged In View */}
          {currentUser && mode === 'signin' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-slate-100 truncate">
                    {currentUser.displayName || 'ผู้ใช้งาน Ren\'Py Studio'}
                  </h4>
                  <p className="text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                    ✓ เข้าสู่ระบบแล้ว (Verified)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">UID:</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[200px]">
                    {currentUser.uid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">สถานะบันทึกคลาวด์:</span>
                  <span className="text-emerald-400 font-medium">พร้อมใช้งาน (Active)</span>
                </div>
              </div>

              {onOpenCloudSync && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCloudSync();
                  }}
                  className="w-full py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg transition font-medium cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <Cloud className="w-4 h-4 text-indigo-400" />
                  <span>จัดการโปรเจกต์และการซิงค์บน Firestore</span>
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-800/50 rounded-lg transition font-medium cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}

          {/* Custom Domain Guide & Configuration Tab */}
          {mode === 'domain' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Globe className="w-4 h-4" />
                  <span>วิธีเชื่อมต่อโดเมนของคุณกับระบบเว็บ</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  สำหรับผู้ใช้ที่มีโดเมนอยู่แล้ว (เช่น <code>yourgame.com</code> หรือ <code>studio.yourdomain.com</code>) สามารถเชื่อมต่อระบบได้ดังนี้:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    <b>เพิ่ม Authorized Domain:</b> เข้าไปที่ Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains แล้วเพิ่มชื่อโดเมนของคุณลงในรายการ
                  </li>
                  <li>
                    <b>Firebase Auth Domain ปัจจุบัน:</b>
                    <div className="mt-1 flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800 font-mono text-[10px] text-indigo-300">
                      <span>{firebaseConfig.authDomain}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(firebaseConfig.authDomain);
                          setCopiedAuthDomain(true);
                          setTimeout(() => setCopiedAuthDomain(false), 2000);
                        }}
                        className="p-1 hover:text-white cursor-pointer"
                        title="คัดลอก"
                      >
                        {copiedAuthDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    <b>ตั้งค่า DNS ที่ผู้ให้บริการโดเมนของคุณ:</b>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-300 mt-1 space-y-0.5">
                      <div>Type: CNAME</div>
                      <div>Host / Name: @ หรือ studio</div>
                      <div>Value: {firebaseConfig.authDomain}</div>
                    </div>
                  </li>
                </ol>
              </div>

              {currentUser && (
                <form onSubmit={handleSaveDomain} className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-200 block">
                    บันทึกโดเมนของคุณในโปรไฟล์:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น mygame.com หรือ studio.mydomain.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={loading || !customDomain.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'กำลังบันทึก...' : 'บันทึกโดเมน'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sign In & Sign Up Form */}
          {!currentUser && (mode === 'signin' || mode === 'signup') && (
            <div className="space-y-4">
              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium rounded-xl transition flex items-center justify-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>ดำเนินการต่อด้วย Google (1-Click)</span>
              </button>

              <div className="flex items-center gap-3 text-slate-500">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[11px]">หรือใช้อีเมลและรหัสผ่าน</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      ชื่อที่ใช้แสดง (Display Name)
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="เช่น GameDev, นักพัฒนา"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    อีเมล (Email)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-slate-200 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 mt-2"
                >
                  {loading
                    ? 'กำลังประมวลผล...'
                    : mode === 'signup'
                    ? 'สมัครสมาชิกและเริ่มใช้งาน'
                    : 'เข้าสู่ระบบ'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
