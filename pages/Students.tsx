import React, { useEffect, useState } from 'react';
import { Student } from '../types';
import { LibraryService } from '../services/firebaseDatabase';
import { Plus, Printer, Trash2, Search, Book as BookIcon, X, ClipboardList } from 'lucide-react';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', studentNumber: '', email: '', grade: '' });

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHistory, setStudentHistory] = useState<{ id: string, title: string, author: string, category: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchStudents = async () => {
    const data = await LibraryService.getStudents();
    setStudents(data);
    setFilteredStudents(data);
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
        <h2 className="text-2xl font-bold text-gray-800">Öğrenci Veritabanı</h2>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Öğrenci ara..."
            className="pl-10 block w-full rounded-lg border-gray-300 border py-2 px-4 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-3 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 flex-1 md:flex-none"
          >
            <Printer size={18} />
            <span>Kart Yazdır</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 flex-1 md:flex-none"
          >
            <Plus size={18} />
            <span>Ekle</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 no-print">
          <h3 className="text-lg font-semibold mb-4">Yeni Öğrenci Kaydet</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Ad Soyad"
              className="border p-2 rounded"
              value={newStudent.name}
              onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
              required
            />
            <input
              placeholder="Öğrenci No (ID)"
              className="border p-2 rounded"
              value={newStudent.studentNumber}
              onChange={e => setNewStudent({ ...newStudent, studentNumber: e.target.value })}
              required
            />
            <input
              placeholder="Email"
              type="email"
              className="border p-2 rounded"
              value={newStudent.email}
              onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
            />
            <input
              placeholder="Sınıf / Şube"
              className="border p-2 rounded"
              value={newStudent.grade}
              onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })}
            />
            <button type="submit" className="col-span-2 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Öğrenciyi Kaydet</button>
          </form>
        </div>
      )}

      {/* Student List - Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">İsim</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Öğrenci No</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Sınıf</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Geçmiş</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400">Öğrenci bulunamadı.</td></tr>
            ) : filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleShowHistory(student)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-left"
                  >
                    {student.name}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono">{student.studentNumber}</td>
                <td className="px-6 py-4">{student.grade}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {student.readingHistory.length} kitap okudu
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                    title="Öğrenciyi Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student List - Mobile Cards */}
      <div className="md:hidden space-y-4 no-print">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-6 rounded-xl text-center text-gray-400 border border-gray-200">Öğrenci bulunamadı.</div>
        ) : filteredStudents.map(student => (
          <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start">
            <div className="space-y-1">
              <button
                onClick={() => handleShowHistory(student)}
                className="font-bold text-indigo-600 text-left"
              >
                {student.name}
              </button>
              <p className="text-sm text-gray-500 font-mono">{student.studentNumber}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold uppercase">{student.grade}</span>
                <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-bold">
                  {student.readingHistory.length} Kitap
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(student.id)}
              className="text-red-400 hover:text-red-600 p-2 rounded-lg bg-red-50 transition-colors"
              title="Öğrenciyi Sil"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Student Reading History Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-soft-fade max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                  <p className="text-indigo-100 text-sm">Okuma Geçmişi Detayı</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-grow">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                  <p>Geçmiş yükleniyor...</p>
                </div>
              ) : studentHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-4">
                  <BookIcon size={48} className="opacity-20" />
                  <p className="text-lg">Bu öğrenci henüz hiç kitap okumamış.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                    <BookIcon size={18} className="text-indigo-500" />
                    Toplam {studentHistory.length} Kitap
                  </h4>
                  <div className="grid gap-3">
                    {studentHistory.map((book, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <BookIcon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{book.title}</p>
                            <p className="text-sm text-gray-500">{book.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider hidden sm:inline-block">
                            {book.category}
                          </span>
                          <button
                            onClick={() => handleRemoveBookFromHistory(book.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Geçmişten Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View - Library Cards */}
      <div className="print-only w-full">
        <h1 className="text-2xl font-bold mb-8 text-center">Kütüphane Kartları</h1>
        <div className="grid grid-cols-2 gap-8 w-full">
          {filteredStudents.map(student => (
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