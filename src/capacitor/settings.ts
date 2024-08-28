import { AndroidSettings, IOSSettings, NativeSettings } from '@radroots/capacitor-native-settings';
import type { IClientSettings, IClientSettingsOpen, } from '../types';

export class CapacitorClientSettings implements IClientSettings {
    private async open_android(setting: keyof typeof AndroidSettings): Promise<boolean> {
        try {
            const res = await NativeSettings.openAndroid({
                option: AndroidSettings[setting],
            });
            if (typeof res.status === `boolean`) return res.status;
            else return false;
        } catch (e) {
            return false;
        };
    };

    private async open_ios(setting: keyof typeof IOSSettings): Promise<boolean> {
        try {
            const res = await NativeSettings.openIOS({
                option: IOSSettings[setting],
            });
            if (typeof res.status === `boolean`) return res.status;
            else return false;
        } catch (e) {
            return false;
        };
    };

    public async open(opts: IClientSettingsOpen): Promise<boolean> {
        try {
            if (`android` in opts) {
                const { android: { setting } } = opts;
                const res = await this.open_android(setting);
                return res;
            } else {
                const { ios: { setting } } = opts;
                const res = await this.open_ios(setting);
                return res;
            }

        } catch (e) {
            return false;
        };
    };
}
