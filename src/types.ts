import { type BatteryInfo, type DeviceInfo } from '@capacitor/device';
import { ConnectToWifiResult, type GetCurrentWifiResult, type ScanWifiResult } from '@radroots/capacitor-wifi';

export type IClient = {
    platform: IClientPlatform;
    keystore: IClientKeystore;
    device: IClientDevice;
    haptics: IClientHaptics;
    network: IClientNetwork;
    preferences: IClientPreferences;
    share: IClientShare;
    wifi: IClientWifi;
};

export type IClientPlatform = `androiď` | `ios` | `web`;

export type IClientKeystore = {
    init: () => Promise<void>;
    set(key: string, val: string): Promise<boolean>;
    get(key: string): Promise<string | undefined>;
    keys(): Promise<string[] | undefined>;
    remove(key: string): Promise<boolean>;
};

export type CapacitorDeviceInfo = DeviceInfo;
export type CapacitorDeviceBatteryInfo = BatteryInfo;

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

export type IClientNetworkConnectionType = `wifi` | `cellular` | `none` | `unknown`;

export type IClientNetworkConnection = {
    connected: boolean;
    connection_type: IClientNetworkConnectionType;
};

export type IClientNetwork = {
    status(): Promise<IClientNetworkConnection | undefined>;
    close(): Promise<boolean>;
};

export type IClientPreferences = {
    set(key: string, value: string): Promise<boolean>;
    get(key: string): Promise<string | undefined>;
};

export type ICapacitorShareOpts = {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
    dialog_title?: string;
};

export type IClientShare = {
    status(): Promise<boolean>;
    share(opts: ICapacitorShareOpts): Promise<void>;
};

export type IClientWifiScanResult = ScanWifiResult;
export type IClientWifiCurrentResult = GetCurrentWifiResult;
export type IClientWifiConnectResult = ConnectToWifiResult;

export type IClientWifi = {
    scan: () => Promise<IClientWifiScanResult | undefined>;
    current: () => Promise<IClientWifiCurrentResult | undefined>;
    connect: (ssid: string, password: string) => Promise<IClientWifiConnectResult | undefined>;
    connect_prefix: (ssidPrefix: string, password: string) => Promise<IClientWifiConnectResult | undefined>;
    disconnect: () => Promise<void>
};