import { MapPin, Calendar, Users, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import styles from './OpportunityCard.module.css';

export function OpportunityCard({ 
  opportunity, 
  currentUserRole, 
  onEdit, 
  onApply,
  onDelete 
}) {
  const statusClasses = {
    open: styles.statusDotActive,
    draft: styles.statusDotDraft,
    closed: styles.statusDotClosed,
  };
  const statusDotClass = statusClasses[opportunity.status?.toLowerCase()] || styles.statusDotActive; 

  // ✅ Helper function to capitalize the first letter of the category
  const formatCategory = (category) => {
    if (!category) return "";
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  return (
    <Card className={`${styles.card} shadow-sm rounded-2xl flex flex-col h-full overflow-hidden`}>
     {/* ✅ Added overflow-hidden to fix the sharp bottom corners */}
      <CardHeader className={styles.cardHeader}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              {opportunity.title || "Untitled Opportunity"}
            </h3>

            {opportunity.category && (
              <span className={styles.categoryTag}>
                {formatCategory(opportunity.category)} {/* ✅ Capitalized Category */}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${styles.cardContent} flex-grow`}>
        <p className={styles.description}>{opportunity.description}</p>

        <div className={styles.detailsList}>
          {opportunity.location && (
            <div className={styles.detailItem}>
              <MapPin className={styles.detailIcon} />
              <span>{opportunity.location}</span>
            </div>
          )}

          {opportunity.deadline && (
            <div className={styles.detailItem}>
              <Calendar className={styles.detailIcon} />
              <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
            </div>
          )}

          <div className={styles.detailItem}>
            <Users className={styles.detailIcon} />
            <span>{opportunity.applicants || 0} interested volunteers</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className={`${styles.cardFooter} flex justify-between items-center w-full mt-auto`}>
        <div className={styles.footerStatus}>
          <span className={`${styles.statusDot} ${statusDotClass}`} />
          <span className={styles.statusText}>{opportunity.status || 'Open'}</span>
        </div>

        {/* ✅ Increased gap-2 to gap-4 so it's not so compact */}
        <div className="flex gap-4 ml-auto items-center">
          
          {/* NGO CONTROLS */}
          {currentUserRole === 'ngo' && (
            <>
              {/* ✅ Internal Applications button removed. Only Edit and Delete remain. */}
              <button 
                onClick={() => onEdit(opportunity)} 
                className={`${styles.actionBtn} ${styles.editBtn}`} 
                title="Edit Opportunity"
              >
                <Edit2 size={18} />
              </button>

              <button 
                onClick={() => onDelete(opportunity._id)} 
                className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                title="Delete Opportunity"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}

          {/* VOLUNTEER CONTROLS */}
          {currentUserRole === 'volunteer' && (opportunity.status === 'open' || !opportunity.status) && (
            <button 
              onClick={() => onApply(opportunity._id)} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Apply Now
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}