import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TabProvider } from '@/lib/tabContext';

// Public portal pages
import VolunteerPortal from '@/pages/portal/VolunteerPortal';
import StaffPortal from '@/pages/portal/StaffPortal';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Portal from '@/pages/Portal';
import WidgetCustomization from '@/pages/WidgetCustomization';
import MeetingManager from '@/pages/MeetingManager';

// NexusHR
import NexusLayout from '@/components/nexushr/NexusLayout';
import NexusDashboard from '@/pages/nexushr/NexusDashboard';
import NexusEmployees from '@/pages/nexushr/NexusEmployees';
import NexusPerformanceReviews from '@/pages/nexushr/NexusPerformanceReviews';
import NexusIncidents from '@/pages/nexushr/NexusIncidents';
import NexusTraining from '@/pages/nexushr/NexusTraining';
import NexusDocuments from '@/pages/nexushr/NexusDocuments';
import NexusContracts from '@/pages/nexushr/NexusContracts';
import NexusCorrectiveActions from '@/pages/nexushr/NexusCorrectiveActions';
import NexusLegalCases from '@/pages/nexushr/NexusLegalCases';
import NexusCareerPlans from '@/pages/nexushr/NexusCareerPlans';
import NexusPayGrid from '@/pages/nexushr/NexusPayGrid';
import NexusServiceAwards from '@/pages/nexushr/NexusServiceAwards';
import NexusTimeLogs from '@/pages/nexushr/NexusTimeLogs';
import NexusRecognition from '@/pages/nexushr/NexusRecognition';
import NexusOnboarding from '@/pages/nexushr/NexusOnboarding';
import NexusEmailEmployees from '@/pages/nexushr/NexusEmailEmployees';
import NexusEmployeeProfile from '@/pages/nexushr/NexusEmployeeProfile';

// Volunteer Manager
import VolunteerMgrLayout from '@/components/volunteermgr/VolunteerMgrLayout';
import VolunteerMgrDashboard from '@/pages/volunteermgr/VolunteerMgrDashboard';
import VolunteerMgrVolunteers from '@/pages/volunteermgr/VolunteerMgrVolunteers';
import VolunteerMgrEvents from '@/pages/volunteermgr/VolunteerMgrEvents';
import VolunteerMgrEventDetail from '@/pages/volunteermgr/VolunteerMgrEventDetail';
import VolunteerMgrImport from '@/pages/volunteermgr/VolunteerMgrImport';
import VolunteerMgrEmail from '@/pages/volunteermgr/VolunteerMgrEmail';
import VolunteerMgrPositions from '@/pages/volunteermgr/VolunteerMgrPositions';
import VolunteerMgrTimeLogs from '@/pages/volunteermgr/VolunteerMgrTimeLogs';
import VolunteerMgrTraining from '@/pages/volunteermgr/VolunteerMgrTraining';
import VolunteerMgrRecognition from '@/pages/volunteermgr/VolunteerMgrRecognition';
import VolunteerMgrDocuments from '@/pages/volunteermgr/VolunteerMgrDocuments';
import VolunteerMgrApprovals from '@/pages/volunteermgr/VolunteerMgrApprovals';
import VolunteerMgrProfile from '@/pages/volunteermgr/VolunteerMgrProfile';
import VolunteerMgrBirthdays from '@/pages/volunteermgr/VolunteerMgrBirthdays';
import VolunteerMgrMilestones from '@/pages/volunteermgr/VolunteerMgrMilestones';
import VolunteerMgrSchedule from '@/pages/volunteermgr/VolunteerMgrSchedule';
import VolunteerMgrStaffRequests from '@/pages/volunteermgr/VolunteerMgrStaffRequests';

// Admin pages
import ManageCards from '@/pages/admin/ManageCards';
import ManageWidgets from '@/pages/admin/ManageWidgets';
import UsersAccess from '@/pages/admin/UsersAccess';
import Announcements from '@/pages/admin/Announcements';
import OrgSettingsPage from '@/pages/admin/OrgSettingsPage';
import UserSettings from '@/pages/UserSettings';

