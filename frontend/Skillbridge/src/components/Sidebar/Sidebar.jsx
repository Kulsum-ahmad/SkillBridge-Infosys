// Sidebar.jsx (FINAL – NGO View Applications Added)

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import skillBridgeLogo from "figma:asset/cd12bfb4f77c3986715b08d851b34fa45144098e.png";
import {
    FaHome,
    FaUserEdit,
    FaCog,
    FaSignOutAlt,
    FaRegHandshake,
    FaClipboardList
} from 'react-icons/fa';
import styles from './sidebar.module.css';

// ✅ Navigation items for both Volunteer and NGO dashboards
const navConfig = {
    Volunteer: [
        { name: 'Dashboard', path: '/dashboard', icon: <FaHome /> },
        { name: 'Profile Editing', path: '/profile-editing', icon: <FaUserEdit /> },
        { name: 'Browse Opportunities', path: '/browse-opportunities', icon: <FaRegHandshake /> },
    ],
    NGO: [
        { name: 'Dashboard', path: '/dashboard', icon: <FaHome /> },
        { name: 'Profile Editing', path: '/profile-editing', icon: <FaUserEdit /> },
        { name: 'Opportunity Management', path: '/opportunity-management', icon: <FaRegHandshake /> },
    ],
};

const Sidebar = ({ demoMode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentNavItems = navConfig[demoMode];
    const portalName = `${demoMode} Portal`;

    // ✅ Logout logic
    const handleLogout = () => {
        localStorage.removeItem("sb_token");
        localStorage.removeItem("sb_user");
        window.dispatchEvent(new Event("sb_auth_change"));
        navigate("/", { replace: true });
    };

    // ✅ Active link logic
    const getLinkClassName = (itemPath) => {
        const currentPath = location.pathname.endsWith('/')
            ? location.pathname.slice(0, -1)
            : location.pathname;

        if (itemPath === '/dashboard') {
            return currentPath === itemPath ? styles.active : '';
        }

        if (currentPath.startsWith(itemPath)) {
            return styles.active;
        }

        return '';
    };

    return (
        <aside className={styles.sidebar}>
            {/* ✅ Brand and logo */}
            <div className={styles.brand}>
                <div className={styles.logoContainer}>
                    <img
                        src={skillBridgeLogo}
                        alt="SkillBridge Logo"
                        className={styles.logo}
                    />
                </div>
                <span className={styles.logoText}>SkillBridge</span>
            </div>

            {/* ✅ Portal title */}
            <h2 className={styles.portalTitle}>{portalName}</h2>

            {/* ✅ Navigation items */}
            <nav className={styles.nav}>
                <ul>
                    {currentNavItems.map((item) => (
                        <li key={item.name}>
                            <Link
                                to={item.path}
                                className={`${styles.navLink} ${getLinkClassName(item.path)}`}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.text}>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* ✅ Logout */}
            <div className={styles.logoutSection}>
                <div onClick={handleLogout} className={styles.logoutLink}>
                    <span className={styles.logoutIcon}><FaSignOutAlt /></span>
                    <span className={styles.logoutText}>Logout</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
