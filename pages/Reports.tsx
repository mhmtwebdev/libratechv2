import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Student, Book, Transaction } from '../types';
import {
    Download, FileText, BarChart3, Users, BookOpen,
    Award, TrendingUp, Calendar, Search, ChevronRight,
    Printer, Filter, PieChart as PieChartIcon, LogOut
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

export const Reports: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [allTransactions, setAllTransactions] = useState<(Transaction & { book: Book, student: Student })[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [sData, bData, tData] = await Promise.all([
                LibraryService.getStudents(),
                LibraryService.getBooks(),
                LibraryService.getAllTransactions()
            ]);
            setStudents(sData);
            setBooks(bData);
            setAllTransactions(tData);
            setLoading(false);
        };
        fetchData();
    }, []);

    // Statistics Calculations
    const totalBooksRead = students.reduce((acc, s) => acc + (s.readingHistory?.length || 0), 0);
    const topReader = [...students].sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0))[0];

    // This Week Calculation
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const booksReadThisWeek = allTransactions.filter(t => new Date(t.issueDate) >= startOfWeek).length;

    // Category Distribution Data
    const categoryCounts = books.reduce((acc: any, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    // Grade Activity Data
    const gradeDataMap = students.reduce((acc: any, s) => {
        if (!acc[s.grade]) acc[s.grade] = { name: s.grade, count: 0 };
        acc[s.grade].count += (s.readingHistory?.length || 0);
        return acc;
    }, {});
    const barData = Object.values(gradeDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Export Logic
    const exportToExcel = (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");
        const maxWidths = data.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                const valueWidth = String(row[key] || '').length;
                acc[i] = Math.max(acc[i] || 0, valueWidth, key.length);
            });
            return acc;
        }, [] as number[]);
        worksheet['!cols'] = maxWidths.map(w => ({ wch: w + 5 }));
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const downloadGeneralReport = () => {
        const reportData = students.map(s => ({
            'Ad Soyad': s.name,
            'Öğrenci No': s.studentNumber,
            'Sınıf': s.grade,
            'Toplam Okunan': s.readingHistory?.length || 0,
            'E-posta': s.email || '-'
        }));
        exportToExcel(reportData, 'Kutuphane_Genel_Ogrenci_Raporu');
    };

    const downloadClassReport = (grade: string) => {
        const classStudents = students.filter(s => s.grade === grade);
        const sheetData = classStudents.map(s => ({
            'Öğrenci Adı': s.name,
            'Öğrenci No': s.studentNumber,
            'Okunan Kitap Sayısı': s.readingHistory?.length || 0,
            'Okuduğu Kitaplar': s.readingHistory.map(id => books.find(b => b.id === id)?.title).join(', ')
        }));
        exportToExcel(sheetData, `${grade}_Sinifi_Okuma_Raporu`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Raporlar hazırlanıyor...</p>
            </div>
        );
    }

    const filteredStudents = students
        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentNumber.includes(searchTerm))
        .sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0));

    // Get specific student stats for modal
    const getStudentHistory = (studentId: string) => {
        return allTransactions
            .filter(t => t.studentId === studentId)
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Performans ve Analiz</h2>
                    <p className="text-gray-500 mt-1">Kütüphane verilerinin detaylı görsel raporu</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 text-gray-700 transition-all font-semibold no-print">
                        <Printer size={18} />
                        Sayfayı Yazdır
                    </button>
                    <button onClick={downloadGeneralReport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 text-white transition-all font-semibold no-print">
                        <Download size={18} />
                        Genel Rapor
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <BookOpen size={24} />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                            <TrendingUp size={12} /> +12%
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Toplam Okuma</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{totalBooksRead}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Calendar size={24} />
                        </div>
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">Bu Hafta</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Haftalık Aktivite</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{booksReadThisWeek}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Award size={24} />
                        </div>
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">En Çok Okuyan</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{topReader?.name || 'Veri Yok'}</p>
                        <h3 className="text-xl font-black text-gray-900 mt-1 truncate">{topReader?.readingHistory?.length || 0} Kitap</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">Katılım</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Toplam Öğrenci</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{students.length}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm no-print">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Sınıf Bazlı Okuma Oranları</h3>
                            <p className="text-sm text-gray-500">Hangi sınıflar daha çok kitap okuyor?</p>
                        </div>
                        <BarChart3 className="text-gray-300" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm no-print">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Kategori Dağılımı</h3>
                            <p className="text-sm text-gray-500">Kitap türlerinin yoğunluğu</p>
                        </div>
                        <PieChartIcon className="text-gray-300" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Student Progress / Report Cards */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList className="text-indigo-600" />
                        Öğrenci Okuma Karneleri
                    </h3>
                    <div className="relative w-full md:w-80 no-print">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Öğrenci karnesi ara..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, idx) => (
                        <div key={student.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner mt-1">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase">{student.name}</h4>
                                            <p className="text-xs text-gray-400 font-mono">No: {student.studentNumber} • {student.grade}</p>
                                        </div>
                                    </div>
                                    {idx < 3 && (
                                        <div className="text-amber-500">
                                            <Award size={20} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                                        <span>Okuma İlerlemesi</span>
                                        <span>{student.readingHistory?.length || 0} Kitap</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(((student.readingHistory?.length || 0) / (totalBooksRead / (students.length || 1) * 2)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between no-print">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kütüphane Kaydı</span>
                                <button
                                    onClick={() => setSelectedStudent(student)}
                                    className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    Detay <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advanced Filters & Specific Reports */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm no-print">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Filter size={18} />
                    </div>
                    <h4 className="font-bold text-gray-900">Özel Sınıf Raporları</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from(new Set(students.map(s => s.grade))).sort().map(grade => (
                        <button
                            key={grade}
                            onClick={() => downloadClassReport(grade)}
                            className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-50/50 transition-all flex flex-col items-center gap-2"
                        >
                            <span>{grade}</span>
                            <FileText size={16} className="text-gray-300 hover:text-indigo-300" />
                        </button>
                    ))}
                </div>
            </div>
            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-soft-fade max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold shadow-soft">
                                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{selectedStudent.name}</h3>
                                    <p className="text-indigo-100 opacity-80 font-medium">Bireysel Okuma Gelişim Karnesi</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-3 hover:bg-white/10 rounded-full transition-transform hover:rotate-90"
                            >
                                <XIcon size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow custom-scrollbar">
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Toplam Kitap</p>
                                    <p className="text-xl font-black text-indigo-600">{selectedStudent.readingHistory?.length || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sınıf Sırası</p>
                                    <p className="text-xl font-black text-emerald-600">
                                        #{students.filter(s => s.grade === selectedStudent.grade).sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0)).findIndex(s => s.id === selectedStudent.id) + 1}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Öğrenci No</p>
                                    <p className="text-xl font-black text-purple-600">{selectedStudent.studentNumber}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                    <TrendingUp size={20} className="text-indigo-500" />
                                    Okuma Serüveni
                                </h4>
                                {getStudentHistory(selectedStudent.id).length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <BookOpen className="mx-auto text-gray-300 mb-2" size={40} />
                                        <p className="text-gray-500 font-medium">Henüz bir veri bulunmuyor</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {getStudentHistory(selectedStudent.id).map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <BookIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{t.book.title}</p>
                                                        <p className="text-xs text-gray-500 italic">{t.book.author} • {new Date(t.issueDate).toLocaleDateString('tr-TR')}</p>
                                                    </div>
                                                </div>
                                                <div className={`${t.isReturned ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter`}>
                                                    {t.isReturned ? 'TAMAMLANDI' : 'OKUYOR'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
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

// Missing Imports Fix
const ClipboardList = ({ size, className }: { size?: number, className?: string }) => <FileText size={size} className={className} />;
const BookIcon = ({ size, className }: { size?: number, className?: string }) => <BookOpen size={size} className={className} />;
const XIcon = ({ size, className }: { size?: number, className?: string }) => <LogOut size={size} className={className} style={{ transform: 'rotate(0deg)' }} />;

