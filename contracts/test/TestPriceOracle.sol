pragma solidity 0.6.6;

import "../interfaces/PriceOracleInterface.sol";

// solhint-disable var-name-mixedcase
contract TestPriceOracle is PriceOracleInterface {
    uint256 private _latestId;

    bool private _isWorking;

    mapping(uint256 => uint256) private prices;
    mapping(uint256 => uint256) private timestamps;

    constructor(bool _isWorking_v) public {
        _isWorking = _isWorking_v;
    }

    modifier validId(uint256 id) {
        require(id > 0 && id <= _latestId, "invalid id");
        _;
    }

    function setIsWorking(bool _isWorking_v) external {
        _isWorking = _isWorking_v;
    }

    function isWorking() external override returns (bool) {
        return _isWorking;
    }

    function latestId() external override returns (uint256) {
        require(_latestId > 0, "no records found");
        return _latestId;
    }

    function latestPrice() external override returns (uint256) {
        require(_latestId > 0, "no records found");
        return prices[_latestId];
    }

    function latestTimestamp() external override returns (uint256) {
        return _latestTimestamp();
    }

    function getPrice(uint256 id)
        external
        override
        validId(id)
        returns (uint256)
    {
        return prices[id];
    }

    function getTimestamp(uint256 id)
        external
        override
        validId(id)
        returns (uint256)
    {
        return timestamps[id];
    }

    function registerPrice(uint256 timestamp, uint256 price) external {
        require(
            timestamp > timestamps[_latestId] || _latestId == 0,
            "multiple registration in one timestamp"
        );
        _latestId++;
        prices[_latestId] = price;
        timestamps[_latestId] = timestamp;
    }

    function _latestTimestamp() private view returns (uint256) {
        require(_latestId > 0, "no records found");
        return timestamps[_latestId];
    }
}