// Pathways CM - Case Management
import PathwaysLayout from '@/components/pathways/PathwaysLayout';
import PathwaysHome from '@/pages/pathways/PathwaysHome';
import PathwaysIntake from '@/pages/pathways/PathwaysIntake';
import PathwaysWorkerDashboard from '@/pages/pathways/PathwaysWorkerDashboard';
import PathwaysMasterList from '@/pages/pathways/PathwaysMasterList';
import PathwaysClientProfile from '@/pages/pathways/PathwaysClientProfile';
import PathwaysReports from '@/pages/pathways/PathwaysReports';
import PathwaysSupervisor from '@/pages/pathways/PathwaysSupervisor';
import PathwaysResources from '@/pages/pathways/PathwaysResources';
import PathwaysCompass from '@/pages/pathways/PathwaysCompass';
import PathwaysBilling from '@/pages/pathways/PathwaysBilling';
import PathwaysEmployers from '@/pages/pathways/PathwaysEmployers';
import PathwaysInternalTraining from '@/pages/pathways/PathwaysInternalTraining';

// Candora File Manager
import FileManagerLayout from '@/components/filemanager/FileManagerLayout';
import FileManagerHome from '@/pages/filemanager/FileManagerHome';
import FileBrowser from '@/pages/filemanager/FileBrowser';
import FileUploadPage from '@/pages/filemanager/FileUpload';
import FileViewer from '@/pages/filemanager/FileViewer';
import FileEditor from '@/pages/filemanager/FileEditor';
import BulkUpload from '@/pages/filemanager/BulkUpload';
import Notes from '@/pages/filemanager/Notes';
import Workspace from '@/pages/filemanager/Workspace';
import Collections from '@/pages/filemanager/Collections';
import CollectionDetail from '@/pages/filemanager/CollectionDetail';
import SearchPage from '@/pages/filemanager/SearchPage';
import DevTasks from '@/pages/DevTasks';
import HowToAdmin from '@/pages/HowToAdmin';

// Grant / Proposal Manager
import GrantsLayout from '@/components/grants/GrantsLayout';
import GrantsHome from '@/pages/grants/GrantsHome';
import GrantsProjects from '@/pages/grants/GrantsProjects';
import GrantsNewProject from '@/pages/grants/GrantsNewProject';
import GrantsProjectDetail from '@/pages/grants/GrantsProjectDetail';
import GrantsFundingDB from '@/pages/grants/GrantsFundingDB';
import GrantsProposals from '@/pages/grants/GrantsProposals';
import GrantsSubmissions from '@/pages/grants/GrantsSubmissions';
import GrantsReports from '@/pages/grants/GrantsReports';
import GrantsFiles from '@/pages/grants/GrantsFiles';

// Executive Director Portal
import EDLayout from '@/components/ed/EDLayout';
import EDDashboard from '@/pages/ed/EDDashboard';
import EDTasks from '@/pages/ed/EDTasks';
import EDProjects from '@/pages/ed/EDProjects';
import EDOPSP from '@/pages/ed/EDOPSP';
import EDKPIs from '@/pages/ed/EDKPIs';
import EDBudgets from '@/pages/ed/EDBudgets';
import EDOrgChart from '@/pages/ed/EDOrgChart';
import EDNotes from '@/pages/ed/EDNotes';
import EDAgendaMaker from '@/pages/ed/EDAgendaMaker';
import EDBoardReport from '@/pages/ed/EDBoardReport';

// Reports Portal
import ReportingLayout from '@/components/reporting/ReportingLayout';
import ReportingHome from '@/pages/reporting/ReportingHome';
import ReportingInternal from '@/pages/reporting/ReportingInternal';
import ReportingFunder from '@/pages/reporting/ReportingFunder';
import ReportingSpecial from '@/pages/reporting/ReportingSpecial';
import ReportingAGR from '@/pages/reporting/ReportingAGR';
import ReportingAGREditor from '@/pages/reporting/ReportingAGREditor';
import ReportingAGRPreview from '@/pages/reporting/ReportingAGRPreview';
import ReportingAGRPrint from '@/pages/reporting/ReportingAGRPrint';
import ReportingAGRAnalysis from '@/pages/reporting/ReportingAGRAnalysis';

