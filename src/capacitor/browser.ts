import { Browser } from '@capacitor/browser';
import type { IClientBrowser } from '../types';

export class CapacitorClientBrowser implements IClientBrowser {
    public async open(url: string): Promise<void> {
        try {
            await Browser.open({ url });
        } catch (e) { };
    }
}
