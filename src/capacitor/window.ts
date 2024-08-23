import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { IClientWindow } from '../types';

export class CapacitorClientWindow implements IClientWindow {
    public async splash_hide(): Promise<void> {
        try {
            await SplashScreen.hide();
        } catch (e) { };
    }

    public async splash_show(showDuration?: number): Promise<void> {
        try {
            await SplashScreen.show({
                showDuration,
                autoHide: showDuration ? true : false,
            });
        } catch (e) { };
    }

    public async status_hide(): Promise<void> {
        try {
            await StatusBar.hide();
        } catch (e) { };
    }

    public async status_show(): Promise<void> {
        try {
            await StatusBar.show();
        } catch (e) { };
    }

    public async status_style(style: 'light' | 'dark'): Promise<void> {
        try {
            await StatusBar.setStyle({ style: style === 'light' ? Style.Light : Style.Dark });
        } catch (e) { };
    }
}