// Food Services
import FoodLayout from '@/components/food/FoodLayout';
import FoodDashboard from '@/pages/food/FoodDashboard';
import FoodMenu from '@/pages/food/FoodMenu';
import FoodOrders from '@/pages/food/FoodOrders';
import FoodInventory from '@/pages/food/FoodInventory';
import FoodRecipes from '@/pages/food/FoodRecipes';
import FoodCatering from '@/pages/food/FoodCatering';
import FoodCustomers from '@/pages/food/FoodCustomers';
import FoodAreaOrders from '@/pages/food/FoodAreaOrders';
import FoodAreaMenu from '@/pages/food/FoodAreaMenu';
import FoodAreaRecipes from '@/pages/food/FoodAreaRecipes';
import FoodAreaOverview from '@/pages/food/FoodAreaOverview';
import CommunityLunch from '@/pages/food/CommunityLunch';
import FoodSchedule from '@/pages/food/FoodSchedule';
import FoodSales from '@/pages/food/FoodSales';

// Catering Portal (Public)
import PublicLayout from '@/components/catering-portal/PublicLayout';
import CateringHome from '@/pages/catering-portal/CateringHome';
import CateringMenuPage from '@/pages/catering-portal/CateringMenuPage';
import OurSpaces from '@/pages/catering-portal/OurSpaces';
import BookingWizard from '@/pages/catering-portal/BookingWizard';
import MyBooking from '@/pages/catering-portal/MyBooking';
import OurStory from '@/pages/catering-portal/OurStory';


// Candora Board
import BoardLayout from '@/components/board/BoardLayout';
import BoardDashboard from '@/pages/board/BoardDashboard';
import BoardMeetings from '@/pages/board/BoardMeetings';
import BoardDocuments from '@/pages/board/BoardDocuments';
import BoardMembers from '@/pages/board/BoardMembers';
import BoardOnboarding from '@/pages/board/BoardOnboarding';
import BoardStrategicPlan from '@/pages/board/BoardStrategicPlan';
import BoardAssistant from '@/pages/board/BoardAssistant';
import BoardAgendaBuilder from '@/pages/board/BoardAgendaBuilder';
import BoardMinutesTaker from '@/pages/board/BoardMinutesTaker';

// Outlook Portal
import OutlookLayout from '@/components/outlook/OutlookLayout';
import OutlookDashboard from '@/pages/outlook/OutlookDashboard';

// Events/Projects/Programs Manager
import EventsMgrLayout from '@/components/eventsmgr/EventsMgrLayout';
import EventsMgrDashboard from '@/pages/eventsmgr/EventsMgrDashboard';
import EventsMgrEvents from '@/pages/eventsmgr/EventsMgrEvents';
import EventsMgrPrograms from '@/pages/eventsmgr/EventsMgrPrograms';
import EventsMgrProjects from '@/pages/eventsmgr/EventsMgrProjects';
import EventsMgrContacts from '@/pages/eventsmgr/EventsMgrContacts';
import EventsMgrResources from '@/pages/eventsmgr/EventsMgrResources';

// Marketing & Fundraising Manager
import MarketingLayout from '@/components/marketing/MarketingLayout';
import MarketingHome from '@/pages/marketing/MarketingHome';
import MarketingAssets from '@/pages/marketing/MarketingAssets';
import MarketingEmail from '@/pages/marketing/MarketingEmail';
import MarketingSocial from '@/pages/marketing/MarketingSocial';
import MarketingCampaigns from '@/pages/marketing/MarketingCampaigns';
import MarketingCalendar from '@/pages/marketing/MarketingCalendar';
import MarketingSEO from '@/pages/marketing/MarketingSEO';
import MarketingWebsite from '@/pages/marketing/MarketingWebsite';
import MarketingResources from '@/pages/marketing/MarketingResources';
import MarketingRequests from '@/pages/marketing/MarketingRequests';
import MarketingDonors from '@/pages/marketing/MarketingDonors';
import MarketingMedia from '@/pages/marketing/MarketingMedia';
import MarketingContent from '@/pages/marketing/MarketingContent';
import MarketingDonationPages from '@/pages/marketing/MarketingDonationPages';
import MarketingAnnualReport from '@/pages/marketing/MarketingAnnualReport';

