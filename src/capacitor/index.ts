
import { Capacitor } from "@capacitor/core";
import { ClientNostr } from "../nostr";
import type { IClient, IClientBluetoothLe, IClientBrowser, IClientCamera, IClientDatePicker, IClientDevice, IClientDialog, IClientGeolocation, IClientHaptics, IClientHttp, IClientKeystore, IClientNetwork, IClientPlatform, IClientPreferences, IClientShare, IClientWifi, IClientWindow } from "../types";
import { parse_platform } from "../utils";
import { CapacitorClientBluetoothLe } from "./bluetooth-le";
import { CapacitorClientBrowser } from "./browser";
import { CapacitorClientCamera } from "./camera";
import { CapacitorClientDatePicker } from "./date-picker";
import { CapacitorClientDevice } from "./device";
import { CapacitorClientDialog } from "./dialog";
import { CapacitorClientGeolocation } from "./geolocation";
import { CapacitorClientHaptics } from "./haptics";
import { CapacitorClientHttp } from "./http";
import { CapacitorClientKeystore } from "./keystore";
import { CapacitorClientNetwork } from "./network";
import { CapacitorClientPreferences } from "./preferences";
import { CapacitorClientSettings } from "./settings";
import { CapacitorClientShare } from "./share";
import { CapacitorClientSQLite } from "./sql";
import { CapacitorClientWifi } from "./wifi";
import { CapacitorClientWindow } from "./window";

export class ClientCapacitor implements IClient {
    private _nostr: ClientNostr = new ClientNostr();
    private _platform: IClientPlatform = parse_platform(Capacitor.getPlatform());
    private _keystore: IClientKeystore = new CapacitorClientKeystore();
    private _device: IClientDevice = new CapacitorClientDevice();
    private _haptics: IClientHaptics = new CapacitorClientHaptics();
    private _network: IClientNetwork = new CapacitorClientNetwork();
    private _preferences: IClientPreferences = new CapacitorClientPreferences();
    private _share: IClientShare = new CapacitorClientShare();
    private _wifi: IClientWifi = new CapacitorClientWifi();
    private _dialog: IClientDialog = new CapacitorClientDialog();
    private _browser: IClientBrowser = new CapacitorClientBrowser();
    private _dates: IClientDatePicker = new CapacitorClientDatePicker();
    private _geo: IClientGeolocation = new CapacitorClientGeolocation();
    private _http: IClientHttp = new CapacitorClientHttp();
    private _window: IClientWindow = new CapacitorClientWindow();
    private _ble: IClientBluetoothLe = new CapacitorClientBluetoothLe();
    private _camera: IClientCamera = new CapacitorClientCamera();
    private _db: CapacitorClientSQLite = new CapacitorClientSQLite();
    private _settings: CapacitorClientSettings = new CapacitorClientSettings();

    public get nostr() {
        return this._nostr;
    }

    public get platform() {
        return this._platform;
    }

    public get keystore() {
        return this._keystore;
    }

    public get device() {
        return this._device;
    }

    public get haptics() {
        return this._haptics;
    }

    public get network() {
        return this._network;
    }

    public get preferences() {
        return this._preferences;
    }

    public get share() {
        return this._share;
    }

    public get wifi() {
        return this._wifi;
    }

    public get dialog() {
        return this._dialog;
    }

    public get browser() {
        return this._browser;
    }

    public get dates() {
        return this._dates;
    }

    public get geo() {
        return this._geo;
    }

    public get http() {
        return this._http;
    }

    public get window() {
        return this._window;
    }

    public get ble() {
        return this._ble;
    }

    public get camera() {
        return this._camera;
    }

    public get db() {
        return this._db;
    }

    public get settings() {
        return this._settings;
    }
};