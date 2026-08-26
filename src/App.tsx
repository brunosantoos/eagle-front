import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { SiteContentProvider } from './context/SiteContentProvider';
import { ToastProvider } from './context/ToastProvider';
import { trpc, makeTrpcClient } from './lib/trpc';
import { PageLoader } from './components/ui/PageLoader';

const Home = lazy(() => import('./pages/Home'));
const Franchise = lazy(() => import('./pages/Franchise'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

/**
 * Tudo que depende de autenticação entra por import dinâmico.
 *
 * Import estático traria o cliente do better-auth para o bundle do site
 * público e, pior, faria toda visita disparar a chamada de sessão — custo puro
 * para quem só está lendo o site.
 */
const AdminAuthProvider = lazy(() =>
  import('./context/AdminAuthProvider').then((m) => ({
    default: m.AdminAuthProvider,
  })),
);
const ProtectedAdminRoute = lazy(() =>
  import('./pages/admin/ProtectedAdminRoute').then((m) => ({
    default: m.ProtectedAdminRoute,
  })),
);
const AdminUsersProvider = lazy(() =>
  import('./context/AdminUsersProvider').then((m) => ({
    default: m.AdminUsersProvider,
  })),
);

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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route
                    path="/admin/login"
                    element={
                      <AdminAuthProvider>
                        <AdminLogin />
                      </AdminAuthProvider>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminAuthProvider>
                        <ProtectedAdminRoute>
                          <AdminUsersProvider>
                            <AdminDashboard />
                          </AdminUsersProvider>
                        </ProtectedAdminRoute>
                      </AdminAuthProvider>
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
            </ToastProvider>
          </SiteContentProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
