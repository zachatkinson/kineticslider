import type { ISliderEngine } from '../../core/types';
import type { ConfigurationSystem } from '../../config';
import type { ConfigValidator } from '../../config/config-validator';
import type { DefaultsManager } from '../../config/defaults-manager';
import type { debugLogger } from '../../utils/debug-logger';

declare global {
  interface Window {
    kineticSlider?: {
      engine: ISliderEngine;
      version: string;
    };
    kineticSliderConfig?: {
      ConfigurationSystem: typeof ConfigurationSystem;
      ConfigValidator: typeof ConfigValidator;
      DefaultsManager: typeof DefaultsManager;
      debugLogger: typeof debugLogger;
    };
    sliderInstance?: ISliderEngine;
    __lastInitError?: Error;
  }
}

// This is necessary to make the file a module
export {};