import { Device } from '@capacitor/device';
import type { CapacitorDeviceBatteryInfo, CapacitorDeviceInfo, IClientDevice } from '../types';


export class CapacitorClientDevice implements IClientDevice {
    public async info(): Promise<CapacitorDeviceInfo | undefined> {
        try {
            const res = await Device.getInfo();
            return res;
        } catch (e) { };
    }

    public async battery(): Promise<CapacitorDeviceBatteryInfo | undefined> {
        try {
            const res = await Device.getBatteryInfo();
            return res;
        } catch (e) { };

    }
}
