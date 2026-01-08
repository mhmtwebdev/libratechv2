import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Circulation } from './pages/Circulation';
import { BookInventory } from './pages/BookInventory';
import { Students } from './pages/Students';
import { Reports } from './pages/Reports';
import { ParentView } from './pages/ParentView';
import { AdminDashboard } from './pages/AdminDashboard';
import { User } from './types';
import { auth, LibraryService } from './services/firebaseDatabase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(true);

  // Veli Görünümü Kontrolü (Daha dayanıklı kontrol)
  const queryParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
  const isParentView = queryParams.get('view') === 'parent';

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role from Firestore
        LibraryService.getUserRole(firebaseUser.uid).then(role => {
          setUser({
            id: firebaseUser.uid,
            role: role,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Öğretmen'
          });
          setAuthLoading(false);
        });
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // Firebase onAuthStateChanged handles the actual state update
    // This function can be used for extra logic after login if needed
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isParentView) {
    const teacherId = queryParams.get('teacher');
    return <ParentView teacherId={teacherId} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
      case 'admin': return <AdminDashboard />;
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