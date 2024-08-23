import { CapacitorHttp } from '@capacitor/core';
import type { IClientHttp, IClientHttpOpts, IClientHttpResponse } from '../types';

export class CapacitorClientHttp implements IClientHttp {
    public async get(opts: IClientHttpOpts): Promise<IClientHttpResponse | undefined> {
        try {
            const { url: url, method: method, params: params, data: data, headers: headers, read_timeout: readTimeout, connect_timeout: connectTimeout } = opts;
            const res: IClientHttpResponse = await CapacitorHttp.get({
                url,
                method,
                params,
                data,
                headers,
                readTimeout,
                connectTimeout,
            });
            return res;
        } catch (e) { };
    }

    public async post(opts: IClientHttpOpts): Promise<IClientHttpResponse | undefined> {
        try {
            const { url: url, method: method, params: params, data: data, headers: headers, read_timeout: readTimeout, connect_timeout: connectTimeout } = opts;
            const response: IClientHttpResponse = await CapacitorHttp.post({
                url,
                method,
                params,
                data,
                headers,
                readTimeout,
                connectTimeout,
            });
            return response;
        } catch (e) { };
    }
}