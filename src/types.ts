import { type BatteryInfo, type DeviceInfo } from '@capacitor/device';

export type CapacitorDeviceInfo = DeviceInfo;
export type CapacitorDeviceBatteryInfo = BatteryInfo;

export type IClient = {
    platform: IClientPlatform;
    keystore: IClientKeystore;
    device: IClientDevice;
    haptics: IClientHaptics;
};

export type IClientPlatform = `androiď` | `ios` | `web`;

export type IClientKeystore = {
    init: () => Promise<void>;
    set(key: string, val: string): Promise<boolean>;
    get(key: string): Promise<string | undefined>;
    keys(): Promise<string[] | undefined>;
    remove(key: string): Promise<boolean>;
};

export type IClientDevice = {
    info(): Promise<CapacitorDeviceInfo | undefined>;
    battery(): Promise<CapacitorDeviceBatteryInfo | undefined>;
};

export type IClientHaptics = {
    impact: (mod?: "less" | "more") => Promise<void>;
    vibrate: (duration?: number) => Promise<void>;
    selection_start: () => Promise<void>;
    selection_changed: () => Promise<void>;
    selection_end: () => Promise<void>;
};