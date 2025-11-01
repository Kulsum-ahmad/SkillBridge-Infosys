import { useState, useEffect } from "react";
import { Plus, Briefcase, ArrowLeft, Users } from "lucide-react";
import { Button } from "../ui/button";
import { OpportunityCard } from "./OpportunityCard";
import { OpportunityFilters } from "./OpportunityFilters";
import { CreateOpportunityModal } from "./CreateOpportunityModal";
import { toast } from "sonner";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./OpportunityManagementPage.module.css";

export default function OpportunityManagementPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showModal, setShowModal] = useState(false);
  const [editOpportunity, setEditOpportunity] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ✅ Fetch opportunities for the logged-in NGO only
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/opportunities"); // backend already filters by NGO if userType === "ngo"
      setOpportunities(response.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to view opportunities");
        navigate("/login");
      } else {
        toast.error("Failed to fetch opportunities");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // ✅ Create or update opportunity
  const handleSaveOpportunity = async (data) => {
    try {
      if (editOpportunity?._id) {
        const response = await api.put(`/opportunities/${editOpportunity._id}`, data);
        setOpportunities((prev) =>
          prev.map((o) => (o._id === editOpportunity._id ? response.data : o))
        );
        toast.success("Opportunity updated successfully!");
      } else {
        const response = await api.post("/opportunities", data);
        setOpportunities((prev) => [response.data, ...prev]);
        toast.success("Opportunity created successfully!");
      }
      setShowModal(false);
      setEditOpportunity(null);
    } catch (error) {
      console.error("Save error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to save opportunity");
      }
    }
  };

  // ✅ Delete opportunity
  const handleDelete = async () => {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/opportunities/${deleteId}`);
      setOpportunities((prev) => prev.filter((o) => o._id !== deleteId));
      toast.success("Opportunity deleted successfully!");
      setDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else if (error.response?.status === 404) {
        setOpportunities((prev) => prev.filter((o) => o._id !== deleteId));
        toast.info("Opportunity already deleted.");
        setDeleteId(null);
      } else {
        toast.error(error.response?.data?.message || "Failed to delete opportunity.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Filter & sort logic
  const filteredOpportunities = opportunities
    .filter((o) => {
      const title = o.title || "";
      const description = o.description || "";
      const categoryValue = o.category || "";

      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        category === "all" ||
        categoryValue.toLowerCase() === category.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return new Date(a.deadline) - new Date(b.deadline);
        case "applicants":
          return (b.applicants || 0) - (a.applicants || 0);
        case "location":
          return (a.location || "").localeCompare(b.location || "");
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div className={styles.titleSection}>
          <div className={styles.headerTop}>
          </div>
          <h1 className={styles.title}>Opportunity Management</h1>
          <div className={styles.titleSeparator}></div>
          <p className={styles.subtitle}>
            Manage and create volunteer opportunities for your organization.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditOpportunity(null);
            setShowModal(true);
          }}
          className={styles.createButton}
        >
          <Plus className={styles.iconSmall} /> Create Opportunity
        </Button>
      </div>

      {/* ✅ Show loading spinner */}
      {loading ? (
        <div className={styles.loadingState}>
          <Briefcase className={styles.loadingIcon} />
          <p>Loading your opportunities...</p>
        </div>
      ) : (
        <>
          <OpportunityFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            category={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {filteredOpportunities.length === 0 ? (
            <div className={styles.emptyStatePlaceholder}>
              <Briefcase className={styles.emptyStateIcon} />
              <h2 className={styles.emptyStateTitle}>
                {searchTerm || category !== "all"
                  ? "No opportunities found"
                  : "No opportunities yet"}
              </h2>
              <p className={styles.emptyStateDescription}>
                {searchTerm || category !== "all"
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : "Get started by creating your first volunteer opportunity. It’s quick and easy!"}
              </p>
              {!searchTerm && category === "all" && (
                <Button
                  onClick={() => setShowModal(true)}
                  className={styles.emptyStateButton}
                >
                  Create First Opportunity
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {filteredOpportunities.map((o) => (
                <div key={o._id} className={styles.cardWrapper}>
                  <OpportunityCard
                    opportunity={o}
                    onEdit={(opp) => {
                      setEditOpportunity(opp);
                      setShowModal(true);
                    }}
                    onDelete={setDeleteId}
                  />

                  {/* ✅ View Applications */}
                  <Button
                    variant="secondary"
                    className={styles.viewApplicantsButton}
                    onClick={() => navigate(`/opportunity/${o._id}/applications`)}
                  >
                    <Users className={styles.iconSmall} /> View Applications
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ✅ Create / Edit Opportunity Modal */}
      <CreateOpportunityModal
        open={showModal}
        onOpenChange={(val) => {
          setShowModal(val);
          if (!val) setEditOpportunity(null);
        }}
        onCreateOpportunity={handleSaveOpportunity}
        opportunityToEdit={editOpportunity}
      />

      {/* ✅ Delete Confirmation Popup */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className={styles.deletePopupOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDeleting && setDeleteId(null)}
          >
            <motion.div
              className={styles.deletePopupBox}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.deletePopupTitle}>Are you sure?</h2>
              <p className={styles.deletePopupDescription}>
                This action cannot be undone. This will permanently delete the opportunity.
              </p>

              <div className={styles.deletePopupButtons}>
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteId(null)}
                  className={styles.deletePopupCancel}
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className={styles.deletePopupDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
