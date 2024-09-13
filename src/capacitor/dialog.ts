import { type ConfirmOptions, Dialog } from "@capacitor/dialog";
import type { IClientDialog, IClientDialogConfirmOpts, IClientDialogPrompt } from "../types";

export class CapacitorClientDialog implements IClientDialog {
    public async alert(message: string): Promise<boolean> {
        try {
            await Dialog.alert({ message });
            return true;
        } catch (e) {
            return false;
        };
    }

    public async confirm(opts: IClientDialogConfirmOpts): Promise<boolean> {
        try {
            const message = typeof opts === `string` ? opts : opts.message;
            const options: ConfirmOptions = {
                message
            };

            if (typeof opts !== `string`) {
                if (opts.cancel_label) options.cancelButtonTitle = opts.cancel_label;
                if (opts.ok_label) options.okButtonTitle = opts.ok_label;
            }
            const res = await Dialog.confirm(options);
            if (res && typeof res.value === `boolean`) return res.value;
            return false;
        } catch (e) {
            return false;
        };
    }

    public async prompt(opts: IClientDialogPrompt): Promise<string | false> {
        try {
            const { title, message, ok_button_title: okButtonTitle, cancel_button_title: cancelButtonTitle, input_placeholder: inputPlaceholder, input_text: inputText } = opts;
            const res = await Dialog.prompt({
                title,
                message,
                okButtonTitle,
                cancelButtonTitle,
                inputPlaceholder,
                inputText
            });
            if (typeof res.value === `string` && res.cancelled === false) return res.value;
            return false;
        } catch (e) {
            return false;
        };
    }
}
