import Category from '../models/categoryModel.js';

// Create a new category
export const createCategory = async (req, res) => {
  
    try {
        const { categoryName} = req.body;
        const category = new Category({ categoryName });
        const savedCategory = await category.save();
        res.status(201).json({ message: 'Category created successfully', savedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('products');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('products');
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category', error });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category updated successfully', updatedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error });
    }
};
