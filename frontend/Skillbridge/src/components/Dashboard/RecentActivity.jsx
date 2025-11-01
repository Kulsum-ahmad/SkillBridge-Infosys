// frontend/src/components/Dashboard/RecentActivity.jsx

import React from 'react';
import styles from './dashboard.module.css';

const activityItems = [
    { text: 'Activity item 1', time: '2 hours ago' },
    { text: 'Activity item 2', time: '2 hours ago' },
    { text: 'Activity item 3', time: '2 hours ago' },
];

const RecentActivity = () => (
    <div className={styles.activityBox}>
        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        <ul className={styles.activityList}>
            {activityItems.map((item, index) => (
                <li key={index} className={styles.activityItem}>
                    <span className={styles.activityDot}></span>
                    <span className={styles.activityText}>{item.text}</span>
                    <span className={styles.activityTime}>{item.time}</span>
                </li>
            ))}
        </ul>
    </div>
);

export default RecentActivity;