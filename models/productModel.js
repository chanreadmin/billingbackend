import mongoose from "mongoose";
const ProductSchema = new mongoose.Schema({
    productname: { type: String, required: true },
    productcode: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    servicetype: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tax: { type: String, required: true }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

export default Product;
