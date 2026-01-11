import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { User } from './types';
import { auth, LibraryService } from './services/firebaseDatabase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Lazy loading pages
// Login sayfası LCP performansı için direkt yükleniyor (Lazy load değil)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Circulation = lazy(() => import('./pages/Circulation').then(m => ({ default: m.Circulation })));
const BookInventory = lazy(() => import('./pages/BookInventory').then(m => ({ default: m.BookInventory })));
const Students = lazy(() => import('./pages/Students').then(m => ({ default: m.Students })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const ParentView = lazy(() => import('./pages/ParentView').then(m => ({ default: m.ParentView })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

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
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ParentView teacherId={teacherId} />
      </Suspense>
    );
  }

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    );
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
      <Suspense fallback={<LoadingSpinner />}>
        {renderPage()}
      </Suspense>
    </Layout>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default App;