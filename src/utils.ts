import type { ErrorResponse, IClientPlatform } from "./types";

/*export enum IClientCameraResultTypeEnum {
    Uri = "uri",
    Base64 = "base64",
    DataUrl = "dataUrl"
};*/

export function parse_platform(str: string): IClientPlatform {
    switch (str) {
        case `ios`:
        case `androiď`:
        case `web`:
            return str;
        default:
            return `web`;
    };
};

export function fmt_location_coords(number: number): number {
    return Math.round(number * 1e7) / 1e7;
};

export const err_msg = (e: unknown): ErrorResponse => {
    const error = (e as Error).message ? (e as Error).message : String(e);
    return { error };
};
