/**
 * @file AnimationCoordinator.ts
 * @description Coordinates animations across different components of the KineticSlider.
 * Ensures animations are properly grouped, prioritized, and synchronized.
 */

import { gsap } from 'gsap';
import RenderScheduler from './RenderScheduler';
import { UpdateType, UpdatePriority } from './UpdateTypes';
import ResourceManager from './ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

/**
 * Animation group types for categorizing related animations
 */
export enum AnimationGroupType {
    SLIDE_TRANSITION = 'slide_transition',
    MOUSE_MOVEMENT = 'mouse_movement',
    IDLE_EFFECT = 'idle_effect',
    FILTER_EFFECT = 'filter_effect',
    TEXT_ANIMATION = 'text_animation',
    DISPLACEMENT = 'displacement',
    INTERACTION = 'interaction'
}

/**
 * Animation priority levels
 */
export enum AnimationPriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    NORMAL = 'normal',
    LOW = 'low'
}

/**
 * Maps animation group types to their default priority
 */
const GROUP_PRIORITY_MAP: Record<AnimationGroupType, AnimationPriority> = {
    [AnimationGroupType.SLIDE_TRANSITION]: AnimationPriority.CRITICAL,
    [AnimationGroupType.MOUSE_MOVEMENT]: AnimationPriority.HIGH,
    [AnimationGroupType.INTERACTION]: AnimationPriority.HIGH,
    [AnimationGroupType.DISPLACEMENT]: AnimationPriority.NORMAL,
    [AnimationGroupType.FILTER_EFFECT]: AnimationPriority.NORMAL,
    [AnimationGroupType.TEXT_ANIMATION]: AnimationPriority.NORMAL,
    [AnimationGroupType.IDLE_EFFECT]: AnimationPriority.LOW
};

/**
 * Maps animation priority to RenderScheduler UpdateType
 */
const PRIORITY_UPDATE_TYPE_MAP: Record<AnimationPriority, UpdateType> = {
    [AnimationPriority.CRITICAL]: UpdateType.SLIDE_TRANSITION,
    [AnimationPriority.HIGH]: UpdateType.INTERACTION_FEEDBACK,
    [AnimationPriority.NORMAL]: UpdateType.FILTER_UPDATE,
    [AnimationPriority.LOW]: UpdateType.IDLE_EFFECT
};

/**
 * Interface for animation group configuration
 */
export interface AnimationGroupConfig {
    id: string;
    type: AnimationGroupType;
    priority?: AnimationPriority;
    animations: gsap.core.Tween[];
    onComplete?: () => void;
    onStart?: () => void;
}

/**
 * Interface for animation group tracking
 */
interface AnimationGroup {
    id: string;
    type: AnimationGroupType;
    priority: AnimationPriority;
    timeline: gsap.core.Timeline;
    animations: gsap.core.Tween[];
    isActive: boolean;
    startTime: number;
}

/**
 * Coordinates animations across different components of the KineticSlider.
 * Ensures animations are properly grouped, prioritized, and synchronized.
 */
export class AnimationCoordinator {
    /** Singleton instance */
    private static instance: AnimationCoordinator;

    /** Active animation groups */
    private activeGroups: Map<string, AnimationGroup> = new Map();

    /** Resource manager for tracking animations */
    private resourceManager: ResourceManager | null = null;

    /** Render scheduler for coordinating updates */
    private scheduler: RenderScheduler;

    /** Pending animation groups to be processed */
    private pendingGroups: AnimationGroupConfig[] = [];

    /** Processing state */
    private isProcessing: boolean = false;

    /** Processing timeout ID */
    private processingTimeoutId: number | null = null;

    /**
     * Get the singleton instance
     */
    public static getInstance(): AnimationCoordinator {
        if (!AnimationCoordinator.instance) {
            AnimationCoordinator.instance = new AnimationCoordinator();
        }
        return AnimationCoordinator.instance;
    }

    /**
     * Private constructor for singleton pattern
     */
    private constructor() {
        this.scheduler = RenderScheduler.getInstance();
    }

    /**
     * Set the resource manager
     */
    public setResourceManager(resourceManager: ResourceManager): void {
        this.resourceManager = resourceManager;
    }

    /**
     * Create and register an animation group
     */
    public createAnimationGroup(config: AnimationGroupConfig): gsap.core.Timeline {
        try {
            // Use provided priority or default for the group type
            const priority = config.priority || GROUP_PRIORITY_MAP[config.type];

            // Create a timeline for the group
            const timeline = gsap.timeline({
                onComplete: () => {
                    this.completeGroup(config.id);
                    if (config.onComplete) config.onComplete();
                },
                onStart: () => {
                    if (config.onStart) config.onStart();
                }
            });

            // Add all animations to the timeline
            config.animations.forEach(animation => {
                timeline.add(animation, 0);
            });

            // Create the animation group
            const group: AnimationGroup = {
                id: config.id,
                type: config.type,
                priority,
                timeline,
                animations: config.animations,
                isActive: true,
                startTime: Date.now()
            };

            // Register the group
            this.activeGroups.set(config.id, group);

            // Track the timeline with resource manager
            if (this.resourceManager) {
                this.resourceManager.trackAnimation(timeline);
            }

            if (isDevelopment) {
                console.log(`Created animation group: ${config.id} (${config.type}) with priority ${priority}`);
            }

            return timeline;
        } catch (error) {
            if (isDevelopment) {
                console.error('Error creating animation group:', error);
            }
            // Return an empty timeline on error
            return gsap.timeline();
        }
    }

