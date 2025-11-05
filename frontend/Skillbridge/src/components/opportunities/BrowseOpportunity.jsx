import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaMapMarkerAlt, FaClock, FaFilter } from "react-icons/fa";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import styles from "./BrowseOpportunity.module.css";
import Sidebar from '../Sidebar/Sidebar.jsx';
import Navbar from "../Navbar/Navbar.jsx";

const FilterItem = ({ label, isChecked, onChange }) => (
  <label className={styles.filterItemLabel}>
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className={styles.filterItemCheckbox}
    />
    <span className={styles.filterItemText}>{label}</span>
  </label>
);

const OpportunityCard = ({ opportunity }) => {
  const navigate = useNavigate();

  const ngoName =
    opportunity.orgName ||
    opportunity.ngoId?.orgName ||
    opportunity.ngoId?.organizationName ||
    opportunity.ngoId?.name ||
    opportunity.ngo_id?.orgName ||
    opportunity.ngo_id?.organizationName ||
    opportunity.ngo_id?.name ||
    "Unknown NGO";

  const ngoImage =
    opportunity.orgImage ||
    opportunity.ngoId?.orgImage ||
    opportunity.ngoId?.profilePicture ||
    opportunity.ngoId?.logo ||
    opportunity.ngo_id?.orgImage ||
    opportunity.ngo_id?.profilePicture ||
    opportunity.ngo_id?.logo ||
    "https://placehold.co/80x80?text=NGO";

  const skills = opportunity.skills || opportunity.required_skills || [];

  return (
    <div className={styles.opportunityCard}>
      <div className={styles.cardHeader}>
        <img src={ngoImage} alt={ngoName} className={styles.orgImage} />
        <span className={styles.orgName}>{ngoName}</span>
      </div>

      <h3 className={styles.jobTitle}>{opportunity.title}</h3>

      <div className={styles.jobDetails}>
        <p className={styles.detailItem}>
          <FaMapMarkerAlt className={styles.detailIcon} />
          {opportunity.location || "Not specified"}
        </p>
        <p className={styles.detailItem}>
          <FaClock className={styles.detailIcon} />
          {opportunity.duration || "N/A"}
        </p>
      </div>

      <div className={styles.skillTags}>
        {skills.length > 0 ? (
          skills.slice(0, 3).map((skill, index) => (
            <span key={index} className={styles.skillTag}>
              {skill}
            </span>
          ))
        ) : (
          <span className={styles.noSkills}>No skills listed</span>
        )}
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.viewDetailsButton}
          onClick={() => navigate(`/opportunity/${opportunity._id}`)}
        >
          View Details
        </button>
        <button
          className={styles.applyButton}
          onClick={() => navigate(`/opportunity/${opportunity._id}/apply`)}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const BrowseOpportunity = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    selectedSkills: [],
    location: "All Locations",
    duration: "All",
  });
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:5000/api/opportunities";

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const res = await axios.get(API_URL);
        if (res.data && Array.isArray(res.data)) {
          setOpportunities(res.data);
        } else if (res.data?.data) {
          setOpportunities(res.data.data);
        } else {
          console.warn("Unexpected response format:", res.data);
          setOpportunities([]);
          toast.warning("No opportunities found");
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
        toast.error(error.response?.data?.message || "Failed to load opportunities. Please try again.");
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const ALL_LOCATIONS = useMemo(
    () => ["All Locations", ...new Set(opportunities.map((o) => o.location || "Unknown").filter(Boolean))],
    [opportunities]
  );

  const ALL_SKILLS = useMemo(() => {
    const all = opportunities.flatMap((o) => o.skills || o.required_skills || []);
    return [...new Set(all)].filter(Boolean);
  }, [opportunities]);

  const ALL_DURATIONS = ["All", "Short", "Long"];

  const handleSkillChange = (skill) => {
    setFilters((prev) => {
      const isSelected = prev.selectedSkills.includes(skill);
      const newSkills = isSelected
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill];
      return { ...prev, selectedSkills: newSkills };
    });
  };

  const handleLocationChange = (e) =>
    setFilters((prev) => ({ ...prev, location: e.target.value }));

  const handleDurationChange = (duration) =>
    setFilters((prev) => ({ ...prev, duration }));

  const clearFilters = () => {
    setFilters({
      selectedSkills: [],
      location: "All Locations",
      duration: "All",
    });
  };

  const filteredOpportunities = useMemo(() => {
    let current = opportunities;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      current = current.filter(
        (o) =>
          o.title?.toLowerCase().includes(lower) ||
          o.orgName?.toLowerCase().includes(lower) ||
          o.ngoId?.orgName?.toLowerCase().includes(lower) ||
          o.ngoId?.organizationName?.toLowerCase().includes(lower) ||
          o.ngoId?.name?.toLowerCase().includes(lower) ||
          o.ngo_id?.orgName?.toLowerCase().includes(lower) ||
          o.ngo_id?.organizationName?.toLowerCase().includes(lower) ||
          o.ngo_id?.name?.toLowerCase().includes(lower)
      );
    }

    if (filters.selectedSkills.length > 0) {
      current = current.filter((o) => {
        const oppSkills = o.skills || o.required_skills || [];
        return filters.selectedSkills.every((s) => oppSkills.includes(s));
      });
    }

    if (filters.location !== "All Locations") {
      current = current.filter((o) => o.location === filters.location);
    }

    if (filters.duration !== "All") {
      const term = `${filters.duration}-term`.toLowerCase();
      current = current.filter((o) => o.duration?.toLowerCase() === term);
    }

    return current;
  }, [searchTerm, filters, opportunities]);

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <Loader className="animate-spin w-8 h-8 text-blue-600" />
        <p>Loading opportunities...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Browse Opportunities</h1>
          <p className={styles.heroSubtitle}>
            Discover meaningful volunteer opportunities that match your skills and passion
          </p>
        </div>
      </div>

      <div className={styles.searchBarWrapper}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by title or NGO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <FaSearch className={styles.searchIcon} />
        </div>
      </div>

      <main className={styles.mainContent}>
        <div className={styles.resultsCount}>
          <span className={styles.resultsCountNumber}>
            {filteredOpportunities.length}
          </span>{" "}
          opportunities found
        </div>

        <div className={styles.contentGrid}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>
                <FaFilter className={styles.sidebarIcon} /> Filters
              </h2>
              <button onClick={clearFilters} className={styles.clearFiltersButton}>
                Clear All
              </button>
            </div>

            <div className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Skills</h3>
              <div className={styles.filterItemsList}>
                {ALL_SKILLS.length > 0 ? (
                  ALL_SKILLS.map((skill) => (
                    <FilterItem
                      key={skill}
                      label={skill}
                      isChecked={filters.selectedSkills.includes(skill)}
                      onChange={() => handleSkillChange(skill)}
                    />
                  ))
                ) : (
                  <p className={styles.noFilters}>No skills available</p>
                )}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Location</h3>
              <select
                className={styles.filterSelect}
                value={filters.location}
                onChange={handleLocationChange}
              >
                {ALL_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <section className={styles.opportunityGrid}>
            <div className={styles.cardContainer}>
              {filteredOpportunities.length === 0 ? (
                <p>No matching opportunities found.</p>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity._id} opportunity={opportunity} />
                ))
              )}
            </div>

            <div className={styles.loadMoreWrapper}>
              <button className={styles.loadMoreButton}>
                Load More Opportunities
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BrowseOpportunity;