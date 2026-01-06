import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Student, Book, Transaction } from '../types';
import {
    BookOpen, Award, TrendingUp, Calendar, Search,
    ChevronRight, BarChart3, PieChart as PieChartIcon,
    Library, FileText, Info, Users
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

export const ParentView: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [allTransactions, setAllTransactions] = useState<(Transaction & { book: Book, student: Student })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isPrivate, setIsPrivate] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sData, bData, tData, settings] = await Promise.all([
                    LibraryService.getStudents(),
                    LibraryService.getBooks(),
                    LibraryService.getAllTransactions(),
                    LibraryService.getSettings()
                ]);
                setStudents(sData);
                setBooks(bData);
                setAllTransactions(tData);
                setIsPrivate(settings.parentViewPrivate);
            } catch (error) {
                console.error("Data fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Stats
    const totalBooksRead = students.reduce((acc, s) => acc + (s.readingHistory?.length || 0), 0);
    const topReader = [...students].sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0))[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const booksReadThisWeek = allTransactions.filter(t => new Date(t.issueDate) >= startOfWeek).length;

    // Chart Data
    const categoryCounts = books.reduce((acc: any, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    const gradeDataMap = students.reduce((acc: any, s) => {
        if (!acc[s.grade]) acc[s.grade] = { name: s.grade, count: 0 };
        acc[s.grade].count += (s.readingHistory?.length || 0);
        return acc;
    }, {});
    const barData = Object.values(gradeDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-indigo-50/30">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-bold animate-pulse">Veli Paneli Yükleniyor...</p>
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
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* Veli Header */}
            <header className="bg-indigo-900 text-white p-6 shadow-xl sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Library size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase">LibraTech</h1>
                            <p className="text-[10px] text-indigo-300 font-bold tracking-[0.2em] uppercase">Veli Takip Sistemi</p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-sm font-bold text-indigo-100 italic">"Okumak, özgürlüğe uçmaktır."</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Search Section */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 text-center space-y-4">
                        <h2 className="text-3xl font-black italic">Öğrenci Okuma Karnesi Sorgula</h2>
                        <p className="text-indigo-100 opacity-80 max-w-lg mx-auto">Çocuğunuzun okuma gelişimini takip etmek için ismine veya okul numarasına göre arama yapabilirsiniz.</p>
                        <div className="relative max-w-xl mx-auto mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-900" size={24} />
                            <input
                                type="text"
                                placeholder="Öğrenci adı veya numarası giriniz..."
                                className="w-full pl-14 pr-6 py-4 bg-white text-gray-900 rounded-2xl shadow-lg border-none focus:ring-4 focus:ring-yellow-400 focus:ring-opacity-50 transition-all font-bold text-lg outline-none placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
                </div>

                {/* Search Results */}
                {searchTerm && (
                    <div className="animate-soft-fade">
                        {filteredStudents.length === 0 ? (
                            <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl text-center">
                                <Info className="mx-auto text-amber-500 mb-2" />
                                <p className="text-amber-800 font-bold italic">Aradığınız kriterlere uygun öğrenci bulunamadı. Lütfen bilgileri kontrol edin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredStudents.map(student => (
                                    <div key={student.id} className="bg-white p-6 rounded-3xl shadow-xl border-2 border-indigo-100 hover:border-indigo-500 transition-all group flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                                    {student.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 leading-tight uppercase group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{student.grade} • NO: {student.studentNumber}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-xs font-black uppercase text-gray-500 tracking-wider">
                                                    <span>Okuma İlerlemesi</span>
                                                    <span className="text-indigo-600">{student.readingHistory?.length || 0} Kitap</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-md"
                                                        style={{ width: `${Math.min(((student.readingHistory?.length || 0) / 10) * 100, 100)}%` }} // Base on 10 books goal
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStudent(student)}
                                            className="mt-6 w-full py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
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
                <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm flex items-start gap-4 italic text-gray-500 text-sm">
                    <Info className="text-indigo-400 shrink-0" size={20} />
                    <p>
                        Sayın Velimiz, bu panel üzerinden çocuğunuzun kütüphanemizdeki okuma serüvenini takip edebilirsiniz.
                        Okul numarasını veya tam adını girerek kişisel karnesine ulaşabilir, okuduğu kitapları inceleyebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Student Detail Modal - Copy from Reports but Read Only */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">
                                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{selectedStudent.name}</h3>
                                    <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">Dijital Okuma Karnesi</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:scale-110">
                                <ChevronRight size={32} className="rotate-90" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Toplam Okuduğu</p>
                                    <p className="text-4xl font-black text-indigo-700">{selectedStudent.readingHistory?.length || 0}</p>
                                    <p className="text-[10px] text-indigo-400 font-bold mt-1 uppercase">Kitap</p>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Başarı Puanı</p>
                                    <p className="text-4xl font-black text-emerald-700">A+</p>
                                    <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">Süper Okuyucu</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="font-black text-gray-900 flex items-center gap-2 text-lg uppercase tracking-tight">
                                    <Award size={24} className="text-amber-500" />
                                    Okuma Geçmişi
                                </h4>
                                <div className="space-y-3">
                                    {allTransactions
                                        .filter(t => t.studentId === selectedStudent.id)
                                        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                                        .map((t, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{t.book.title}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold italic uppercase tracking-wider">{new Date(t.issueDate).toLocaleDateString('tr-TR')} Tarihinde Okundu</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t flex justify-center shrink-0">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="px-12 py-3 bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-800 transition-all"
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
