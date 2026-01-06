import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Circulation } from './pages/Circulation';
import { BookInventory } from './pages/BookInventory';
import { Students } from './pages/Students';
import { Reports } from './pages/Reports';
import { ParentView } from './pages/ParentView';
import { User } from './types';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Veli Görünümü Kontrolü (Daha dayanıklı kontrol)
  const queryParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
  const isParentView = queryParams.get('view') === 'parent';

  const handleLogin = () => {
    // Simulating Firebase Auth login
    setUser({
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@library.school',
      role: 'ADMIN'
    });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (isParentView) {
    return <ParentView />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'circulation': return <Circulation />;
      case 'books': return <BookInventory />;
      case 'students': return <Students />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;