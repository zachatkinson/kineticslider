import React, { useState, useEffect } from 'react';
import { FeatureFlag, useFeatureFlags } from './feature-flags';
import { MigrationDashboardProps, PhaseMetadata, PhaseStatus, PhaseProgress, MigrationPhase } from '../src/types/migration';
const phaseToFeatureFlags: Record<MigrationPhase, FeatureFlag[]> = {
    [MigrationPhase.PREPARATION]: [],
    [MigrationPhase.CORE_SLIDER]: [
        FeatureFlag.NEW_CORE_SLIDER,
        FeatureFlag.NEW_GESTURE_HANDLING
    ],
    [MigrationPhase.CANVAS_SYSTEM]: [
        FeatureFlag.RESPONSIVE_CANVAS
    ],
    [MigrationPhase.THEME_SYSTEM]: [
        FeatureFlag.THEME_SYSTEM
    ],
    [MigrationPhase.ANIMATION_EFFECTS]: [
        FeatureFlag.NEW_ANIMATION_SYSTEM,
        FeatureFlag.ADVANCED_EFFECTS
    ],
    [MigrationPhase.CONTENT_MANAGEMENT]: [
        FeatureFlag.CONTENT_MANAGEMENT
    ],
    [MigrationPhase.PERFORMANCE_OPTIMIZATIONS]: [
        FeatureFlag.NEW_PERFORMANCE_OPTIMIZATIONS
    ],
    [MigrationPhase.ACCESSIBILITY]: [
        FeatureFlag.NEW_ACCESSIBILITY_FEATURES
    ],
    [MigrationPhase.FINALIZATION]: [
        FeatureFlag.NEW_CORE_SLIDER,
        FeatureFlag.NEW_GESTURE_HANDLING,
        FeatureFlag.RESPONSIVE_CANVAS,
        FeatureFlag.THEME_SYSTEM,
        FeatureFlag.NEW_ANIMATION_SYSTEM,
        FeatureFlag.ADVANCED_EFFECTS,
        FeatureFlag.CONTENT_MANAGEMENT,
        FeatureFlag.NEW_PERFORMANCE_OPTIMIZATIONS,
        FeatureFlag.NEW_ACCESSIBILITY_FEATURES
    ],
};
const phaseMetadata: Record<MigrationPhase, Omit<PhaseMetadata, 'status' | 'progress' | 'startedAt' | 'completedAt' | 'errors'>> = {
    [MigrationPhase.PREPARATION]: {
        label: 'Phase 0: Preparation',
        description: 'Set up feature flags, migration dashboard, and benchmarking',
        estimatedDuration: '1 week',
    },
    [MigrationPhase.CORE_SLIDER]: {
        label: 'Phase 1: Core Slider',
        description: 'Implement new core slider and gesture handling',
        estimatedDuration: '2 weeks',
    },
    [MigrationPhase.CANVAS_SYSTEM]: {
        label: 'Phase 2: Canvas System',
        description: 'Implement responsive canvas with dynamic sizing',
        estimatedDuration: '1 week',
    },
    [MigrationPhase.THEME_SYSTEM]: {
        label: 'Phase 3: Theme System',
        description: 'Implement theme provider and preset system',
        estimatedDuration: '1 week',
    },
    [MigrationPhase.ANIMATION_EFFECTS]: {
        label: 'Phase 4: Animation & Effects',
        description: 'Upgrade animation system and implement advanced effects',
        estimatedDuration: '2 weeks',
    },
    [MigrationPhase.CONTENT_MANAGEMENT]: {
        label: 'Phase 5: Content Management',
        description: 'Implement dynamic content loading system',
        estimatedDuration: '1 week',
    },
    [MigrationPhase.PERFORMANCE_OPTIMIZATIONS]: {
        label: 'Phase 6: Performance',
        description: 'Implement performance optimizations and monitoring',
        estimatedDuration: '1 week',
    },
    [MigrationPhase.ACCESSIBILITY]: {
        label: 'Phase 7: Accessibility',
        description: 'Enhance accessibility features and compliance',
        estimatedDuration: '1 week',
    },
    [MigrationPhase.FINALIZATION]: {
        label: 'Phase 8: Finalization',
        description: 'Complete testing and ensure all systems work together',
        estimatedDuration: '2 weeks',
    },
};
const PROGRESS_STORAGE_KEY = 'kinetic-slider-migration-progress';
const initialPhaseProgress: PhaseProgress = Object.values(MigrationPhase).reduce((acc, phase) => ({
    ...acc,
    [phase]: {
        ...phaseMetadata[phase],
        status: PhaseStatus.NOT_STARTED,
        progress: 0,
    },
}), {} as PhaseProgress);
export const MigrationDashboard: React.FC<MigrationDashboardProps> = ({ isAdmin = false }) => {
    const { flags, setFlag } = useFeatureFlags();
    const [phaseProgress, setPhaseProgress] = useState<PhaseProgress>(() => {
        try {
            const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : initialPhaseProgress;
        }
        catch {
            return initialPhaseProgress;
        }
    });
    const overallProgress = Object.values(phaseProgress).reduce((sum, phase) => sum + phase.progress, 0) / Object.values(MigrationPhase).length;
    useEffect(() => {
        try {
            localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(phaseProgress));
        }
        catch (error) {
            console.warn('Failed to save migration progress to localStorage:', error);
        }
    }, [phaseProgress]);
    useEffect(() => {
        const newProgress = { ...phaseProgress };
        Object.entries(phaseToFeatureFlags).forEach(([phase, featureFlags]) => {
            const phaseKey = phase as MigrationPhase;
            if (featureFlags.length === 0)
                return;
            const enabledFlags = featureFlags.filter(flag => flags[flag]);
            const percentComplete = featureFlags.length > 0
                ? (enabledFlags.length / featureFlags.length) * 100
                : 0;
            let status = PhaseStatus.NOT_STARTED;
            if (percentComplete >= 100) {
                status = PhaseStatus.COMPLETED;
            }
            else if (percentComplete > 0) {
                status = PhaseStatus.IN_PROGRESS;
            }
            if (newProgress[phaseKey].status !== status ||
                newProgress[phaseKey].progress !== percentComplete) {
                newProgress[phaseKey] = {
                    ...newProgress[phaseKey],
                    status,
                    progress: percentComplete,
                    ...(status === PhaseStatus.IN_PROGRESS && !newProgress[phaseKey].startedAt
                        ? { startedAt: new Date() }
                        : {}),
                    ...(status === PhaseStatus.COMPLETED && !newProgress[phaseKey].completedAt
                        ? { completedAt: new Date() }
                        : {}),
                };
            }
        });
        if (JSON.stringify(newProgress) !== JSON.stringify(phaseProgress)) {
            setPhaseProgress(newProgress);
        }
    }, [flags, phaseProgress]);
    const updatePhaseProgress = (phase: MigrationPhase, progress: number): void => {
        if (!isAdmin)
            return;
        const newStatus = progress >= 100
            ? PhaseStatus.COMPLETED
            : progress > 0
                ? PhaseStatus.IN_PROGRESS
                : PhaseStatus.NOT_STARTED;
        setPhaseProgress(prev => ({
            ...prev,
            [phase]: {
                ...prev[phase],
                status: newStatus,
                progress,
                ...(newStatus === PhaseStatus.IN_PROGRESS && !prev[phase].startedAt
                    ? { startedAt: new Date() }
                    : {}),
                ...(newStatus === PhaseStatus.COMPLETED && !prev[phase].completedAt
                    ? { completedAt: new Date() }
                    : {}),
            },
        }));
    };
    const toggleFeatureFlag = (flag: FeatureFlag): void => {
        if (!isAdmin)
            return;
        setFlag(flag, !flags[flag]);
    };
    const renderPhaseRow = (phase: MigrationPhase): React.ReactElement => {
        const { status, progress } = phaseProgress[phase];
        const { label, description, estimatedDuration } = phaseMetadata[phase];
        const featureFlags = phaseToFeatureFlags[phase];
        
        return (
            <div 
                key={phase} 
                className="phase-row"
                style={styles.phaseRow}
            >
                <div 
                    className="phase-header"
                    style={styles.phaseHeader}
                >
                    <h3 style={styles.phaseHeaderTitle}>
                        {label}
                    </h3>
                    <span 
                        className={`status ${status}`}
                        style={styles.status}
                    >
                        {status === PhaseStatus.NOT_STARTED ? 'Not Started' :
                         status === PhaseStatus.IN_PROGRESS ? 'In Progress' :
                         'Completed'}
                    </span>
                </div>
                <p>{description}</p>
                <div className="duration">
                    Est. Duration: {estimatedDuration}
                </div>
                <div 
                    className="progress-container"
                    style={{
                        marginTop: '10px',
                        height: '20px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative' as const
                    }}
                >
                    <div 
                        className="progress-bar"
                        style={{
                            ...styles.progressBar, 
                            width: `${progress}%`
                        }}
                    />
                    <span 
                        className="progress-text"
                        style={styles.progressText}
                    >
                        {Math.round(progress)}%
                    </span>
                </div>
                {isAdmin && (
                    <div 
                        className="admin-controls"
                        style={styles.adminControls}
                    >
                        <div 
                            className="feature-flags"
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap' as const,
                                gap: '8px',
                                marginBottom: '12px'
                            }}
                        >
                            {featureFlags.map(flag => (
                                <div 
                                    key={flag} 
                                    className="feature-flag" 
                                    style={styles.featureFlag}
                                >
                                    <input 
                                        type="checkbox" 
                                        id={flag} 
                                        checked={flags[flag]} 
                                        onChange={() => toggleFeatureFlag(flag)} 
                                    />
                                    <label htmlFor={flag}>
                                        {flag}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => updatePhaseProgress(phase, parseInt(e.target.value, 10))}
                            style={styles.rangeInput}
                        />
                    </div>
                )}
            </div>
        );
    };
    return (
        <div 
            className="migration-dashboard"
            style={styles.dashboard}
        >
            <div 
                className="dashboard-header"
                style={styles.dashboardHeader}
            >
                <h2>KineticSlider Migration Dashboard</h2>
                <div 
                    className="overall-progress"
                >
                    <h4>
                        Overall Progress: {Math.round(overallProgress)}%
                    </h4>
                    <div 
                        style={styles.overallProgressContainer}
                    >
                        <div 
                            style={{
                                ...styles.overallProgressBar, 
                                width: `${overallProgress}%`
                            }}
                        />
                    </div>
                </div>
            </div>
            <div 
                className="phases-container"
            >
                {Object.values(MigrationPhase).map(renderPhaseRow)}
            </div>
        </div>
    );
};
const styles = {
    dashboard: {
        fontFamily: 'sans-serif',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    dashboardHeader: {
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px'
    },
    overallProgressContainer: {
        height: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '10px',
        overflow: 'hidden'
    },
    overallProgressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: '10px'
    },
    phaseRow: {
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    phaseHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    phaseHeaderTitle: {
        margin: '0',
        color: '#333'
    },
    status: {
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold' as const
    },
    'status.NOT_STARTED': {
        background: '#f0f0f0',
        color: '#666'
    },
    'status.IN_PROGRESS': {
        background: '#FFF9C4',
        color: '#F57F17'
    },
    'status.COMPLETED': {
        background: '#E8F5E9',
        color: '#2E7D32'
    },
    progressContainer: {
        marginTop: '10px',
        height: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative'
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: '10px'
    },
    progressText: {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#000',
        fontWeight: 'bold' as const
    },
    adminControls: {
        marginTop: '15px',
        padding: '10px',
        borderTop: '1px solid #eee'
    },
    featureFlags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px'
    },
    featureFlag: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    rangeInput: {
        width: '100%'
    }
};
