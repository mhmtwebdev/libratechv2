import React, { useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { BookDown, BookUp, AlertTriangle, CheckCircle, Zap, List } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Ödünç & İade Bankosu</h2>
        <p className="text-gray-500 text-lg">Hızlı tarama sistemi ile kitap işlemlerini saniyeler içinde tamamlayın.</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Issue Card */}
        <div className={`relative overflow-hidden group rounded-3xl p-8 border-2 transition-all cursor-pointer ${mode === 'ISSUE' ? 'border-indigo-500 bg-white shadow-xl' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
          onClick={() => { setMode('ISSUE'); setFeedback(null); setBatchResults(null); }}>
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mode === 'ISSUE' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                <BookDown size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Kitap Ver (Ödünç)</h3>
                <p className="text-gray-500 mt-1">Öğrenci kartı ve kitapları taratarak ödünç verin.</p>
              </div>
            </div>

            {mode === 'ISSUE' && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Ödünç Süresi</label>
                  <select
                    value={duration}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="block w-full rounded-xl border-gray-200 border py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={7}>7 Gün (1 Hafta)</option>
                    <option value={14}>14 Gün (2 Hafta)</option>
                    <option value={30}>30 Gün (1 Ay)</option>
                    <option value={90}>90 Gün (Dönemlik)</option>
                  </select>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-transform active:scale-95"
                >
                  <Zap size={22} />
                  <span>Hızlı Taramayı Başlat</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Return Card */}
        <div className={`relative overflow-hidden group rounded-3xl p-8 border-2 transition-all cursor-pointer ${mode === 'RETURN' ? 'border-emerald-500 bg-white shadow-xl' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
          onClick={() => { setMode('RETURN'); setFeedback(null); setBatchResults(null); }}>
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mode === 'RETURN' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                <BookUp size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Kitap Al (İade)</h3>
                <p className="text-gray-500 mt-1">İade edilen kitapları topluca envantere geri alın.</p>
              </div>
            </div>

            {mode === 'RETURN' && (
              <div className="mt-8 animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 transition-transform active:scale-95"
                >
                  <Zap size={22} />
                  <span>Hızlı Taramayı Başlat</span>
                </button>
              </div>
            )}
          </div>
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
        <div className={`p-6 rounded-3xl flex items-start space-x-4 border ${feedback.type === 'error' ? 'bg-red-50 text-red-800 border-red-100' :
          feedback.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100' :
            'bg-green-50 text-green-800 border-green-100'
          }`}>
          {feedback.type === 'error' && <AlertTriangle className="shrink-0 mt-1" size={28} />}
          {feedback.type === 'warning' && <AlertTriangle className="shrink-0 mt-1" size={28} />}
          {feedback.type === 'success' && <CheckCircle className="shrink-0 mt-1" size={28} />}
          <div>
            <p className="text-xl font-bold mb-1">{feedback.type === 'error' ? 'Hata' : feedback.type === 'warning' ? 'Bilgi/Uyarı' : 'Başarılı'}</p>
            <p className="opacity-90">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Batch Results Report */}
      {batchResults && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gray-50 px-8 py-5 border-b flex justify-between items-center">
            <h3 className="font-black text-xl text-gray-800 flex items-center gap-3">
              <List size={24} className="text-gray-400" />
              İşlem Raporu
            </h3>
            <button onClick={() => setBatchResults(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <Zap size={20} className="inline mr-1 rotate-12" /> Raporu Kapat
            </button>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-8">
            {batchResults.successes.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-black text-green-700 flex items-center gap-2">
                  <CheckCircle size={20} /> Başarılı ({batchResults.successes.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {batchResults.successes.map((msg, i) => (
                    <div key={i} className="p-3 bg-green-50 rounded-xl text-sm text-green-700 font-medium flex items-center gap-3 border border-green-100">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {batchResults.failures.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-black text-red-700 flex items-center gap-2">
                  <AlertTriangle size={20} /> Hatalı ({batchResults.failures.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {batchResults.failures.map((msg, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded-xl text-sm text-red-700 font-medium flex items-center gap-3 border border-red-100">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
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