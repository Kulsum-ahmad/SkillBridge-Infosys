import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import AppContent from "./AppContent";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard/Dashboard";
import ProfileEditingPage from "./components/profile/ProfileEditingPage";
import OpportunityManagementPage from "./components/opportunities/OpportunityManagementPage";
import BrowseOpportunity from "./components/opportunities/BrowseOpportunity";
import OpportunityDetails from "./components/opportunities/OpportunityDetails";
import OpportunityApply from "./components/opportunities/OpportunityApply";
import OpportunityApplications from "./components/opportunities/OpportunityApplications";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public landing page routes */}
        <Route path="/" element={<AppContent />} />
        
        {/* Protected dashboard routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile-editing" element={<ProfileEditingPage />} />
          <Route path="opportunity-management" element={<OpportunityManagementPage />} />
          <Route path="browse-opportunities" element={<BrowseOpportunity />} />
          <Route path="opportunity/:id" element={<OpportunityDetails />} />
          <Route path="opportunity/:id/apply" element={<OpportunityApply />} />
          <Route path="opportunity/:id/applications" element={<OpportunityApplications />} />
          <Route path="ngo-applications" element={<OpportunityApplications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}