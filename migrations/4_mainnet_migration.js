const TrustedPriceOracle = artifacts.require("TrustedPriceOracle");
const MarketOracle = artifacts.require("MarketOracle");

module.exports = async (deployer, network) => {
    if (network == "mainnet" || network == "mainnet-fork") {
        const {
            MARKET_ORACLE_OWNER,
            TRUSTED_PRICE_ORACLE_OWNER,
            CHAINLINK_ADDRESS
        } = process.env;
        await deployer.deploy(TrustedPriceOracle, true);
        const to = await TrustedPriceOracle.deployed();
        await deployer.deploy(MarketOracle, CHAINLINK_ADDRESS, to.address);
        const mo = await MarketOracle.deployed();
        await to.transferOwnership(TRUSTED_PRICE_ORACLE_OWNER);
        await mo.transferOwnership(MARKET_ORACLE_OWNER);
    }
};
