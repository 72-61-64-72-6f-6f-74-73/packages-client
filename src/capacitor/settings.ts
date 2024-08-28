import { AndroidSettings, IOSSettings, NativeSettings } from '@radroots/capacitor-native-settings';
import type { IClientSettings, } from '../types';

export class CapacitorClientSettings implements IClientSettings {
    public async open(): Promise<boolean> {
        try {
            const res = await NativeSettings.open({
                optionAndroid: AndroidSettings.ApplicationDetails,
                optionIOS: IOSSettings.App
            });
            if (typeof res.status === `boolean`) return res.status;
            else return false;
        } catch (e) {
            return false;
        };
    };
}
