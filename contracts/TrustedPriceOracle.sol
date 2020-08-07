pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/PriceOracleInterface.sol";

/**
 * @notice Sub oracle for Recovery phase.
 * If and only if in an emergent situation, users need to trust the owner of the contract.
 *
 * CAUTION: NEVER use this contract as a price oracle.
 * @dev Only owner can update the price.
 */
contract TrustedPriceOracle is Ownable, PriceOracleInterface {
    using SafeMath for uint256;

    uint256 private constant SECONDS_IN_DAY = 60 * 60 * 24;
    // The first id is 1.
    uint256 private _latestId;

    struct Record {
        uint128 price;
        uint128 timestamp;
    }

    // id => record.
    mapping(uint256 => Record) private records;

    event PriceRegistered(
        uint256 indexed id,
        uint128 timestamp,
        uint128 price
    );

    /**
     * @dev Checks if `id` is larger than 0, and equals to or smaller than latestId.
     */
    modifier validId(uint256 id) {
        require(id != 0 && id <= _latestId, "invalid id");
        _;
    }

    /**
     * @dev Checks if any records are registered.
     */
    modifier hasRecord() {
        require(_latestId != 0, "no records found");
        _;
    }

    /**
     * @notice Registers `price` as the value on the timestamp in the block.
     * @param price Decimals of this value must be 8.
     * For example, if real price is `1.05`, param value is `105000000`.
     */
    function registerPrice(uint128 price) external onlyOwner {
        uint256 latestId = _latestId;
        require(
            now > records[latestId].timestamp,
            "multiple registration in one block"
        );
        require(price != 0, "0 is invalid as price");
        uint256 newId = latestId + 1;
        uint128 timestamp = uint128(now);
        _latestId = newId;
        records[newId] = Record(price, timestamp);
        emit PriceRegistered(newId, timestamp, price);
    }

    // Implementation of price oracle interface

    /**
     * @notice Returns `true` if the price was updated correctly within last 24 hours.
     */
    function isWorking() external override returns (bool) {
        return now.sub(_latestTimestamp()) < SECONDS_IN_DAY;
    }

    /**
     * @dev See {PriceOracleInterface-latestId}.
     */
    function latestId() external override hasRecord returns (uint256) {
        return _latestId;
    }

    /**
     * @dev See {PriceOracleInterface-latestPrice}.
     */
    function latestPrice() external override hasRecord returns (uint256) {
        return records[_latestId].price;
    }

    /**
     * @dev See {PriceOracleInterface-latestTimestamp}.
     */
    function latestTimestamp() external override returns (uint256) {
        return _latestTimestamp();
    }

    /**
     * @dev See {PriceOracleInterface-getPrice}.
     */
    function getPrice(uint256 id)
        external
        override
        validId(id)
        returns (uint256)
    {
        return records[id].price;
    }

    /**
     * @dev See {PriceOracleInterface-getTimestamp}.
     */
    function getTimestamp(uint256 id)
        external
        override
        validId(id)
        returns (uint256)
    {
        return records[id].timestamp;
    }

    function _latestTimestamp() private view hasRecord returns (uint256) {
        return records[_latestId].timestamp;
    }
}