    /**
     * Queue an animation group for processing
     */
    public queueAnimationGroup(config: AnimationGroupConfig): void {
        // Add to pending groups
        this.pendingGroups.push(config);

        // Schedule processing
        this.schedulePendingGroupsProcessing();
    }

    /**
     * Schedule processing of pending animation groups
     */
    private schedulePendingGroupsProcessing(): void {
        if (this.isProcessing || this.processingTimeoutId !== null) {
            return;
        }

        this.processingTimeoutId = window.setTimeout(() => {
            this.processingTimeoutId = null;
            this.processPendingGroups();
        }, 16); // Process on next frame
    }

    /**
     * Process pending animation groups
     */
    private processPendingGroups(): void {
        if (this.pendingGroups.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            // Group pending animations by type
            const groupedByType = new Map<AnimationGroupType, AnimationGroupConfig[]>();

            this.pendingGroups.forEach(group => {
                if (!groupedByType.has(group.type)) {
                    groupedByType.set(group.type, []);
                }
                groupedByType.get(group.type)!.push(group);
            });

            // Process each type
            groupedByType.forEach((groups, type) => {
                // For each type, create a single combined group
                if (groups.length > 1) {
                    this.combineAndCreateGroup(groups, type);
                } else if (groups.length === 1) {
                    this.createAnimationGroup(groups[0]);
                }
            });

            // Clear pending groups
            this.pendingGroups = [];
        } catch (error) {
            if (isDevelopment) {
                console.error('Error processing pending animation groups:', error);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Combine multiple animation groups of the same type into a single group
     */
    private combineAndCreateGroup(groups: AnimationGroupConfig[], type: AnimationGroupType): void {
        try {
            // Combine all animations
            const allAnimations: gsap.core.Tween[] = [];
            const onCompleteCallbacks: (() => void)[] = [];
            const onStartCallbacks: (() => void)[] = [];

            groups.forEach(group => {
                allAnimations.push(...group.animations);
                if (group.onComplete) onCompleteCallbacks.push(group.onComplete);
                if (group.onStart) onStartCallbacks.push(group.onStart);
            });

            // Create a combined group
            const combinedGroup: AnimationGroupConfig = {
                id: `combined_${type}_${Date.now()}`,
                type,
                animations: allAnimations,
                onComplete: () => {
                    onCompleteCallbacks.forEach(callback => callback());
                },
                onStart: () => {
                    onStartCallbacks.forEach(callback => callback());
                }
            };

            // Create the combined group
            this.createAnimationGroup(combinedGroup);

            if (isDevelopment) {
                console.log(`Combined ${groups.length} animation groups of type ${type}`);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error combining animation groups:', error);
            }
        }
    }

    /**
     * Mark an animation group as complete
     */
    private completeGroup(groupId: string): void {
        try {
            const group = this.activeGroups.get(groupId);
            if (!group) return;

            // Mark as inactive
            group.isActive = false;

            // Remove from active groups
            this.activeGroups.delete(groupId);

            if (isDevelopment) {
                const duration = Date.now() - group.startTime;
                console.log(`Completed animation group: ${groupId} (${group.type}) after ${duration}ms`);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error completing animation group:', error);
            }
        }
    }

    /**
     * Cancel all animations of a specific type
     */
    public cancelAnimationsByType(type: AnimationGroupType): void {
        try {
            const groupsToCancel: string[] = [];

            // Find all groups of the specified type
            this.activeGroups.forEach((group, id) => {
                if (group.type === type) {
                    groupsToCancel.push(id);
                }
            });

            // Cancel each group
            groupsToCancel.forEach(id => {
                this.cancelAnimationGroup(id);
            });

            if (isDevelopment && groupsToCancel.length > 0) {
                console.log(`Cancelled ${groupsToCancel.length} animation groups of type ${type}`);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error cancelling animations by type:', error);
            }
        }
    }

    /**
     * Cancel a specific animation group
     */
    public cancelAnimationGroup(groupId: string): void {
        try {
            const group = this.activeGroups.get(groupId);
            if (!group) return;

            // Kill the timeline
            group.timeline.kill();

            // Remove from active groups
            this.activeGroups.delete(groupId);

            if (isDevelopment) {
                console.log(`Cancelled animation group: ${groupId} (${group.type})`);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error cancelling animation group:', error);
            }
        }
    }

    /**
     * Schedule an animation update with the render scheduler
     */
    public scheduleAnimationUpdate(
        groupType: AnimationGroupType,
        callback: () => void,
        identifier: string = 'animation'
    ): void {
        try {
            // Get the priority for this group type
            const priority = GROUP_PRIORITY_MAP[groupType];

            // Map to update type
            const updateType = PRIORITY_UPDATE_TYPE_MAP[priority];

            // Schedule the update
            this.scheduler.scheduleTypedUpdate(
                identifier,
                updateType,
                callback
            );

            if (isDevelopment) {
                console.log(`Scheduled animation update for ${groupType} with priority ${priority}`);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error scheduling animation update:', error);
            }
        }
    }

    /**
     * Get all active animation groups
     */
    public getActiveGroups(): Map<string, AnimationGroup> {
        return new Map(this.activeGroups);
    }

    /**
     * Check if there are any active animations of a specific type
     */
    public hasActiveAnimationsOfType(type: AnimationGroupType): boolean {
        for (const group of this.activeGroups.values()) {
            if (group.type === type && group.isActive) {
                return true;
            }
        }
        return false;
    }
}

export default AnimationCoordinator;