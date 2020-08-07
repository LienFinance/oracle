pragma solidity 0.6.6;

import "../interfaces/AggregatorInterface.sol";

contract TestAggregator is AggregatorInterface {
    int256 private _latestAnswer;
    uint256 private _latestTimestamp;
    uint256 private _latestRound;
    int256 private _getAnswer;
    uint256 private _getTimestamp;
    uint8 private _decimals;

    bool private _exceptionInLatestRoundData;
    bool private _exceptionInGetAnswer;
    bool private _exceptionInDecimals;

    function setLatestAnswer(int256 v) external {
        _latestAnswer = v;
    }

    function setLatestTimestamp(uint256 v) external {
        _latestTimestamp = v;
    }

    function setLatestRound(uint256 v) external {
        _latestRound = v;
    }

    function setGetAnswer(int256 v) external {
        _getAnswer = v;
    }

    function setGetTimestamp(uint256 v) external {
        _getTimestamp = v;
    }

    function setDecimals(uint8 v) external {
        _decimals = v;
    }

    function setExceptionInLatestRoundData(bool v) external {
        _exceptionInLatestRoundData = v;
    }

    function setExceptionInGetAnswer(bool v) external {
        _exceptionInGetAnswer = v;
    }

    function setExceptionInDecimals(bool v) external {
        _exceptionInDecimals = v;
    }

    function destruct() external {
        selfdestruct(msg.sender);
    }

    function latestAnswer() public override view returns (int256) {
        return _latestAnswer;
    }

    function latestTimestamp() public override view returns (uint256) {
        return _latestTimestamp;
    }

    function latestRound() public override view returns (uint256) {
        return _latestRound;
    }

    function getAnswer(uint256 roundId) public override view returns (int256) {
        if (_exceptionInGetAnswer) {
            revert("Exception in getAnswer");
        }
        return _getAnswer + int256(roundId);
    }

    function getTimestamp(uint256 roundId)
        public
        override
        view
        returns (uint256)
    {
        return _getTimestamp + roundId;
    }

    function latestRoundData()
        external
        override
        view
        returns (
            uint256 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint256 answeredInRound
        )
    {
        if (_exceptionInLatestRoundData) {
            revert("Exception in latestRoundData");
        }
        return (latestRound(), latestAnswer(), 0, latestTimestamp(), 0);
    }

    event AnswerUpdated(
        int256 indexed current,
        uint256 indexed roundId,
        uint256 timestamp
    );
    event NewRound(
        uint256 indexed roundId,
        address indexed startedBy,
        uint256 startedAt
    );

    function decimals() external override view returns (uint8) {
        require(_exceptionInDecimals == false, "exception in decimals");
        return _decimals;
    }
}
