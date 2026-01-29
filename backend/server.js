const express = require('express');
const cors = require('cors');
const db = require('./config/db')

require('dotenv').config();

// create express app and connect to database
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

db();

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
})