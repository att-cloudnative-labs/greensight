import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, it } from 'mocha';
import { expect } from 'chai';

import { ResponseValue, ResponseValueEntry } from '@cpt/capacity-planning-simulation-types';
import { getResponseValueEntry, normalizeResponseValue, mergeResponseValue, makeLatencyResponse, responseHistogramAggregation, mergeResponseAspect } from '../src/cpt-response-ops';
import { assertSplit, assertSplitEntry, makeResponseEnvironment } from "./test-util";
import { cartesianProduct } from "../src/cpt-cartesian-ops";

describe("Response Ops", () => {
    let e1: ResponseValueEntry = { value: 1000, freq: 500 };
    let e2: ResponseValueEntry = { value: 200, freq: 500 };

    let basicSplit: ResponseValue = [e1, e2];

    let up1: ResponseValueEntry = { value: 1000, freq: 50 };
    let up2: ResponseValueEntry = { value: 200, freq: 50 };
    let upScaleSplit: ResponseValue = [up1, up2];


    let down1: ResponseValueEntry = { value: 1000, freq: 5000 };
    let down2: ResponseValueEntry = { value: 200, freq: 5000 };
    let downScaleSplit: ResponseValue = [down1, down2];

    const responseEnv = makeResponseEnvironment();


    let a1a2SplitResultAndroid: ResponseValue = [{ value: 100, freq: 250 }, { value: 200, freq: 250 }, { value: 50, freq: 500 }];
    let a1a2SplitResultIos: ResponseValue = [{ value: 50, freq: 250 }, { value: 300, freq: 250 }, { value: 10, freq: 500 }];



    before("Setting up test variables", () => {
        chai.should();
        chai.use(chaiAsPromised)
    });

    it("cartop", () => {
        const v1: ResponseValue = [{ freq: 500, value: 10 }, { freq: 500, value: 5 }];
        const v2: ResponseValue = [{ freq: 500, value: 1 }, { freq: 500, value: 2 }];
        const v3: ResponseValue = [{ freq: 600, value: 99 }, { freq: 400, value: 50 }];


        const res = cartesianProduct([v1, v2, v3]);
        expect(res.length).to.equal(8);
    });

    it("getResponseSplitEntrys should return the right entry", () => {
        let m = getResponseValueEntry(basicSplit, 1000);
        expect(m).to.not.equal(null);
        assertSplitEntry(m, e1);
    });

    it("getResponseSplitEntrys should return null otherwise", () => {
        let m = getResponseValueEntry(basicSplit, 10);
        expect(m).to.equal(null);
    });

    it("normalizeResponseSplit should scale up", () => {
        let norm = normalizeResponseValue(upScaleSplit);
        assertSplit(basicSplit, norm);
    });

    it("normalizeResponseSplit should scale down", () => {
        let norm = normalizeResponseValue(downScaleSplit);
        assertSplit(basicSplit, norm);
    });

    it("normalizeResponseSplit should not scale normalized", () => {
        let norm = normalizeResponseValue(basicSplit);
        assertSplit(basicSplit, norm);
    });

    it("mergeResponseSplit should double values if the same split is merged", () => {
        let mergedSplit = mergeResponseValue(basicSplit, basicSplit);
        let m1 = getResponseValueEntry(mergedSplit, 1000);
        let m2 = getResponseValueEntry(mergedSplit, 200);
        expect(m1).to.not.equal(null);
        expect(m2).to.not.equal(null);
        m1.value.should.equal(e1.value);
        m1.freq.should.equal(e1.freq + e1.freq);
        m2.value.should.equal(e2.value);
        m2.freq.should.equal(e2.freq + e2.freq);
    });

    it("mergeResponseSplit should return a if b is empty", () => {
        let mergedSplit = mergeResponseValue(basicSplit, []);
        assertSplit(mergedSplit, basicSplit);
    });

    it("mergeResponseSplit should return b if a is empty", () => {
        let mergedSplit = mergeResponseValue([], basicSplit);
        assertSplit(mergedSplit, basicSplit);
    });

    it("mergeResponseSplit should return [] if a,b are empty", () => {
        let mergedSplit = mergeResponseValue([], []);
        assertSplit(mergedSplit, []);
    });



    it("responseHistogramAggregation aggregates a basic response", () => {
        let resp1 = makeLatencyResponse(400);
        resp1.value = basicSplit;
        let agg = responseHistogramAggregation([resp1, resp1, resp1, resp1]);
        expect(agg).to.not.equal(null);
        agg.length.should.equal(4);
    });

    it("mergeResponseAspect returns identical aspect if the same is added twice", () => {
        let aspect = mergeResponseAspect(responseEnv.responseAspect1, responseEnv.responseAspect1);
        expect(aspect).to.not.equal(null);
        aspect.name.should.equal(responseEnv.responseAspect1.name);
        assertSplit(responseEnv.responseAspect1.slices['android'], aspect.slices['android']);
        assertSplit(responseEnv.responseAspect1.slices['ios'], aspect.slices['ios']);
    });

    it("mergeResponseAspect returns correct aspect when different aspects are merged", () => {
        let aspect = mergeResponseAspect(responseEnv.responseAspect1, responseEnv.responseAspect2);
        expect(aspect).to.not.equal(null);
        aspect.name.should.equal(responseEnv.responseAspect1.name);
        assertSplit(a1a2SplitResultAndroid, aspect.slices['android']);
        assertSplit(a1a2SplitResultIos, aspect.slices['ios']);
    });

});
