const MarketOracle = artifacts.require("MarketOracle");
const TestPriceOracle = artifacts.require("TestPriceOracle");
const {expectRevert} = require("openzeppelin-test-helpers");
const testData = require("./getVolatilityTestData.json");

contract("MarketOracle", (accounts) => {
    let main, sub, mo;
    const owner = accounts[1];
    const stranger = accounts[2];
    beforeEach(async () => {
        main = await TestPriceOracle.new(true);
        sub = await TestPriceOracle.new(true);
        mo = await MarketOracle.new(main.address, sub.address, {from: owner});
    });
    describe("#mainOracle", () => {
        it("returns address of main oracle", async () => {
            const address = await mo.mainOracle();
            assert.equal(address, main.address);
        });
    });
    describe("#subOracle", () => {
        it("returns address of sub oracle", async () => {
            const address = await mo.subOracle();
            assert.equal(address, sub.address);
        });
    });
    describe("proxy oracles", () => {
        const mainOracleData = [
            {timestamp: 111, price: 121},
            {timestamp: 112, price: 122},
            {timestamp: 113, price: 123},
            {timestamp: 114, price: 124}
        ];
        const subOracleData = [
            {timestamp: 211, price: 221},
            {timestamp: 212, price: 222},
            {timestamp: 213, price: 223}
        ];
        beforeEach(async () => {
            for (const data of mainOracleData) {
                await main.registerPrice(data.timestamp, data.price);
            }
            for (const data of subOracleData) {
                await sub.registerPrice(data.timestamp, data.price);
            }
        });
        describe("#isRecoveryPhase", () => {
            describe("main oracle is working", () => {
                describe("after isWorking() called", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after latestId() called", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after latestPrice() called", () => {
                    beforeEach(async () => {
                        await mo.latestPrice();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after latestTimestamp() called", () => {
                    beforeEach(async () => {
                        await mo.latestTimestamp();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after getPrice() called", () => {
                    beforeEach(async () => {
                        await mo.getPrice(1);
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after getTimestamp() called", () => {
                    beforeEach(async () => {
                        await mo.getTimestamp(1);
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
            });
            describe("main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                describe("after isWorking() called", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                    });
                    it("returns true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
                describe("after latestId() called", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                    });
                    it("returns true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
                describe("after latestPrice() called", () => {
                    beforeEach(async () => {
                        await mo.latestPrice();
                    });
                    it("returns true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
                describe("after latestTimestamp() called", () => {
                    beforeEach(async () => {
                        await mo.latestTimestamp();
                    });
                    it("returns true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
                describe("after getPrice() called", () => {
                    beforeEach(async () => {
                        await mo.getPrice(1);
                    });
                    it("returns true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
                describe("after getTimestamp() called", () => {
                    beforeEach(async () => {
                        await mo.getTimestamp(1);
                    });
                    it("returns true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
                describe("when main oracle starts working again after entering recovery phase", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                        await main.setIsWorking(1);
                    });
                    it("keeps return true", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, true);
                    });
                });
            });
            describe("sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                describe("after isWorking() called", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after latestId() called", () => {
                    beforeEach(async () => {
                        await mo.latestId();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after latestPrice() called", () => {
                    beforeEach(async () => {
                        await mo.latestPrice();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after latestTimestamp() called", () => {
                    beforeEach(async () => {
                        await mo.latestTimestamp();
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after getPrice() called", () => {
                    beforeEach(async () => {
                        await mo.getPrice(1);
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
                describe("after getTimestamp() called", () => {
                    beforeEach(async () => {
                        await mo.getTimestamp(1);
                    });
                    it("returns false", async () => {
                        const r = await mo.isRecoveryPhase();
                        assert.equal(r, false);
                    });
                });
            });
        });
        describe("#isWorking", () => {
            describe("when both of the oracles are working", () => {
                it("returns true", async () => {
                    const r = await mo.isWorking.call();
                    assert.equal(r, true);
                });
            });
            describe("when main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("returns true", async () => {
                    const r = await mo.isWorking.call();
                    assert.equal(r, true);
                });
                it("emits an enter recovery phase event on the first call", async () => {
                    let tx;
                    tx = await mo.isWorking();
                    assert.equal(
                        tx.receipt.logs[0].event,
                        "EnterRecoveryPhase"
                    );
                    tx = await mo.isWorking();
                    assert.equal(tx.receipt.logs.length, 0);
                });
            });
            describe("when sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                it("returns true", async () => {
                    const r = await mo.isWorking.call();
                    assert.equal(r, true);
                });
            });
            describe("when both of the oracles are not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                    await sub.setIsWorking(false);
                });
                it("returns false", async () => {
                    const r = await mo.isWorking.call();
                    assert.equal(r, false);
                });
            });
        });
        describe("#latestId", () => {
            describe("when main oracle is working", () => {
                it("returns the returned value by main oracle", async () => {
                    const latestId = await mo.latestId.call();
                    assert.equal(latestId, mainOracleData.length);
                });
            });
            describe("when main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("returns the returned value by sub oracle", async () => {
                    const latestId = await mo.latestId.call();
                    assert.equal(latestId, subOracleData.length);
                });
                it("emits an enter recovery phase event on the first call", async () => {
                    let tx;
                    tx = await mo.latestId();
                    assert.equal(
                        tx.receipt.logs[0].event,
                        "EnterRecoveryPhase"
                    );
                    tx = await mo.latestId();
                    assert.equal(tx.receipt.logs.length, 0);
                });
            });
            describe("when sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                it("returns the returned value by main oracle", async () => {
                    const latestId = await mo.latestId.call();
                    assert.equal(latestId, mainOracleData.length);
                });
            });
            describe("when both of the oracles are not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                    await sub.setIsWorking(false);
                });
                it("reverts", async () => {
                    await expectRevert(
                        mo.latestId.call(),
                        "both of the oracles are not working"
                    );
                });
            });
        });
        describe("#latestPrice", () => {
            describe("when main oracle is working", () => {
                const expected =
                    mainOracleData[mainOracleData.length - 1].price;
                it("returns the returned value by main oracle", async () => {
                    const latestPrice = await mo.latestPrice.call();
                    assert.equal(latestPrice, expected);
                });
            });
            describe("when main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("returns the returned value by sub oracle", async () => {
                    const latestPrice = await mo.latestPrice.call();
                    assert.equal(
                        latestPrice,
                        subOracleData[subOracleData.length - 1].price
                    );
                });
                it("emits an enter recovery phase event on the first call", async () => {
                    let tx;
                    tx = await mo.latestPrice();
                    assert.equal(
                        tx.receipt.logs[0].event,
                        "EnterRecoveryPhase"
                    );
                });
            });
            describe("when sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                it("returns the returned value by main oracle", async () => {
                    const latestPrice = await mo.latestPrice.call();
                    assert.equal(
                        latestPrice,
                        mainOracleData[mainOracleData.length - 1].price
                    );
                });
            });
            describe("when both of the oracles are not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                    await sub.setIsWorking(false);
                });
                it("reverts", async () => {
                    await expectRevert(
                        mo.latestPrice(),
                        "both of the oracles are not working"
                    );
                });
            });
        });
        describe("#latestTimestamp", () => {
            describe("when main oracle is working", () => {
                it("returns the returned value by main oracle", async () => {
                    const latestTimestamp = await mo.latestTimestamp.call();
                    assert.equal(
                        latestTimestamp,
                        mainOracleData[mainOracleData.length - 1].timestamp
                    );
                });
            });
            describe("when main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("returns the returned value by sub oracle", async () => {
                    const latestTimestamp = await mo.latestTimestamp.call();
                    assert.equal(
                        latestTimestamp,
                        subOracleData[subOracleData.length - 1].timestamp
                    );
                });
                it("emits an enter recovery phase event on the first call", async () => {
                    let tx;
                    tx = await mo.latestTimestamp();
                    assert.equal(
                        tx.receipt.logs[0].event,
                        "EnterRecoveryPhase"
                    );
                    tx = await mo.latestTimestamp();
                    assert.equal(tx.receipt.logs.length, 0);
                });
            });
            describe("when sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                it("returns the returned value by main oracle", async () => {
                    const latestTimestamp = await mo.latestTimestamp.call();
                    assert.equal(
                        latestTimestamp,
                        mainOracleData[mainOracleData.length - 1].timestamp
                    );
                });
            });
            describe("when both of the oracles are not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                    await sub.setIsWorking(false);
                });
                it("reverts", async () => {
                    await expectRevert(
                        mo.latestTimestamp.call(),
                        "both of the oracles are not working"
                    );
                });
            });
        });
        describe("#getPrice", () => {
            describe("when main oracle is working", () => {
                it("returns the returned value by main oracle", async () => {
                    for (let i = 0; i < mainOracleData.length; i++) {
                        const price = await mo.getPrice.call(i + 1);
                        assert.equal(price, mainOracleData[i].price);
                    }
                });
            });
            describe("when main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("returns the returned value by sub oracle", async () => {
                    for (let i = 0; i < subOracleData.length; i++) {
                        const price = await mo.getPrice.call(i + 1);
                        assert.equal(price, subOracleData[i].price);
                    }
                });
                it("emits an enter recovery phase event on the first call", async () => {
                    let tx;
                    tx = await mo.getPrice(1);
                    assert.equal(
                        tx.receipt.logs[0].event,
                        "EnterRecoveryPhase"
                    );
                    tx = await mo.getPrice(1);
                    assert.equal(tx.receipt.logs.length, 0);
                });
            });
            describe("when sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                it("returns the returned value by main oracle", async () => {
                    for (let i = 0; i < mainOracleData.length; i++) {
                        const price = await mo.getPrice.call(i + 1);
                        assert.equal(price, mainOracleData[i].price);
                    }
                });
            });
            describe("when both of the oracles are not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                    await sub.setIsWorking(false);
                });
                it("reverts", async () => {
                    await expectRevert(
                        mo.getPrice.call(1),
                        "both of the oracles are not working"
                    );
                });
            });
        });
        describe("#getTimestamp", () => {
            describe("when main oracle is working", () => {
                it("returns the returned value by main oracle", async () => {
                    for (let i = 0; i < mainOracleData.length; i++) {
                        const timestamp = await mo.getTimestamp.call(i + 1);
                        assert.equal(timestamp, mainOracleData[i].timestamp);
                    }
                });
            });
            describe("when main oracle is not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("returns the returned value by sub oracle", async () => {
                    for (let i = 0; i < subOracleData.length; i++) {
                        const timestamp = await mo.getTimestamp.call(i + 1);
                        assert.equal(timestamp, subOracleData[i].timestamp);
                    }
                });
                it("emits an enter recovery phase event on the first call", async () => {
                    let tx;
                    tx = await mo.getTimestamp(1);
                    assert.equal(
                        tx.receipt.logs[0].event,
                        "EnterRecoveryPhase"
                    );
                    tx = await mo.getTimestamp(1);
                    assert.equal(tx.receipt.logs.length, 0);
                });
            });
            describe("when sub oracle is not working", () => {
                beforeEach(async () => {
                    await sub.setIsWorking(false);
                });
                it("returns the returned value by main oracle", async () => {
                    for (let i = 0; i < mainOracleData.length; i++) {
                        const timestamp = await mo.getTimestamp.call(i + 1);
                        assert.equal(timestamp, mainOracleData[i].timestamp);
                    }
                });
            });
            describe("when both of the oracles are not working", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                    await sub.setIsWorking(false);
                });
                it("reverts", async () => {
                    await expectRevert(
                        mo.getTimestamp.call(1),
                        "both of the oracles are not working"
                    );
                });
            });
        });
    });
    describe("#setMainOracle", () => {
        let newMainOracle;
        beforeEach(async () => {
            newMainOracle = await TestPriceOracle.new(true);
            await newMainOracle.registerPrice(101, 1010);
        });
        describe("on recovery phase", () => {
            beforeEach(async () => {
                await main.setIsWorking(false);
                await sub.registerPrice(202, 2020); // prepare for entering recovery phase
                await mo.latestPrice(); // enter recovery phase
            });
            describe("when called by owner", () => {
                let event;
                beforeEach(async () => {
                    const tx = await mo.setMainOracle(newMainOracle.address, {
                        from: owner
                    });
                    event = tx.receipt.logs[0];
                });
                it("changes main oracles address", async () => {
                    const address = await mo.mainOracle();
                    assert.equal(address, newMainOracle.address);
                });
                it("returns to normal phase", async () => {
                    const isRecoveryPhase = await mo.isRecoveryPhase();
                    assert.equal(isRecoveryPhase, false);
                });
                it("starts to return the returned value from the new oracle", async () => {
                    const latestPrice = await mo.latestPrice.call();
                    assert.equal(latestPrice, 1010);
                });
                it("emits a return from recovery phase event", async () => {
                    assert.equal(event.event, "ReturnFromRecoveryPhase");
                    assert.equal(
                        event.args.newMainOracle,
                        newMainOracle.address
                    );
                });
            });
            describe("when called by stranger", () => {
                it("reverts", async () => {
                    await expectRevert(
                        mo.setMainOracle(newMainOracle.address, {
                            from: stranger
                        }),
                        "caller is not the owner"
                    );
                });
            });
            describe("when specified oracle is not working", () => {
                beforeEach(async () => {
                    newMainOracle.setIsWorking(false);
                });
                it("reverts", async () => {
                    await expectRevert(
                        mo.setMainOracle(newMainOracle.address, {from: owner}),
                        "New oracle is not working"
                    );
                });
            });
        });
        describe("on normal phase", () => {
            describe("when called by owner", () => {
                it("reverts", async () => {
                    await expectRevert(
                        mo.setMainOracle(newMainOracle.address, {from: owner}),
                        "Cannot change working main oracle"
                    );
                });
            });
        });
    });
    describe("#setSubOracle", () => {
        let newSubOracle;
        beforeEach(async () => {
            newSubOracle = await TestPriceOracle.new(true);
            await newSubOracle.registerPrice(101, 1010);
        });
        describe("when called by owner", () => {
            let event;
            beforeEach(async () => {
                const tx = await mo.setSubOracle(newSubOracle.address, {
                    from: owner
                });
                event = tx.receipt.logs[0];
            });
            it("changes sub oracles address", async () => {
                const address = await mo.subOracle();
                assert.equal(address, newSubOracle.address);
            });
            it("emits a set sub oracle event", async () => {
                assert.equal(event.event, "SetSubOracle");
                assert.equal(event.args.newSubOracle, newSubOracle.address);
            });
            describe("on recovery phase", () => {
                beforeEach(async () => {
                    await main.setIsWorking(false);
                });
                it("starts to return the returned value from the new oracle", async () => {
                    const latestPrice = await mo.latestPrice.call();
                    assert.equal(latestPrice, 1010);
                });
            });
        });
        describe("when called by stranger", () => {
            it("reverts", async () => {
                await expectRevert(
                    mo.setSubOracle(newSubOracle.address, {from: stranger}),
                    "caller is not the owner"
                );
            });
        });
    });
    describe("#getVolatility", () => {
        const input = testData.input;
        const volatilities = testData.volatilities;
        const calcVolatilityWhileRegisteringPrice = async (calcTime) => {
            let receipts = [];
            let inputIndex = 0;
            for (const volatility of volatilities.slice(0, calcTime)) {
                const {to} = volatility;
                for (; inputIndex < to; inputIndex++) {
                    const item = input[inputIndex];
                    await main.registerPrice(item.timestamp, item.price);
                }
                const {receipt} = await mo.getVolatility();
                receipts.push(receipt);
            }
            return receipts;
        };
        describe("when calculate for the first time", () => {
            let receipt;
            beforeEach(async () => {
                const receipts = await calcVolatilityWhileRegisteringPrice(1);
                receipt = receipts[0];
            });
            it("takes the highest gas cost [@skip-on-coverage]", async () => {
                assert.equal(receipt.gasUsed, 234507);
            });
            it("emits a volatility calculated event", async () => {
                const event = receipt.logs[0];
                assert.equal(event.event, "VolatilityCalculated");
                assert.equal(event.args.volatility, volatilities[0].value);
            });
            it("returns volatility", async () => {
                const volatility = await mo.getVolatility.call();
                assert.equal(volatility, volatilities[0].value);
            });
        });
        describe("when calculate again before price is updated", () => {
            let receipt;
            beforeEach(async () => {
                await calcVolatilityWhileRegisteringPrice(1);
                const tx = await mo.getVolatility();
                receipt = tx.receipt;
            });
            it("takes the lowest gas cost [@skip-on-coverage]", async () => {
                assert.equal(receipt.gasUsed, 32944);
            });
            it("does not emit a volatility calculated event", async () => {
                assert.equal(receipt.logs.length, 0);
            });
            it("returns volatility", async () => {
                const volatility = await mo.getVolatility.call();
                assert.equal(volatility, volatilities[0].value);
            });
        });
        describe("calculate after price was updated after the volatility has been calculated", () => {
            describe("when price was updated once", () => {
                let receipt;
                beforeEach(async () => {
                    const receipts = await calcVolatilityWhileRegisteringPrice(
                        2
                    );
                    receipt = receipts[1];
                });
                it("takes low gas cost [@skip-on-coverage]", async () => {
                    assert.equal(receipt.gasUsed, 78664);
                });
                it("emits a volatility calculated event", async () => {
                    const event = receipt.logs[0];
                    assert.equal(event.event, "VolatilityCalculated");
                    assert.equal(event.args.volatility, volatilities[1].value);
                });
                it("returns volatility", async () => {
                    const volatility = await mo.getVolatility.call();
                    assert.equal(volatility, volatilities[1].value);
                });
            });
            describe("when price was updated twice", () => {
                let receipt;
                beforeEach(async () => {
                    const receipts = await calcVolatilityWhileRegisteringPrice(
                        4
                    );
                    receipt = receipts[3];
                });
                it("takes low gas cost [@skip-on-coverage]", async () => {
                    assert.equal(receipt.gasUsed, 87478);
                });
                it("emits a volatility calculated event", async () => {
                    const event = receipt.logs[0];
                    assert.equal(event.event, "VolatilityCalculated");
                    assert.equal(event.args.volatility, volatilities[3].value);
                });
                it("returns volatility", async () => {
                    const volatility = await mo.getVolatility.call();
                    assert.equal(volatility, volatilities[3].value);
                });
            });
            describe("when price was updated 12 times", () => {
                let receipt;
                beforeEach(async () => {
                    const receipts = await calcVolatilityWhileRegisteringPrice(
                        5
                    );
                    receipt = receipts[4];
                });
                it("takes high gas cost [@skip-on-coverage]", async () => {
                    assert.equal(receipt.gasUsed, 170498);
                });
                it("emits a volatility calculated event", async () => {
                    const event = receipt.logs[0];
                    assert.equal(event.event, "VolatilityCalculated");
                    assert.equal(event.args.volatility, volatilities[4].value);
                });
                it("returns volatility", async () => {
                    const volatility = await mo.getVolatility.call();
                    assert.equal(volatility, volatilities[4].value);
                });
            });
            describe("when price was updated 24 times", () => {
                let receipt;
                beforeEach(async () => {
                    const receipts = await calcVolatilityWhileRegisteringPrice(
                        6
                    );
                    receipt = receipts[5];
                });
                it("takes as high gas cost as when price was updated 12 times [@skip-on-coverage]", async () => {
                    assert.equal(receipt.gasUsed, 170500);
                });
                it("emits a volatility calculated event", async () => {
                    const event = receipt.logs[0];
                    assert.equal(event.event, "VolatilityCalculated");
                    assert.equal(event.args.volatility, volatilities[5].value);
                });
                it("returns volatility", async () => {
                    const volatility = await mo.getVolatility.call();
                    assert.equal(volatility, volatilities[5].value);
                });
            });
            describe("when price was updated 13 times", () => {
                let receipt;
                beforeEach(async () => {
                    const receipts = await calcVolatilityWhileRegisteringPrice(
                        7
                    );
                    receipt = receipts[6];
                });
                it("takes as high gas cost as when price was updated 12 times [@skip-on-coverage]", async () => {
                    assert.equal(receipt.gasUsed, 170496);
                });
                it("emits a volatility calculated event", async () => {
                    const event = receipt.logs[0];
                    assert.equal(event.event, "VolatilityCalculated");
                    assert.equal(event.args.volatility, volatilities[6].value);
                });
                it("returns volatility", async () => {
                    const volatility = await mo.getVolatility.call();
                    assert.equal(volatility, volatilities[6].value);
                });
            });
        });
        describe("when oracle does not has a sufficient number of price data", () => {
            it("reverts", async () => {
                for (inputIndex = 0; inputIndex < 24; inputIndex++) {
                    const item = input[inputIndex];
                    await main.registerPrice(item.timestamp, item.price);
                }
                await expectRevert(mo.getVolatility(), "data is too few");
            });
        });
        describe("when main oracle is not working", () => {
            let receipt;
            beforeEach(async () => {
                await main.setIsWorking(false);
                for (inputIndex = 0; inputIndex < 25; inputIndex++) {
                    const item = input[inputIndex];
                    await sub.registerPrice(item.timestamp, item.price);
                }
                const tx = await mo.getVolatility();
                receipt = tx.receipt;
            });
            it("emits an enter recovery phase event", async () => {
                assert.equal(receipt.logs[0].event, "EnterRecoveryPhase");
            });
            it("calculate of prices provided by sub oracle", async () => {
                const event = receipt.logs[1];
                assert.equal(event.event, "VolatilityCalculated");
                assert.equal(event.args.volatility, volatilities[0].value);
            });
        });
    });
});
