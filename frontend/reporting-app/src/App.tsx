import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch } from './store/store';
import { fetchUsers } from './store/slices/authSlice';
import { fetchReports, fetchProjects, fetchActivities } from './store/slices/reportsSlice';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, type NavigationTab } from './components/common/Sidebar';
import { AiAssistantModal } from './components/ai/AiAssistantModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { PersonalReportPage } from './pages/PersonalReportPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { ManagerReviewPage } from './pages/ManagerReviewPage';
import { TeamMemberProfilePage } from './pages/TeamMemberProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAuth();

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    return isManager ? 'team-dashboard' : 'personal-report';
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Synchronize backend data from FastAPI endpoints
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchReports());
    dispatch(fetchProjects());
    dispatch(fetchActivities());
  }, [dispatch]);

  // Derived effective tab prevents non-managers from seeing manager tabs
  const effectiveTab: NavigationTab =
    !isManager && (currentTab === 'team-dashboard' || currentTab === 'manager-review' || currentTab === 'users')
      ? 'personal-report'
      : currentTab;

  if (!currentUser) {
    return <LoginPage />;
  }

  const navigateToTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReportDetail = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentTab('report-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMemberProfile = (memberId: string) => {
    setSelectedMemberId(memberId);
    setCurrentTab('member-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (effectiveTab) {
      case 'personal-report':
        return (
          <PersonalReportPage
            onViewHistory={() => navigateToTab('report-history')}
            onViewDetails={(id) => handleOpenReportDetail(id)}
          />
        );

      case 'report-history':
        return (
          <ReportHistoryPage
            onOpenReport={(id) => handleOpenReportDetail(id)}
            onCreateNew={() => navigateToTab('personal-report')}
          />
        );

      case 'report-detail':
        return (
          <ReportDetailPage
            reportId={selectedReportId || ''}
            onBack={() => navigateToTab(isManager ? 'team-dashboard' : 'report-history')}
            onEditReport={() => navigateToTab('personal-report')}
          />
        );

      case 'team-dashboard':
        return (
          <TeamDashboardPage
            onOpenReportDetail={handleOpenReportDetail}
            onOpenMemberProfile={handleOpenMemberProfile}
          />
        );

      case 'manager-review':
        return <ManagerReviewPage onOpenReportDetail={handleOpenReportDetail} />;

      case 'member-profile':
        return (
          <TeamMemberProfilePage
            memberId={selectedMemberId || ''}
            onBack={() => navigateToTab('team-dashboard')}
            onOpenReport={handleOpenReportDetail}
          />
        );

      case 'projects':
        return <ProjectsPage />;

      case 'users':
        return <UserManagementPage />;

      default:
        return (
          <PersonalReportPage
            onViewHistory={() => navigateToTab('report-history')}
            onViewDetails={(id) => handleOpenReportDetail(id)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Top Navigation */}
      <Navbar onOpenAiAssistant={() => setIsAiModalOpen(true)} />

      {/* Main Layout Body: Sidebar + Dynamic Page Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar currentTab={effectiveTab} onNavigate={navigateToTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Floating AI Assistant Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsAiModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
        title="Open AI Assistant for team summaries and Q&A"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Ask AI Assistant</span>
      </button>

      {/* AI Assistant Modal */}
      <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ReportProvider>
          <AppContent />
        </ReportProvider>
      </AuthProvider>
    </Provider>
  );
};

export default App;
