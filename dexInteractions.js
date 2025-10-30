require('dotenv').config();
const { ethers } = require('ethers');
const {joeABI, pangolinPairABI, sushiPairABI} = require('./abi/dexes.js');

// Data initialization 
const rpcProvider = process.env.MAINNET_RPC_PROVIDER;
const provider = new ethers.JsonRpcProvider(rpcProvider);
let traderJoePairAddress, pangolinPairAddress, sushiPairAddress;
traderJoePairAddress = process.env.TRADER_JOE_PAIR_WETH_WAVAX_MAINNET;
pangolinPairAddress = process.env.PANGOLIN_PAIR_WETH_WAVAX_MAINNET;
sushiPairAddress = process.env.SUSHISWAP_PAIR_WETH_WAVAX_MAINNET;


// Create smart contract instanecs
const traderJoePair = new ethers.Contract(traderJoePairAddress, joeABI, provider);
const pangolinPair = new ethers.Contract(pangolinPairAddress, pangolinPairABI, provider);
const sushiPair = new ethers.Contract(sushiPairAddress, sushiPairABI, provider);

async function realizarSwap(dex, cantidad, tokenOrigen, tokenDestino) {
  // Lógica interacción smart contract swap
}

// Obtención de precios a través de reserves, para obtener los últimos precios de cuánto valen

// function to get the price of AVAX in terms of WETH
async function getLatestPrices() {
  try {
      // console.log("Antes del error")
      const reservesTraderJoe = await traderJoePair.getReserves();
      console.log("Reservas de Trader Joe:", reservesTraderJoe);
      const reservesPangolin = await pangolinPair.getReserves();
      const reservesSushi = await sushiPair.getReserves();
      console.log("Reservas de Pangolin", reservesPangolin);
      console.log("Reservas de SushiSwap:", reservesSushi);

      // Convertir las reservas de wei a Ether
      const reserveAVAXTraderJoe = ethers.formatUnits(reservesTraderJoe[0], 'wei');
      const reserveWETHTraderJoe = ethers.formatUnits(reservesTraderJoe[1], 'wei');
      const reserveWAVAXPangolin = ethers.formatUnits(reservesPangolin[0], 'wei');
      const reserveWETHPangolin = ethers.formatUnits(reservesPangolin[1], 'wei');
      const reserveAVAXSushi = ethers.formatUnits(reservesSushi[0], 'wei');
      const reserveWETHSushi = ethers.formatUnits(reservesSushi[1], 'wei');

      // Calcular el precio de AVAX en términos de WETH
      const priceTraderJoe = Number(reserveWETHTraderJoe) / Number(reserveAVAXTraderJoe);
      const pricePangolin = Number(reserveWETHPangolin) / Number(reserveWAVAXPangolin);
      const priceSushi = Number(reserveWETHSushi) / Number(reserveAVAXSushi);

      console.log("Precio en Trader Joe:", priceTraderJoe);
      console.log("Precio en WAVAX por WETH Pangolin:", pricePangolin);
      console.log("Precio en AVAX por WETH Sushi:", priceSushi);


      let mayorPrecio;
      let diferenciaPorcentaje;

        if (priceSushi > pricePangolin) {
            mayorPrecio = 'Sushi';
            diferenciaPorcentaje = ((priceSushi - pricePangolin) / pricePangolin) * 100;
        } else if (pricePangolin > priceSushi) {
            mayorPrecio = 'Pangolin';
            diferenciaPorcentaje = ((pricePangolin - priceSushi) / priceSushi) * 100;
        } else {
            mayorPrecio = 'Iguales';
            diferenciaPorcentaje = 0;
        }

        console.log(`Mayor precio: ${mayorPrecio}. Diferencia porcentual: ${diferenciaPorcentaje.toFixed(7)}%`);
        
      //Comprobar si la diferencia supera el umbral: Si la diferencia porcentual es mayor que 0.55%

        if (diferenciaPorcentaje > 0.4) {
          console.log('\x1b[36m%s\x1b[0m', 'Oportunidad de Swap en Pangolin y Sushi \x1b[0m');
          await realizarSwap();
        }
        return {
            traderJoePrice: priceTraderJoe,
            pangolinPrice: pricePangolin,
            sushiPrice: priceSushi,
            mayorPrecio,
            diferenciaPorcentaje: diferenciaPorcentaje.toFixed(2)
        };
    } catch (error) {
        console.error("Error al obtener los precios:", error);
        throw error;
    }
}


// Función para obtener y registrar los precios cada segundo
function startPriceMonitoring() {
  setInterval(async () => {
      try {
          const prices = await getLatestPrices();
          console.log(new Date().toISOString(), prices);
      } catch (error) {
          console.error("Error al obtener los precios:", error);
      }
  }, 1000); // 1000 milisegundos = 1 segundo
}

// Iniciar el monitoreo de precios
startPriceMonitoring();
// getLatestPrices().then(prices => console.log(prices)).catch(error => console.error(error));

module.exports = {
  getLatestPrices,
};
