import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkstationShell from './components/WorkstationShell';
import AuthCallback from './screens/AuthCallback';
import Home from './screens/Home';
import CompanyGateway from './screens/CompanyGateway';
import PhoneRegistration from './screens/PhoneRegistration';
import CustomerDashboard from './screens/CustomerDashboard';
import Pricing from './screens/Pricing';
import WorkerAccess from './screens/WorkerAccess';
import WorkerPortal from './screens/WorkerPortal';
import CountryRegistration from './screens/CountryRegistration';
import DashboardLayout from './components/app/DashboardLayout';
import Dashboard from './screens/Dashboard';
import DeveloperControlCenter from './screens/DeveloperControlCenter';
import DeveloperWorkstation from './screens/DeveloperWorkstation';
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
import AccountantDashboard from './screens/AccountantDashboard';
import CustomerServiceWorkspace from './screens/CustomerServiceWorkspace';
import HRWorkspace from './screens/HRWorkspace';
import GovernorDashboard from './screens/GovernorDashboard';
import PowerHoldingsExecutive from './screens/PowerHoldingsExecutive';
import CEOExecutiveWorkspace from './screens/CEOExecutiveWorkspace';
import PlatformUsageDashboard from './screens/PlatformUsageDashboard';
import PayAndPlay from './screens/PayAndPlay';

const AppRoutes = () => <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/company/:slug" element={<CompanyGateway />} />
  <Route path="/phone-registration" element={<PhoneRegistration />} />
  <Route path="/customer-dashboard" element={<CustomerDashboard />} />
  <Route path="/pricing" element={<Pricing />} />
  <Route path="/worker-access" element={<WorkerAccess />} />
  <Route path="/xedruo-ai" element={<AIAssistant />} />
  <Route path="/developer-workstation" element={<DeveloperWorkstation />} />
  <Route path="/registration/country" element={<CountryRegistration />} />
  <Route element={<WorkstationShell />}>
    <Route path="/power-holdings" element={<PowerHoldingsExecutive />} />
    <Route path="/ceo/:id" element={<CEOExecutiveWorkspace />} />
    <Route path="/ceo/:id/office" element={<CEOExecutiveWorkspace office />} />
    <Route path="/accountant" element={<AccountantDashboard />} />
    <Route path="/customer-service" element={<CustomerServiceWorkspace />} />
    <Route path="/hr" element={<HRWorkspace />} />
    <Route path="/governor" element={<GovernorDashboard mode="operations" />} />
    <Route path="/governor-finance" element={<GovernorDashboard mode="finance" />} />
  </Route>
  <Route path="/platform-usage" element={<PlatformUsageDashboard />} />
  <Route path="/login" element={<Navigate to="/worker-access" replace />} />
  <Route path="/developer-login" element={<Navigate to="/worker-access" replace />} />
  <Route path="/forgot-password" element={<Navigate to="/worker-access" replace />} />
  <Route path="/reset-password" element={<Navigate to="/worker-access" replace />} />
  <Route path="/auth/callback" element={<AuthCallback />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/worker-portal" element={<WorkerPortal />} />
    <Route element={<DashboardLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pay-and-play" element={<PayAndPlay />} />
      <Route path="/developer" element={<DeveloperControlCenter />} />
      <Route path="/company-ai" element={<CompanyAI />} />
      <Route path="/ai-assistant" element={<AIAssistant />} />
      <Route path="/distribution" element={<Distribution />} />
      <Route path="/promotion" element={<Promotion />} />
      <Route path="/producer-suite" element={<ProducerSuite />} />
      <Route path="/creator-payments" element={<CreatorPayments />} />
      <Route path="/sell-tickets" element={<SellTickets />} />
      <Route path="/invest" element={<Invest />} />
      <Route path="/publishing" element={<Publishing />} />
      <Route path="/royalties" element={<Royalties />} />
      <Route path="/label-dashboard" element={<LabelDashboard />} />
      <Route path="/artist-management" element={<ArtistManagement />} />
      <Route path="/creator-store" element={<CreatorStore />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/kyc" element={<KYC />} />
      <Route path="/support" element={<Support />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/book-studio" element={<BookStudio />} />
      <Route path="/artist-catalog" element={<ArtistCatalog />} />
      <Route path="/artist/:id" element={<ArtistProfilePage />} />
    </Route>
  </Route>
  <Route path="*" element={<PageNotFound />} />
</Routes>;

function App() { return <AuthProvider><QueryClientProvider client={queryClientInstance}><Router><ScrollToTop/><AppRoutes/></Router><Toaster/></QueryClientProvider></AuthProvider> }
export default App
