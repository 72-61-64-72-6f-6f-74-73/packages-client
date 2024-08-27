import { Share } from '@capacitor/share';
import type { IClientShare, IClientShareOpts } from '../types';

export class CapacitorClientShare implements IClientShare {
    public async status(): Promise<boolean> {
        try {
            const res = await Share.canShare();
            if (res && typeof res.value === `boolean`) return res.value;
            return false;
        } catch (e) {
            return false;
        };
    }

    public async open(opts: IClientShareOpts): Promise<void> {
        try {
            const { title, text, url, files, dialog_title: dialogTitle } = opts;
            await Share.share({
                title,
                text,
                url,
                files,
                dialogTitle
            });
        } catch (e) { };
    }
}


