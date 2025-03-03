import { AnimationClip } from 'three';
import { VRM } from '@pixiv/three-vrm';

/**
 * Load Mixamo animation, convert for three-vrm use, and return it.
 * @param url A url of mixamo animation data
 * @param vrm A target VRM
 * @returns The converted AnimationClip
 */
export function loadMixamoAnimation(url: string, vrm: VRM): Promise<AnimationClip>; 