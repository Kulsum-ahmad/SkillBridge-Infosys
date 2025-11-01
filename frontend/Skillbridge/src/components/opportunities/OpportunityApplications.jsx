import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User, FileText, Check, X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import api from "../api";
import { toast } from "sonner";
import styles from "./OpportunityApplications.module.css";

export default function OpportunityApplications() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✅ Fetch opportunity + its applications
  const fetchApplications = async () => {
    try {
      const [oppRes, appsRes] = await Promise.all([
        api.get(`/opportunities/${id}`),
        api.get(`/applications/opportunity/${id}`),
      ]);

      setOpportunity(oppRes.data.data || oppRes.data);
      setApplications(appsRes.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching applications:", error);
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [id]);

  // ✅ Update status (Accept/Reject)
  const handleStatusChange = async (appId, status) => {
    try {
      const res = await api.put(`/applications/${appId}/status`, { status });
      if (res.data.success) {
        toast.success(`Application ${status}!`);
        // ✅ Refresh the applications list instead of navigating
        fetchApplications();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
      toast.error("Error updating application status");
    }
  };

  // ✅ Delete application
  const handleDeleteApplication = async (appId, applicantName) => {
    // Confirm before deleting
    const confirmed = window.confirm(
      `Are you sure you want to delete the application from ${applicantName}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const res = await api.delete(`/applications/${appId}`);
      if (res.data.success) {
        toast.success("Application deleted successfully!");
        // ✅ Refresh the applications list
        fetchApplications();
      } else {
        toast.error("Failed to delete application");
      }
    } catch (error) {
      console.error("❌ Error deleting application:", error);
      toast.error("Error deleting application");
    }
  };

  // ✅ Handle resume view with proper error handling
  const handleViewResume = (resumePath) => {
    if (!resumePath) {
      toast.error("No resume available");
      return;
    }

    try {
      // If the resume path already starts with http/https, use it directly
      if (resumePath.startsWith("http://") || resumePath.startsWith("https://")) {
        window.open(resumePath, "_blank", "noopener,noreferrer");
        return;
      }

      // Otherwise, construct the full URL
      const cleanPath = resumePath.startsWith("/") ? resumePath : `/${resumePath}`;
      const fullUrl = `${BASE_URL}${cleanPath}`;
      
      console.log("Opening resume:", {
        resumePath,
        BASE_URL,
        fullUrl
      });

      window.open(fullUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening resume:", error);
      toast.error("Failed to open resume");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} />
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <Button
          variant="outline"
          onClick={() => navigate("/opportunity-management")}
          className={styles.backButton}
        >
          <ArrowLeft size={18} /> Back
        </Button>

        <h1 className={styles.title}>
          Applications for:{" "}
          <span className={styles.highlight}>
            {opportunity?.title || "Unknown"}
          </span>
        </h1>
      </div>

      {applications.length === 0 ? (
        <div className={styles.emptyState}>
          <User className={styles.emptyIcon} />
          <h2>No applications yet</h2>
          <p>
            Volunteers haven't applied for this opportunity yet. Check back
            later!
          </p>
        </div>
      ) : (
        <div className={styles.applicationsGrid}>
          {applications.map((app) => (
            <div key={app._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <User className={styles.userIcon} />
                <div style={{ flex: 1 }}>
                  <h3>{app.name || "Anonymous"}</h3>
                </div>
                {/* ✅ Delete button in header */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteApplication(app._id, app.name)}
                  className={styles.deleteButton}
                  title="Delete Application"
                >
                  <Trash2 size={18} className="text-red-500" />
                </Button>
              </div>

              <p>
                <strong>Email:</strong> {app.email || "N/A"}
              </p>

              {app.user?.skills && (
                <p>
                  <strong>Skills:</strong>{" "}
                  {Array.isArray(app.user.skills)
                    ? app.user.skills.join(", ")
                    : app.user.skills}
                </p>
              )}

              <p>
                <strong>Motivation:</strong> {app.motivation || "—"}
              </p>

              {/* ✅ Resume Section */}
              <p>
                <strong>Resume:</strong>{" "}
                {app.resume ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewResume(app.resume)}
                    className={styles.resumeButton}
                  >
                    <FileText size={16} className="mr-2" />
                    View Resume
                  </Button>
                ) : (
                  <span className={styles.noResume}>No resume uploaded</span>
                )}
              </p>

              {/* ✅ Status Section */}
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    app.status === "pending"
                      ? styles.pending
                      : app.status === "accepted"
                      ? styles.accepted
                      : styles.rejected
                  }
                >
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </p>

              {/* ✅ Accept / Reject Buttons - Show for all statuses */}
              <div className={styles.actions}>
                {app.status !== "accepted" && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleStatusChange(app._id, "accepted")}
                    className={styles.acceptButton}
                  >
                    <Check size={16} className="mr-1" /> Accept
                  </Button>
                )}
                {app.status !== "rejected" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStatusChange(app._id, "rejected")}
                    className={styles.rejectButton}
                  >
                    <X size={16} className="mr-1" /> Reject
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}