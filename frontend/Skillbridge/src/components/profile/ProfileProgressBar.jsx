// ProfileProgressBar.jsx

import { Progress } from "../ui/progress";
import { CheckCircle2 } from "lucide-react";

// 💡 IMPORT THE CSS MODULE
import styles from './ProfileProgressBar.module.css';

export function ProfileProgressBar({ progress }) {
  const isComplete = progress === 100;

  // Use dynamic class names based on the completion state
  const iconWrapperClass = isComplete
    ? `${styles.iconWrapper} ${styles.iconWrapperComplete}`
    : `${styles.iconWrapper} ${styles.iconWrapperIncomplete}`;

  const iconClass = isComplete
    ? `${styles.icon} ${styles.iconComplete}`
    : `${styles.icon} ${styles.iconIncomplete}`;

  const completionMessage = isComplete
    ? (
        <p className={styles.completeText}>
          <span role="img" aria-label="party popper">🎉</span>
          <span>Your profile is complete!</span>
        </p>
      )
    : (
        <p className={styles.incompleteText}>
          Complete your profile to increase visibility and opportunities!
        </p>
      );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={iconWrapperClass}>
            <CheckCircle2 className={iconClass} />
          </div>
          <h3 className={styles.headerTitle}>Profile Completion</h3>
        </div>
        <span className={styles.progressBadge}>
          {progress}%
        </span>
      </div>
      
      {/* Assuming the Progress component handles its own height via internal styles */}
      <Progress value={progress} className={styles.progressBar} />
      
      {completionMessage}
    </div>
  );
}