import { sys } from 'cc';

class HttpManager {
    // ✅ 显式声明所有私有属性（这是关键！）
    private baseUrl: string = 'https://www.kaoiki.com:3333/api/v1';
    private token: string | null = null;
    // url配置
    private APIURL = {
        "auth-login-guest":"/auth/login/guest",
    }

    private static instance: HttpManager;

    private constructor() {} // 私有构造函数，确保单例

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

    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        
        const fullUrl = this.baseUrl + this.APIURL[url];
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['token'] = `${this.token}`;
        }

        const finalOptions: RequestInit = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(fullUrl, finalOptions);

            if (!response.ok) {
                let errorMsg = `HTTP Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg += ` - ${JSON.stringify(errorData)}`;
                } catch {}
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return (await response.text()) as unknown as T;
            }
        } catch (error) {
            console.error('[HttpManager] 请求失败:', url, error);
            throw error;
        }
    }

    public get<T>(url: string, params?: Record<string, any>): Promise<T> {
        let queryString = '';
        if (params) {
            const searchParams = new URLSearchParams();
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    searchParams.append(key, String(params[key]));
                }
            }
            queryString = '?' + searchParams.toString();
        }
        return this.request<T>(url + queryString, { method: 'GET' });
    }

    public post<T>(url: string, data?: Record<string, any>): Promise<T> {
        return this.request<T>(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    public put<T>(url: string, data?: Record<string, any>): Promise<T> {
        return this.request<T>(url, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    public delete<T>(url: string): Promise<T> {
        return this.request<T>(url, { method: 'DELETE' });
    }
}

export const http = HttpManager.getInstance();
export default HttpManager;