const TrustedPriceOracle = artifacts.require('TrustedPriceOracle');
const MarketOracle = artifacts.require('MarketOracle');

module.exports = (deployer, network) => {
  if (network == 'ropsten') {
    deployer.deploy(TrustedPriceOracle, true).then((to) => {
        return deployer.deploy(MarketOracle, to.address, '0x0000000000000000000000000000000000000000');
    });
  }
};