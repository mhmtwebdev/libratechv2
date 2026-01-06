import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Student, Book } from '../types';
import { Download, FileText, BarChart3, Users, BookOpen, Award } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [sData, bData] = await Promise.all([
                LibraryService.getStudents(),
                LibraryService.getBooks()
            ]);
            setStudents(sData);
            setBooks(bData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const exportToExcel = (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");

        // Sütun genişliklerini otomatik ayarla
        const maxWidths = data.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                const valueWidth = String(row[key] || '').length;
                acc[i] = Math.max(acc[i] || 0, valueWidth, key.length);
            });
            return acc;
        }, [] as number[]);
        worksheet['!cols'] = maxWidths.map(w => ({ w: w + 5 }));

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
        exportToExcel(reportData, 'Genel_Ogrenci_Raporu');
    };

    const downloadDetailedHistory = async () => {
        const activeTransactions = await LibraryService.getActiveTransactions();
        const reportData: any[] = [];

        students.forEach(student => {
            const history = student.readingHistory || [];
            const currentlyBorrowed = activeTransactions.find(t => t.studentId === student.id);
            const currentBookTitle = currentlyBorrowed ? currentlyBorrowed.book.title : '-';

            if (history.length === 0) {
                reportData.push({
                    'Öğrenci Ad Soyad': student.name,
                    'Öğrenci No': student.studentNumber,
                    'Sınıf': student.grade,
                    'Şu An Okuduğu': currentBookTitle,
                    'Okuduğu Kitap': 'Henüz kitap okunmadı'
                });
            } else {
                history.forEach((bookId, index) => {
                    const book = books.find(b => b.id === bookId);
                    reportData.push({
                        'Öğrenci Ad Soyad': student.name,
                        'Öğrenci No': student.studentNumber,
                        'Sınıf': student.grade,
                        'Şu An Okuduğu': index === 0 ? currentBookTitle : '', // Sadece ilk satırda göster veya her satırda
                        'Okuduğu Kitap': book?.title || 'Bilinmeyen Kitap'
                    });
                });
            }
        });

        exportToExcel(reportData, 'Detayli_Okuma_Gecmisi_Raporu');
    };

    const downloadClassReport = (grade: string) => {
        const classStudents = students.filter(s => s.grade === grade);
        if (classStudents.length === 0) return;

        // Sayfa verisini oluştur (2D dizi)
        const sheetData: any[][] = [];

        // 1. Satır: Öğrenci İsimleri
        const nameRow = classStudents.map(s => s.name);
        sheetData.push(nameRow);

        // 2. Satır: "Okunan Kitaplar" başlığı (Her sütunun altına)
        const headerRow = classStudents.map(() => "Okunan Kitaplar");
        sheetData.push(headerRow);

        // Maksimum kitap sayısını bul (Kaç satır veri olacağını belirlemek için)
        const maxBooks = Math.max(...classStudents.map(s => s.readingHistory?.length || 0));

        // Kitap satırlarını ekle
        for (let i = 0; i < maxBooks; i++) {
            const row = classStudents.map(student => {
                const bookId = student.readingHistory?.[i];
                if (!bookId) return ""; // Eğer o öğrenci o kadar kitap okumadıysa boş bırak
                const book = books.find(b => b.id === bookId);
                return book?.title || "Bilinmeyen Kitap";
            });
            sheetData.push(row);
        }

        // XLSX ile dosyayı oluştur
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `${grade} Sınıfı`);

        // Sütun genişliklerini ayarla (Her sütun 25 karakter genişliğinde olsun)
        worksheet['!cols'] = classStudents.map(() => ({ w: 25 }));

        XLSX.writeFile(workbook, `${grade}_Sinifi_Okuma_Raporu.xlsx`);
    };

    const grades = Array.from(new Set(students.map(s => s.grade))).sort();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Statistics
    const totalBooksRead = students.reduce((acc, s) => acc + (s.readingHistory?.length || 0), 0);
    const topReader = [...students].sort((a, b) => (b.readingHistory?.length || 0) - (a.readingHistory?.length || 0))[0];
    const mostReadBookId = (() => {
        const counts: any = {};
        students.forEach(s => s.readingHistory?.forEach(id => counts[id] = (counts[id] || 0) + 1));
        return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
    })();
    const mostReadBook = books.find(b => b.id === mostReadBookId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">İstatistikler ve Raporlar</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Toplam Okuma</p>
                            <h3 className="text-3xl font-bold mt-1">{totalBooksRead}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <BarChart3 size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-indigo-200 mt-4 italic">Kütüphane genelinde okunan toplam kitap</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Okuma Şampiyonu</p>
                            <h3 className="text-xl font-bold mt-1 truncate max-w-[150px]">{topReader?.name || '-'}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Award size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-emerald-200 mt-4">{topReader?.readingHistory?.length || 0} kitap ile zirvede</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-amber-100 text-sm font-medium">En Çok Okunan Kitap</p>
                            <h3 className="text-xl font-bold mt-1 truncate max-w-[150px]">{mostReadBook?.title || '-'}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-amber-200 mt-4">En çok tercih edilen eser</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Options */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Download size={20} className="text-indigo-600" />
                        Veri Dışa Aktar (Excel/CSV)
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={downloadGeneralReport}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="text-gray-400" size={20} />
                                <span className="font-medium">Tüm Öğrenci Listesi</span>
                            </div>
                            <FileText size={18} />
                        </button>

                        <button
                            onClick={downloadDetailedHistory}
                            className="w-full flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl hover:bg-indigo-100 hover:text-indigo-700 transition-all border border-indigo-100/50"
                        >
                            <div className="flex items-center gap-3">
                                <BookOpen className="text-indigo-400" size={20} />
                                <span className="font-bold">Detaylı Okuma Geçmişi</span>
                            </div>
                            <FileText size={18} />
                        </button>

                        <p className="text-xs text-gray-400 mt-4 mb-2 font-bold uppercase tracking-wider">Sınıf Bazlı İndir</p>
                        <div className="grid grid-cols-2 gap-2">
                            {grades.map(grade => (
                                <button
                                    key={grade}
                                    onClick={() => downloadClassReport(grade)}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                >
                                    <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600">{grade}</span>
                                    <Download size={14} className="text-gray-300 group-hover:text-indigo-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Tips or info */}
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4">Raporlama Hakkında</h3>
                    <ul className="space-y-3 text-indigo-800 text-sm">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <span>İndirilen dosyalar Excel, Google Sheets ve Numbers ile tam uyumludur.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <span>Veriler her indirme yapıldığında o anki güncel durumdan oluşturulur.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <span>Sınıf listeleri, öğrencileri kaydederken girdiğiniz sınıf bilgilerine göre otomatik gruplanır.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
