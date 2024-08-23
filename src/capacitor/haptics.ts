import { Haptics, ImpactStyle } from '@capacitor/haptics';
import type { IClientHaptics } from '../types';

export class CapacitorClientHaptics implements IClientHaptics {
    public impact = async (mod?: 'less' | 'more'): Promise<void> => {
        try {
            await Haptics.impact({ style: mod ? mod === `more` ? ImpactStyle.Heavy : ImpactStyle.Light : ImpactStyle.Medium });
        } catch (e) { };
    };

    public vibrate = async (duration?: number): Promise<void> => {
        try {
            await Haptics.vibrate(duration ? { duration } : undefined);
        } catch (e) { };
    };

    public selection_start = async (): Promise<void> => {
        try {
            await Haptics.selectionStart();
        } catch (e) { };
    };

    public selection_changed = async (): Promise<void> => {
        try {
            await Haptics.selectionChanged();
        } catch (e) { };
    };

    public selection_end = async (): Promise<void> => {
        try {
            await Haptics.selectionEnd();
        } catch (e) { };
    };
}
