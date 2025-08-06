import type { ISliderEngine } from '../../../core/types';

export interface LoopManagerInterface {
  updateConfig: (config: {
    enabled: boolean;
    mode?: string;
    useVirtualSlides?: boolean;
  }) => void;
  getConfig?: () => { mode?: string };
  getVirtualSlides?: () => unknown[];
  on?: (event: string, handler: () => void) => void;
}

export interface EngineWithManagers extends ISliderEngine {
  loopManager?: LoopManagerInterface;
}
