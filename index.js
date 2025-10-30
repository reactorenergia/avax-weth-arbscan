require('dotenv').config();

const express = require('express');
const { getLatestPrices } = require('./dexInteractions'); // Importa la función de dexInteractions.js

const app = express();
const port = 3000;

// Ruta principal
app.get('/', (req, res) => {
  res.send('Arbitrage Bot Running');
});

// Ruta para obtener los precios
app.get('/prices', async (req, res) => {
  try {
    const prices = await getLatestPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).send('Error fetching prices');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});