import React from 'react';
import { Medicine } from '../types/medicine';
import { Activity, AlertTriangle, Package, TrendingUp } from 'lucide-react';

interface DashboardProps {
  medicines: Medicine[];
}

export const Dashboard: React.FC<DashboardProps> = ({ medicines }) => {
  const totalMedicines = medicines.length;
  const totalStock = medicines.reduce((sum, med) => sum + med.quantity, 0);
  const lowStockCount = medicines.filter(med => med.quantity <= med.minThreshold).length;
  const expiringSoon = medicines.filter(med => 
    med.expiryDate && new Date(med.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  const stats = [
    {
      title: 'Total Medicines',
      value: totalMedicines,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      description: 'Unique medicines in inventory'
    },
    {
      title: 'Total Stock',
      value: totalStock,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      description: 'Total units available'
    },
    {
      title: 'Low Stock',
      value: lowStockCount,
      icon: AlertTriangle,
      color: lowStockCount > 0 ? 'bg-red-500' : 'bg-gray-400',
      bgColor: lowStockCount > 0 ? 'bg-red-50' : 'bg-gray-50',
      description: 'Items below threshold'
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon,
      icon: Activity,
      color: expiringSoon > 0 ? 'bg-amber-500' : 'bg-gray-400',
      bgColor: expiringSoon > 0 ? 'bg-amber-50' : 'bg-gray-50',
      description: 'Expires within 30 days'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`${stat.color} p-3 rounded-full transition-transform duration-300 hover:scale-110`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{stat.title}</p>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};