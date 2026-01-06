import React, { useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { BookDown, BookUp, AlertTriangle, CheckCircle, Zap, List, AlertCircle } from 'lucide-react';
import { OptimizedScanner } from '../components/OptimizedScanner';

type Mode = 'ISSUE' | 'RETURN';

export const Circulation: React.FC = () => {
  const [mode, setMode] = useState<Mode>('ISSUE');
  const [duration, setDuration] = useState(14); // Default 14 days

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning', msg: string } | null>(null);
  const [batchResults, setBatchResults] = useState<{ successes: string[], failures: string[] } | null>(null);

  // Scanner State
  const [showScanner, setShowScanner] = useState<boolean>(false);

  const handleBatchComplete = async (studentId: string | null, books: string[]) => {
    setShowScanner(false);
    setBatchResults(null);
    setFeedback({ type: 'warning', msg: 'İşlem yapılıyor, lütfen bekleyin...' });

    const successes: string[] = [];
    const failures: string[] = [];

    for (const isbn of books) {
      try {
        const result = mode === 'ISSUE'
          ? await LibraryService.issueBook(isbn, studentId!, duration)
          : await LibraryService.returnBook(isbn);

        if (result.success) {
          successes.push(`${isbn}: ${result.message}`);
        } else {
          failures.push(`${isbn}: ${result.message}`);
        }
      } catch (error) {
        failures.push(`${isbn}: Sistem hatası`);
      }
    }

    setBatchResults({ successes, failures });

    if (failures.length === 0) {
      setFeedback({ type: 'success', msg: `Toplam ${successes.length} kitap başarıyla ${mode === 'ISSUE' ? 'ödünç verildi' : 'iade alındı'}.` });
    } else {
      setFeedback({ type: 'warning', msg: `${successes.length} kitap başarılı, ${failures.length} kitapta hata oluştu.` });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <div className="text-center space-y-3 py-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Ödünç & İade Bankosu</h2>
        <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Hızlı tarama sistemi ile kitap işlemlerini saniyeler içinde tamamlayın.</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Issue Card */}
        <div className={`relative overflow-hidden group rounded-[2.5rem] p-10 border-2 transition-all cursor-pointer ${mode === 'ISSUE' ? 'border-cyan-500 bg-white shadow-2xl shadow-cyan-900/10 scale-105 z-10' : 'border-slate-200 bg-slate-50 hover:border-cyan-200 hover:bg-white opacity-80 hover:opacity-100'}`}
          onClick={() => { setMode('ISSUE'); setFeedback(null); setBatchResults(null); }}>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="space-y-6">
              <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg transition-colors ${mode === 'ISSUE' ? 'bg-cyan-500 text-white shadow-cyan-300' : 'bg-slate-200 text-slate-400'}`}>
                <BookDown size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Kitap Ver (Ödünç)</h3>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed">Öğrenci kartı ve kitapları taratarak ödünç verin.</p>
              </div>
            </div>

            {mode === 'ISSUE' && (
              <div className="mt-10 space-y-6 animate-soft-fade">
                <div className="space-y-2">
                  <label htmlFor="issue-duration" className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Ödünç Süresi</label>
                  <div className='relative'>
                    <select
                      id="issue-duration"
                      name="issue-duration"
                      value={duration}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="block w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 px-5 font-bold text-slate-700 outline-none focus:border-cyan-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value={7}>7 Gün (1 Hafta)</option>
                      <option value={14}>14 Gün (2 Hafta)</option>
                      <option value={30}>30 Gün (1 Ay)</option>
                      <option value={90}>90 Gün (Dönemlik)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap size={24} fill="currentColor" />
                  <span>Hızlı Taramayı Başlat</span>
                </button>
              </div>
            )}
          </div>
          {mode === 'ISSUE' && <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />}
        </div>

        {/* Return Card */}
        <div className={`relative overflow-hidden group rounded-[2.5rem] p-10 border-2 transition-all cursor-pointer ${mode === 'RETURN' ? 'border-emerald-500 bg-white shadow-2xl shadow-emerald-900/10 scale-105 z-10' : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white opacity-80 hover:opacity-100'}`}
          onClick={() => { setMode('RETURN'); setFeedback(null); setBatchResults(null); }}>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="space-y-6">
              <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg transition-colors ${mode === 'RETURN' ? 'bg-emerald-500 text-white shadow-emerald-300' : 'bg-slate-200 text-slate-400'}`}>
                <BookUp size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Kitap Al (İade)</h3>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed">İade edilen kitapları topluca envantere geri alın.</p>
              </div>
            </div>

            {mode === 'RETURN' && (
              <div className="mt-10 animate-soft-fade">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap size={24} fill="currentColor" />
                  <span>Hızlı Taramayı Başlat</span>
                </button>
              </div>
            )}
          </div>
          {mode === 'RETURN' && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />}
        </div>
      </div>

      {/* Scanner Modal Area */}
      {showScanner && (
        <OptimizedScanner
          onComplete={handleBatchComplete}
          onCancel={() => setShowScanner(false)}
          isReturnOnly={mode === 'RETURN'}
        />
      )}

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-6 rounded-[2rem] flex items-center space-x-5 border-2 animate-soft-fade ${feedback.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-100' :
          feedback.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100' :
            'bg-emerald-50 text-emerald-800 border-emerald-100'
          }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feedback.type === 'error' ? 'bg-rose-200 text-rose-700' :
            feedback.type === 'warning' ? 'bg-amber-200 text-amber-700' :
              'bg-emerald-200 text-emerald-700'
            }`}>
            {feedback.type === 'error' && <AlertCircle size={28} />}
            {feedback.type === 'warning' && <AlertTriangle size={28} />}
            {feedback.type === 'success' && <CheckCircle size={28} />}
          </div>
          <div>
            <p className="text-lg font-black uppercase tracking-wide mb-1 opacity-80">{feedback.type === 'error' ? 'Hata Oluştu' : feedback.type === 'warning' ? 'Uyarı' : 'İşlem Başarılı'}</p>
            <p className="font-bold text-lg">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Batch Results Report */}
      {batchResults && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 animate-soft-fade">
          <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-100 flex justify-between items-center backdrop-blur-sm">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-3 uppercase tracking-tight">
              <List size={24} className="text-cyan-600" />
              İşlem Raporu
            </h3>
            <button onClick={() => setBatchResults(null)} className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              Raporu Kapat <Zap size={16} className="inline rotate-12" />
            </button>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-8">
            {batchResults.successes.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                  Başarılı İşlemler ({batchResults.successes.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {batchResults.successes.map((msg, i) => (
                    <div key={i} className="p-4 bg-emerald-50 rounded-2xl text-sm text-emerald-800 font-bold flex items-center gap-3 border border-emerald-100/50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" />
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {batchResults.failures.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                  Hatalı İşlemler ({batchResults.failures.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {batchResults.failures.map((msg, i) => (
                    <div key={i} className="p-4 bg-rose-50 rounded-2xl text-sm text-rose-800 font-bold flex items-center gap-3 border border-rose-100/50">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-400" />
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};