// src/components/opportunities/OpportunityApply.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./OpportunityApply.module.css";
import { FaMapMarkerAlt, FaClock, FaCalendarAlt, FaUpload } from "react-icons/fa";
import { toast } from "sonner";
import api from "../api"; // ✅ Use centralized axios instance

const OpportunityApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resume, setResume] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [motivation, setMotivation] = useState("");

  // ✅ Fetch user details using api (token handled automatically)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/profile/me");
        setUser(res.data);
      } catch (err) {
        console.error("❌ Error fetching user:", err.response?.data || err.message);
        toast.warning("Unable to fetch your profile details.");
      }
    };
    fetchUser();
  }, []);

  // ✅ Auto-fill name & email
  useEffect(() => {
    if (user) {
      setName(user.name || user.fullName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // ✅ Fetch opportunity details
  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const res = await api.get(`/opportunities/${id}`);
        setOpportunity(res.data);
      } catch (err) {
        console.error("❌ Error fetching opportunity:", err);
        setError("Failed to load opportunity details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
  }, [id]);

  // ✅ Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.warning("⚠️ Only PDF, DOC, or DOCX files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("⚠️ File too large (max 5MB).");
      return;
    }

    setResume(file);
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivation.trim()) {
      toast.warning("⚠️ Please enter your motivation.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("opportunityId", id);
      formData.append("motivation", motivation.trim());
      if (resume) formData.append("resume", resume);

      const res = await api.post("/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data?.message || "✅ Application submitted successfully!");
      setTimeout(() => navigate("/browse-opportunities"), 1500);
    } catch (error) {
      console.error("❌ Application error:", error.response?.data || error.message);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to submit application. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading opportunity details...</div>;
  if (error || !opportunity) return <div className={styles.notFound}>Opportunity not found.</div>;

  const orgName =
    opportunity.ngoId?.organizationName ||
    opportunity.ngoId?.fullName ||
    opportunity.ngo_id?.organizationName ||
    opportunity.ngo_id?.fullName ||
    "Unknown Organization";

  const deadline = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString()
    : "Not specified";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.banner}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ← Back to Details
        </button>
        <div className={styles.bannerText}>
          <h1 className={styles.title}>Application Form</h1>
          <p className={styles.subtitle}>
            Applying for <strong>{opportunity.title}</strong> at {orgName}
          </p>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.formSection}>
          <h2>Tell us about yourself</h2>
          <p className={styles.instructions}>
            Complete the form below to submit your application. All fields marked with an asterisk (*) are required.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                placeholder="Your full name"
                disabled
              />
              <small>This field is auto-filled from your profile</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                placeholder="you@example.com"
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="motivation">Why are you interested in this opportunity? *</label>
              <textarea
                id="motivation"
                name="motivation"
                rows="5"
                placeholder="Share your motivation and what makes you a great fit..."
                required
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
              ></textarea>
            </div>

            <div className={styles.uploadBox}>
              <label htmlFor="resumeUpload" className={styles.uploadLabel}>
                <FaUpload className={styles.uploadIcon} />
                <p>
                  {resume
                    ? `Selected File: ${resume.name}`
                    : "Drag and drop your resume here, or click to browse"}
                </p>
                <small>PDF, DOC, or DOCX (max 5MB)</small>
              </label>
              <input
                type="file"
                id="resumeUpload"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.summaryCard}>
            <h3>Opportunity Summary</h3>
            <p className={styles.org}>{orgName}</p>
            <h4>{opportunity.title}</h4>
            <div className={styles.summaryDetails}>
              <p>
                <FaMapMarkerAlt /> {opportunity.location || "N/A"}
              </p>
              <p>
                <FaClock /> {opportunity.duration || "Not specified"}
              </p>
              <p>
                <FaCalendarAlt /> Deadline: {deadline}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OpportunityApply;
