require ('dotenv').config()
const express = require('express');
const cors = require('cors');
const configureDB = require('./app/config/db');
const router = require('./app/routes/common.routes');
const app = express();
const PORT = 5030;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});