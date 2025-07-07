const API_BASE_URL = 'http://localhost:5000/api';

export interface Medicine {
  id: string;
  name: string;
  quantity: number;
  minThreshold: number;
  category: string;
  expiryDate?: string;
  addedDate: string;
}

export interface MedicineFormData {
  name: string;
  quantity: number;
  minThreshold: number;
  category: string;
  expiryDate?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getAllMedicines(): Promise<Medicine[]> {
    return this.request<Medicine[]>('/medicines');
  }

  async getMedicine(id: string): Promise<Medicine> {
    return this.request<Medicine>(`/medicines/${id}`);
  }

  async createMedicine(medicineData: MedicineFormData): Promise<Medicine> {
    return this.request<Medicine>('/medicines', {
      method: 'POST',
      body: JSON.stringify(medicineData),
    });
  }

  async updateMedicineQuantity(id: string, quantity: number): Promise<Medicine> {
    return this.request<Medicine>(`/medicines/${id}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async deleteMedicine(id: string): Promise<void> {
    await this.request<void>(`/medicines/${id}`, {
      method: 'DELETE',
    });
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }
}

export const apiService = new ApiService();