// ELL (English Language Learning) Portal
import ELLLayout from '@/components/ell/ELLLayout';
import ELLDashboard from '@/pages/ell/ELLDashboard';
import ELLLearners from '@/pages/ell/ELLLearners';
import ELLClasses from '@/pages/ell/ELLClasses';
import ELLSchedule from '@/pages/ell/ELLSchedule';
import ELLInstructors from '@/pages/ell/ELLInstructors';
import ELLAssessments from '@/pages/ell/ELLAssessments';

// Candora Archives
import ArchivesLayout from '@/components/archives/ArchivesLayout';
import ArchivesHome from '@/pages/archives/ArchivesHome';
import ArchivesTimeline from '@/pages/archives/ArchivesTimeline';
import ArchivesTimelineDetail from '@/pages/archives/ArchivesTimelineDetail';
import ArchivesTimelineDocument from '@/pages/archives/ArchivesTimelineDocument';
import ArchivesBios from '@/pages/archives/ArchivesBios';
import ArchivesStories from '@/pages/archives/ArchivesStories';
import ArchivesDocuments from '@/pages/archives/ArchivesDocuments';

// FRN Programs Portal
import FRNLayout from '@/components/frn/FRNLayout';
import FRNDashboard from '@/pages/frn/FRNDashboard';
import FRNParticipants from '@/pages/frn/FRNParticipants';
import FRNIntake from '@/pages/frn/FRNIntake';
import FRNAssessments from '@/pages/frn/FRNAssessments';

