const TestPriceOracle = artifacts.require('TestPriceOracle');
const MarketOracle = artifacts.require('MarketOracle');
const seedTestPrices = require('./test_price_seeder');

const fs = require('fs');

module.exports = async (deployer, network, [defaultAccount]) => {
    if (network == 'private') {
        const inputFile = process.env.DUMP || 'dump.json';
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

        await deployer.deploy(TestPriceOracle, true);
        const deployedTestPriceOracle = await TestPriceOracle.deployed();
        await seedTestPrices(deployedTestPriceOracle);
        await deployer.deploy(MarketOracle, deployedTestPriceOracle.address, '0x0000000000000000000000000000000000000000');
        const deployedMarketOracle = await MarketOracle.deployed();
        const output = {
            ...data,
            oracle: deployedMarketOracle.address,
        };
        const outputFile = process.env.DUMP || 'dump.json';
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    }
};