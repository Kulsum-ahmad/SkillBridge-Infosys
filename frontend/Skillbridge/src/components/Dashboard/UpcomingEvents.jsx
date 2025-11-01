// frontend/src/components/Dashboard/UpcomingEvents.jsx

import React from 'react';
import styles from './dashboard.module.css';

const eventItems = [
    { title: 'Event 1', date: 'Oct 15, 2025' },
    { title: 'Event 2', date: 'Oct 16, 2025' },
    { title: 'Event 3', date: 'Oct 17, 2025' },
];

const UpcomingEvents = () => (
    <div className={styles.eventsBox}>
        <h3 className={styles.sectionTitle}>Upcoming Events</h3>
        <ul className={styles.eventsList}>
            {eventItems.map((item, index) => (
                <li key={index} className={styles.eventItem}>
                    <p className={styles.eventTitle}>{item.title}</p>
                    <p className={styles.eventDate}>{item.date}</p>
                </li>
            ))}
        </ul>
    </div>
);

export default UpcomingEvents;