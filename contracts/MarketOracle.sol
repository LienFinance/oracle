pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interfaces/PriceOracleInterface.sol";
import "./interfaces/VolatilityOracleInterface.sol";

/**
 * @notice Market data oracle. It provides prices and historical volatility of the price.
 * Without any problems, It continues to refer to one certain price oracle (main oracle).
 * No one can reassign any other oracle to the main oracle as long as the main oracle is working correctly.
 * When this contract recognizes that the main oracle is not working correctly (stop updating data, start giving wrong data, self truncated), MarketOracle automatically enters Recovery phase.
 *
 * [Recovery phase]
 * When it turns into Recovery phase, it start to refer to a sub oracle in order to keep providing market data continuously.
 * The sub oracle is referred to only in such a case.
 * The sub oracle is not expected to be used for long.
 * In the meanwhile the owner of MarketOracle finds another reliable oracle and assigns it to the new main oracle.
 * If the new main oracle passes some checks, MarketOracle returns to the normal phase from the Recovery phase.
 * Owner can reassign the sub oracle anytime.
 *
 * Volatility is calculated by some last prices provided by the oracle.
 * Calculating volatility is an expensive task, So MarketOracle stores some intermediate values to storage.
 */
contract MarketOracle is
    Ownable,
    PriceOracleInterface,
    VolatilityOracleInterface
{
    using SafeMath for uint256;
    uint256 public constant VOLATILITY_DATA_NUM = 25;
    uint256 private constant SECONDS_IN_YEAR = 31536000;

    /**
     *@notice If true, this contract is in Recovery phase.
     */
    bool public isRecoveryPhase;
    PriceOracleInterface public mainOracle;
    PriceOracleInterface public subOracle;

    uint256 private exTo;
    uint256 private lastCalculatedVolatility;
    PriceOracleInterface private exVolatilityOracle;
    uint256 private exSquareReturnSum;

    event EnterRecoveryPhase();
    event ReturnFromRecoveryPhase(PriceOracleInterface newMainOracle);
    event SetSubOracle(PriceOracleInterface newSubOracle);
    event VolatilityCalculated(uint256 volatility);

    /**
     * @dev Enters Recovery phase if the main oracle is not working.
     */
    modifier recoveryPhaseCheck() {
        if (!mainOracle.isWorking() && !isRecoveryPhase) {
            emit EnterRecoveryPhase();
            isRecoveryPhase = true;
        }
        _;
    }

    constructor(
        PriceOracleInterface _mainOracle,
        PriceOracleInterface _subOracle
    ) public {
        mainOracle = _mainOracle;
        subOracle = _subOracle;
    }

    /**
     * @notice Assigns `oracle` to the new main oracle and returns to the normal phase from Recovery phase.
     * Only owner can call this function only when the main oracle is not working correctly.
     */
    function setMainOracle(PriceOracleInterface oracle) external onlyOwner {
        require(isRecoveryPhase, "Cannot change working main oracle");
        require(oracle.isWorking(), "New oracle is not working");
        mainOracle = oracle;
        isRecoveryPhase = false;
        emit ReturnFromRecoveryPhase(oracle);
    }

    /**
     * @notice Assigns `oracle` to the new sub oracle.
     * Only owner can call this function anytime.
     */
    function setSubOracle(PriceOracleInterface oracle) external onlyOwner {
        subOracle = oracle;
        emit SetSubOracle(oracle);
    }

    /**
     * @notice Calculates the latest volatility.
     * If any update to the price after the last calculation of volatility, recalculates and returns the new value.
     */
    function getVolatility()
        external
        override
        recoveryPhaseCheck
        returns (uint256)
    {
        uint256 to;
        uint256 from;
        uint256 _exTo;
        uint256 exFrom;

        uint256 squareReturnSum;

        PriceOracleInterface oracle = _activeOracle();
        to = oracle.latestId();
        from = to.sub(VOLATILITY_DATA_NUM, "data is too few").add(1);
        _exTo = exTo;

        bool needToRecalculateAll = oracle != exVolatilityOracle || // if oracle has been changed
            (to.sub(_exTo)) >= VOLATILITY_DATA_NUM / 2; // if it is not efficient to reuse some intermediate values.

        if (needToRecalculateAll) {
            // recalculate the whole of intermediate values
            squareReturnSum = _sumOfSquareReturn(oracle, from, to);
        } else if (_exTo == to) {
            // no need to recalculate
            return lastCalculatedVolatility;
        } else {
            // reuse some of intermediate values and recalculate others for gas cost reduce.
            // `_exTo` is same as `to` on the last volatility updated.
            // Whenever volatility is updated, `to` is equal to or more than 25, so `_exTo` never goes below 25.
            exFrom = _exTo.add(1).sub(VOLATILITY_DATA_NUM);
            squareReturnSum = exSquareReturnSum
                .add(_sumOfSquareReturn(oracle, _exTo, to))
                .sub(_sumOfSquareReturn(oracle, exFrom, from));
        }

        uint256 time = oracle.getTimestamp(to).sub(oracle.getTimestamp(from));
        uint256 s = squareReturnSum.mul(SECONDS_IN_YEAR).div(time);
        uint256 v = _sqrt(s);
        lastCalculatedVolatility = v;
        exTo = to;
        exVolatilityOracle = oracle;
        exSquareReturnSum = squareReturnSum;
        emit VolatilityCalculated(v);
        return v;
    }

    /**
     * @notice Returns 'true' if either of the main oracle or the sub oracle is working.
     * @dev See {PriceOracleInterface-isWorking}.
     */
    function isWorking() external override recoveryPhaseCheck returns (bool) {
        return mainOracle.isWorking() || subOracle.isWorking();
    }

    /**
     * @dev See {PriceOracleInterface-latestId}.
     */
    function latestId()
        external
        override
        recoveryPhaseCheck
        returns (uint256)
    {
        return _activeOracle().latestId();
    }

    /**
     * @dev See {PriceOracleInterface-latestPrice}.
     */
    function latestPrice()
        external
        override
        recoveryPhaseCheck
        returns (uint256)
    {
        return _activeOracle().latestPrice();
    }

    /**
     * @dev See {PriceOracleInterface-latestTimestamp}.
     */
    function latestTimestamp()
        external
        override
        recoveryPhaseCheck
        returns (uint256)
    {
        return _activeOracle().latestTimestamp();
    }

    /**
     * @dev See {PriceOracleInterface-getPrice}.
     */
    function getPrice(uint256 id)
        external
        override
        recoveryPhaseCheck
        returns (uint256)
    {
        return _activeOracle().getPrice(id);
    }

    /**
     * @dev See {PriceOracleInterface-getTimestamp}.
     */
    function getTimestamp(uint256 id)
        external
        override
        recoveryPhaseCheck
        returns (uint256)
    {
        return _activeOracle().getTimestamp(id);
    }

    /**
     * @dev Returns the main oracle if this contract is in Recovery phase.
     * Returns the sub oracle if the main oracle is not working.
     * Reverts if neither is working.
     * recoveryPhaseCheck modifier must be called before this function is called.
     */
    function _activeOracle() private returns (PriceOracleInterface) {
        if (!isRecoveryPhase) {
            return mainOracle;
        }
        require(subOracle.isWorking(), "both of the oracles are not working");
        return subOracle;
    }

    /**
     * @dev Returns sum of the square of relative returns of prices given by `oracle`.
     */
    function _sumOfSquareReturn(
        PriceOracleInterface oracle,
        uint256 from,
        uint256 to
    ) private returns (uint256) {
        uint256 a;
        uint256 b;
        uint256 sum;
        b = oracle.getPrice(from);
        for (uint256 id = from + 1; id <= to; id++) {
            a = b;
            b = oracle.getPrice(id);
            sum = sum.add(_squareReturn(a, b));
        }
        return sum;
    }

    /**
     * @dev Returns squareReturn of two values.
     * v = {abs(b-a)/a}^2 * 10^16
     */
    function _squareReturn(uint256 a, uint256 b)
        private
        pure
        returns (uint256)
    {
        uint256 sub = _absDef(a, b);
        return (sub.mul(10**8)**2).div(a**2);
    }

    /**
     * @dev Returns absolute difference of two numbers.
     */
    function _absDef(uint256 a, uint256 b) private pure returns (uint256) {
        if (a > b) {
            return a - b;
        } else {
            return b - a;
        }
    }

    /**
     * @dev Returns square root of `x`.
     * Babylonian method for square root.
     */
    function _sqrt(uint256 x) private pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
