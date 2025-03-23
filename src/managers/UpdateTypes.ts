// src/components/KineticSlider/managers/UpdateTypes.ts

/**
 * @file UpdateTypes.ts
 * @description Defines standard update types and their recommended priorities for KineticSlider.
 * This helps maintain consistent priority assignments across different hooks and components.
 */

/**
 * Priority levels for rendering updates.
 * Higher numbers indicate higher priority.
 * @enum {number}
 */
export enum UpdatePriority {
    /** Background, non-visual updates */
    LOW = 0,
    /** Standard visual updates */
    NORMAL = 1,
    /** Important visual feedback */
    HIGH = 2,
    /** Must-run-immediately updates */
    CRITICAL = 3
}

/**
 * Standard update types for KineticSlider with associated default priorities.
 * @enum {string}
 */
export enum UpdateType {
    /** Background animation effects that aren't immediately visible */
    BACKGROUND_EFFECT = 'background_effect',

    /** Preloading of assets not yet needed */
    ASSET_PRELOAD = 'asset_preload',

    /** Standard text movement and position updates */
    TEXT_POSITION = 'text_position',

    /** Idle effects that show after some time */
    IDLE_EFFECT = 'idle_effect',

    /** Filter updates that aren't critical to user interaction */
    FILTER_UPDATE = 'filter_update',

    /** Updates directly responding to mouse movement */
    MOUSE_RESPONSE = 'mouse_response',

    /** Displacement effects tied to user interaction */
    DISPLACEMENT_EFFECT = 'displacement_effect',

    /** Main slide position and scale during interaction */
    SLIDE_TRANSFORM = 'slide_transform',

    /** Slide transitions between views */
    SLIDE_TRANSITION = 'slide_transition',

    /** Direct user interaction responses */
    INTERACTION_FEEDBACK = 'interaction_feedback',

    /** Loading state changes that affect UI */
    LOADING_STATE = 'loading_state'
}

/**
 * Maps update types to their recommended priority levels.
 * This provides consistency across the application.
 * @type {Record<UpdateType, UpdatePriority>}
 */
export const UPDATE_TYPE_PRIORITIES: Record<UpdateType, UpdatePriority> = {
    // Low priority (background tasks)
    [UpdateType.BACKGROUND_EFFECT]: UpdatePriority.LOW,
    [UpdateType.ASSET_PRELOAD]: UpdatePriority.LOW,

    // Normal priority (standard visual updates)
    [UpdateType.TEXT_POSITION]: UpdatePriority.NORMAL,
    [UpdateType.IDLE_EFFECT]: UpdatePriority.NORMAL,
    [UpdateType.FILTER_UPDATE]: UpdatePriority.NORMAL,

    // High priority (important visual feedback)
    [UpdateType.MOUSE_RESPONSE]: UpdatePriority.HIGH,
    [UpdateType.DISPLACEMENT_EFFECT]: UpdatePriority.HIGH,
    [UpdateType.SLIDE_TRANSFORM]: UpdatePriority.HIGH,

    // Critical priority (must execute immediately)
    [UpdateType.SLIDE_TRANSITION]: UpdatePriority.CRITICAL,
    [UpdateType.INTERACTION_FEEDBACK]: UpdatePriority.CRITICAL,
    [UpdateType.LOADING_STATE]: UpdatePriority.CRITICAL
};

/**
 * Helper function to get the recommended priority for an update type.
 *
 * @param {UpdateType} type - The type of update
 * @returns {UpdatePriority} The recommended priority level
 */
export function getPriorityForUpdateType(type: UpdateType): UpdatePriority {
    return UPDATE_TYPE_PRIORITIES[type] || UpdatePriority.NORMAL;
}

/**
 * Generate a unique update ID for a specific component and update type.
 *
 * @param {string} componentId - ID of the component requesting the update
 * @param {UpdateType} updateType - Type of update
 * @param {string} [suffix] - Optional suffix for further differentiation
 * @returns {string} A unique update ID
 */
export function createUpdateId(
    componentId: string,
    updateType: UpdateType,
    suffix?: string
): string {
    return suffix ?
        `${componentId}:${updateType}:${suffix}` :
        `${componentId}:${updateType}`;
}

/**
 * Interface for hook update helper methods
 * @interface
 */
export interface HookUpdateHelper {
    /**
     * Create an update ID for this hook.
     *
     * @param {UpdateType} updateType - Type of update
     * @param {string} [suffix] - Optional suffix
     * @returns {string} A unique update ID
     */
    createId(updateType: UpdateType, suffix?: string): string;

    /**
     * Get the recommended priority for an update type.
     *
     * @param {UpdateType} updateType - Type of update
     * @returns {UpdatePriority} The recommended priority
     */
    getPriority(updateType: UpdateType): UpdatePriority;
}

/**
 * Utility to help create standard update IDs for hooks.
 *
 * @param {string} hookName - Name of the hook (e.g., 'useMouseTracking')
 * @returns {HookUpdateHelper} An object with methods to create update IDs and get priorities
 */
export function createHookUpdateHelper(hookName: string): HookUpdateHelper {
    return {
        /**
         * Create an update ID for this hook.
         *
         * @param {UpdateType} updateType - Type of update
         * @param {string} [suffix] - Optional suffix
         * @returns {string} A unique update ID
         */
        createId(updateType: UpdateType, suffix?: string): string {
            return createUpdateId(hookName, updateType, suffix);
        },

        /**
         * Get the recommended priority for an update type.
         *
         * @param {UpdateType} updateType - Type of update
         * @returns {UpdatePriority} The recommended priority
         */
        getPriority(updateType: UpdateType): UpdatePriority {
            return getPriorityForUpdateType(updateType);
        }
    };
}