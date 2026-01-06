import React, { useState } from 'react';
import { BookOpen, Users, LayoutDashboard, ArrowLeftRight, LogOut, Library, RefreshCcw, Menu, X, BarChart3 } from 'lucide-react';
import { LibraryService } from '../services/firebaseDatabase';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'circulation', label: 'Ödünç İşlemleri', icon: ArrowLeftRight },
    { id: 'books', label: 'Kitap Envanteri', icon: BookOpen },
    { id: 'students', label: 'Öğrenciler', icon: Users },
    { id: 'reports', label: 'Raporlar', icon: BarChart3 },
  ];

  const handleResetData = () => {
    if (window.confirm("TÜM VERİLER SİLİNECEK ve fabrika ayarlarına dönülecek. Onaylıyor musunuz?")) {
      LibraryService.resetDatabase();
    }
  }

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden flex-col md:flex-row">

      {/* Mobile Header - Visible only on mobile */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20 no-print">
        <div className="flex items-center space-x-2">
          <Library size={24} className="text-cyan-500" />
          <span className="font-bold text-lg tracking-tight">LibraTech</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 hover:bg-slate-800 rounded focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay - Visible when menu is open on mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-xl 
        transform transition-transform duration-300 ease-in-out md:translate-x-0 no-print
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Desktop Logo - Hidden on mobile */}
        <div className="hidden md:flex p-6 items-center space-x-3 border-b border-slate-800">
          <div className="bg-cyan-600 p-2 rounded-lg">
            <Library size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight uppercase">LibraTech</h1>
            <p className="text-xs text-cyan-400 font-medium">Okul Kütüphanesi</p>
          </div>
        </div>

        {/* Mobile Menu Header */}
        <div className="md:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="font-bold text-xs uppercase tracking-widest text-slate-500">Menü Navigation</span>
          <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} className="text-slate-400" /></button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-800/50 rounded-xl">
            <img
              src={`https://ui-avatars.com/api/?name=${user.name}&background=0891b2&color=fff`}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user.name}</p>
              <p className="text-[10px] text-cyan-500 font-bold truncate uppercase tracking-tighter">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleResetData}
            className="w-full flex items-center space-x-3 px-4 py-2 text-slate-500 hover:bg-slate-950 hover:text-cyan-400 rounded-lg transition-colors"
            title="Veritabanını Sıfırla"
          >
            <RefreshCcw size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Sıfırla</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto w-full relative bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};