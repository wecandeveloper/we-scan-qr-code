require ('dotenv').config()
const express = require('express');
const cors = require('cors');
const configureDB = require('./app/config/db');
const router = require('./app/routes/common.routes');
const app = express();
const PORT = 5010;

configureDB()
app.use(cors());
app.use(express.json());

app.use('/api', router)

app.get('/', (req, res) => {
  res.send('API Running');
});

app.use("/health", (req, res) => {
    res.status(200).send("Welcome to Backend of Crunchies");
});

// const ProductSchema = new mongoose.Schema({
//   name: String,
//   price: Number
// });

// const Product = mongoose.model('Product', ProductSchema);

// app.post('/add', async (req, res) => {
//   try {
//     console.log("Request Body:", req.body); // Confirm request body

//     const { name, price } = req.body;

//     if (!name || !price) {
//       return res.status(400).json({ error: "Name and Price are required" });
//     }

//     const product = new Product({ name, price });
//     await product.save();

//     res.json({ message: "Product Added", product });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server Error" });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});