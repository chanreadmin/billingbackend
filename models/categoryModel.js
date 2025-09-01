import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true },
   
    // Optional: an array of references to the Product model if you want to list products under each category
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);

export default Category;
