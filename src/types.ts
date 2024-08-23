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
    dialog: IClientDialog;
    browser: IClientBrowser;
    dates: IClientDatePicker;
    geo: IClientGeolocation;
    http: IClientHttp;
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

export type IClientShareOpts = {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
    dialog_title?: string;
};

export type IClientShare = {
    status(): Promise<boolean>;
    share(opts: IClientShareOpts): Promise<void>;
};

export type IClientWifiScanResult = ScanWifiResult;
export type IClientWifiCurrentResult = GetCurrentWifiResult;
export type IClientWifiConnectResult = ConnectToWifiResult;

export type IClientWifi = {
    scan: () => Promise<IClientWifiScanResult | undefined>;
    current: () => Promise<IClientWifiCurrentResult | undefined>;
    connect: (ssid: string, password: string) => Promise<IClientWifiConnectResult | undefined>;
    connect_prefix: (ssidPrefix: string, password: string) => Promise<IClientWifiConnectResult | undefined>;
    disconnect: () => Promise<void>;
};

export type IClientDialogPrompt = {
    title?: string;
    message: string;
    ok_button_title?: string;
    cancel_button_title?: string;
    input_placeholder?: string;
    input_text?: string;
};

export type IClientDialog = {
    alert(message: string): Promise<boolean>;
    confirm(message: string): Promise<boolean>;
    prompt(opts: IClientDialogPrompt): Promise<string | false>;
};

export type IClientBrowser = {
    open(url: string): Promise<void>;
};

export type IClientDatePickerPresentDatesMode = `date` | `time` | `dateAndTime`;

export type IClientDatePickerPresent = {
    mode: IClientDatePickerPresentDatesMode;
};

export type IClientDatePicker = {
    present(opts: IClientDatePickerPresent): Promise<string | undefined>;
};

export type IClientGeolocationPosition = {
    lat: number;
    lng: number;
    accuracy: number | undefined;
    altitude: number | undefined;
    altitude_accuracy: number | undefined;
};

export type IClientGeolocation = {
    current(): Promise<IClientGeolocationPosition | undefined>;
};

export type IClientHttpOpts = {
    url: string;
    method?: string;
    params?: {
        [key: string]: string | string[];
    };
    data?: any;
    headers?: {
        [key: string]: string;
    };
    read_timeout?: number;
    connect_timeout?: number;
};

export type IClientHttpResponse = {
    data: any;
    status: number;
    headers: {
        [key: string]: string;
    };
    url: string;
};

export type IClientHttp = {
    get(opts: IClientHttpOpts): Promise<IClientHttpResponse | undefined>;
    post(opts: IClientHttpOpts): Promise<IClientHttpResponse | undefined>;
};