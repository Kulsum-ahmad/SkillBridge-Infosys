import { useState, useEffect } from "react";
import { useLocation, Routes, Route, useNavigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { Toaster } from "./components/ui/sonner";
import VolunteerRegistrationForm from "./components/VolunteerRegistrationForm";
import OrganizationRegistrationForm from "./components/OrganizationRegistrationForm";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Dashboard from "./components/Dashboard/Dashboard.jsx";

export default function AppContent() {
  const navigate = useNavigate();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "login",
  });

   const handleAuthSuccess = (userType) => {
      closeModal(); 
      navigate('/dashboard'); 
  };

  const openModal = (type, userType) =>
    setModalState({ isOpen: true, type, userType });

  const closeModal = () =>
    setModalState((prev) => ({ ...prev, isOpen: false }));

  const { pathname } = useLocation();

  const isProtectedPath = 
    pathname.startsWith("/dashboard");

  const isRegistrationPath = 
    pathname === "/volunteer" || pathname === "/organization";

    const showPublicNav = !isProtectedPath && !isRegistrationPath;

  return (
    <div className="font-sans leading-relaxed overflow-x-hidden">
      <Toaster position="top-right" richColors />
    
     {showPublicNav && <Navigation onOpenModal={openModal} />}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero onOpenModal={openModal} />
              <About />
              <HowItWorks />
              <Features />
              <Contact />
              <Footer />
            </>
          }
        />

    
        <Route
          path="/organization"
          element={
          <OrganizationRegistrationForm 
            onLoginClick={() => openModal('login', 'organization')}
            onAuthSuccess={handleAuthSuccess}
          />}
        />

        <Route path="/volunteer" 
        element={
        <VolunteerRegistrationForm 
          onLoginClick={() => openModal('login', 'volunteer')}
          onAuthSuccess={handleAuthSuccess}
        />
        } 
        />
      </Routes>

      <AuthModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        userType={modalState.userType}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}