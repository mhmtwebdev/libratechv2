import React, { useState } from 'react';
import { Library, Mail, Lock, User, ArrowRight, Chrome, Eye, EyeOff, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { auth, googleProvider, LibraryService } from '../services/firebaseDatabase';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Sınıf Kütüphanem tamamen ücretsiz mi?",
      answer: "Evet! Öğretmenler ve okullar için temel özelliklerin tamamı ücretsizdir. Amacımız okuma alışkanlığını teknolojinin gücüyle artırmaktır."
    },
    {
      question: "Öğrenci verilerim güvende mi?",
      answer: "Kesinlikle. Verileriniz Google'ın güvenli sunucularında (Firebase) şifreli olarak saklanır. Sizin izniniz olmadan kimse (biz dahil) verilerinize erişemez."
    },
    {
      question: "QR Kod sistemi nasıl çalışır?",
      answer: "Sistem, her kitabınız ve öğrenciniz için özel bir QR kod üretir. Bu kodları bir kez yazıcıdan çıkarıp yapıştırdığınızda, ödünç verme işlemi sadece kameraya okutarak 1 saniyede tamamlanır."
    },
    {
      question: "Veliler sisteme giriş yapabilir mi?",
      answer: "Veliler üye olmadan, kendilerine verdiğiniz özel link veya kod ile sadece kendi çocuklarının okuma geçmişini görüntüleyebilirler. Sınıfın genelini göremezler."
    }
  ];

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      // Auth state listener in App.tsx will handle the rest
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Giriş işlemi iptal edildi.');
      } else {
        setError('Google ile giriş yapılırken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          throw new Error('Lütfen isminizi giriniz.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // Create initial user document if needed
        await LibraryService.createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email || '',
          displayName: name,
          role: 'teacher'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Auth state listener in App.tsx will handle the rest
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-posta adresi veya parola hatalı.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else if (err.code === 'auth/weak-password') {
        setError('Parola en az 6 karakter olmalıdır.');
      } else {
        setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-y-auto">
      {/* Hero / Login Section */}
      <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-12 overflow-hidden">
        {/* Soft Background Orbs - Turquoise Theme (Keep existing) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-200/40 blur-[130px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 blur-[130px] rounded-full animate-pulse delay-1000 pointer-events-none" />

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white shadow-[0_32px_128px_-12px_rgba(6,182,212,0.15)] rounded-[3.5rem] overflow-hidden border border-white animate-soft-fade z-10 relative">

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

            <div className="relative z-10 hidden lg:block mt-12">
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
                  <label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">İsim Soyisim</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Adınız Soyadınız"
                      className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 pl-14 pr-5 py-4.5 rounded-[1.25rem] focus:border-cyan-500/50 focus:bg-white transition-all font-bold placeholder:text-slate-300 outline-none disabled:opacity-50"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 group">
                <label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">E-Posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="ogretmen@okul.com"
                    className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 pl-14 pr-5 py-4.5 rounded-[1.25rem] focus:border-cyan-500/50 focus:bg-white transition-all font-bold placeholder:text-slate-300 outline-none disabled:opacity-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Parola</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 pl-14 pr-14 py-4.5 rounded-[1.25rem] focus:border-cyan-500/50 focus:bg-white transition-all font-bold placeholder:text-slate-300 outline-none disabled:opacity-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors"
                    disabled={loading}
                    aria-label={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
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
              className="w-full h-14 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md active:bg-slate-100 disabled:opacity-50 mt-2"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <span className="font-semibold">Google ile Giriş Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Landing Page Content (Below Fold) */}
      <section className="py-24 px-4 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-cyan-600 font-black text-xs uppercase tracking-widest bg-cyan-50 px-4 py-2 rounded-full border border-cyan-100">Özellikler</span>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-800 mt-6 mb-4 tracking-tight">
            Kütüphane Yönetimi <span className="text-cyan-600">Yeniden Tanımlandı</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Kitap takibini manuel yapmaktan yorulmadınız mı? Modern araçlarla kütüphanenizi dijitale taşıyın, zaman kazanın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: <div className="p-4 bg-cyan-100 rounded-2xl text-cyan-600"><Chrome size={32} /></div>,
              title: "QR Kod ile Hızlı İşlem",
              desc: "Kitapların ve öğrencilerin üzerine yapıştırdığınız her QR kod, saniyeler içinde ödünç verme işlemi yapmanızı sağlar."
            },
            {
              icon: <div className="p-4 bg-blue-100 rounded-2xl text-blue-600"><Sparkles size={32} /></div>,
              title: "Akıllı Raporlama",
              desc: "Hangi öğrenci ne kadar okuyor? Sınıfın en çok okuyanları kimler? Tek tıkla detaylı grafiklere ulaşın."
            },
            {
              icon: <div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600"><Library size={32} /></div>,
              title: "Bulut Tabanlı Sistem",
              desc: "Verileriniz güvenle saklanır. Bilgisayardan, tabletten veya telefondan dilediğiniz zaman erişin."
            }
          ].map((feature, idx) => (
            <div key={idx} className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-cyan-100/50 transition-all duration-300 hover:-translate-y-1">
              {feature.icon}
              <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden text-center lg:text-left mb-24">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-cyan-900/50 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4 max-w-xl">
              <h3 className="text-3xl lg:text-4xl font-black tracking-tight">Siz Eğitime Odaklanın, <br /><span className="text-cyan-400">Gerisini Bize Bırakın.</span></h3>
              <p className="text-slate-400 text-lg">Binlerce kitap ve öğrenci hareketi, tek bir platformda güvenle yönetiliyor.</p>
            </div>
            <div className="flex gap-8 lg:gap-16">
              <div>
                <div className="text-4xl lg:text-5xl font-black text-white mb-2">100%</div>
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Ücretsiz</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-black text-white mb-2">7/24</div>
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Erişim</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-12">
            <span className="text-cyan-600 font-black text-xs uppercase tracking-widest bg-cyan-50 px-4 py-2 rounded-full border border-cyan-100">Merak Edilenler</span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mt-6 tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${openFaqIndex === idx ? 'border-cyan-200 shadow-lg shadow-cyan-100/50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`font-bold text-lg ${openFaqIndex === idx ? 'text-cyan-700' : 'text-slate-700'}`}>
                    {faq.question}
                  </span>
                  <div className={`p-2 rounded-full transition-colors ${openFaqIndex === idx ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-50 text-slate-400'}`}>
                    {openFaqIndex === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                <div
                  className={`px-6 transition-all duration-300 ease-in-out ${openFaqIndex === idx ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
                >
                  <p className="text-slate-500 leading-relaxed font-medium">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-600 to-blue-600 p-2 rounded-xl">
              <Library size={20} className="text-white" />
            </div>
            <span className="font-black text-slate-800 tracking-tight text-lg uppercase">LibraTech</span>
          </div>
          <p className="text-slate-400 text-xs font-bold">
            © 2026 Tüm Hakları Saklıdır. | Designed by Mahmutissiz
          </p>
        </div>
      </footer>
    </div>
  );
};
