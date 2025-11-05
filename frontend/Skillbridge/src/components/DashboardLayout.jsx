import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "./Sidebar/Sidebar.jsx";
import Navbar from "./Navbar/Navbar.jsx";
import styles from "./dashboardlayout.module.css";

const DashboardLayout = ({ children }) => {
  // ✅ Detect whether user is NGO or Volunteer
  const getInitialMode = () => {
    try {
      // ✅ FIX: Added || "{}" to prevent parsing null
      const user = JSON.parse(localStorage.getItem("sb_user") || "{}");
      return user?.userType === "ngo" ? "NGO" : "Volunteer";
    } catch {
      return "Volunteer";
    }
  };

  const [currentRole, setCurrentRole] = useState(getInitialMode);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ✅ Fetch user data from backend API
  const fetchUserData = async () => {
    try {
      // ✅ FIX: Added || "{}" to prevent parsing null
      const storedUser = JSON.parse(localStorage.getItem("sb_user") || "{}");
      const authToken = storedUser?.token;

      if (!authToken) {
        console.error("⚠️ Authentication token missing or invalid.");
        setIsLoadingUser(false);
        return;
      }

      // ✅ Use correct backend API endpoint
      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Failed to fetch user data:", errText);
        toast.error("Failed to load user data. Please try refreshing the page.");
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      // ✅ Set user details properly for Navbar + Sidebar
      setCurrentUser({
        name: data.fullName || data.name || "Unknown User",
        username: data.username || "unknown",
        email: data.email || "N/A",
      });
    } catch (error) {
      console.error("❌ Error fetching user data:", error.message);
      if (error.message !== "Failed to fetch user data") {
        toast.error("An error occurred while loading user data");
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  // ✅ Run once on mount
  useEffect(() => {
    fetchUserData();

    // ✅ Listen for "profile_updated" events
    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("profile_updated", handleProfileUpdate);
  }, []);

  if (isLoadingUser) {
    return <div className={styles.loading}>Loading user data...</div>;
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar demoMode={currentRole} user={currentUser} />

      <div className={styles.mainContentWrapper}>
        <Navbar demoMode={currentRole} user={currentUser} />

        <main className={styles.pageContent}>
          <Outlet /> {/* Replace children with Outlet */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;