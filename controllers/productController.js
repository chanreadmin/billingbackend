import Product from '../models/productModel.js';

// Create a new product
export const createProduct = async (req, res) => {
    try {
        const { productname, productcode, description, price, servicetype, category, tax } = req.body;
        if (!productname ||!productcode ||!description ||!price ||!servicetype ||!category ||!tax) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const product = new Product({productname, productcode, description, price, servicetype, category, tax});
        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', savedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error });
    }
};

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};

// Update a product
export const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product updated successfully', updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};
