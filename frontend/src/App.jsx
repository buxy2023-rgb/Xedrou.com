import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from './screens/Login';
import Register from './screens/Register';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import AuthCallback from './screens/AuthCallback';
import Home from './screens/Home';
import Pricing from './screens/Pricing';
import WorkerAccess from './screens/WorkerAccess';
import WorkerPortal from './screens/WorkerPortal';
import DashboardLayout from './components/app/DashboardLayout';
import Dashboard from './screens/Dashboard';
import Distribution from './screens/Distribution';
import Promotion from './screens/Promotion';
import ProducerSuite from './screens/ProducerSuite';
import CreatorPayments from './screens/CreatorPayments';
import SellTickets from './screens/SellTickets';
import Invest from './screens/Invest';
import Publishing from './screens/Publishing';
import Royalties from './screens/Royalties';
import LabelDashboard from './screens/LabelDashboard';
import ArtistManagement from './screens/ArtistManagement';
import CreatorStore from './screens/CreatorStore';
import AIAssistant from './screens/AIAssistant';
import CompanyAI from './screens/CompanyAI';
import Notifications from './screens/Notifications';
import KYC from './screens/KYC';
import Support from './screens/Support';
import AdminReports from './screens/AdminReports';
import BookStudio from './screens/BookStudio';
import ArtistCatalog from './screens/ArtistCatalog';
import ArtistProfilePage from './screens/ArtistProfilePage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  if (authError) { if (authError.type === 'user_not_registered') return <UserNotRegisteredError />; if (authError.type === 'auth_required') { navigateToLogin(); return null; } }
  return <Routes>
    <Route path="/" element={<Home />} /><Route path="/pricing" element={<Pricing />} /><Route path="/worker-access" element={<WorkerAccess />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/auth/callback" element={<AuthCallback />} /><Route path="/reset-password" element={<ResetPassword />} />
    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}><Route path="/worker-portal" element={<WorkerPortal />} /><Route element={<DashboardLayout />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/company-ai" element={<CompanyAI />} /><Route path="/distribution" element={<Distribution />} /><Route path="/promotion" element={<Promotion />} /><Route path="/producer-suite" element={<ProducerSuite />} /><Route path="/creator-payments" element={<CreatorPayments />} /><Route path="/sell-tickets" element={<SellTickets />} /><Route path="/invest" element={<Invest />} /><Route path="/publishing" element={<Publishing />} /><Route path="/royalties" element={<Royalties />} /><Route path="/label-dashboard" element={<LabelDashboard />} /><Route path="/artist-management" element={<ArtistManagement />} /><Route path="/creator-store" element={<CreatorStore />} /><Route path="/ai-assistant" element={<AIAssistant />} /><Route path="/notifications" element={<Notifications />} /><Route path="/kyc" element={<KYC />} /><Route path="/support" element={<Support />} /><Route path="/admin/reports" element={<AdminReports />} /><Route path="/book-studio" element={<BookStudio />} /><Route path="/artist-catalog" element={<ArtistCatalog />} /><Route path="/artist/:id" element={<ArtistProfilePage />} /></Route></Route>
    <Route path="*" element={<PageNotFound />} />
  </Routes>;
};
function App() { return <AuthProvider><QueryClientProvider client={queryClientInstance}><Router><ScrollToTop/><AuthenticatedApp/></Router><Toaster/></QueryClientProvider></AuthProvider> }
export default App
