import { type BatteryInfo, type DeviceInfo } from '@capacitor/device';
import { type ScanResult } from '@radroots/capacitor-bluetooth-le';
import { IOSSettings, type AndroidSettings } from '@radroots/capacitor-native-settings';
import { type ConnectToWifiResult, type GetCurrentWifiResult, type PermissionStatus, type ScanWifiResult } from '@radroots/capacitor-wifi';
import { type ErrorResponse } from '@radroots/utils';

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
    window: IClientWindow;
    ble: IClientBluetoothLe;
    settings: IClientSettings;
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
    remove(key: string): Promise<boolean>;
};

export type IClientShareOpenOpts = {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
    dialog_title?: string;
};

export type IClientShare = {
    status(): Promise<boolean>;
    open(opts: IClientShareOpenOpts): Promise<void>;
};

export type IClientWifiPermissionsStatus = PermissionStatus;
export type IClientWifiScanResult = ScanWifiResult;
export type IClientWifiCurrentResult = GetCurrentWifiResult;
export type IClientWifiConnectResult = ConnectToWifiResult;

export type IClientWifi = {
    scan: () => Promise<IClientWifiScanResult | undefined>;
    current: () => Promise<IClientWifiCurrentResult | undefined>;
    connect: (ssid: string, password: string) => Promise<IClientWifiConnectResult | undefined>;
    connect_prefix: (ssidPrefix: string, password: string) => Promise<IClientWifiConnectResult | undefined>;
    disconnect: () => Promise<void>;
    check_permissions: () => Promise<IClientWifiPermissionsStatus | undefined>;
    request_permissions: () => Promise<IClientWifiPermissionsStatus | undefined>;
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

export type IGeolocationErrorMessage = `permissions-required`;

export type IClientGeolocation = {
    current(): Promise<IClientGeolocationPosition | undefined | IGeolocationErrorMessage>;
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

export type IClientWindow = {
    splash_hide(): Promise<void>;
    splash_show(showDuration?: number): Promise<void>;
    status_hide(): Promise<void>;
    status_show(): Promise<void>;
    status_style(style: "light" | "dark"): Promise<void>;
};

export type IClientBluetoothLeScanResult = ScanResult;

export type IClientBluetoothLe = {
    enabled(): Promise<boolean>;
    initialize(): Promise<boolean>;
    scan(): Promise<boolean>;
    select_device(device_id: string): Promise<IClientBluetoothLeScanResult | undefined>;
    select_devices(): Promise<IClientBluetoothLeScanResult[] | undefined>;
};

export type IClientCamera = {
    enabled(): Promise<OsPhotosPermissions | ErrorResponse>;
    request_enabled(): Promise<OsPhotosPermissions | ErrorResponse>;
    get_photo(opts: OsPhotoSelectOptions): Promise<OsPhoto | ErrorResponse>;
    get_photos(opts: OsPhotoGallerySelectOptions): Promise<OsPhotoGallery[] | ErrorResponse>;
};

export type OsPhotoSelectOptionsBase = {
    quality?: number;
    width?: number;
    height?: number;
    correct_orientation?: boolean;
};

export type OsPhotoSelectOptions = OsPhotoSelectOptionsBase & {
    allow_editing?: boolean;
    result_type: 'uri' | 'base64' | 'dataUrl';
    save_to_gallery?: boolean;
    prompt_label_header?: string;
    prompt_label_cancel?: string;
    prompt_label_photo?: string;
    prompt_label_picture?: string;
};

export type OsPhotoGallerySelectOptions = OsPhotoSelectOptionsBase & {
    limit?: number;
};

export type OsPhoto = {
    base64_string?: string;
    data_url?: string;
    path?: string;
    web_path?: string;
    exif?: any;
    format: string;
    saved: boolean;
};

export type OsPhotoGallery = {
    path?: string;
    web_path: string;
    exif?: any;
    format: string;
};

export type OsPhotosPermissions = {
    camera: string;
    photos: string;
};

export type IClientSettingsOpenAndroid = {
    android: {
        setting: keyof typeof AndroidSettings;
    }
};

export type IClientSettingsOpenIos = {
    ios: {
        setting: keyof typeof IOSSettings;
    }
};

export type IClientSettingsOpen = IClientSettingsOpenAndroid | IClientSettingsOpenIos;

export type IClientSettings = {
    open(opts: IClientSettingsOpen): Promise<boolean>;
};