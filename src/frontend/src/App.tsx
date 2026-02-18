import { lazy, Suspense } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage';
import CatalogPage from './pages/CatalogPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import { Toaster } from '@/components/ui/sonner';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for code splitting
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}

// Layout component for root route
function RootLayout() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </div>
  );
}

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Main page route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MainPage,
});

// Catalog page route with prefetching
const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  component: CatalogPage,
});

// Vehicle detail route with dynamic ID parameter and lazy loading
const vehicleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/$vehicleId',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <VehicleDetailPage />
    </Suspense>
  ),
});

// Create route tree
const routeTree = rootRoute.addChildren([indexRoute, catalogRoute, vehicleRoute]);

// Create router instance
const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;
