import { Preferences } from '@capacitor/preferences';
import type { IClientPreferences } from '../types';

export class CapacitorClientPreferences implements IClientPreferences {
    public async set(key: string, value: string): Promise<boolean> {
        try {
            await Preferences.set({ key, value });
            return true;
        } catch (e) {
            return false;
        };
    }

    public async get(key: string): Promise<string | undefined> {
        try {
            const res = await Preferences.get({ key });
            if (typeof res.value === 'string') return res.value;
        } catch (e) { };
    }
}
