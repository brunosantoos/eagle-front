import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { SiteContentProvider } from './context/SiteContentProvider';
import { AdminAuthProvider } from './context/AdminAuthProvider';
import { ToastProvider } from './context/ToastProvider';
import { AdminUsersProvider } from './context/AdminUsersProvider';
import { trpc, makeTrpcClient } from './lib/trpc';
import { PageLoader } from './components/ui/PageLoader';
import { ProtectedAdminRoute } from './pages/admin/ProtectedAdminRoute';

const Home = lazy(() => import('./pages/Home'));
const Franchise = lazy(() => import('./pages/Franchise'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const trpcClient = makeTrpcClient();

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SiteContentProvider>
            <ToastProvider>
              <AdminAuthProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedAdminRoute>
                          <AdminUsersProvider>
                            <AdminDashboard />
                          </AdminUsersProvider>
                        </ProtectedAdminRoute>
                      }
                    />
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="franquia" element={<Franchise />} />
                      <Route path="sobre" element={<About />} />
                      <Route path="privacidade" element={<PrivacyPolicy />} />
                      <Route path="termos" element={<TermsOfUse />} />
                    </Route>
                  </Routes>
                </Suspense>
              </AdminAuthProvider>
            </ToastProvider>
          </SiteContentProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
