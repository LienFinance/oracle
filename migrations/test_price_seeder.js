const testData = require('./test_price.json');

const seedTestPrices = async (testPriceOracle) => {
    console.group('Seeding test prices');
    for (i = 0; i < 25; i++) {
        console.log(i+1, '/', 25);
        item = testData[i];
        await testPriceOracle.registerPrice(item.timestamp, item.price);
    }
    console.groupEnd('Finish Seeding test prices');
};

module.exports = seedTestPrices;