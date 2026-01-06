import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Student, Book, Transaction } from '../types';
import {
    BookOpen, Award, Search,
    ChevronRight, Library, Info, Users
} from 'lucide-react';

interface ParentViewProps {
    teacherId?: string | null;
}

export const ParentView: React.FC<ParentViewProps> = ({ teacherId }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [allTransactions, setAllTransactions] = useState<(Transaction & { book: Book, student: Student })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isPrivate, setIsPrivate] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!teacherId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [sData, , tData, settings] = await Promise.all([
                    LibraryService.getStudents(teacherId),
                    LibraryService.getBooks(teacherId),
                    LibraryService.getAllTransactions(teacherId),
                    LibraryService.getSettings(teacherId)
                ]);
                setStudents(sData);
                setAllTransactions(tData);
                setIsPrivate(settings?.parentViewPrivate ?? true);
            } catch (error) {
                console.error("Data fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [teacherId]);

    if (!teacherId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Geçersiz Bağlantı</h2>
                    <p className="text-slate-500 font-medium">Veli görünümüne erişmek için geçerli bir öğretmen bağlantısı gereklidir.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-600 mb-4"></div>
                <p className="text-slate-500 font-bold animate-pulse">Veli Paneli Yükleniyor...</p>
            </div>
        );
    }

    const filteredStudents = students.filter(s => {
        const term = searchTerm.toLowerCase().trim();

        // Eğer arama yapılıyorsa her zaman filtrele
        if (term) {
            const isNumeric = /^\d+$/.test(term);
            if (isNumeric) {
                return s.studentNumber === term;
            } else {
                return s.name.toLowerCase().trim() === term;
            }
        }

        // Arama yoksa: Gizlilik ayarına bak
        // isPrivate false ise (Liste Açık) tüm öğrencileri göster
        return !isPrivate;
    }).sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0));

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans">
            {/* Veli Header */}
            <header className="bg-slate-900 text-white p-6 shadow-xl sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/20 p-2 rounded-xl backdrop-blur-md border border-cyan-500/30">
                            <Library size={28} className="text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase text-white">LibraTech</h1>
                            <p className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] uppercase">Veli Takip Sistemi</p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-sm font-bold text-slate-400 italic">"Okumak, özgürlüğe uçmaktır."</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Search Section */}
                <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/15 transition-colors duration-700" />
                    <div className="relative z-10 text-center space-y-4">
                        <h2 className="text-3xl font-black italic tracking-wide">Öğrenci Okuma Karnesi Sorgula</h2>
                        <p className="text-cyan-50 max-w-lg mx-auto font-medium">Çocuğunuzun okuma gelişimini takip etmek için ismine veya okul numarasına göre arama yapabilirsiniz.</p>
                        <div className="relative max-w-xl mx-auto mt-6">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-700 pointer-events-none" size={24} />
                            <input
                                id="parent-search"
                                name="parent-search"
                                type="text"
                                placeholder="Öğrenci adı veya numarası giriniz..."
                                className="w-full pl-16 pr-6 py-5 bg-white text-slate-800 rounded-2xl shadow-xl shadow-cyan-900/20 border-none focus:ring-4 focus:ring-cyan-300/50 transition-all font-bold text-lg outline-none placeholder:text-slate-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Student Report Cards Section */}
                {(searchTerm || !isPrivate) && (
                    <div className="space-y-6 animate-soft-fade">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-cyan-600" size={28} />
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                {searchTerm ? 'Arama Sonuçları' : 'Öğrenci Okuma Karneleri'}
                            </h3>
                        </div>

                        {filteredStudents.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] text-center">
                                <Info className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-500 font-bold text-lg">Aradığınız kriterlere uygun öğrenci bulunamadı.</p>
                                <p className="text-slate-400 text-sm mt-1">Lütfen öğrenci numarasını veya ismini kontrol ediniz.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredStudents.map((student, idx) => (
                                    <div key={student.id} className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-cyan-100/50 border border-slate-100 hover:border-cyan-200 transition-all group flex flex-col justify-between relative overflow-hidden">

                                        <div className="relative z-10 transition-transform duration-300">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-200">
                                                    {student.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 leading-tight uppercase group-hover:text-cyan-600 transition-colors tracking-tight">{student.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{student.grade} • NO: {student.studentNumber}</p>
                                                </div>
                                                {/* Rank Badge for Top 3 (visual flair only) */}
                                                {student.readingHistory && student.readingHistory.length > 20 && (
                                                    <div className="absolute top-0 right-0 text-amber-400">
                                                        <Award size={24} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                    <span>Okuma İlerlemesi</span>
                                                    <span className="text-cyan-600">{student.readingHistory?.length || 0} Kitap</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                                        style={{ width: `${Math.min(((student.readingHistory?.length || 0) / 10) * 100, 100)}%` }} // Base on 10 books goal
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStudent(student)}
                                            className="mt-8 w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-cyan-200"
                                        >
                                            Detaylı Karneyi Görüntüle <ChevronRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Veli bilgilendirme mesajı */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-4 text-slate-500 text-sm">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-500 shrink-0">
                        <Info size={20} />
                    </div>
                    <p className="font-medium leading-relaxed">
                        Sayın Velimiz, bu panel üzerinden çocuğunuzun kütüphanemizdeki okuma serüvenini takip edebilirsiniz.
                        Okul numarasını veya tam adını girerek kişisel karnesine ulaşabilir, okuduğu kitapları inceleyebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Student Detail Modal - Copy from Reports but Read Only */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md no-print animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-soft-fade border border-white/20">
                        <div className="bg-cyan-600 p-10 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-black shadow-inner border border-white/10 backdrop-blur-sm">
                                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">{selectedStudent.name}</h3>
                                    <p className="text-cyan-100 font-bold uppercase tracking-widest text-[10px] bg-cyan-800/30 px-3 py-1 rounded-full inline-block mt-2">Dijital Okuma Karnesi</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-transform hover:scale-105 relative z-10">
                                <ChevronRight size={24} className="rotate-90" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow bg-slate-50 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Toplam Okuduğu</p>
                                    <p className="text-5xl font-black text-cyan-600 tracking-tighter">{selectedStudent.readingHistory?.length || 0}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Kitap</p>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Başarı Puanı</p>
                                    <p className={`text-5xl font-black tracking-tighter ${(selectedStudent.readingHistory?.length || 0) > 30 ? 'text-emerald-500' :
                                        (selectedStudent.readingHistory?.length || 0) > 20 ? 'text-blue-500' :
                                            (selectedStudent.readingHistory?.length || 0) > 10 ? 'text-cyan-500' :
                                                (selectedStudent.readingHistory?.length || 0) >= 1 ? 'text-amber-500' : 'text-slate-300'
                                        }`}>
                                        {(selectedStudent.readingHistory?.length || 0) > 30 ? 'A+' :
                                            (selectedStudent.readingHistory?.length || 0) > 20 ? 'A' :
                                                (selectedStudent.readingHistory?.length || 0) > 10 ? 'B' :
                                                    (selectedStudent.readingHistory?.length || 0) >= 1 ? 'C' : '-'}
                                    </p>
                                    <p className={`text-[10px] font-bold mt-2 uppercase text-center tracking-wide ${(selectedStudent.readingHistory?.length || 0) > 30 ? 'text-emerald-500' :
                                        (selectedStudent.readingHistory?.length || 0) > 20 ? 'text-blue-500' :
                                            (selectedStudent.readingHistory?.length || 0) > 10 ? 'text-cyan-500' :
                                                (selectedStudent.readingHistory?.length || 0) >= 1 ? 'text-amber-500' : 'text-slate-300'
                                        }`}>
                                        {(selectedStudent.readingHistory?.length || 0) > 30 ? 'Kitap Kurdu' :
                                            (selectedStudent.readingHistory?.length || 0) > 20 ? 'Harika Okuyucu' :
                                                (selectedStudent.readingHistory?.length || 0) > 10 ? 'İyi Okuyucu' :
                                                    (selectedStudent.readingHistory?.length || 0) >= 1 ? 'Okuma Yolunda' : 'Yeni Başlıyor'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="font-black text-slate-800 flex items-center gap-2 text-lg uppercase tracking-tight">
                                    <Award size={24} className="text-amber-400 drop-shadow-sm" />
                                    Okuma Geçmişi
                                </h4>
                                <div className="space-y-3">
                                    {allTransactions
                                        .filter(t => t.studentId === selectedStudent.id)
                                        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                                        .map((t, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:shadow-md transition-all group hover:border-cyan-100">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 bg-slate-50 rounded-2xl shadow-inner group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 group-hover:text-cyan-600 transition-colors uppercase text-sm tracking-tight">{t.book.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(t.issueDate).toLocaleDateString('tr-TR')} Tarihinde Okundu</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex justify-center shrink-0">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="px-12 py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-200 hover:bg-cyan-700 transition-all text-xs"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
