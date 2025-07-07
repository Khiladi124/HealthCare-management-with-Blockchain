import React, { useState } from 'react';
import { Medicine } from '../services/api';
import { Package, AlertTriangle, Plus, Minus, Calendar, Edit2, Trash2, Loader2 } from 'lucide-react';

interface MedicineCardProps {
  medicine: Medicine;
  onUpdateQuantity: (id: string, newQuantity: number) => Promise<Medicine>;
  onDelete: (id: string) => Promise<void>;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onUpdateQuantity, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isLowStock = medicine.quantity <= medicine.minThreshold;
  const isExpiringSoon = medicine.expiryDate && new Date(medicine.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const handleAdjustQuantity = async (operation: 'add' | 'subtract') => {
    const newQuantity = operation === 'add' 
      ? medicine.quantity + adjustAmount
      : Math.max(0, medicine.quantity - adjustAmount);
    
    try {
      setIsUpdating(true);
      await onUpdateQuantity(medicine.id, newQuantity);
      setIsEditing(false);
      setAdjustAmount(1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      try {
        setIsDeleting(true);
        await onDelete(medicine.id);
      } catch (error) {
        console.error('Failed to delete medicine:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl ${
      isLowStock ? 'border-red-500' : 'border-blue-500'
    } ${(isUpdating || isDeleting) ? 'opacity-75' : ''}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${isLowStock ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Package className={`w-6 h-6 ${isLowStock ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{medicine.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{medicine.category}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={isUpdating || isDeleting}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating || isDeleting}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Current Stock</span>
            <span className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {medicine.quantity}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Min. Threshold</span>
            <span className="text-sm text-gray-500">{medicine.minThreshold}</span>
          </div>

          {medicine.expiryDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Expires</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${isExpiringSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {(isLowStock || isExpiringSoon) && (
            <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                {isLowStock && isExpiringSoon ? 'Low stock & expiring soon' :
                 isLowStock ? 'Low stock alert' : 'Expiring soon'}
              </span>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <label className="text-sm font-medium text-gray-700">Adjust by:</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                min="1"
                disabled={isUpdating}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAdjustQuantity('add')}
                disabled={isUpdating}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
              <button
                onClick={() => handleAdjustQuantity('subtract')}
                disabled={isUpdating}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
                <span>Remove</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};