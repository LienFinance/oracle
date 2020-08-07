const ChainlinkPriceOracle = artifacts.require("ChainlinkPriceOracle");
const TestAggregator = artifacts.require("TestAggregator");

contract("ChainlinkPriceOracle", (accounts) => {
    let ta;
    let co;
    beforeEach(async () => {
        ta = await TestAggregator.new();
        co = await ChainlinkPriceOracle.new(ta.address);
    });
    describe("#aggregator", () => {
        it("returns address of aggregator", async () => {
            assert.equal(await co.aggregator(), ta.address);
        });
    });
    describe("functions of price oracle interface", () => {
        describe("#isWorking", () => {
            let now;
            beforeEach(async () => {
                now = (await web3.eth.getBlock("latest")).timestamp;
                await ta.setLatestRound(2);
                await ta.setLatestAnswer(800);
                await ta.setGetAnswer(799);
                await ta.setLatestTimestamp(now - 60 * 60 * 24 + 10); // 10 is an sufficient buffer to execute tx
                await ta.setDecimals(8);
            });
            describe("when aggregator passes all checks", () => {
                it("returns true", async () => {
                    assert.equal(await co.isWorking.call(), true);
                });
            });
            describe("when aggregator has self destructed", () => {
                beforeEach(async () => {
                    await ta.destruct();
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when latestTimestamp is not in last 24H", () => {
                beforeEach(async () => {
                    await ta.setLatestTimestamp(now - 60 * 60 * 24 - 1);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when latestAnswer = 0", () => {
                beforeEach(async () => {
                    await ta.setLatestAnswer(0);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when latestAnswer < 0", () => {
                beforeEach(async () => {
                    await ta.setLatestAnswer(1);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when latestAnswer = 8 * previousAnswer", () => {
                beforeEach(async () => {
                    await ta.setLatestAnswer(6400);
                });
                it("returns true", async () => {
                    assert.equal(await co.isWorking.call(), true);
                });
            });
            describe("when latestAnswer > 8 * previousAnswer", () => {
                beforeEach(async () => {
                    await ta.setLatestAnswer(6401);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when latestAnswer = previousAnswer/8", () => {
                beforeEach(async () => {
                    await ta.setLatestAnswer(100);
                });
                it("returns true", async () => {
                    assert.equal(await co.isWorking.call(), true);
                });
            });
            describe("when latestAnswer < previousAnswer/8", () => {
                beforeEach(async () => {
                    await ta.setLatestAnswer(99);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when decimals != 8", () => {
                it("returns false", async () => {
                    for (const decimal of [7, 9]) {
                        await ta.setDecimals(decimal);
                        assert.equal(await co.isWorking.call(), false);
                    }
                });
            });
            describe("when exception was thrown by latestRoundData", () => {
                beforeEach(async () => {
                    await ta.setExceptionInLatestRoundData(true);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when exception was thrown by getAnswer", () => {
                beforeEach(async () => {
                    await ta.setExceptionInGetAnswer(true);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
            describe("when an exception was thrown by decimals", () => {
                beforeEach(async () => {
                    await ta.setExceptionInDecimals(true);
                });
                it("returns false", async () => {
                    assert.equal(await co.isWorking.call(), false);
                });
            });
        });
        describe("#latestId", () => {
            it("returns the returned value of aggregator.latestRound()", async () => {
                for (const round of [1, 10, 101]) {
                    await ta.setLatestRound(round);
                    assert.equal(await co.latestId.call(), round);
                }
            });
        });
        describe("#latestPrice", () => {
            it("returns the returned value of aggregator.latestAnswer()", async () => {
                for (const answer of [1, 10, 101]) {
                    await ta.setLatestAnswer(answer);
                    assert.equal(await co.latestPrice.call(), answer);
                }
            });
        });
        describe("#latestTimestamp", () => {
            it("returns the returned value of aggregator.latestTimestamp()", async () => {
                for (const timestamp of [1, 10, 101]) {
                    await ta.setLatestTimestamp(timestamp);
                    assert.equal(await co.latestTimestamp.call(), timestamp);
                }
            });
        });
        describe("#getPrice", () => {
            it("returns the returned value of aggregator.getAnswer(id)", async () => {
                for (const price of [1, 10, 101]) {
                    await ta.setGetAnswer(price);
                    for (const id of [1, 2, 3]) {
                        assert.equal(await co.getPrice.call(id), price + id);
                    }
                }
            });
        });
        describe("#getTimestamp", () => {
            it("returns the returned value of aggregator.getTimestamp(id)", async () => {
                for (const timestamp of [1, 10, 101]) {
                    await ta.setGetTimestamp(timestamp);
                    for (const id of [1, 2, 3]) {
                        assert.equal(
                            await co.getTimestamp.call(id),
                            timestamp + id
                        );
                    }
                }
            });
        });
    });
});
