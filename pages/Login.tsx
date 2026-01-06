import React, { useState } from 'react';
import { Library, Mail, Lock, User, ArrowRight, Chrome, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../services/firebaseDatabase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err: any) {
      console.error("Google auth error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google ile giriş yapılırken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        // Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update Profile with Name
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      console.error("Auth error:", err);
      // Detailed error messages in Turkish
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Bu e-posta adresi zaten kullanımda.');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz bir e-posta adresi girdiniz.');
          break;
        case 'auth/operation-not-allowed':
          setError('E-posta/Şifre girişi etkin değil.');
          break;
        case 'auth/weak-password':
          setError('Şifre çok zayıf (en az 6 karakter olmalı).');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('E-posta veya şifre hatalı.');
          break;
        default:
          setError('Bir hata oluştu: ' + (err.message || 'Lütfen tekrar deneyin.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-4 lg:p-12 font-sans">
      {/* Soft Background Orbs - Turquoise Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-200/40 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 blur-[130px] rounded-full animate-pulse delay-1000" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white shadow-[0_32px_128px_-12px_rgba(6,182,212,0.15)] rounded-[3.5rem] overflow-hidden border border-white animate-soft-fade">

        {/* Visual / Branding Section (Left/Top) */}
        <div className="relative flex flex-col justify-between p-10 lg:p-16 overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-500 to-blue-600 text-white">
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-20">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-xl border border-white/30 shadow-xl">
                <Library size={32} className="text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter uppercase">LibraTech</span>
            </div>

            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles size={14} className="text-cyan-200" />
                Kütüphane Yönetimi 2.0
              </div>
              <h1 className="text-4xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white">
                Okul Kütüphanenizi <br />
                <span className="text-cyan-100">Geleceğe Taşıyın</span>
              </h1>
              <p className="text-cyan-50/80 text-lg font-medium leading-relaxed max-w-sm">
                Öğretmenler için modern, hızlı ve akıllı kütüphane yönetim sistemi. QR kod desteği ile saniyeler içinde kitap takibi.
              </p>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <div className="flex items-center gap-6 bg-black/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-cyan-500 bg-cyan-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    {i === 3 ? '+2k' : <User size={14} />}
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-white/90">
                Dijital dönüşümde <br />
                lider kütüphane yazılımı.
              </p>
            </div>
          </div>

          {/* Glowing Background Elements for Visual side */}
          <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-white/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[60px]" />
        </div>

        {/* Form Section (Right/Bottom) */}
        <div className="p-10 lg:p-16 flex flex-col justify-center bg-white relative">
          <div className="mb-12 hidden lg:block">
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight uppercase">
              {isRegistering ? 'Hesap Oluştur' : 'Hoşgeldiniz'}
            </h2>
            <p className="text-slate-400 font-bold text-sm tracking-wide">
              {isRegistering ? 'Öğretmen paneline kayıt olun.' : 'Kütüphane sistemine giriş yapmaya hazır mısınız?'}
            </p>
          </div>

          {/* Premium Toggle Switch */}
          <div className="p-1.5 bg-slate-100/80 border border-slate-200 rounded-[1.5rem] mb-12 flex relative">
            <button
              onClick={() => { setIsRegistering(false); setError(null); }}
              className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 z-10 ${!isRegistering ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setIsRegistering(true); setError(null); }}
              className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 z-10 ${isRegistering ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Kayıt Ol
            </button>
            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-cyan-600 rounded-2xl transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-lg shadow-cyan-600/30 ${isRegistering ? 'left-[calc(50%+3px)]' : 'left-1.5'}`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-soft-fade">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            {isRegistering && (
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">İsim Soyisim</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Adınız Soyadınız"
                    className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 pl-14 pr-5 py-4.5 rounded-[1.25rem] focus:border-cyan-500/50 focus:bg-white transition-all font-bold placeholder:text-slate-300 outline-none disabled:opacity-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  placeholder="ogretmen@okul.com"
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 pl-14 pr-5 py-4.5 rounded-[1.25rem] focus:border-cyan-500/50 focus:bg-white transition-all font-bold placeholder:text-slate-300 outline-none disabled:opacity-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Parola</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 pl-14 pr-14 py-4.5 rounded-[1.25rem] focus:border-cyan-500/50 focus:bg-white transition-all font-bold placeholder:text-slate-300 outline-none disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-4 relative overflow-hidden group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Minimalist Social Section */}
          <div className="flex items-center gap-6 my-12">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hızlı Bağlan</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-16 bg-white hover:bg-slate-50 border-2 border-slate-100 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-4 group shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
              <Chrome size={22} className="text-cyan-600" />
            </div>
            Google ile Devam Et
          </button>

          <footer className="mt-14 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight mb-3">
              Kütüphane Yönetim Altyapısı &copy; 2026
            </p>
            <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className="hover:text-cyan-600 cursor-pointer transition-colors border-b-2 border-transparent hover:border-cyan-600/30 pb-0.5">Yardım</span>
              <span className="hover:text-cyan-600 cursor-pointer transition-colors border-b-2 border-transparent hover:border-cyan-600/30 pb-0.5">Gizlilik</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
