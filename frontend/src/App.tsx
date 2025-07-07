import React, { useState } from 'react';
import { useMedicines } from './hooks/useMedicines';
import { MedicineCard } from './components/MedicineCard';
import { AddMedicineForm } from './components/AddMedicineForm';
import { Dashboard } from './components/Dashboard';
import { SearchAndFilter } from './components/SearchAndFilter';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Plus, Heart, Wifi, WifiOff } from 'lucide-react';

function App() {
  const { medicines, loading, error, addMedicine, updateMedicineQuantity, deleteMedicine, refetch } = useMedicines();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLowStock, setShowLowStock] = useState(false);

  const handleAddMedicine = async (medicineData: any) => {
    try {
      await addMedicine(medicineData);
      setIsAddFormOpen(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || medicine.category === selectedCategory;
    const matchesLowStock = !showLowStock || medicine.quantity <= medicine.minThreshold;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800">Infirmary Management</h1>
            </div>
          </div>
          <LoadingSpinner message="Loading medicines..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Infirmary Management</h1>
            <div className="flex items-center space-x-2 ml-4">
              {error ? (
                <WifiOff className="w-5 h-5 text-red-500" title="Connection Error" />
              ) : (
                <Wifi className="w-5 h-5 text-green-500" title="Connected" />
              )}
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Keep track of your medical inventory with our comprehensive management system
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={refetch} />
          </div>
        )}

        {!error && (
          <>
            {/* Dashboard */}
            <Dashboard medicines={medicines} />

            {/* Search and Filter */}
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showLowStock={showLowStock}
              onToggleLowStock={setShowLowStock}
            />

            {/* Add Medicine Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Medicine Inventory ({filteredMedicines.length})
              </h2>
              <button
                onClick={() => setIsAddFormOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* Medicine Grid */}
            {filteredMedicines.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No medicines found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedCategory !== 'All' || showLowStock 
                      ? 'Try adjusting your search or filters' 
                      : 'Start by adding your first medicine to the inventory'}
                  </p>
                  {!searchTerm && selectedCategory === 'All' && !showLowStock && (
                    <button
                      onClick={() => setIsAddFormOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Medicine
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedicines.map(medicine => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    onUpdateQuantity={updateMedicineQuantity}
                    onDelete={deleteMedicine}
                  />
                ))}
              </div>
            )}

            {/* Add Medicine Form Modal */}
            <AddMedicineForm
              isOpen={isAddFormOpen}
              onClose={() => setIsAddFormOpen(false)}
              onAddMedicine={handleAddMedicine}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;