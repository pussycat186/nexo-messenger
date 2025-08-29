import { DIDRegistration, STH, Health, WSMessage } from '@shared/schema';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async getHealth(): Promise<Health> {
    return this.request<Health>('/health');
  }

  async registerDID(registration: DIDRegistration): Promise<{ message: string; tree_size: number }> {
    return this.request('/did/register', {
      method: 'POST',
      body: JSON.stringify(registration),
    });
  }

  async getLatestSTH(): Promise<STH> {
    return this.request<STH>('/sth/latest');
  }

  async getSTHChain(limit = 10): Promise<STH[]> {
    return this.request<STH[]>(`/sth/chain?limit=${limit}`);
  }

  async getMetrics(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    return response.text();
  }
}

export const apiClient = new ApiClient();
