import { MapPin, Calendar, Users, Edit2, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import styles from './OpportunityCard.module.css';

export function OpportunityCard({ opportunity, onEdit, onDelete, onViewApplications }) {
  const statusClasses = {
    open: styles.statusDotActive,
    draft: styles.statusDotDraft,
    closed: styles.statusDotClosed,
  };
  const statusDotClass = statusClasses[opportunity.status] || styles.statusDotClosed;

  return (
    <Card className={`${styles.card} shadow-sm rounded-2xl`}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              {opportunity.title || "Untitled Opportunity"}
            </h3>

            {opportunity.category && (
              <span className={styles.categoryTag}>
                {opportunity.category}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={styles.cardContent}>
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

      {/* ✅ UPDATED FOOTER WITH VIEW APPLICATIONS */}
      <CardFooter className={styles.cardFooter}>
        <div className={styles.footerStatus}>
          <span className={`${styles.statusDot} ${statusDotClass}`} />
          <span className={styles.statusText}>{opportunity.status}</span>
        </div>
      </CardFooter>
    </Card>
  );
}