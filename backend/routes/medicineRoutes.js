import express from 'express';
import Medicine from '../models/medicine.model.js';

const medicineRouter = express.Router();

// GET /api/medicines - Get all medicines with optional filtering
medicineRouter.get('/', async (req, res) => {
  try {
    console.log('Fetching all medicines with filters:', req.query);
    const { category, lowStock, expiringSoon, search } = req.query;
    let query = {};

    // Build query based on filters
    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    let medicines = await Medicine.find(query).sort({ createdAt: -1 });

    // Apply client-side filters for complex conditions
    if (lowStock === 'true') {
      medicines = medicines.filter(med => med.quantity <= med.minThreshold);
    }

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      medicines = medicines.filter(med => 
        med.expiryDate && new Date(med.expiryDate) <= thirtyDaysFromNow
      );
    }

    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ 
      error: 'Failed to fetch medicines',
      details: error.message 
    });
  }
});

// GET /api/medicines/stats - Get dashboard statistics
medicineRouter.get('/stats', async (req, res) => {
  try {
    console.log('Fetching medicine statistics');
    const totalMedicines = await Medicine.countDocuments();
    const totalStock = await Medicine.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    
    const lowStockMedicines = await Medicine.find().then(medicines => 
      medicines.filter(med => med.quantity <= med.minThreshold)
    );
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = await Medicine.countDocuments({
      expiryDate: {
        $exists: true,
        $lte: thirtyDaysFromNow
      }
    });

    res.json({
      totalMedicines,
      totalStock: totalStock[0]?.total || 0,
      lowStockCount: lowStockMedicines.length,
      expiringSoon
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

// GET /api/medicines/:id - Get a specific medicine
medicineRouter.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid medicine ID format' });
    }
    res.status(500).json({ 
      error: 'Failed to fetch medicine',
      details: error.message 
    });
  }
});

// POST /api/medicines - Create a new medicine
medicineRouter.post('/', async (req, res) => {
  try {
    const { name, quantity, minThreshold, category, expiryDate } = req.body;
    console.log('Creating medicine with data:', req.body);
    // Check if medicine with same name already exists
    const existingMedicine = await Medicine.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingMedicine) {
      return res.status(400).json({ 
        error: 'Medicine with this name already exists' 
      });
    }

    const medicineData = {
      name: name.trim(),
      quantity: parseInt(quantity),
      minThreshold: parseInt(minThreshold) || 10,
      category,
    };

    if (expiryDate) {
      medicineData.expiryDate = new Date(expiryDate);
    }

    const medicine = new Medicine(medicineData);
    await medicine.save();

    res.status(201).json(medicine);
  } catch (error) {
    console.error('Error creating medicine:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create medicine',
      details: error.message 
    });
  }
});

// PUT /api/medicines/:id/quantity - Update medicine quantity
medicineRouter.put('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { quantity: parseInt(quantity) },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error updating medicine quantity:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid medicine ID format' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update medicine quantity',
      details: error.message 
    });
  }
});

// PUT /api/medicines/:id - Update entire medicine
medicineRouter.put('/:id', async (req, res) => {
  try {
    const { name, quantity, minThreshold, category, expiryDate } = req.body;
    
    const updateData = {
      name: name?.trim(),
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      minThreshold: minThreshold !== undefined ? parseInt(minThreshold) : undefined,
      category,
    };

    if (expiryDate) {
      updateData.expiryDate = new Date(expiryDate);
    } else if (expiryDate === '') {
      updateData.expiryDate = undefined;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid medicine ID format' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update medicine',
      details: error.message 
    });
  }
});

// DELETE /api/medicines/:id - Delete a medicine
medicineRouter.delete('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ 
      message: 'Medicine deleted successfully',
      deletedMedicine: medicine 
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid medicine ID format' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete medicine',
      details: error.message 
    });
  }
});

// DELETE /api/medicines - Delete multiple medicines
medicineRouter.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid medicine IDs provided' });
    }

    const result = await Medicine.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: `${result.deletedCount} medicines deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting medicines:', error);
    res.status(500).json({ 
      error: 'Failed to delete medicines',
      details: error.message 
    });
  }
});

export default medicineRouter;