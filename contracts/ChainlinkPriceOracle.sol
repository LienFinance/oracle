pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";
import "./interfaces/PriceOracleInterface.sol";
import "./interfaces/AggregatorInterface.sol";

/**
 * @notice PriceOracle wrapping AggregatorInterface by Chainlink.
 */
contract ChainlinkPriceOracle is PriceOracleInterface {
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    uint256 private constant SECONDS_IN_DAY = 60 * 60 * 24;
    uint8 private constant DECIMALS = 8;
    int256 private constant FLUCTUATION_THRESHOLD = 8; // 800%

    AggregatorInterface public immutable aggregator;

    constructor(AggregatorInterface aggregatorAddress) public {
        aggregator = aggregatorAddress;
    }

    //
    // Implementation of PriceOracleInterface
    //
    /**
     * @notice Returns `true` if the price is updated correctly within last 24 hours.
     * @dev Returns `false` if any exception was thrown in function calls to aggregator.
     */
    function isWorking() external override returns (bool) {
        return
            _isNotDestructed() &&
            _isLatestPriceProper() &&
            _isDecimalNotChanged();
    }

    /**
     * @dev See {PriceOracleInterface-latestId}.
     */
    function latestId() external override returns (uint256) {
        return aggregator.latestRound();
    }

    /**
     * @dev See {PriceOracleInterface-latestPrice}.
     */
    function latestPrice() external override returns (uint256) {
        int256 price = aggregator.latestAnswer();
        return uint256(price);
    }

    /**
     * @dev See {PriceOracleInterface-latestTimestamp}.
     */
    function latestTimestamp() external override returns (uint256) {
        return aggregator.latestTimestamp();
    }

    /**
     * @dev See {PriceOracleInterface-getPrice}.
     */
    function getPrice(uint256 id) external override returns (uint256) {
        int256 price = aggregator.getAnswer(id);
        return uint256(price);
    }

    /**
     * @dev See {PriceOracleInterface-getTimestamp}.
     */
    function getTimestamp(uint256 id) external override returns (uint256) {
        return aggregator.getTimestamp(id);
    }

    /**
     * @dev Returns `true` if the aggregator is not self destructed.
     * After a contract is destructed, size of the code at the address becomes 0.
     */
    function _isNotDestructed() private view returns (bool) {
        address aggregatorAddr = address(aggregator);
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(aggregatorAddr)
        }
        return size != 0;
    }

    /**
     * @dev Returns `true` if the aggregator's latest price value is appropriate.
     * 1. Updated within last 24 hours.
     * 2. More than 0.
     * 3. Not too larger than the previous value.
     * 4. Not too smaller than the previous value.
     * Returns `false` when catch exception.
     */
    function _isLatestPriceProper() private view returns (bool r) {
        try aggregator.latestRoundData() returns (
            uint256 latestRound,
            int256 latestAnswer,
            uint256,
            uint256 updatedAt,
            uint256
        ) {
            // check if `latestRound` is not 0 to avoid under flow on L 111.
            if (latestRound == 0) {
                return r;
            }
            try aggregator.getAnswer(latestRound - 1) returns (
                int256 previousAnswer
            ) {
                // 1. Updated within last 24 hours.
                //check if the aggregator updated the price within last 24 hours.
                if (now.sub(updatedAt) > SECONDS_IN_DAY) {
                    return r;
                }
                // 2. More than 0.
                // check if the latest and the previous price are more than 0.
                if (latestAnswer <= 0) {
                    return r;
                }
                // 3. Not too larger than the previous value.
                // check if the latest price is not too larger than the previous price.
                if (latestAnswer > previousAnswer.mul(FLUCTUATION_THRESHOLD)) {
                    return r;
                }
                // 4. Not too smaller than the previous value.
                // check if the latest price is not too smaller than the previous price.
                if (latestAnswer.mul(FLUCTUATION_THRESHOLD) < previousAnswer) {
                    return r;
                }
                r = true;
            } catch {}
        } catch {}
    }

    /**
     * @dev Returns `true` if the aggregator returns 8 for the decimals.
     * Returns `false` when catch exception.
     * When the aggregator decimals() returns a different value,
     * stop providing data and turn into Recovery phase.
     */
    function _isDecimalNotChanged() private view returns (bool) {
        try aggregator.decimals() returns (uint8 d) {
            return d == DECIMALS;
        } catch {
            return false;
        }
    }
}
