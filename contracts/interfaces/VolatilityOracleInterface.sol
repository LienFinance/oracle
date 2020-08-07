pragma solidity 0.6.6;

/**
 * @dev Interface of the volatility oracle.
 */
interface VolatilityOracleInterface {
    /**
     * @dev Returns the latest volatility.
     * Decimals is 8.
     * This is not a view function because in order for gas efficiency, we would sometimes need to store some values during the calculation of volatility value.
     */
    function getVolatility() external returns (uint256);
}
