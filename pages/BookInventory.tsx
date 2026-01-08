import React, { useEffect, useState } from 'react';
import { Book, BookStatus } from '../types';
import { LibraryService } from '../services/firebaseDatabase';
import { Plus, Printer, Trash2, Search, BookOpen, QrCode, FileDown } from 'lucide-react';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

export const BookInventory: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '' });

  const fetchBooks = async () => {
    const data = await LibraryService.getBooks();
    // En yeni eklenen kitapların en üstte görünmesi için tarihe göre sıralıyoruz
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.addedDate || 0).getTime();
      const dateB = new Date(b.addedDate || 0).getTime();
      return dateB - dateA;
    });
    setBooks(sortedData);
    setFilteredBooks(sortedData);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(lowerTerm) ||
      book.author.toLowerCase().includes(lowerTerm) ||
      book.isbn.includes(lowerTerm)
    );
    setFilteredBooks(filtered);
    // Filtre değişince seçimi temizleme isteğe bağlıdır, şimdilik aktif bırakıyoruz
    // setSelectedIds([]);
  }, [searchTerm, books]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBooks.map(b => b.id));
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
    if (newBook.title && newBook.isbn) {
      const res = await LibraryService.addBook(newBook);
      if (res.success) {
        setNewBook({ title: '', author: '', isbn: '', category: '' });
        setIsAdding(false);
        fetchBooks();
      } else {
        alert(res.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu kitabı silmek istediğinize emin misiniz?')) {
      await LibraryService.deleteBook(id);
      fetchBooks();
    }
  };

  const handlePrint = (bookToPrint?: Book) => {
    window.print();
  };

  const exportToExcel = async () => {
    const dataToExport = filteredBooks.map(book => ({
      'Kitap Adı': book.title,
      'Yazar': book.author || 'Belirtilmemiş',
      'ISBN/Barkod': book.isbn,
      'Kategori': book.category || 'Genel',
      'Durum': getStatusLabel(book.status),
      'Eklenme Tarihi': new Date(book.addedDate).toLocaleDateString('tr-TR')
    }));

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kitaplar");
    XLSX.writeFile(workbook, `Kutuphane_Envanter_${new Date().toLocaleDateString('tr-TR')}.xlsx`);
  };

  const generateRandomISBN = () => {
    setNewBook(prev => ({ ...prev, isbn: Math.floor(1000000000000 + Math.random() * 9000000000000).toString() }));
  }

  const getStatusLabel = (status: BookStatus) => {
    switch (status) {
      case BookStatus.AVAILABLE: return 'MEVCUT';
      case BookStatus.BORROWED: return 'ÖDÜNÇTE';
      case BookStatus.LOST: return 'KAYIP';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Kitap Envanteri</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Kütüphane Kayıtları</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative group w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            </div>
            <input
              id="book-search"
              name="book-search"
              type="text"
              placeholder="Kitap ara..."
              className="pl-10 block w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 px-4 font-bold text-slate-700 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-0 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-100 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all flex-1 md:flex-none border border-emerald-100"
            >
              <FileDown size={18} />
              <span className="hidden lg:inline">Excel</span>
            </button>
            <button
              onClick={() => handlePrint()}
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
            Yeni Kitap Ekle
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="book-title" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Kitap Adı</label>
              <input
                id="book-title"
                name="book-title"
                placeholder="Örn: Sefiller"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newBook.title}
                onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="book-author" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Yazar (İsteğe Bağlı)</label>
              <input
                id="book-author"
                name="book-author"
                placeholder="Örn: Victor Hugo (Boş bırakılabilir)"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newBook.author}
                onChange={e => setNewBook({ ...newBook, author: e.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label htmlFor="book-isbn" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">ISBN / Barkod</label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
                  <input
                    id="book-isbn"
                    name="book-isbn"
                    placeholder="ISBN Numarası"
                    className="w-full pl-10 bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-mono font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                    value={newBook.isbn}
                    onChange={e => setNewBook({ ...newBook, isbn: e.target.value })}
                    required
                  />
                </div>
                <button type="button" onClick={generateRandomISBN} className="bg-slate-100 text-slate-600 px-3 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors">Üret</button>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="book-category" className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Kategori</label>
              <input
                id="book-category"
                name="book-category"
                placeholder="Örn: Klasikler"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-cyan-500 transition-all"
                value={newBook.category}
                onChange={e => setNewBook({ ...newBook, category: e.target.value })}
              />
            </div>
            <button type="submit" className="md:col-span-2 bg-cyan-600 text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 active:scale-[0.98] transition-all">
              Kitabı Kaydet
            </button>
          </form>
        </div>
      )}

      {/* Book List - Desktop Table */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-5 no-print">
                <input
                  type="checkbox"
                  checked={isAllSelected && filteredBooks.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kitap Bilgisi</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Yazar</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">ISBN</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredBooks.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">Aradığınız kriterlerde kitap bulunamadı.</td></tr>
            ) : filteredBooks.map(book => (
              <tr key={book.id} className={`group hover:bg-slate-50 transition-colors ${selectedIds.includes(book.id) ? 'bg-cyan-50/50' : ''}`}>
                <td className="px-6 py-4 no-print">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(book.id)}
                    onChange={() => toggleSelect(book.id)}
                    className="w-5 h-5 rounded border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-lg group-hover:text-cyan-700 transition-colors">{book.title}</div>
                  {book.category && <div className="text-[10px] inline-block bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide mt-1">{book.category}</div>}
                </td>
                <td className="px-8 py-4 font-bold text-slate-600">{book.author}</td>
                <td className="px-8 py-4 font-mono font-medium text-slate-500 bg-slate-50/50 rounded px-2">{book.isbn}</td>
                <td className="px-8 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${book.status === BookStatus.AVAILABLE
                    ? 'bg-emerald-100 text-emerald-700 shadow-emerald-200'
                    : 'bg-rose-100 text-rose-700 shadow-rose-200'
                    }`}>
                    {getStatusLabel(book.status)}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedIds([book.id]);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="text-slate-400 hover:text-cyan-600 p-2 rounded-xl hover:bg-cyan-50 transition-all no-print"
                      title="Sadece Bu QR'ı Yazdır"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="text-slate-400 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-all no-print"
                      title="Kitabı Sil"
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

      {/* Book List - Mobile Cards */}
      <div className="md:hidden space-y-4 no-print">
        {filteredBooks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 font-bold border border-slate-100">Kitap bulunamadı.</div>
        ) : filteredBooks.map(book => (
          <div key={book.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${selectedIds.includes(book.id) ? 'border-cyan-200 bg-cyan-50/30' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(book.id)}
                onChange={() => toggleSelect(book.id)}
                className="w-6 h-6 rounded-lg border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedIds([book.id]);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="text-slate-400 p-2 rounded-xl bg-slate-50 active:bg-cyan-100 transition-colors"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="text-slate-400 p-2 rounded-xl bg-slate-50 active:bg-rose-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-lg">{book.title}</h4>
              <p className="text-sm font-medium text-slate-500">{book.author}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">{book.isbn}</span>
                <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wide ${book.status === BookStatus.AVAILABLE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {getStatusLabel(book.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Print View (QR Codes Grid) */}
      <div className="print-only">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {selectedIds.length > 0 ? 'Seçilen Kitap QR Kodları' : 'Tüm Kitap Envanteri QR Kodları'}
        </h1>
        <div className="grid grid-cols-4 gap-4">
          {(selectedIds.length > 0
            ? books.filter(b => selectedIds.includes(b.id))
            : filteredBooks
          ).map(book => (
            <QRCodeDisplay
              key={book.id}
              value={book.isbn}
              label={book.title.substring(0, 20) + (book.title.length > 20 ? '...' : '')}
              subLabel={book.isbn}
            />
          ))}
        </div>
      </div>
    </div>
  );
};