import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';
import { assertAspect } from './test-util';
import { Aspect, AspectParam, AspectNumberParam, NumberParam, GraphParam } from '../types/src/index';
import { addAspects, filterAspects, aggregateLoad } from '../src/cpt-load-ops';
import { makeNum } from './test-util';

describe("Load Ops", () => {

    let bdPlatform: Aspect = {
        type: 'BREAKDOWN',
        name: 'platform',
        slices: {
            'ios': 5,
            'android': 5
        }
    }

    let bdApi: Aspect = {
        type: 'BREAKDOWN',
        name: 'api',
        slices: {
            '/login': 4,
            '/search': 4,
            '/play': 2
        }
    }
    let tag1: Aspect = {
        type: 'TAG',
        name: 'tag1',
        slices: {
            'tag1': 10
        }
    }
    let tag2: Aspect = {
        type: 'TAG',
        name: 'tag2',
        slices: {
            'tag1': 10
        }
    }

    before("Setting up test variables", () => {
        chai.should();
        chai.use(chaiAsPromised)
    });

    it("addAspect should merge same name aspect", () => {
        let added: Aspect[] = addAspects(10, [bdPlatform], 10, [bdPlatform]);
        added.length.should.equal(1);
        let bd = added[0];
        assertAspect(bd, { 'ios': 10, 'android': 10 });
    });

    it("addAspect scale independent aspects", () => {
        let added: Aspect[] = addAspects(10, [tag1], 10, [tag2]);
        added.length.should.equal(2);
        let tag1Result = added.filter(a => a.name === tag1.name).pop();
        let tag2Result = added.filter(a => a.name === tag2.name).pop();
        assertAspect(tag1Result, { 'tag1': 10, 'unknown': 10 }, 'tag1');
        assertAspect(tag2Result, { 'tag2': 10, 'unknown': 10 }, 'tag2');
    });

    it("addAspect should combine same name and independent breakdowns", () => {
        let added: Aspect[] = addAspects(10, [tag1, bdPlatform, bdApi], 10, [tag2, bdPlatform]);
        added.length.should.equal(4);
        let tag1Result = added.filter(a => a.name === tag1.name).pop();
        let tag2Result = added.filter(a => a.name === tag2.name).pop();
        let platformResult = added.filter(a => a.name === bdPlatform.name).pop();
        let apiResult = added.filter(a => a.name === bdApi.name).pop();
        assertAspect(tag1Result, { 'tag1': 10, 'unknown': 10 }, 'tag1');
        assertAspect(tag2Result, { 'tag2': 10, 'unknown': 10 }, 'tag2');
        assertAspect(platformResult, { 'ios': 10, 'android': 10 });
        assertAspect(apiResult, { '/play': 2, '/login': 4, '/search': 4, 'unknown': 10 });
    });

    it("filterAspect returns single aspect with single slice", () => {
        let asp: Aspect[] = [bdPlatform];
        let filtered: Aspect[] = filterAspects([bdPlatform], 'platform', 'android');
        filtered.length.should.equal(1);
        let platformResult = filtered.filter(a => a.name === bdPlatform.name).pop();
        assertAspect(platformResult, { 'android': 5 });
        expect(platformResult.slices['ios']).to.equal(undefined);
    });

    it("aggregateLoad should add nums", () => {
        let aggregate: GraphParam = aggregateLoad([makeNum(10), makeNum(20)]);
        aggregate.type.should.equal('NUMBER');
        aggregate.value.should.equal(30);
    });

});
