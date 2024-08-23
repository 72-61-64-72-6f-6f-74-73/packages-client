import { DatePicker } from '@radroots/capacitor-date-picker';
import type { IClientDatePicker, IClientDatePickerPresent } from '../types';

export class CapacitorClientDatePicker implements IClientDatePicker {
    public async present(opts: IClientDatePickerPresent): Promise<string | undefined> {
        try {
            const res = await DatePicker.present({
                mode: opts.mode,
                ios: {
                    style: "wheels",
                },
            });
            if (typeof res.value === `string`) return res.value;
        } catch (e) { };
    };
}
