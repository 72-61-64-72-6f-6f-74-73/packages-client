import { Dialog } from "@capacitor/dialog";
import type { IClientDialog, IClientDialogPrompt } from "../types";

export class CapacitorClientDialog implements IClientDialog {
    public async alert(message: string): Promise<boolean> {
        try {
            await Dialog.alert({ message });
            return true;
        } catch (e) {
            return false;
        };
    }

    public async confirm(message: string): Promise<boolean> {
        try {
            const res = await Dialog.confirm({ message });
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
