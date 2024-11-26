const ccxt = require('ccxt')
const moment = require('moment')
require('dotenv').config();
const binance = new ccxt.binance({
    apiKey: process.env.API_KEY,
    secret: process.env.SECRET_KEY,
});
binance.setSandboxMode(true);

async function printBalance(btcPrice) {
    try {
        const balance = await binance.fetchBalance();
        
        // Chỉ in ra số dư khả dụng cho BTC và USDT
        // console.log(balance.info);
        console.log('BTC Balance:', balance.total.BTC);
        console.log('USDT Balance:', balance.total.USDT);

        // Tính toán số dư USDT sau khi trừ đi giá trị BTC
        const btcValueInUSDT = btcPrice * balance.total.BTC;
        const totalUSDT = btcValueInUSDT - balance.total.USDT

        // In ra số dư USDT, đảm bảo không in ra giá trị âm
        console.log(`Total USDT: ${totalUSDT.toFixed(2)}. \n`);
        
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}
async function main(params) {
    while(true){
        await tick()
        await new Promise(resolve => setTimeout(resolve, 60 * 1000))
    }
}
async function tick() {

    const result = await binance.fetchOHLCV('BTC/USDT', '1m', undefined, 5);
    const formatedPrice = result.map(result => {
        return {
            timestamp: moment(result[0]).format(),
            open: result[1],
            high: result[2],
            low: result[3],
            close: result[4],
            volume: result[5],

        }
    })
    const averagePrice = formatedPrice.reduce((acc,price) => acc + price.close,0) / 5
    const lastPrice = formatedPrice[formatedPrice.length - 1].close
    console.log(`averagePrice: ${averagePrice.toFixed(2)}`)
    console.log(`lastPrice: ${lastPrice.toFixed(2)}`)
    console.log(formatedPrice.map(result => result.close),averagePrice,lastPrice)
    const direction = lastPrice > averagePrice ? 'sell' : 'buy'
    const tradeAmount = 100
    const quantity = tradeAmount / lastPrice

    if (typeof direction !== 'string') {
        throw new Error('Direction must be a string');
    }
    printBalance(lastPrice)

    const order = await binance.createMarketOrder('BTC/USDT', direction, quantity)
    console.log(`${moment().format('HH:mm:ss')}: ${direction} ${quantity} BTC at ${lastPrice}`)
}

main();
