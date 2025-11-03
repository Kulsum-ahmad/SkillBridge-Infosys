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
import ResetPassword from "./components/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Protected dashboard routes */}
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile-editing" element={<ProfileEditingPage />} />
          <Route path="opportunity-management" element={<OpportunityManagementPage />} />
          <Route path="browse-opportunities" element={<BrowseOpportunity />} />
          <Route path="opportunity/:id" element={<OpportunityDetails />} />
          <Route path="opportunity/:id/apply" element={<OpportunityApply />} />
          <Route path="opportunity/:id/applications" element={<OpportunityApplications />} />
          <Route path="ngo-applications" element={<OpportunityApplications />} />
        </Route>
        
        {/* Reset Password route - must be before catch-all */}
        <Route path="reset-password/:token" element={<ResetPassword />} />
        
        {/* Public landing page routes - handles /, /volunteer, /organization */}
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}