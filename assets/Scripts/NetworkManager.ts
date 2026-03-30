import { sys } from 'cc';

class HttpManager {
    private baseUrl: string = 'https://www.kaoiki.com:2248';
    private token: string | null = null;

    private APIURL = {
        "invoke": "/invoke",
        "event-init": "/event-init/init",
        "novel": "/novel"
    };

    private static instance: HttpManager;

    private constructor() { }

    public static getInstance(): HttpManager {
        if (!HttpManager.instance) {
            HttpManager.instance = new HttpManager();
        }
        return HttpManager.instance;
    }

    public setToken(token: string | null): void {
        this.token = token;
        if (token) {
            sys.localStorage.setItem('auth_token', token);
        } else {
            sys.localStorage.removeItem('auth_token');
        }
    }

    public getToken(): string | null {
        return this.token;
    }

    // 核心：带错误码的请求封装
    private request<T>(url: string, options: {
        method?: string;
        headers?: Record<string, string>;
        body?: any;
    } = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            // 拼接真实地址
            let realUrl = url;
            let query = '';
            if (url.includes('?')) {
                [realUrl, query] = url.split('?');
                realUrl = realUrl as keyof typeof this.APIURL;
                realUrl = this.baseUrl + this.APIURL[realUrl as keyof typeof this.APIURL] + '?' + query;
            } else {
                realUrl = this.baseUrl + this.APIURL[url as keyof typeof this.APIURL];
            }

            const xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', realUrl, true);
            xhr.timeout = 60000000;

            // 请求头
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options.headers,
            };
            if (this.token) {
                headers['token'] = this.token;
            }
            for (const key in headers) {
                xhr.setRequestHeader(key, headers[key]);
            }

            // 加载完成
            xhr.onload = () => {
                const code = xhr.status;
                try {
                    // 正常返回
                    if (code >= 200 && code < 300) {
                        const res = JSON.parse(xhr.responseText);
                        resolve(res);
                    }
                    // HTTP 错误（4xx/5xx）
                    else {
                        let errData = null;
                        try { errData = JSON.parse(xhr.responseText); } catch { }
                        const err = new Error(errData?.msg || `请求错误 ${code}`);
                        (err as any).code = code;
                        (err as any).data = errData;
                        reject(err);
                    }
                } catch (e) {
                    const err = new Error('数据解析失败');
                    (err as any).code = code;
                    reject(err);
                }
            };

            // 网络错误
            xhr.onerror = () => {
                const err = new Error('网络请求失败');
                (err as any).code = 502;
                reject(err);
            };

            // 超时
            xhr.ontimeout = () => {
                const err = new Error('请求超时');
                (err as any).code = 504;
                reject(err);
            };

            xhr.send(options.body ? JSON.stringify(options.body) : null);
        });
    }

    // GET 请求
    public get<T>(url: string, params?: Record<string, any>): Promise<T> {
        let queryString = '';
        if (params) {
            const ps = new URLSearchParams();
            for (const k in params) ps.append(k, String(params[k]));
            queryString = '?' + ps.toString();
        }
        return this.request<T>(url + queryString, { method: 'GET' });
    }

    // POST 请求
    public post<T>(url: string, data?: Record<string, any>): Promise<T> {
        return this.request<T>(url, { method: 'POST', body: data });
    }

    // PUT 请求
    public put<T>(url: string, data?: Record<string, any>): Promise<T> {
        return this.request<T>(url, { method: 'PUT', body: data });
    }

    // DELETE 请求
    public delete<T>(url: string): Promise<T> {
        return this.request<T>(url, { method: 'DELETE' });
    }
}

export const http = HttpManager.getInstance();
export default HttpManager;