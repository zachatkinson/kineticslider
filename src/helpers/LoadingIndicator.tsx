import React from 'react';
import styles from '../KineticSlider.module.css';
import type { LoadingIndicatorProps } from "../types";

/**
 * Simple loading indicator for the KineticSlider
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
                                                               message = 'Loading slider...'
                                                           }) => {
    return (
        <div className={styles.placeholder}>
        <div className={styles.loadingIndicator}>
        <div className={styles.spinner}></div>
            <div className={styles.message}>{message}</div>
        </div>
        </div>
);
};

export default LoadingIndicator;