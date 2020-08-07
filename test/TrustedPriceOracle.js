const TrustedPriceOracle = artifacts.require("TrustedPriceOracle");
const {expectRevert} = require("openzeppelin-test-helpers");

const increaseTime = async (seconds) => {
    await web3.currentProvider.send(
        {
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [seconds],
            id: Number(Math.random() * 1000).toFixed(0)
        },
        () => {}
    );
    await web3.currentProvider.send(
        {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Number(Math.random() * 1000).toFixed(0)
        },
        () => {}
    );
};

contract("TrustedPriceOracle", (accounts) => {
    const owner = accounts[1];
    const stranger = accounts[2];

    let to;
    beforeEach(async () => {
        to = await TrustedPriceOracle.new({from: owner});
    });

    describe("#registerPrice", () => {
        const prices = [1, 10, 101, 1010, 10101, 101010, 1010101];
        it("emits a price registered event", async () => {
            let receipts = [];
            for (const price of prices) {
                const {receipt} = await to.registerPrice(price, {from: owner});
                await increaseTime(15);
                receipts.push(receipt);
            }
            for (let i = 0; i < prices.length; i++) {
                const price = prices[i];
                const receipt = receipts[i];
                const event = receipt.logs[0];
                const timestamp = (
                    await web3.eth.getBlock(receipt.blockNumber)
                ).timestamp;
                assert.equal(event.event, "PriceRegistered");
                assert.equal(event.args.id, i + 1);
                assert.equal(event.args.timestamp, timestamp);
                assert.equal(event.args.price, price);
            }
        });
        it("updates latest id", async () => {
            let id = 1;
            for (const price of prices) {
                await increaseTime(15);
                await to.registerPrice(price, {from: owner});
                const latestId = await to.latestId.call();
                assert.equal(latestId, id++);
            }
        });
        it("updates latest price", async () => {
            for (const price of prices) {
                await increaseTime(15);
                await to.registerPrice(price, {from: owner});
                const latestPrice = await to.latestPrice.call();
                assert.equal(latestPrice, price);
            }
        });
        it("updates latest timestamp", async () => {
            for (const price of prices) {
                await increaseTime(15);
                const {receipt} = await to.registerPrice(price, {from: owner});
                const timestamp = (
                    await web3.eth.getBlock(receipt.blockNumber)
                ).timestamp;
                const latestTimestamp = await to.latestTimestamp.call();
                assert.equal(latestTimestamp, timestamp);
            }
        });
        describe("when owner register two prices in one block", () => {
            beforeEach(async () => {
                await to.registerPrice(10, {from: owner});
            });
            it("reverts at second registration", async () => {
                await expectRevert(
                    to.registerPrice(101, {from: owner}),
                    "multiple registration in one block"
                );
            });
        });
        describe("when called by a stranger", () => {
            it("reverts", async () => {
                await expectRevert(
                    to.registerPrice(10, {from: stranger}),
                    "caller is not the owner"
                );
            });
        });
        describe("when owner registers 0", () => {
            it("reverts", async () => {
                await expectRevert(
                    to.registerPrice(0, {from: owner}),
                    "0 is invalid as price"
                );
            });
        });
    });

    describe("#isWorking", () => {
        beforeEach(async () => {
            await to.registerPrice(10, {from: owner});
        });
        describe("when price has been updated within last 24 hours", () => {
            beforeEach(async () => {
                await increaseTime(59 * 60 * 24);
            });
            it("returns true", async () => {
                const isWorking = await to.isWorking.call();
                assert.equal(isWorking, true);
            });
        });
        describe("when price has not been updated within last 24 hours", () => {
            beforeEach(async () => {
                await increaseTime(60 * 60 * 24);
            });
            it("returns false", async () => {
                const isWorking = await to.isWorking.call();
                assert.equal(isWorking, false);
            });
        });
    });

    describe("#latestId", () => {
        describe("when no prices registered", () => {
            it("reverts", async () => {
                await expectRevert(to.latestId(), "no records found");
            });
        });
    });

    describe("#latestPrice", () => {
        describe("when no prices registered", () => {
            it("reverts", async () => {
                await expectRevert(to.latestPrice(), "no records found");
            });
        });
    });

    describe("#latestTimestamp", () => {
        describe("when no prices registered", () => {
            it("reverts", async () => {
                await expectRevert(to.latestTimestamp(), "no records found");
            });
        });
    });

    describe("#getPrice", () => {
        const prices = [1, 10, 101, 1010, 10101, 101010, 1010101];
        beforeEach(async () => {
            for (const price of prices) {
                await to.registerPrice(price, {from: owner});
                await increaseTime(15);
            }
        });
        it("returns the price registered before", async () => {
            for (let i = 0; i < prices.length; i++) {
                const price = await to.getPrice.call(i + 1);
                assert.equal(prices[i], price);
            }
        });
        describe("when specify 0 as id", () => {
            it("reverts", async () => {
                await expectRevert(to.getPrice(0), "invalid id");
            });
        });
        describe("when specify id larger than latest id", () => {
            it("reverts", async () => {
                await expectRevert(
                    to.getPrice(prices.length + 1),
                    "invalid id"
                );
            });
        });
    });

    describe("#getTimestamp", () => {
        const prices = [1, 10, 101, 1010, 10101, 101010, 1010101];
        let timestamps = [];
        beforeEach(async () => {
            for (const price of prices) {
                const {logs} = await to.registerPrice(price, {from: owner});
                timestamps.push(logs[0].args.timestamp);
                await increaseTime(15);
            }
        });
        it("returns the timestamp of price registered before", async () => {
            for (let i = 0; i < prices.length; i++) {
                const timestamp = await to.getTimestamp.call(i + 1);
                assert.equal(timestamps[i].toNumber(), timestamp.toNumber());
            }
        });
        describe("when specify 0 as id", () => {
            it("reverts", async () => {
                await expectRevert(to.getTimestamp(0), "invalid id");
            });
        });
        describe("when specify id larger than latest id", () => {
            it("reverts", async () => {
                await expectRevert(
                    to.getTimestamp(prices.length + 1),
                    "invalid id"
                );
            });
        });
    });
});
