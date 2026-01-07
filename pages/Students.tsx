import React, { useEffect, useState } from 'react';
import { Student } from '../types';
import { LibraryService } from '../services/firebaseDatabase';
import { Plus, Printer, Trash2, Search, Book as BookIcon, X, ClipboardList, GraduationCap } from 'lucide-react';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', studentNumber: '', email: '', grade: '' });

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHistory, setStudentHistory] = useState<{ id: string, title: string, author: string, category: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchStudents = async () => {
    const data = await LibraryService.getStudents();
    // Öğrencileri isimlerine göre alfabetik (A-Z) sıralıyoruz
    const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
    setStudents(sortedData);
    setFilteredStudents(sortedData);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(lowerTerm) ||
      student.studentNumber.includes(lowerTerm) ||
      student.grade.toLowerCase().includes(lowerTerm)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.name && newStudent.studentNumber) {
      const res = await LibraryService.addStudent(newStudent);
      if (res.success) {
        setNewStudent({ name: '', studentNumber: '', email: '', grade: '' });
        setIsAdding(false);
        fetchStudents();
      } else {
        alert(res.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      await LibraryService.deleteStudent(id);
      fetchStudents();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShowHistory = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingHistory(true);
    try {
      const allBooks = await LibraryService.getBooks();
      const historyBooks = student.readingHistory
        .map(bookId => allBooks.find(b => b.id === bookId))
        .filter((b): b is any => b !== undefined);
      setStudentHistory(historyBooks);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRemoveBookFromHistory = async (bookId: string) => {
    if (!selectedStudent) return;

    if (window.confirm('Bu kitabı öğrencinin geçmişinden silmek istediğinize emin misiniz?')) {
      const res = await LibraryService.removeBookFromHistory(selectedStudent.id, bookId);
      if (res.success) {
        // Update local state to reflect change immediately
        setStudentHistory(prev => prev.filter(b => b.id !== bookId));
        // Also update the main students list so the "X kitap okudu" count stays correct
        setStudents(prev => prev.map(s =>
          s.id === selectedStudent.id
            ? { ...s, readingHistory: (s.readingHistory || []).filter(id => id !== bookId) }
            : s
        ));
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Öğrenci Veritabanı</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Kütüphane Üyeleri</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative group w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            </div>
            <input
              id="student-search"
              name="student-search"
              type="text"
              placeholder="Öğrenci ara..."
              className="pl-10 block w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 px-4 font-bold text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-0 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className={`${selectedIds.length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'} px-4 py-2.5 rounded-xl hover:opacity-90 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all flex-1 md:flex-none`}
            >
              <Printer size={18} />
              <span className="hidden lg:inline">
                {selectedIds.length > 0 ? `Seçilenleri Yazdır (${selectedIds.length})` : 'Tümünü Yazdır'}
              </span>
              <span className="lg:hidden">
                {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </span>
            </button>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-cyan-600 text-white px-6 py-2.5 rounded-xl hover:bg-cyan-700 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all flex-1 md:flex-none"
            >
              <Plus size={18} />
              <span>Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 no-print animate-soft-fade">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-cyan-500 rounded-full" />
            Yeni Öğrenci Kaydet
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="student-name" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Ad Soyad</label>
              <input
                id="student-name"
                name="student-name"
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newStudent.name}
                onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-id" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Öğrenci No (ID)</label>
              <input
                id="student-id"
                name="student-id"
                placeholder="Örn: 123"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newStudent.studentNumber}
                onChange={e => setNewStudent({ ...newStudent, studentNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-email" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Email (İsteğe Bağlı)</label>
              <input
                id="student-email"
                name="student-email"
                placeholder="ogrenci@okul.com"
                type="email"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newStudent.email}
                onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-grade" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Sınıf / Şube</label>
              <input
                id="student-grade"
                name="student-grade"
                placeholder="Örn: 10-A"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newStudent.grade}
                onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })}
              />
            </div>
            <button type="submit" className="md:col-span-2 bg-cyan-600 text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 active:scale-[0.98] transition-all">Öğrenciyi Kaydet</button>
          </form>
        </div>
      )}

      {/* Student List - Desktop Table */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-5 no-print">
                <input
                  type="checkbox"
                  checked={isAllSelected && filteredStudents.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">İsim</th>
              <th className="px-8 py-5 text-[11px) font-black text-slate-400 uppercase tracking-widest">Öğrenci No</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Sınıf</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Geçmiş</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">Öğrenci bulunamadı.</td></tr>
            ) : filteredStudents.map(student => (
              <tr key={student.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(student.id) ? 'bg-cyan-50/50' : ''}`}>
                <td className="px-6 py-4 no-print">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleSelect(student.id)}
                    className="w-5 h-5 rounded border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleShowHistory(student)}
                    className="font-bold text-slate-800 hover:text-cyan-600 hover:underline text-left text-lg transition-colors"
                  >
                    {student.name}
                  </button>
                </td>
                <td className="px-8 py-4 text-slate-500 font-mono font-medium">{student.studentNumber}</td>
                <td className="px-8 py-4">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{student.grade}</span>
                </td>
                <td className="px-8 py-4 text-sm font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <BookIcon size={16} className="text-cyan-400" />
                    {student.readingHistory.length} Kitap
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedIds([student.id]);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="text-slate-400 hover:text-cyan-600 p-2 rounded-xl hover:bg-cyan-50 transition-all no-print"
                      title="Sadece Bu Kartı Yazdır"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all no-print"
                      title="Öğrenciyi Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student List - Mobile Cards */}
      <div className="md:hidden space-y-4 no-print">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 font-bold border border-slate-100">Öğrenci bulunamadı.</div>
        ) : filteredStudents.map(student => (
          <div key={student.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${selectedIds.includes(student.id) ? 'border-cyan-200 bg-cyan-50/30' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(student.id)}
                onChange={() => toggleSelect(student.id)}
                className="w-6 h-6 rounded-lg border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedIds([student.id]);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="text-slate-400 p-2 rounded-xl bg-slate-50 active:bg-cyan-100 transition-colors"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="text-slate-400 p-2 rounded-xl bg-slate-50 active:bg-rose-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleShowHistory(student)}
                className="font-bold text-slate-900 text-lg hover:text-cyan-600 text-left transition-colors"
              >
                {student.name}
              </button>
              <p className="text-sm text-slate-500 font-mono">{student.studentNumber}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600 font-bold uppercase">{student.grade}</span>
                <span className="text-[10px] bg-cyan-50 px-2 py-1 rounded text-cyan-600 font-bold flex items-center gap-1">
                  <BookIcon size={12} />
                  {student.readingHistory.length} Kitap
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student Reading History Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-soft-fade max-h-[90vh] flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="bg-cyan-600 p-8 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/10">
                  <ClipboardList size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedStudent.name}</h3>
                  <p className="text-cyan-100 text-sm font-medium">Okuma Geçmişi Detayı</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors relative z-10">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto flex-grow bg-slate-50">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-cyan-500 mb-4"></div>
                  <p className="font-bold">Geçmiş yükleniyor...</p>
                </div>
              ) : studentHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                  <div className="p-6 bg-slate-100 rounded-full border border-slate-200">
                    <BookIcon size={48} className="opacity-40" />
                  </div>
                  <p className="text-lg font-bold">Bu öğrenci henüz hiç kitap okumamış.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">
                    <BookIcon size={14} className="text-cyan-500" />
                    Toplam {studentHistory.length} Kitap
                  </h4>
                  <div className="grid gap-3">
                    {studentHistory.map((book, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-cyan-100 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-inner">
                            <BookIcon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight text-lg">{book.title}</p>
                            <p className="text-sm text-slate-500 font-medium">{book.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-[10px] font-black uppercase tracking-wider hidden sm:inline-block border border-cyan-100">
                            {book.category}
                          </span>
                          <button
                            onClick={() => handleRemoveBookFromHistory(book.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Geçmişten Sil"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-8 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors uppercase tracking-wide text-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View - Library Cards */}
      <div className="print-only w-full">
        <h1 className="text-2xl font-bold mb-8 text-center">
          {selectedIds.length > 0 ? 'Seçilen Öğrenci Kütüphane Kartları' : 'Tüm Öğrenci Kütüphane Kartları'}
        </h1>
        <div className="grid grid-cols-2 gap-8 w-full">
          {(selectedIds.length > 0
            ? students.filter(s => selectedIds.includes(s.id))
            : filteredStudents
          ).map(student => (
            <div key={student.id} className="border-2 border-black rounded-xl p-6 flex items-center justify-between break-inside-avoid shadow-none">
              <div className="flex-1 mr-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-black rounded-full text-white flex items-center justify-center font-bold">L</div>
                  <span className="font-bold text-sm tracking-wider uppercase">Okul Kütüphanesi</span>
                </div>
                <h3 className="text-xl font-bold uppercase mb-1">{student.name}</h3>
                <p className="text-lg font-mono mb-1">{student.studentNumber}</p>
                <p className="text-sm text-gray-600 mb-4">{student.grade}</p>
                <div className="border-t-2 border-black pt-2 w-32">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Yetkili İmza</p>
                </div>
              </div>
              <div>
                <QRCodeDisplay
                  value={student.studentNumber}
                  label=""
                  size={96}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};