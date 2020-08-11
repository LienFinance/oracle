const TrustedPriceOracle = artifacts.require("TrustedPriceOracle");
const ChainlinkPriceOracle = artifacts.require("ChainlinkPriceOracle");
const MarketOracle = artifacts.require("MarketOracle");

module.exports = async (deployer, network) => {
    if (network == "mainnet" || network == "mainnet-fork") {
        const {
            MARKET_ORACLE_OWNER,
            TRUSTED_PRICE_ORACLE_OWNER,
            CHAINLINK_ADDRESS
        } = process.env;
        await deployer.deploy(TrustedPriceOracle);
        await deployer.deploy(ChainlinkPriceOracle, CHAINLINK_ADDRESS);
        const to = await TrustedPriceOracle.deployed();
        const co = await ChainlinkPriceOracle.deployed();
        await deployer.deploy(MarketOracle, co.address, to.address);
        const mo = await MarketOracle.deployed();
        await to.transferOwnership(TRUSTED_PRICE_ORACLE_OWNER);
        await mo.transferOwnership(MARKET_ORACLE_OWNER);
    }
};
