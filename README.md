# Oracle

Oracle system providing price and historical volatility of the price.

![Architecture](documents/images/architecture.png?raw=true "Architecture Of Oracle System")

## Test

Recommended NodeJS version is v10.20.0 because some dependencies are not compatible with the newer versions.

```
yarn
yarn test
```

## Market Oracle

This Contract provides prices and historical volatility of the price.
Without any problems, It continues to refer to one certain price oracle (main oracle).
No one can reassign any other oracle to the main oracle as long as the main oracle is working correctly.
When this contract recognizes that the main oracle is not working correctly (stop updating data, start giving wrong data, self truncated), MarketOracle automatically enters Recovery phase.
 
### Recovery phase

 When Market Oracle turns into Recovery phase, it start to refer to a sub oracle in order to keep providing market data continuously.
 The sub oracle is referred to only in such a case.
 The sub oracle is not expected to be used for long.
 In the meanwhile the owner of Market Oracle finds another reliable oracle and assigns it to the new main oracle.
 If the new main oracle passes some checks, Market Oracle returns to the normal phase from the Recovery phase.
 Owner can reassign the sub oracle anytime.

### Volatility

Volatility is calculated by some last prices provided by the oracle.
Calculating volatility is an expensive task, so Market Oracle stores some intermediate values in storage.

## Chainlink Price Oracle

Chainlink Price Oracle is the first main oracle which refers to the contract that is released and supported by Chainlink. See https://feeds.chain.link/.

## Trusted Price Oracle

Trusted Price Oracle is the first sub oracle. The owner key managed by Lien is used to register price data. This contract is referred to by Market Oracle in emergency.

## Oracle Node

Oracle Node is used by Lien to register price data to Trusted Price Oracle.
