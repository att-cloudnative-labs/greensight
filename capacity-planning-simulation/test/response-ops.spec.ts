import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { ResponseSplit, ResponseSplitEntry, Aspect, ResponseNumberParam, ResponseAspect } from '../types/src/index';
import { getResponseSplitEntry, normalizeResponseSplit, mergeResponseSplit, makeLatencyResponse, aggregateResponseByAspect, responseHistogramAggregation, mergeResponseAspect } from '../src/cpt-response-ops';

describe("Response Ops", () => {
    let e1: ResponseSplitEntry = { value: 1000, freq: 500 };
    let e2: ResponseSplitEntry = { value: 200, freq: 500 };

    let basicSplit: ResponseSplit = [e1, e2];

    let up1: ResponseSplitEntry = { value: 1000, freq: 50 };
    let up2: ResponseSplitEntry = { value: 200, freq: 50 };
    let upScaleSplit: ResponseSplit = [up1, up2];


    let down1: ResponseSplitEntry = { value: 1000, freq: 5000 };
    let down2: ResponseSplitEntry = { value: 200, freq: 5000 };
    let downScaleSplit: ResponseSplit = [down1, down2];

    let resp1 = makeLatencyResponse(100);
    let resp2 = makeLatencyResponse(200);
    let resp3 = makeLatencyResponse(300);
    let aspectSeason: Aspect = {
        type: 'BREAKDOWN',
        name: 'season',
        relative: true,
        slices: { 'spring': 40, 'summer': 40, 'autumn': 40, 'winter': 40 }
    }

    let responseAspect1: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'platform',
        slices: { 'android': [{ value: 100, freq: 500 }, { value: 200, freq: 500 }], 'ios': [{ value: 50, freq: 500 }, { value: 300, freq: 500 }] }
    }

    let responseAspect2: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'platform',
        slices: { 'android': [{ value: 50, freq: 1000 }], 'ios': [{ value: 10, freq: 1000 }] }
    }

    let a1a2SplitResultAndroid: ResponseSplit = [{ value: 100, freq: 250 }, { value: 200, freq: 250 }, { value: 50, freq: 500 }];
    let a1a2SplitResultIos: ResponseSplit = [{ value: 50, freq: 250 }, { value: 300, freq: 250 }, { value: 10, freq: 500 }];

    function assertSplitEntry(a: ResponseSplitEntry, b: ResponseSplitEntry) {
        expect(a).to.not.equal(null);
        expect(b).to.not.equal(null);
        a.value.should.equal(b.value);
        a.freq.should.equal(b.freq);
    }

    function assertSplit(a: ResponseSplit, b: ResponseSplit) {
        expect(a).to.not.equal(null);
        expect(b).to.not.equal(null);
        expect(a.length).to.equal(b.length);
        for (let e of a) {
            let comp = getResponseSplitEntry(b, e.value);
            expect(comp).to.not.equal(null);
            assertSplitEntry(e, comp);
        }
    }


    before("Setting up test variables", () => {
        chai.should();
        chai.use(chaiAsPromised)
    });

    it("getResponseSplitEntrys should return the right entry", () => {
        let m = getResponseSplitEntry(basicSplit, 1000);
        expect(m).to.not.equal(null);
        assertSplitEntry(m, e1);
    });

    it("getResponseSplitEntrys should return null otherwise", () => {
        let m = getResponseSplitEntry(basicSplit, 10);
        expect(m).to.equal(null);
    });

    it("normalizeResponseSplit should scale up", () => {
        let norm = normalizeResponseSplit(upScaleSplit);
        assertSplit(basicSplit, norm);
    });

    it("normalizeResponseSplit should scale down", () => {
        let norm = normalizeResponseSplit(downScaleSplit);
        assertSplit(basicSplit, norm);
    });

    it("normalizeResponseSplit should not scale normalized", () => {
        let norm = normalizeResponseSplit(basicSplit);
        assertSplit(basicSplit, norm);
    });

    it("mergeResponseSplit should double values if the same split is merged", () => {
        let mergedSplit = mergeResponseSplit(basicSplit, basicSplit);
        let m1 = getResponseSplitEntry(mergedSplit, 1000);
        let m2 = getResponseSplitEntry(mergedSplit, 200);
        expect(m1).to.not.equal(null);
        expect(m2).to.not.equal(null);
        m1.value.should.equal(e1.value);
        m1.freq.should.equal(e1.freq + e1.freq);
        m2.value.should.equal(e2.value);
        m2.freq.should.equal(e2.freq + e2.freq);
    });

    it("mergeResponseSplit should return a if b is empty", () => {
        let mergedSplit = mergeResponseSplit(basicSplit, []);
        assertSplit(mergedSplit, basicSplit);
    });

    it("mergeResponseSplit should return b if a is empty", () => {
        let mergedSplit = mergeResponseSplit([], basicSplit);
        assertSplit(mergedSplit, basicSplit);
    });

    it("mergeResponseSplit should return [] if a,b are empty", () => {
        let mergedSplit = mergeResponseSplit([], []);
        assertSplit(mergedSplit, []);
    });

    it("aggregateResponseByAspect aggregate a single response", () => {
        let agg = aggregateResponseByAspect(aspectSeason, { 'summer': resp1 });
        expect(agg).to.not.equal(null);
        expect(agg.split).to.not.equal(null);
        agg.split.length.should.be.equal(2);
    });


    it("responseHistogramAggregation aggregates a basic response", () => {
        let resp1 = makeLatencyResponse(400);
        resp1.split = basicSplit;
        let agg = responseHistogramAggregation([resp1, resp1, resp1, resp1]);
        expect(agg).to.not.equal(null);
        agg.length.should.equal(4);
    });

    it("mergeResponseAspect returns identical aspect if the same is added twice", () => {
        let aspect = mergeResponseAspect(responseAspect1, responseAspect1);
        expect(aspect).to.not.equal(null);
        aspect.name.should.equal(responseAspect1.name);
        assertSplit(responseAspect1.slices['android'], aspect.slices['android']);
        assertSplit(responseAspect1.slices['ios'], aspect.slices['ios']);
    });

    it("mergeResponseAspect returns correct aspect when different aspects are merged", () => {
        let aspect = mergeResponseAspect(responseAspect1, responseAspect2);
        expect(aspect).to.not.equal(null);
        aspect.name.should.equal(responseAspect1.name);
        assertSplit(a1a2SplitResultAndroid, aspect.slices['android']);
        assertSplit(a1a2SplitResultIos, aspect.slices['ios']);
    });

});
