import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, Building2, Mail, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MessagePopup from '../MessagePopup.jsx';

// --- Centralized API Logic ---
const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
    (config) => {
        // Check multiple token locations
        let token = localStorage.getItem('sb_token');
        if (!token) {
            const userStr = localStorage.getItem('sb_user');
            if (userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    token = userData.token;
                } catch (e) {
                    console.error("Error parsing sb_user:", e);
                }
            }
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- STYLES ---
const styles = {
    dashboard: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", padding: '20px' },
    welcomeHeader: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' },
    welcomeText: { fontSize: '1.1rem', color: '#6b7280', marginBottom: '32px' },
    profileCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' },
    profileHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    profileTitle: { fontSize: '1.4rem', fontWeight: '600', color: '#374151' },
    profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
    profileItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
    profileLabel: { fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' },
    profileValue: { fontSize: '0.95rem', color: '#374151', fontWeight: '400', marginTop: '2px' },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' },
    bottomSection: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' },
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' },
    cardTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#374151', marginBottom: '16px' },
    metricCard: { padding: '24px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    metricCardTitle: { fontSize: '1rem', fontWeight: '600', marginBottom: '8px', opacity: 0.9 },
    metricCardValue: { fontSize: '2.5rem', fontWeight: 'bold' },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { padding: '12px 0', borderBottom: '1px solid #f0f0f0', color: '#4b5563', fontSize: '0.9rem' },
    loadingWrapper: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', color: '#6b7280' },
    emptyState: { padding: '20px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' },
    errorText: { color: '#ef4444', padding: '20px', textAlign: 'center' },
    iconWrapper: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
};

const colorMap = {
    blue: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    purple: 'linear-gradient(135deg, #c084fc, #a855f7)',
    pink: 'linear-gradient(135deg, #f9a8d4, #f472b6)',
    yellow: 'linear-gradient(135deg, #fcd34d, #fbbf24)',
};

// --- CHILD COMPONENTS ---

const MetricCard = ({ title, value, color }) => (
    <div style={{ ...styles.metricCard, background: colorMap[color] }}>
        <div style={styles.metricCardTitle}>{title}</div>
        <div style={styles.metricCardValue}>{value !== undefined ? value : 0}</div>
    </div>
);

const NGOProfileCard = ({ ngoData }) => {
    if (!ngoData) return null;

    return (
        <div style={styles.profileCard}>
            <div style={styles.profileHeader}>
                <div style={styles.iconWrapper}>
                    <Building2 size={24} />
                </div>
                <h3 style={styles.profileTitle}>Organization Profile</h3>
            </div>
            <div style={styles.profileGrid}>
                <div style={styles.profileItem}>
                    <Building2 size={18} color="#6b7280" />
                    <div>
                        <div style={styles.profileLabel}>Organization Name</div>
                        <div style={styles.profileValue}>{ngoData.organizationName || ngoData.name || 'Not provided'}</div>
                    </div>
                </div>
                <div style={styles.profileItem}>
                    <Mail size={18} color="#6b7280" />
                    <div>
                        <div style={styles.profileLabel}>Email</div>
                        <div style={styles.profileValue}>{ngoData.email || 'Not provided'}</div>
                    </div>
                </div>
                <div style={styles.profileItem}>
                    <Globe size={18} color="#6b7280" />
                    <div>
                        <div style={styles.profileLabel}>Website</div>
                        <div style={styles.profileValue}>
                            {ngoData.website ? (
                                <a href={ngoData.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                    {ngoData.website}
                                </a>
                            ) : 'Not provided'}
                        </div>
                    </div>
                </div>
                <div style={styles.profileItem}>
                    <MapPin size={18} color="#6b7280" />
                    <div>
                        <div style={styles.profileLabel}>Location</div>
                        <div style={styles.profileValue}>{ngoData.location || ngoData.address || 'Not provided'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecentActivity = ({ activities }) => (
    <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Activity</h3>
        {activities && activities.length > 0 ? (
            <ul style={styles.list}>
                {activities.map((activity, index) => (
                    <li 
                        key={index} 
                        style={{ 
                            ...styles.listItem, 
                            borderBottom: index === activities.length - 1 ? 'none' : '1px solid #f0f0f0' 
                        }}
                    >
                        {activity}
                    </li>
                ))}
            </ul>
        ) : (
            <div style={styles.emptyState}>No recent activity</div>
        )}
    </div>
);

const UpcomingEvents = ({ events, isNGO = false }) => (
    <div style={styles.card}>
        <h3 style={styles.cardTitle}>{isNGO ? 'Rejected Applications' : 'Upcoming Events'}</h3>
        {events && events.length > 0 ? (
            <ul style={styles.list}>
                {events.map((event, index) => (
                    <li 
                        key={index} 
                        style={{ 
                            ...styles.listItem, 
                            borderBottom: index === events.length - 1 ? 'none' : '1px solid #f0f0f0' 
                        }}
                    >
                        {event}
                    </li>
                ))}
            </ul>
        ) : (
            <div style={styles.emptyState}>
                {isNGO ? 'No applications rejected yet' : 'No upcoming events'}
            </div>
        )}
    </div>
);

// --- MAIN DASHBOARD COMPONENT ---

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        metrics: [],
        recentActivity: [],
        upcomingEvents: [],
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                console.log("🔄 Fetching dashboard data...");
                
                // Fetch user profile - try multiple endpoints
                let userData = null;
                let userResponse = null;

                try {
                    userResponse = await api.get('/users/profile');
                    console.log("👤 User Response (/users/profile):", userResponse.data);
                    userData = userResponse.data?.data || userResponse.data?.user || userResponse.data;
                } catch (err) {
                    console.warn("⚠️ /users/profile failed, trying /auth/me:", err.message);
                    try {
                        userResponse = await api.get('/auth/me');
                        console.log("👤 User Response (/auth/me):", userResponse.data);
                        userData = userResponse.data?.data || userResponse.data?.user || userResponse.data;
                    } catch (err2) {
                        console.warn("⚠️ /auth/me failed, trying /profile/me:", err2.message);
                        try {
                            userResponse = await api.get('/profile/me');
                            console.log("👤 User Response (/profile/me):", userResponse.data);
                            userData = userResponse.data?.data || userResponse.data?.user || userResponse.data;
                        } catch (err3) {
                            throw new Error("Unable to fetch user profile from any endpoint");
                        }
                    }
                }
                
                if (userData) {
                    setUser(userData);
                    const userType = (userData.userType || userData.role || '').toLowerCase();
                    console.log("📋 User Type:", userType);

                    // Fetch dashboard statistics based on user type
                    if (userType === 'volunteer') {
                        await fetchVolunteerDashboard(userData._id || userData.id);
                    } else if (userType === 'ngo' || userType === 'organization') {
                        await fetchNGODashboard(userData._id || userData.id);
                    } else {
                        console.warn("⚠️ Unknown user type:", userType);
                        throw new Error(`Unknown user type: ${userType}`);
                    }
                } else {
                    throw new Error("User data not found in response.");
                }
            } catch (error) {
                console.error("❌ Dashboard fetch error:", error);
                console.error("Error details:", error.response?.data);
                const errorMsg = error.response?.data?.message || error.message || "Could not load dashboard data.";
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchVolunteerDashboard = async (userId) => {
            try {
                console.log("🎯 Fetching volunteer dashboard for user:", userId);
                
                let applications = [];
                let profile = {};
                let opportunities = [];

                // Fetch applications
                try {
            let applicationsRes = await api.get('/applications/my'); // Changed from my-applications to my
            console.log("📝 Applications Response:", applicationsRes.data);
            
            if (Array.isArray(applicationsRes.data)) {
                applications = applicationsRes.data;
            } else if (applicationsRes.data?.data) {
                applications = Array.isArray(applicationsRes.data.data) 
                    ? applicationsRes.data.data 
                    : [applicationsRes.data.data];
            } else if (applicationsRes.data?.applications) {
                applications = applicationsRes.data.applications;
            }
            
            console.log("✅ Parsed applications:", applications);
        } catch (err) {
            console.error("⚠️ Error fetching applications:", err);
            // Fallback to user-specific endpoint
            try {
                const altRes = await api.get(`/applications/user/${userId}`);
                applications = altRes.data?.data || altRes.data?.applications || altRes.data || [];
                console.log("✅ Applications from alternative endpoint:", applications);
            } catch (altErr) {
                console.error("⚠️ Alternative endpoint also failed:", altErr);
            }
        }

                // Fetch profile
                try {
                    const profileRes = await api.get('/profile/me');
                    console.log("👤 Profile Response:", profileRes.data);
                    profile = profileRes.data?.data || profileRes.data || {};
                } catch (error) {
                    console.error("⚠️ Error fetching profile:", err);
                }

                // Fetch opportunities
                try {
                    const oppRes = await api.get('/opportunities');
                    console.log("📋 Opportunities Response:", oppRes.data);
                    opportunities = Array.isArray(oppRes.data) 
                        ? oppRes.data 
                        : (oppRes.data?.data || oppRes.data?.opportunities || []);
                } catch (err) {
                    console.error("⚠️ Error fetching opportunities:", err);
                }

                // Calculate metrics
                const opportunitiesApplied = applications.length;
                
                const acceptedApplications = applications.filter(app => {
                    const status = (app.status || '').toLowerCase();
                    return status === 'accepted' || status === 'approved';
                }).length;
                
                const skillsGained = Array.isArray(profile.skills) ? profile.skills.length : 0;
                
                const organizationIds = new Set();
                applications.forEach(app => {
                    const orgId = app.opportunity?.organization?._id 
                        || app.opportunity?.organization 
                        || app.opportunity?.organizationId 
                        || app.organizationId
                        || app.ngoId;
                    if (orgId) organizationIds.add(String(orgId));
                });
                const organizationsHelped = organizationIds.size;

                const hoursContributed = acceptedApplications * 10;

                const metrics = [
                    { title: 'Opportunities Applied', value: opportunitiesApplied, color: 'blue' },
                    { title: 'Hours Contributed', value: hoursContributed, color: 'purple' },
                    { title: 'Skills Gained', value: skillsGained, color: 'pink' },
                    { title: 'Organizations Helped', value: organizationsHelped, color: 'yellow' },
                ];

                console.log("📊 Volunteer Metrics:", metrics);

                // Recent activity
                const recentActivity = applications
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                    .slice(0, 5)
                    .map(app => {
                        const title = app.opportunity?.title 
                            || app.opportunityTitle 
                            || 'Unknown Opportunity';
                        const status = (app.status || 'pending').toLowerCase();
                        const date = app.createdAt 
                            ? new Date(app.createdAt).toLocaleDateString() 
                            : '';
                        
                        if (status === 'accepted' || status === 'approved') {
                            return `✅ Your application for "${title}" was accepted! ${date}`;
                        } else if (status === 'rejected' || status === 'declined') {
                            return `❌ Your application for "${title}" was not accepted. ${date}`;
                        } else {
                            return `📝 You applied for "${title}" - Status: ${status} ${date}`;
                        }
                    });

                // Upcoming events
                const acceptedOpportunityIds = applications
                    .filter(app => {
                        const status = (app.status || '').toLowerCase();
                        return status === 'accepted' || status === 'approved';
                    })
                    .map(app => String(app.opportunity?._id || app.opportunity?.id || app.opportunityId || ''));

                const upcomingEvents = opportunities
                    .filter(opp => {
                        const oppId = String(opp._id || opp.id || '');
                        const isAccepted = acceptedOpportunityIds.includes(oppId);
                        if (!isAccepted) return false;
                        
                        if (opp.startDate) {
                            const startDate = new Date(opp.startDate);
                            const now = new Date();
                            return startDate > now;
                        }
                        return true;
                    })
                    .slice(0, 3)
                    .map(opp => {
                        const date = opp.startDate 
                            ? new Date(opp.startDate).toLocaleDateString()
                            : 'Date TBD';
                        return `${opp.title} - ${date}`;
                    });

                console.log("✅ Setting volunteer dashboard data");
                setDashboardData({
                    metrics,
                    recentActivity: recentActivity.length > 0 ? recentActivity : ['No applications yet. Start exploring opportunities!'],
                    upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : ['No upcoming events'],
                });

            } catch (error) {
                console.error("❌ Error in fetchVolunteerDashboard:", error);
                toast.error("Failed to load volunteer dashboard data");
                setDashboardData({
                    metrics: [
                        { title: 'Opportunities Applied', value: 0, color: 'blue' },
                        { title: 'Hours Contributed', value: 0, color: 'purple' },
                        { title: 'Skills Gained', value: 0, color: 'pink' },
                        { title: 'Organizations Helped', value: 0, color: 'yellow' },
                    ],
                    recentActivity: ['Unable to load activity'],
                    upcomingEvents: ['Unable to load events'],
                });
            }
        };

        const fetchNGODashboard = async (userId) => {
            try {
                console.log("🏢 Fetching NGO dashboard for user:", userId);
                
                let opportunities = [];
                let allApplications = [];

                // Fetch opportunities - backend already filters by NGO when userType === "ngo"
                try {
                    const opportunitiesRes = await api.get('/opportunities');
                    console.log("📋 NGO Opportunities Response:", opportunitiesRes.data);
                    
                    if (Array.isArray(opportunitiesRes.data)) {
                        opportunities = opportunitiesRes.data;
                    } else if (opportunitiesRes.data?.data) {
                        opportunities = Array.isArray(opportunitiesRes.data.data) 
                            ? opportunitiesRes.data.data 
                            : (opportunitiesRes.data.data ? [opportunitiesRes.data.data] : []);
                    } else if (opportunitiesRes.data?.opportunities) {
                        opportunities = Array.isArray(opportunitiesRes.data.opportunities)
                            ? opportunitiesRes.data.opportunities
                            : [];
                    }
                    
                    console.log("✅ Parsed opportunities:", opportunities);
                } catch (err) {
                    console.error("⚠️ Error fetching opportunities:", err);
                    toast.error("Failed to load opportunities");
                }

                // Fetch NGO applications using the correct endpoint
                try {
                    const applicationsRes = await api.get('/applications/ngo/all');
                    console.log("📝 NGO Applications Response:", applicationsRes.data);
                    
                    if (applicationsRes.data?.success && Array.isArray(applicationsRes.data.data)) {
                        allApplications = applicationsRes.data.data;
                    } else if (Array.isArray(applicationsRes.data)) {
                        allApplications = applicationsRes.data;
                    } else if (applicationsRes.data?.data) {
                        allApplications = Array.isArray(applicationsRes.data.data) 
                            ? applicationsRes.data.data 
                            : (applicationsRes.data.data ? [applicationsRes.data.data] : []);
                    } else if (applicationsRes.data?.applications) {
                        allApplications = Array.isArray(applicationsRes.data.applications)
                            ? applicationsRes.data.applications
                            : [];
                    }
                    
                    console.log("✅ Parsed NGO applications:", allApplications);
                } catch (err) {
                    console.error("⚠️ Error fetching NGO applications:", err);
                    toast.error("Failed to load applications");
                }

                // Calculate metrics
                const activeOpportunities = opportunities.filter(opp => {
                    const status = (opp.status || '').toLowerCase();
                    // Consider opportunities as active if status is 'active', 'open', or if no status is set
                    return status === 'active' || opp.isActive === true || status === 'open' || (!opp.status && !opp.isActive === false);
                }).length;
                
                // Use the applications directly (already filtered by backend for this NGO via /applications/ngo/all)
                const ngoApplications = allApplications;

                console.log("🔗 Total NGO Applications:", ngoApplications.length);

                // Get unique volunteers from applications (backend populates as "user" not "volunteer")
                const volunteerIds = new Set();
                ngoApplications.forEach(app => {
                    const volId = app.user?._id 
                        || app.user?.id 
                        || app.volunteer?._id 
                        || app.volunteer?.id 
                        || app.userId
                        || app.volunteerId;
                    if (volId) volunteerIds.add(String(volId));
                });
                const totalVolunteers = volunteerIds.size;
                
                // New applications are pending or submitted
                const newApplications = ngoApplications.filter(app => {
                    const status = (app.status || '').toLowerCase();
                    return status === 'pending' || status === 'submitted' || status === 'new';
                }).length;
                
                // Rejected applications count
                const rejectedApplications = ngoApplications.filter(app => {
                    const status = (app.status || '').toLowerCase();
                    return status === 'rejected' || status === 'declined';
                }).length;

                const metrics = [
                    { title: 'Active Opportunities', value: activeOpportunities, color: 'blue' },
                    { title: 'Total Volunteers', value: totalVolunteers, color: 'purple' },
                    { title: 'New Applications', value: newApplications, color: 'pink' },
                    { title: 'Rejected Applications', value: rejectedApplications, color: 'yellow' },
                ];

                console.log("📊 NGO Metrics:", metrics);

                // Recent activity - sort by creation date (newest first)
                const recentActivity = ngoApplications
                    .sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0);
                        const dateB = new Date(b.createdAt || 0);
                        return dateB - dateA; // Newest first
                    })
                    .slice(0, 5)
                    .map(app => {
                        // Backend populates as "user" not "volunteer"
                        const volunteerName = app.user?.fullName 
                            || app.user?.name
                            || app.volunteer?.name 
                            || app.volunteer?.fullName 
                            || app.volunteerName 
                            || 'A volunteer';
                        const oppTitle = app.opportunity?.title 
                            || app.opportunityTitle 
                            || 'an opportunity';
                        const date = app.createdAt 
                            ? new Date(app.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })
                            : '';
                        const status = (app.status || 'pending').toLowerCase();
                        if (status === 'accepted' || status === 'approved') {
                            return `✅ ${volunteerName} was accepted for "${oppTitle}" - ${date}`;
                        } else if (status === 'rejected' || status === 'declined') {
                            return `❌ ${volunteerName}'s application for "${oppTitle}" was declined - ${date}`;
                        } else {
                            return `👤 ${volunteerName} applied for "${oppTitle}" - ${date}`;
                        }
                    });

                // Rejected applications list - sort by rejection date (newest first)
                const rejectedApplicationsList = ngoApplications
                    .filter(app => {
                        const status = (app.status || '').toLowerCase();
                        return status === 'rejected' || status === 'declined';
                    })
                    .sort((a, b) => {
                        // Sort by updatedAt if available (when status changed), otherwise createdAt
                        const dateA = new Date(a.updatedAt || a.createdAt || 0);
                        const dateB = new Date(b.updatedAt || b.createdAt || 0);
                        return dateB - dateA; // Newest first
                    })
                    .slice(0, 5)
                    .map(app => {
                        const volunteerName = app.user?.fullName 
                            || app.user?.name
                            || app.volunteer?.name 
                            || app.volunteer?.fullName 
                            || app.volunteerName 
                            || 'A volunteer';
                        const oppTitle = app.opportunity?.title 
                            || app.opportunityTitle 
                            || 'an opportunity';
                        const date = (app.updatedAt || app.createdAt)
                            ? new Date(app.updatedAt || app.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })
                            : '';
                        return `❌ ${volunteerName} rejected for "${oppTitle}" - ${date}`;
                    });

                console.log("✅ Setting NGO dashboard data");
                setDashboardData({
                    metrics,
                    recentActivity: recentActivity.length > 0 ? recentActivity : ['No applications received yet'],
                    upcomingEvents: rejectedApplicationsList.length > 0 ? rejectedApplicationsList : ['No applications rejected yet'],
                });

            } catch (error) {
                console.error("❌ Error in fetchNGODashboard:", error);
                toast.error("Failed to load NGO dashboard data");
                setDashboardData({
                    metrics: [
                        { title: 'Active Opportunities', value: 0, color: 'blue' },
                        { title: 'Total Volunteers', value: 0, color: 'purple' },
                        { title: 'New Applications', value: 0, color: 'pink' },
                        { title: 'Rejected Applications', value: 0, color: 'yellow' },
                    ],
                    recentActivity: ['Unable to load activity'],
                    upcomingEvents: ['Unable to load rejected applications'],
                });
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div style={styles.loadingWrapper}>
                <Loader size={40} className="animate-spin" />
                <p style={{marginTop: '16px'}}>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.dashboard}>
                <div style={styles.errorText}>
                    <p>❌ Error: {error}</p>
                    <p>Please check the browser console for more details.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <div style={styles.loadingWrapper}>Could not load user dashboard.</div>;
    }

    const userType = (user.userType || user.role || '').toLowerCase();
    const isNGO = userType === 'ngo' || userType === 'organization';
    const userRole = isNGO ? 'NGO' : 'Volunteer';
    const welcomeMessage = userRole === 'Volunteer'
        ? "Here's an overview of your volunteer activity."
        : "Here's an overview of your organization's impact.";

    return (
        <div style={styles.dashboard}>
            <h2 style={styles.welcomeHeader}>
                Welcome back, {user.fullName || user.name || user.organizationName || 'User'}!
            </h2>
            <p style={styles.welcomeText}>{welcomeMessage}</p>

            {isNGO && <NGOProfileCard ngoData={user} />}

            <div style={styles.metricsGrid}>
                {dashboardData.metrics && dashboardData.metrics.length > 0 ? (
                    dashboardData.metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
                    ))
                ) : (
                    <div style={styles.emptyState}>Loading metrics...</div>
                )}
            </div>

            <div style={styles.bottomSection}>
                <RecentActivity activities={dashboardData.recentActivity} />
                <UpcomingEvents events={dashboardData.upcomingEvents} isNGO={isNGO} />
            </div>
            <MessagePopup />
        </div>
    );
};

export default Dashboard;