import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Student, Book, Transaction } from '../types';
import {
    Download, FileText, BarChart3, Users, BookOpen,
    Award, TrendingUp, Calendar, Search, ChevronRight,
    Printer, Filter, PieChart as PieChartIcon, LogOut, Share2,
    Eye, EyeOff, Lock, Unlock, ClipboardList
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
    const [isPubliclyVisible, setIsPubliclyVisible] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [sData, bData, tData, settings] = await Promise.all([
                LibraryService.getStudents(),
                LibraryService.getBooks(),
                LibraryService.getAllTransactions(),
                LibraryService.getSettings()
            ]);
            setStudents(sData);
            setBooks(bData);
            setAllTransactions(tData);
            setIsPubliclyVisible(!settings.parentViewPrivate);
            setLoading(false);
        };
        fetchData();
    }, []);

    const togglePublicVisibility = async () => {
        const newValue = !isPubliclyVisible;
        setIsPubliclyVisible(newValue);
        await LibraryService.updateSettings({ parentViewPrivate: !newValue });
    };

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

    const COLORS = ['#0891b2', '#0ea5e9', '#0284c7', '#0369a1', '#3b82f6', '#60a5fa'];

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
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-600"></div>
                <p className="text-slate-500 font-medium animate-pulse">Raporlar hazırlanıyor...</p>
            </div>
        );
    }

    const filteredStudents = students
        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentNumber.includes(searchTerm))
        .sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0));

    const handleShareWithParents = () => {
        const parentUrl = `${window.location.origin}${window.location.pathname}?view=parent`;
        navigator.clipboard.writeText(parentUrl);
        alert("Veli Takip Linki Kopyalandı!\n\nVeliler bu linke tıklayarak şifresiz bir şekilde çocuklarının karnesini sorgulayabilirler.");
    };

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
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Performans ve Analiz</h2>
                    <p className="text-slate-500 mt-1 font-medium">Kütüphane verilerinin detaylı görsel raporu</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={togglePublicVisibility}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-all font-bold text-sm uppercase tracking-wide no-print ${isPubliclyVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}
                        title={isPubliclyVisible ? "Veliler Tüm Listeyi Görebilir" : "Veliler Sadece Arama Yapabilir"}
                    >
                        {isPubliclyVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                        {isPubliclyVisible ? "Veliye Açık" : "Veliye Kapalı"}
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 text-slate-700 transition-all font-bold text-sm uppercase tracking-wide no-print">
                        <Printer size={18} />
                        Yazdır
                    </button>
                    <button onClick={handleShareWithParents} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 text-white transition-all font-bold text-sm uppercase tracking-wide no-print">
                        <Share2 size={18} />
                        Velilerle Paylaş
                    </button>
                    <button onClick={downloadGeneralReport} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-200 hover:bg-cyan-700 text-white transition-all font-bold text-sm uppercase tracking-wide no-print">
                        <Download size={18} />
                        Genel Rapor
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-cyan-100/50 transition-all flex flex-col justify-between group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                            <BookOpen size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                            <TrendingUp size={12} /> +12%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Toplam Okuma</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{totalBooksRead}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-emerald-100/50 transition-all flex flex-col justify-between group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Calendar size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg">Bu Hafta</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Haftalık Aktivite</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{booksReadThisWeek}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-amber-100/50 transition-all flex flex-col justify-between group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Award size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">En Çok Okuyan</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{topReader?.name || 'Veri Yok'}</p>
                        <h3 className="text-xl font-black text-slate-800 mt-1 truncate">{topReader?.readingHistory?.length || 0} Kitap</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-blue-100/50 transition-all flex flex-col justify-between group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Katılım</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Toplam Öğrenci</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{students.length}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm no-print">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sınıf Bazlı İstatistikler</h3>
                            <p className="text-sm font-medium text-slate-500">Hangi sınıflar daha çok kitap okuyor?</p>
                        </div>
                        <BarChart3 className="text-cyan-200" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'inherit' }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm no-print">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Kategori Dağılımı</h3>
                            <p className="text-sm font-medium text-slate-500">Kitap türlerinin yoğunluğu</p>
                        </div>
                        <PieChartIcon className="text-cyan-200" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Student Progress / Report Cards - Always visible for Teacher */}
            <div className="space-y-6 animate-soft-fade">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <ClipboardList className="text-cyan-600" />
                        Öğrenci Okuma Karneleri
                    </h3>
                    <div className="relative w-full md:w-80 no-print group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                            id="report-search"
                            name="report-search"
                            type="text"
                            placeholder="Öğrenci karnesi ara..."
                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, idx) => (
                        <div key={student.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-cyan-100/50 hover:border-cyan-200 transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-200 mt-1">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 leading-tight group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{student.name}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">No: {student.studentNumber} • {student.grade}</p>
                                        </div>
                                    </div>
                                    {idx < 3 && (
                                        <div className="text-amber-400 drop-shadow-sm">
                                            <Award size={24} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 mt-6">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        <span>Okuma İlerlemesi</span>
                                        <span className="text-cyan-600">{student.readingHistory?.length || 0} Kitap</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            style={{ width: `${Math.min(((student.readingHistory?.length || 0) / (totalBooksRead / (students.length || 1) * 2)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between no-print">
                                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Kütüphane Kaydı</span>
                                <button
                                    onClick={() => setSelectedStudent(student)}
                                    className="text-cyan-600 font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wide bg-cyan-50 px-3 py-1.5 rounded-lg hover:bg-cyan-100"
                                >
                                    Detay <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredStudents.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Search className="mx-auto text-slate-200 mb-4" size={48} />
                        <p className="text-slate-400 font-bold text-lg">Aradığınız öğrenci bulunamadı.</p>
                    </div>
                )}
            </div>

            {/* Advanced Filters & Specific Reports */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm no-print">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Filter size={20} />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">Özel Sınıf Raporları</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from(new Set(students.map(s => s.grade))).sort().map(grade => (
                        <button
                            key={grade}
                            onClick={() => downloadClassReport(grade)}
                            className="px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-white hover:border-cyan-300 hover:text-cyan-600 hover:shadow-xl hover:shadow-cyan-50/50 transition-all flex flex-col items-center gap-2 group"
                        >
                            <span className="text-lg">{grade}</span>
                            <FileText size={16} className="text-slate-300 group-hover:text-cyan-400 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in no-print">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-soft-fade max-h-[90vh] flex flex-col border border-white/20">
                        <div className="bg-cyan-600 p-10 text-white relative flex justify-between items-center shrink-0 overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl font-black shadow-inner border border-white/10">
                                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">{selectedStudent.name}</h3>
                                    <p className="text-cyan-100 font-bold opacity-90 mt-1">Bireysel Okuma Gelişim Karnesi</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-3 hover:bg-white/20 rounded-2xl transition-all relative z-10"
                            >
                                <LogOut size={24} className="text-white" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow custom-scrollbar bg-slate-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Kitap</p>
                                    <p className="text-2xl font-black text-cyan-600">{selectedStudent.readingHistory?.length || 0}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sınıf Sırası</p>
                                    <p className="text-2xl font-black text-emerald-500">
                                        #{students.filter(s => s.grade === selectedStudent.grade).sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0)).findIndex(s => s.id === selectedStudent.id) + 1}
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Başarı Puanı</p>
                                    <p className={`text-2xl font-black ${(selectedStudent.readingHistory?.length || 0) > 30 ? 'text-emerald-500' :
                                        (selectedStudent.readingHistory?.length || 0) > 20 ? 'text-blue-500' :
                                            (selectedStudent.readingHistory?.length || 0) > 10 ? 'text-cyan-500' :
                                                (selectedStudent.readingHistory?.length || 0) >= 1 ? 'text-amber-500' : 'text-slate-300'
                                        }`}>
                                        {(selectedStudent.readingHistory?.length || 0) > 30 ? 'A+' :
                                            (selectedStudent.readingHistory?.length || 0) > 20 ? 'A' :
                                                (selectedStudent.readingHistory?.length || 0) > 10 ? 'B' :
                                                    (selectedStudent.readingHistory?.length || 0) >= 1 ? 'C' : '-'}
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Öğrenci No</p>
                                    <p className="text-2xl font-black text-purple-500">{selectedStudent.studentNumber}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-slate-800 flex items-center gap-2 text-lg uppercase tracking-tight">
                                    <TrendingUp size={24} className="text-cyan-500" />
                                    Okuma Serüveni
                                </h4>
                                {getStudentHistory(selectedStudent.id).length === 0 ? (
                                    <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                        <BookOpen className="mx-auto text-slate-200 mb-2" size={40} />
                                        <p className="text-slate-400 font-bold">Henüz bir veri bulunmuyor</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {getStudentHistory(selectedStudent.id).map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-cyan-100 hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-inner">
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-lg">{t.book.title}</p>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t.book.author} • {new Date(t.issueDate).toLocaleDateString('tr-TR')}</p>
                                                    </div>
                                                </div>
                                                <div className={`${t.isReturned ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                                    {t.isReturned ? 'TAMAMLANDI' : 'OKUYOR'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="px-8 py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200 flex items-center gap-2"
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
