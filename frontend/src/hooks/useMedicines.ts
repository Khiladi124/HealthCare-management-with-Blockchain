import { useState, useEffect } from 'react';
import { apiService, Medicine, MedicineFormData } from '../services/api';

export const useMedicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllMedicines();
      setMedicines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medicines');
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = async (medicineData: MedicineFormData) => {
    try {
      const newMedicine = await apiService.createMedicine(medicineData);
      setMedicines(prev => [...prev, newMedicine]);
      return newMedicine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add medicine';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMedicineQuantity = async (id: string, newQuantity: number) => {
    try {
      const updatedMedicine = await apiService.updateMedicineQuantity(id, newQuantity);
      setMedicines(prev => 
        prev.map(medicine => 
          medicine.id === id ? updatedMedicine : medicine
        )
      );
      return updatedMedicine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update medicine quantity';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      await apiService.deleteMedicine(id);
      setMedicines(prev => prev.filter(medicine => medicine.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete medicine';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  return {
    medicines,
    loading,
    error,
    addMedicine,
    updateMedicineQuantity,
    deleteMedicine,
    refetch: fetchMedicines,
  };
};