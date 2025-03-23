/**
 * Type fixes for external libraries
 */

// GSAP
declare module 'gsap' {
    export interface Tween {
        // Add any missing properties here
    }

    // Make sure timeline arrays accept Tween instances
    export interface Timeline {
        add(child: Tween | Timeline | string, position?: any, align?: string, stagger?: any): this;
    }
}

// Fix for string arrays
declare global {
    interface Array<T> {
        push(...items: any[]): number;
    }
}