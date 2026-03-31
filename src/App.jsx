import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/error/ErrorBoundary';

const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminOrders = lazy(() => import('./pages/AdminOrders').then(module => ({ default: module.AdminOrders })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/AdminProducts').then(module => ({ default: module.AdminProducts })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(module => ({ default: module.AdminUsers })));
const MyOrders = lazy(() => import('./pages/MyOrders').then(module => ({ default: module.MyOrders })));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] grid place-items-center px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-primary-red animate-pulse" />
        Đang tải giao diện...
      </div>
    </div>
  );
}

function App() {
  const initAuth = useAuthStore(state => state.init);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <ToastContainer />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/order/success/:id" element={<OrderSuccess />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-orders" element={<MyOrders />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;

