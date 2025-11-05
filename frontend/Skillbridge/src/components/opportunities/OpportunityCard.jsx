import { MapPin, Calendar, Users, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import styles from './OpportunityCard.module.css';

export function OpportunityCard({ opportunity, onEdit, onDelete }) {
  const statusClasses = {
    open: styles.statusDotActive,
    draft: styles.statusDotDraft,
    closed: styles.statusDotClosed,
  };
  const statusDotClass = statusClasses[opportunity.status] || styles.statusDotClosed;

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleWrapper}>
            <h3 className={styles.title}>{opportunity.title || "Untitled Opportunity"}</h3>
            {opportunity.category && <Badge className={styles.categoryBadge}>{opportunity.category}</Badge>}
          </div>
          <div className={styles.actionButtons}>
            <button
              onClick={() => onEdit(opportunity)}
              className={styles.editButton}
              aria-label="Edit opportunity"
            >
              <Edit2 className={styles.actionIcon} />
            </button>
            <button
              onClick={() => onDelete(opportunity._id)}
              className={styles.deleteButton}
              aria-label="Delete opportunity"
            >
              <Trash2 className={styles.actionIcon} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={styles.cardContent}>
        <p className={styles.description}>{opportunity.description || "No description provided."}</p>

        <div className={styles.detailsList}>
          {opportunity.location && (
            <div className={styles.detailItem}>
              <div className={`${styles.iconBox} ${styles.iconBoxOrange}`}>
                <MapPin className={`${styles.icon} ${styles.iconOrange}`} />
              </div>
              <span className={styles.detailText}>{opportunity.location}</span>
            </div>
          )}

          {opportunity.deadline && (
            <div className={styles.detailItem}>
              <div className={`${styles.iconBox} ${styles.iconBoxBlue}`}>
                <Calendar className={`${styles.icon} ${styles.iconBlue}`} />
              </div>
              <span className={styles.detailText}>
                Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className={styles.detailItem}>
            <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
              <Users className={`${styles.icon} ${styles.iconPurple}`} />
            </div>
            <span className={styles.detailText}>
              {opportunity.applicants || 0} interested volunteers
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className={styles.cardFooter}>
        <div className={styles.footerContent}>
          <div className={styles.statusDisplay}>
            <span className={`${styles.statusDot} ${statusDotClass}`}></span>
            <span className={styles.statusText}>{opportunity.status || "closed"}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
