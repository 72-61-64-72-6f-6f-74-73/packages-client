import { BleClient } from '@radroots/capacitor-bluetooth-le';
import type { IClientBluetoothLe, IClientBluetoothLeScanResult } from '../types';

export class CapacitorClientBluetoothLe implements IClientBluetoothLe {
    private _scan_results: IClientBluetoothLeScanResult[] = [];

    private update_scan_results(result: IClientBluetoothLeScanResult): void {
        const existing_result_i = this._scan_results.findIndex(i => i.device.deviceId === result.device.deviceId);
        if (existing_result_i !== -1) this._scan_results[existing_result_i] = result;
        else this._scan_results.push(result);
    }

    public async enabled(): Promise<boolean> {
        try {
            const res = await BleClient.isEnabled();
            return res;
        } catch (e) {
            return false;
        };
    }

    public async initialize(): Promise<boolean> {
        try {
            await BleClient.initialize({
                androidNeverForLocation: false
            });
            if (!this.enabled()) await BleClient.requestEnable();
            return true;
        } catch (e) {
            return false;
        };
    }

    public async scan(): Promise<boolean> {
        try {
            await BleClient.requestLEScan(
                { allowDuplicates: true },
                (result) => this.update_scan_results(result)
            );
            return true;
        } catch (e) {
            return false;
        };
    }

    public async select_device(device_id: string): Promise<IClientBluetoothLeScanResult | undefined> {
        try {
            const res = this._scan_results.find(i => i.device.deviceId === device_id);
            return res;
        } catch (e) { };
    }

    public async select_devices(): Promise<IClientBluetoothLeScanResult[] | undefined> {
        try {
            const res = this._scan_results.length ? this._scan_results : [];
            return res;
        } catch (e) { };
    }
};