// PHAC Programs Portal
import PHACLayout from '@/components/phac/PHACLayout';
import PHACDashboard from '@/pages/phac/PHACDashboard';
import PHACPrograms from '@/pages/phac/PHACPrograms';
import PHACSessions from '@/pages/phac/PHACSessions';
import PHACParticipants from '@/pages/phac/PHACParticipants';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/volunteer-portal', '/staff-portal'].includes(location);

  // Only show loading spinner for protected routes, not public auth pages
  if ((isLoadingPublicSettings || isLoadingAuth) && !isPublicRoute) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">C</span>
          </div>
          <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public portal routes — no auth required */}
      <Route path="/volunteer-portal" element={<VolunteerPortal />} />
      <Route path="/staff-portal" element={<StaffPortal />} />

      {/* Catering Portal — fully public, no auth */}
      <Route element={<PublicLayout />}>
        <Route path="/catering-portal" element={<CateringHome />} />
        <Route path="/catering-portal/menu" element={<CateringMenuPage />} />
        <Route path="/catering-portal/spaces" element={<OurSpaces />} />
        <Route path="/catering-portal/book" element={<BookingWizard />} />
        <Route path="/catering-portal/my-booking" element={<MyBooking />} />
        <Route path="/catering-portal/our-story" element={<OurStory />} />
      </Route>


      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/meeting-manager" element={<MeetingManager />} />
          <Route path="/widget-customization" element={<WidgetCustomization />} />
          <Route path="/admin/cards" element={<ManageCards />} />
          <Route path="/admin/widgets" element={<ManageWidgets />} />
          <Route path="/admin/users" element={<UsersAccess />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/settings" element={<OrgSettingsPage />} />
          <Route path="/user/settings" element={<UserSettings />} />
        </Route>

        {/* Volunteer Manager - standalone layout */}
        <Route element={<VolunteerMgrLayout />}>
          <Route path="/volunteermgr" element={<VolunteerMgrDashboard />} />
          <Route path="/volunteermgr/volunteers" element={<VolunteerMgrVolunteers />} />
          <Route path="/volunteermgr/events" element={<VolunteerMgrEvents />} />
          <Route path="/volunteermgr/positions" element={<VolunteerMgrPositions />} />
          <Route path="/volunteermgr/timelogs" element={<VolunteerMgrTimeLogs />} />
          <Route path="/volunteermgr/training" element={<VolunteerMgrTraining />} />
          <Route path="/volunteermgr/recognition" element={<VolunteerMgrRecognition />} />
          <Route path="/volunteermgr/documents" element={<VolunteerMgrDocuments />} />
          <Route path="/volunteermgr/approvals" element={<VolunteerMgrApprovals />} />
          <Route path="/volunteermgr/volunteers/:id" element={<VolunteerMgrProfile />} />
          <Route path="/volunteermgr/events/:id" element={<VolunteerMgrEventDetail />} />
          <Route path="/volunteermgr/import" element={<VolunteerMgrImport />} />
          <Route path="/volunteermgr/email" element={<VolunteerMgrEmail />} />
          <Route path="/volunteermgr/birthdays" element={<VolunteerMgrBirthdays />} />
          <Route path="/volunteermgr/milestones" element={<VolunteerMgrMilestones />} />
          <Route path="/volunteermgr/schedule" element={<VolunteerMgrSchedule />} />
          <Route path="/volunteermgr/staff-requests" element={<VolunteerMgrStaffRequests />} />
        </Route>

        {/* NexusHR - standalone layout */}
        <Route element={<NexusLayout />}>
          <Route path="/nexushr" element={<NexusDashboard />} />
          <Route path="/nexushr/employees" element={<NexusEmployees />} />
          <Route path="/nexushr/reviews" element={<NexusPerformanceReviews />} />
          <Route path="/nexushr/incidents" element={<NexusIncidents />} />
          <Route path="/nexushr/training" element={<NexusTraining />} />
          <Route path="/nexushr/documents" element={<NexusDocuments />} />
          <Route path="/nexushr/contracts" element={<NexusContracts />} />
          <Route path="/nexushr/corrective-actions" element={<NexusCorrectiveActions />} />
          <Route path="/nexushr/legal" element={<NexusLegalCases />} />
          <Route path="/nexushr/career-plans" element={<NexusCareerPlans />} />
          <Route path="/nexushr/pay-grid" element={<NexusPayGrid />} />
          <Route path="/nexushr/service-awards" element={<NexusServiceAwards />} />
          <Route path="/nexushr/time-logs" element={<NexusTimeLogs />} />
          <Route path="/nexushr/recognition" element={<NexusRecognition />} />
          <Route path="/nexushr/onboarding" element={<NexusOnboarding />} />
          <Route path="/nexushr/email-employees" element={<NexusEmailEmployees />} />
          <Route path="/nexushr/employees/:id" element={<NexusEmployeeProfile />} />
        </Route>

        {/* Grant / Proposal Manager - standalone layout */}
        <Route element={<GrantsLayout />}>
          <Route path="/grants" element={<GrantsHome />} />
          <Route path="/grants/projects" element={<GrantsProjects />} />
          <Route path="/grants/projects/new" element={<GrantsNewProject />} />
          <Route path="/grants/projects/:id" element={<GrantsProjectDetail />} />
          <Route path="/grants/funding-db" element={<GrantsFundingDB />} />
          <Route path="/grants/proposals" element={<GrantsSubmissions />} />
          <Route path="/grants/reports" element={<GrantsReports />} />
          <Route path="/grants/files" element={<GrantsFiles />} />
        </Route>

        {/* Executive Director Portal */}
        <Route element={<EDLayout />}>
          <Route path="/ed" element={<EDDashboard />} />
          <Route path="/ed/tasks" element={<EDTasks />} />
          <Route path="/ed/projects" element={<EDProjects />} />
          <Route path="/ed/opsp" element={<EDOPSP />} />
          <Route path="/ed/kpis" element={<EDKPIs />} />
          <Route path="/ed/budgets" element={<EDBudgets />} />
          <Route path="/ed/org" element={<EDOrgChart />} />
          <Route path="/ed/notes" element={<EDNotes />} />
          <Route path="/ed/agendas" element={<EDAgendaMaker />} />
          <Route path="/ed/board-report" element={<EDBoardReport />} />
        </Route>

        {/* Reports Portal - standalone layout */}
        <Route element={<ReportingLayout />}>
          <Route path="/reporting" element={<ReportingHome />} />
          <Route path="/reporting/internal" element={<ReportingInternal />} />
          <Route path="/reporting/funder" element={<ReportingFunder />} />
          <Route path="/reporting/special" element={<ReportingSpecial />} />
          <Route path="/reporting/agr" element={<ReportingAGR />} />
          <Route path="/reporting/agr/:id/edit" element={<ReportingAGREditor />} />
          <Route path="/reporting/agr/:id/preview" element={<ReportingAGRPreview />} />
          <Route path="/reporting/agr/:id/print" element={<ReportingAGRPrint />} />
          <Route path="/reporting/agr/analysis/:id" element={<ReportingAGRAnalysis />} />
        </Route>

        {/* Food Services - standalone layout */}
        <Route element={<FoodLayout />}>
          <Route path="/food" element={<FoodDashboard />} />
          <Route path="/food/menu" element={<FoodMenu />} />
          <Route path="/food/orders" element={<FoodOrders />} />
          <Route path="/food/inventory" element={<FoodInventory />} />
          <Route path="/food/recipes" element={<FoodRecipes />} />
          <Route path="/food/catering" element={<FoodCatering />} />
          <Route path="/food/customers" element={<FoodCustomers />} />
          {/* Area-specific routes */}
          <Route path="/food/cafe-candeur" element={<FoodAreaOverview />} />
          <Route path="/food/cafe-candeur/menu" element={<FoodAreaMenu />} />
          <Route path="/food/cafe-candeur/orders" element={<FoodAreaOrders />} />
          <Route path="/food/cafe-candeur/recipes" element={<FoodAreaRecipes />} />
          <Route path="/food/auntie-bevs" element={<FoodAreaOverview />} />
          <Route path="/food/auntie-bevs/menu" element={<FoodAreaMenu />} />
          <Route path="/food/auntie-bevs/orders" element={<FoodAreaOrders />} />
          <Route path="/food/auntie-bevs/recipes" element={<FoodAreaRecipes />} />
          <Route path="/food/community-lunch" element={<CommunityLunch />} />
          <Route path="/food/community-lunch/orders" element={<FoodAreaOrders />} />
          <Route path="/food/sales" element={<FoodSales />} />
          <Route path="/food/schedule" element={<FoodSchedule />} />
        </Route>

        {/* Candora Board - standalone layout */}
        <Route element={<BoardLayout />}>
          <Route path="/board" element={<BoardDashboard />} />
          <Route path="/board/meetings" element={<BoardMeetings />} />
          <Route path="/board/meetings/:id/agenda" element={<BoardAgendaBuilder />} />
          <Route path="/board/meetings/:id/minutes" element={<BoardMinutesTaker />} />
          <Route path="/board/documents" element={<BoardDocuments />} />
          <Route path="/board/members" element={<BoardMembers />} />
          <Route path="/board/onboarding" element={<BoardOnboarding />} />
          <Route path="/board/strategic-plan" element={<BoardStrategicPlan />} />
          <Route path="/board/assistant" element={<BoardAssistant />} />
        </Route>

        {/* Outlook Portal - standalone layout */}
        <Route element={<OutlookLayout />}>
          <Route path="/outlook" element={<OutlookDashboard />} />
        </Route>

        {/* Events/Projects/Programs Manager - standalone layout */}
        <Route element={<EventsMgrLayout />}>
          <Route path="/eventsmgr" element={<EventsMgrDashboard />} />
          <Route path="/eventsmgr/events" element={<EventsMgrEvents />} />
          <Route path="/eventsmgr/programs" element={<EventsMgrPrograms />} />
          <Route path="/eventsmgr/projects" element={<EventsMgrProjects />} />
          <Route path="/eventsmgr/contacts" element={<EventsMgrContacts />} />
          <Route path="/eventsmgr/resources" element={<EventsMgrResources />} />
        </Route>

        {/* Marketing & Fundraising Manager - standalone layout */}
        <Route element={<MarketingLayout />}>
          <Route path="/marketing" element={<MarketingHome />} />
          <Route path="/marketing/assets" element={<MarketingAssets />} />
          <Route path="/marketing/email" element={<MarketingEmail />} />
          <Route path="/marketing/social" element={<MarketingSocial />} />
          <Route path="/marketing/campaigns" element={<MarketingCampaigns />} />
          <Route path="/marketing/calendar" element={<MarketingCalendar />} />
          <Route path="/marketing/seo" element={<MarketingSEO />} />
          <Route path="/marketing/website" element={<MarketingWebsite />} />
          <Route path="/marketing/resources" element={<MarketingResources />} />
          <Route path="/marketing/requests" element={<MarketingRequests />} />
          <Route path="/marketing/donors" element={<MarketingDonors />} />
          <Route path="/marketing/media" element={<MarketingMedia />} />
          <Route path="/marketing/content" element={<MarketingContent />} />
          <Route path="/marketing/donation-pages" element={<MarketingDonationPages />} />
          <Route path="/marketing/annual-report" element={<MarketingAnnualReport />} />
        </Route>

        {/* ELL (English Language Learning) Portal - standalone layout */}
        <Route element={<ELLLayout />}>
          <Route path="/ell" element={<ELLDashboard />} />
          <Route path="/ell/learners" element={<ELLLearners />} />
          <Route path="/ell/classes" element={<ELLClasses />} />
          <Route path="/ell/schedule" element={<ELLSchedule />} />
          <Route path="/ell/instructors" element={<ELLInstructors />} />
          <Route path="/ell/assessments" element={<ELLAssessments />} />
        </Route>

        {/* Candora Archives - standalone layout */}
        <Route element={<ArchivesLayout />}>
          <Route path="/archives" element={<ArchivesHome />} />
          <Route path="/archives/timeline" element={<ArchivesTimeline />} />
          <Route path="/archives/timeline/chronicle" element={<ArchivesTimelineDocument />} />
          <Route path="/archives/timeline/:id" element={<ArchivesTimelineDetail />} />
          <Route path="/archives/bios" element={<ArchivesBios />} />
          <Route path="/archives/stories" element={<ArchivesStories />} />
          <Route path="/archives/documents" element={<ArchivesDocuments />} />
        </Route>

        {/* FRN Programs Portal - standalone layout */}
        <Route element={<FRNLayout />}>
          <Route path="/frn" element={<FRNDashboard />} />
          <Route path="/frn/participants" element={<FRNParticipants />} />
          <Route path="/frn/intake" element={<FRNIntake />} />
          <Route path="/frn/assessments" element={<FRNAssessments />} />
        </Route>

        {/* PHAC Programs Portal - standalone layout */}
        <Route element={<PHACLayout />}>
          <Route path="/phac" element={<PHACDashboard />} />
          <Route path="/phac/programs" element={<PHACPrograms />} />
          <Route path="/phac/sessions" element={<PHACSessions />} />
          <Route path="/phac/participants" element={<PHACParticipants />} />
        </Route>

        {/* Candora File Manager - standalone layout */}
        <Route element={<FileManagerLayout />}>
          <Route path="/filemanager" element={<FileManagerHome />} />
          <Route path="/filemanager/files" element={<FileBrowser />} />
          <Route path="/filemanager/upload" element={<FileUploadPage />} />
          <Route path="/filemanager/view" element={<FileViewer />} />
          <Route path="/filemanager/editor" element={<FileEditor />} />
          <Route path="/filemanager/bulk" element={<BulkUpload />} />
          <Route path="/filemanager/notes" element={<Notes />} />
          <Route path="/filemanager/workspace" element={<Workspace />} />
          <Route path="/filemanager/collections" element={<Collections />} />
          <Route path="/filemanager/collections/:id" element={<CollectionDetail />} />
          <Route path="/filemanager/search" element={<SearchPage />} />
        </Route>

        {/* Dev Tasks - standalone page */}
        <Route path="/dev-tasks" element={<DevTasks />} />
        <Route path="/how-to-admin" element={<HowToAdmin />} />

        {/* Pathways CM - standalone layout */}
        <Route element={<PathwaysLayout />}>
          <Route path="/pathways" element={<PathwaysHome />} />
          <Route path="/pathways/intake" element={<PathwaysIntake />} />
          <Route path="/pathways/dashboard" element={<PathwaysWorkerDashboard />} />
          <Route path="/pathways/master" element={<PathwaysMasterList />} />
          <Route path="/pathways/client/:id" element={<PathwaysClientProfile />} />
          <Route path="/pathways/reports" element={<PathwaysReports />} />
          <Route path="/pathways/supervisor" element={<PathwaysSupervisor />} />
          <Route path="/pathways/resources" element={<PathwaysResources />} />
          <Route path="/pathways/compass" element={<PathwaysCompass />} />
          <Route path="/pathways/billing" element={<PathwaysBilling />} />
          <Route path="/pathways/employers" element={<PathwaysEmployers />} />
          <Route path="/pathways/training" element={<PathwaysInternalTraining />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <TabProvider>
            <AuthenticatedApp />
          </TabProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App