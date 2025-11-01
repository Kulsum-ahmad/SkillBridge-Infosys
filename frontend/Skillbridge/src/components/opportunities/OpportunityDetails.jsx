// frontend/Skillbridge/src/components/opportunities/OpportunityDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaMapMarkerAlt, FaClock, FaCalendarAlt } from "react-icons/fa";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import styles from "./OpportunityDetails.module.css";

const OpportunityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/opportunities/${id}`);
        setOpportunity(res.data);
      } catch (error) {
        console.error("❌ Error fetching opportunity:", error);
        toast.error(error.response?.data?.message || "Failed to load opportunity details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <Loader className="animate-spin w-8 h-8 text-blue-600" />
        <p>Loading opportunity details...</p>
      </div>
    );
  }

  if (!opportunity) {
    return <div className={styles.errorText}>Opportunity not found.</div>;
  }

  // 🧩 Clean org name detection
  const orgName =
    opportunity.ngo_id?.organizationName ||
    opportunity.ngo_id?.fullName ||
    opportunity.ngoId?.organizationName ||
    opportunity.ngoId?.fullName ||
    opportunity.orgName ||
    "Unknown Organization";

  // 🧩 Skills
  const skills =
    opportunity.required_skills?.length
      ? opportunity.required_skills
      : opportunity.skills?.length
      ? opportunity.skills
      : ["No specific skills required"];

  const deadline = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString()
    : "Not specified";

  // ✅ Correct route navigation
  const handleApplyClick = () => {
    navigate(`/opportunity/${id}/apply`);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.banner}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ← Back to Opportunities
        </button>

        <div className={styles.bannerContent}>
          <img
            src="https://placehold.co/100x100?text=NGO"
            alt={orgName}
            className={styles.orgImage}
          />
          <div>
            <h1 className={styles.title}>{opportunity.title}</h1>
            <p className={styles.orgName}>{orgName}</p>
          </div>
        </div>

        {/* ✅ Fixed Apply Button */}
        <button className={styles.bannerApplyBtn} onClick={handleApplyClick}>
          Apply Now
        </button>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.mainContent}>
          <div className={styles.infoCards}>
            <div>
              <FaMapMarkerAlt /> {opportunity.location}
            </div>
            <div>
              <FaClock /> {opportunity.duration}
            </div>
            <div>
              <FaCalendarAlt /> Deadline: {deadline}
            </div>
          </div>

          <div className={styles.card}>
            <h2>About This Opportunity</h2>
            <p>{opportunity.description}</p>
          </div>

          <div className={styles.card}>
            <h2>Required Skills</h2>
            <div className={styles.skills}>
              {skills.map((skill, index) => (
                <span key={index}>{skill}</span>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3>Ready to Apply?</h3>
            <div className={styles.sidebarInfo}>
              <p>
                <FaMapMarkerAlt /> {opportunity.location}
              </p>
              <p>
                <FaClock /> {opportunity.duration}
              </p>
              <p>
                <FaCalendarAlt /> Deadline: {deadline}
              </p>
            </div>

            {/* ✅ Sidebar Apply Button */}
            <button className={styles.applyBtn} onClick={handleApplyClick}>
              Apply Now
            </button>

            <p className={styles.tip}>
              <strong>Tip:</strong> Highlight relevant experience and explain your motivation clearly!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OpportunityDetails;
