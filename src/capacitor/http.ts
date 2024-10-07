import { CapacitorHttp, type HttpOptions } from '@capacitor/core';
import { err_msg, type ErrorMessage } from '@radroots/utils';
import type { IClientHttp, IClientHttpOpts, IClientHttpResponse } from '../types';

export class CapacitorClientHttp implements IClientHttp {
    public async fetch(opts: IClientHttpOpts): Promise<IClientHttpResponse | ErrorMessage<string>> {
        try {
            const { url, params, data, headers, read_timeout: readTimeout, connect_timeout: connectTimeout } = opts;
            const options: HttpOptions = {
                url,
                params,
                data,
                headers,
                readTimeout,
                connectTimeout,
            };
            if (opts.method && opts.method === `post`) {
                const res: IClientHttpResponse = await CapacitorHttp.post(options);
                return res;
            } else {
                const res: IClientHttpResponse = await CapacitorHttp.get(options);
                return res;
            }
        } catch (e) {
            return err_msg(String(e));
        };
    }
}