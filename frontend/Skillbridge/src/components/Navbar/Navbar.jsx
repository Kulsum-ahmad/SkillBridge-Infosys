import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import styles from './navbar.module.css';
import api from '../api';
import NotificationButton from '../Notification/NotificationButton'; 

const Navbar = () => {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("sb_user")) || {};
  });
  const [profileImage, setProfileImage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  let pageTitle = "Dashboard";
  if (location.pathname.includes('profile')) {
    pageTitle = "Edit Profile";
  } else if (location.pathname.includes('opportunity-management')) {
    pageTitle = "Opportunity Management";
  } else if (location.pathname.includes('opportunities')) {
    pageTitle = "Browse Opportunities";
  }

  // Role mapping
  const roleDisplay = {
    ngo: { label: 'NGO', className: styles.statusNGO },
    volunteer: { label: 'Volunteer', className: styles.statusVolunteer },
  };

  const userRole = roleDisplay[user.userType?.toLowerCase()] || roleDisplay.volunteer;

  // Fetch profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const res = await api.get("/profile/me");
        if (res.data.image) {
          const imageUrl = res.data.image.startsWith("http") 
            ? res.data.image 
            : `http://localhost:5000${res.data.image}`;
          setProfileImage(imageUrl);
        }
      } catch (err) {
        console.error("Failed to fetch profile image:", err);
      }
    };

    if (user.username) {
      fetchProfileImage();
    }
  }, [user.username]);

  // Listen for profile updates (when image is uploaded)
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail?.image) {
        const imageUrl = event.detail.image.startsWith("http") 
          ? event.detail.image 
          : `http://localhost:5000${event.detail.image}`;
        setProfileImage(imageUrl);
      }
    };

    window.addEventListener("profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("profile_updated", handleProfileUpdate);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_user");
    setProfileImage("");
    window.dispatchEvent(new Event("sb_auth_change"));
    toast.success("You have been logged out.");
    setIsDropdownOpen(false);
    navigate("/", { replace: true });
  };

  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Update user if localStorage changes
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(JSON.parse(localStorage.getItem("sb_user")) || {});
    };
    window.addEventListener("sb_auth_change", handleAuthChange);
    return () => window.removeEventListener("sb_auth_change", handleAuthChange);
  }, []);

  return (
    <header className={styles.navbar}>
      {/* LEFT SECTION */}
      <div className={styles.leftSection}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>{pageTitle}</h1>
        </div>
        <div className={styles.modeStatusContainer}>
          <span className={styles.modeLabel}>Mode:</span>
          <div 
            className={`${styles.statusPill} ${userRole.className}`}
            role="status"
            aria-label={`Current mode: ${userRole.label}`}
          >
            {userRole.label}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className={styles.rightSection}>
        {/* Notification Button with dropdown */}
        <NotificationButton />

        {/* Profile Section */}
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button 
            onClick={toggleDropdown} 
            className={styles.profileButton}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className={styles.profileAvatar}>
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className={styles.avatarImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <User 
                size={20} 
                style={{ display: profileImage ? 'none' : 'block' }}
              />
            </div>
            <ChevronDown size={20} className={isDropdownOpen ? styles.chevronOpen : ''} />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown} role="menu" aria-orientation="vertical">
              <Link to="/profile-editing" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)} role="menuitem">
                <Settings size={16} /> <span>Profile Editing</span>
              </Link>
              <button 
                onClick={handleLogout} 
                className={`${styles.dropdownItem} ${styles.logoutButton}`} 
                role="menuitem" 
                type="button"
              >
                <LogOut size={16} /> <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;