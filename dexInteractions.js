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


// Create smart contract instances
const traderJoePair = new ethers.Contract(traderJoePairAddress, joeABI, provider);
const pangolinPair = new ethers.Contract(pangolinPairAddress, pangolinPairABI, provider);
const sushiPair = new ethers.Contract(sushiPairAddress, sushiPairABI, provider);

// Obtención de precios a través de reserves, para obtener los últimos precios de cuánto valen

// function to get the price of AVAX in terms of WETH
async function getLatestPrices() {
  try {
      // console.log("Antes del error")
      const reservesTraderJoe = await traderJoePair.getReserves();
      // console.log("Reservas de Trader Joe:", reservesTraderJoe);
      const reservesPangolin = await pangolinPair.getReserves();
      const reservesSushi = await sushiPair.getReserves();
      // console.log("Reservas de Pangolin", reservesPangolin);
      // console.log("Reservas de SushiSwap:", reservesSushi);

      // Convertir las reservas de wei a Ether
      const reserveAVAXTraderJoe = ethers.formatUnits(reservesTraderJoe[0], 'wei');
      const reserveWETHTraderJoe = ethers.formatUnits(reservesTraderJoe[1], 'wei');
      const reserveWAVAXPangolin = ethers.formatUnits(reservesPangolin[0], 'wei');
      const reserveWETHPangolin = ethers.formatUnits(reservesPangolin[1], 'wei');
      const reserveAVAXSushi = ethers.formatUnits(reservesSushi[0], 'wei');
      const reserveWETHSushi = ethers.formatUnits(reservesSushi[1], 'wei');

      // Calcular el precio 8Margina - no real) de AVAX en términos de WETH
      const priceTraderJoe = Number(reserveWETHTraderJoe) / Number(reserveAVAXTraderJoe);
      const pricePangolin = Number(reserveWETHPangolin) / Number(reserveWAVAXPangolin);
      const priceSushi = Number(reserveWETHSushi) / Number(reserveAVAXSushi);

      console.log("Precio en Trader Joe:", priceTraderJoe);
      console.log("Precio en WAVAX por WETH Pangolin:", pricePangolin);
      console.log("Precio en AVAX por WETH Sushi:", priceSushi);


      const precios = {
        'Trader Joe': priceTraderJoe,
        'Pangolin':   pricePangolin,
        'Sushi':      priceSushi,
      };

      // Ordena precio ascendente
      const ordenados = Object.entries(precios).sort((a, b) => a[1] - b[1]);

      const menorPrecioDex = ordenados[0][0];
      const menorValor     = ordenados[0][1];
      const mayorPrecioDex = ordenados[ordenados.length - 1][0];
      const mayorValor     = ordenados[ordenados.length - 1][1];

      const mayorPrecio = mayorPrecioDex;
      const diferenciaPorcentaje = ((mayorValor - menorValor) / menorValor) * 100;

      console.log(`MENOR PRECIO: ${menorPrecioDex} (${menorValor})`);
      console.log(`MAYOR PRECIO: ${mayorPrecioDex} (${mayorValor})`);
      console.log(`Diferencia porcentual: ${diferenciaPorcentaje.toFixed(7)}%`);
        
      //Comprobar si la diferencia supera el umbral

        if (diferenciaPorcentaje > 0.4) {
          console.log('\x1b[36m%s\x1b[0m', `Oportunidad de Swap de ${menorPrecioDex} a ${mayorPrecioDex} \x1b[0m`);
          // await realizarSwap(); ---
        }
        return {
            traderJoePrice: priceTraderJoe,
            pangolinPrice: pricePangolin,
            sushiPrice: priceSushi,
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

//Swap routing idea
async function realizarSwap(menorPrecioDex, mayorPrecioDex) {
  // TODO:mejorr logica pasar cantidad, tokenorigne y tokendestino 

  const origenDex  = menorPrecioDex; // DEX MÁS BARATO
  const destinoDex = mayorPrecioDex; // DEX MÁS CARO

  const ruta = `${origenDex}-${destinoDex}`;
  console.log('[realizarSwap] RUTA SELECCIONADA:', ruta);

  switch (ruta) {
    case 'Sushi-Trader Joe':
      await swapSushiTrader(/* CANTIDAD, TOKEN_ORIGEN, TOKEN_DESTINO */);
      break;
    case 'Trader Joe-Sushi':
      await swapTraderSushi(/* CANTIDAD, TOKEN_ORIGEN, TOKEN_DESTINO */);
      break;
    case 'Sushi-Pangolin':
      await swapSushiPango(/* CANTIDAD, TOKEN_ORIGEN, TOKEN_DESTINO */);
      break;
    case 'Trader Joe-Pangolin':
      await swapTraderPango(/* CANTIDAD, TOKEN_ORIGEN, TOKEN_DESTINO */);
      break;
    case 'Pangolin-Trader Joe':
      await swapPangoTrader(/* CANTIDAD, TOKEN_ORIGEN, TOKEN_DESTINO */);
      break;
    case 'Pangolin-Sushi':
      await swapPangoSushi(/* CANTIDAD, TOKEN_ORIGEN, TOKEN_DESTINO */);
      break;
    default:
      console.log('No hay oportunidad de arbitraje significativa en este momento.');
  }
}


async function swapSushiTrader(/* cantidad, tokenOrigen, tokenDestino */) { console.log('[swapSushiTrader] PLACEHOLDER'); }
async function swapTraderSushi(/* cantidad, tokenOrigen, tokenDestino */) { console.log('[swapTraderSushi] PLACEHOLDER'); }
async function swapSushiPango(/* cantidad, tokenOrigen, tokenDestino */)   { console.log('[swapSushiPango] PLACEHOLDER'); }
async function swapTraderPango(/* cantidad, tokenOrigen, tokenDestino */)  { console.log('[swapTraderPango] PLACEHOLDER'); }
async function swapPangoTrader(/* cantidad, tokenOrigen, tokenDestino */)  { console.log('[swapPangoTrader] PLACEHOLDER'); }
async function swapPangoSushi(/* cantidad, tokenOrigen, tokenDestino */)   { console.log('[swapPangoSushi] PLACEHOLDER'); }

module.exports = {
  getLatestPrices,
};
