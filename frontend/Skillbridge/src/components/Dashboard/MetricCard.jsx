import React from "react";
import styles from "./dashboard.module.css";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaChartLine,
  FaUsers,
  FaStar,
  FaUserFriends,
  FaEnvelope,
  FaCalendarDay,
} from "react-icons/fa";

const IconMap = {
  // Volunteer Icons
  OpportunitiesApplied: <FaBriefcase />,
  HoursContributed: <FaCalendarAlt />,
  SkillsGained: <FaChartLine />,
  Organizations: <FaUsers />,
  // NGO Icons
  ActiveOpportunities: <FaStar />,
  TotalVolunteers: <FaUserFriends />,
  Applications: <FaEnvelope />,
  UpcomingEvents: <FaCalendarDay />,
};

const MetricCard = ({ title, value, color }) => {
  // Determine the CSS class based on the intended color/theme
  const cardClassName = styles[`card-${color}`] || styles.cardDefault;
  const iconSymbol = IconMap[title] || "❓";

  const isReactElement = React.isValidElement(iconSymbol);

  return (
    <div className={`${styles.metricCard} ${cardClassName}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
        <div className={styles.cardIconBox}>
          <span className={styles.cardIcon}>{iconSymbol}</span>
        </div>
      </div>
      <p className={styles.cardValue}>{value}</p>
    </div>
  );
};

export default MetricCard;
