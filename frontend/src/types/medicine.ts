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