import React, { useEffect, useState } from 'react';
import { Transaction, Book, Student } from '../types';
import { LibraryService } from '../services/firebaseDatabase';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [loans, setLoans] = useState<(Transaction & { book: Book, student: Student })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    setLoading(true);
    const data = await LibraryService.getActiveTransactions();
    setLoans(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const getDaysKept = (issueDate: string) => {
    const start = new Date(issueDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  if (loading) return <div className="p-8 text-center">Panel verileri yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Kütüphane Paneli</h2>
        <button onClick={fetchLoans} className="text-sm font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-widest transition-colors">
          Verileri Yenile
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aktif Ödünçler</p>
              <h3 className="text-4xl font-black text-slate-900 mt-1">{loans.length}</h3>
            </div>
            <div className="bg-cyan-50 p-4 rounded-2xl text-cyan-600 group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-cyan-50/50 rounded-full blur-2xl" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gecikmiş Kitaplar</p>
              <h3 className="text-4xl font-black text-rose-600 mt-1">
                {loans.filter(l => isOverdue(l.dueDate)).length}
              </h3>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <AlertCircle size={28} />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Zamanında Teslimler</p>
              <h3 className="text-4xl font-black text-emerald-600 mt-1">
                {loans.filter(l => !isOverdue(l.dueDate)).length}
              </h3>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={28} />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Aktif Ödünç Listesi</h3>
          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-tighter">
            Toplam: {loans.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">Öğrenci Bilgisi</th>
                <th className="px-8 py-4">Kitap Detayı</th>
                <th className="px-8 py-4 text-center">Tarih Aralığı</th>
                <th className="px-8 py-4 text-center">Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                        <Clock size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Ödünç verilmiş kitap bulunmuyor</p>
                    </div>
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const overdue = isOverdue(loan.dueDate);
                  const daysKept = getDaysKept(loan.issueDate);

                  return (
                    <tr
                      key={loan.id}
                      className={`group transition-all hover:bg-slate-50/80 ${overdue ? 'bg-rose-50/30' : ''}`}
                    >
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">{loan.student.name}</div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{loan.student.studentNumber}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">{loan.book.title}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">ISBN: {loan.book.isbn}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-xs font-bold text-slate-600">
                            {new Date(loan.issueDate).toLocaleDateString('tr-TR')} - {new Date(loan.dueDate).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1 bg-slate-100 px-2 py-0.5 rounded-full">
                            {daysKept} Gündür Okuyor
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${overdue
                          ? 'bg-rose-100 text-rose-700 shadow-sm shadow-rose-200'
                          : 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200'
                          }`}>
                          {overdue ? 'Gecikmiş' : 'Zamanında'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};