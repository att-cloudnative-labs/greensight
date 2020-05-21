import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, it } from 'mocha';
import { assertAspect } from './test-util';
import { addAspects, aggregateParams } from '../src/cpt-load-ops';
import { makeNum } from './test-util';
import { Aspect, GraphParam } from "@cpt/capacity-planning-simulation-types";

describe("Load Ops", () => {

    let bdPlatform: Aspect = {
        name: 'platform',
        slices: {
            'ios': 5,
            'android': 5
        }
    }

    let bdApi: Aspect = {
        name: 'api',
        slices: {
            '/login': 4,
            '/search': 4,
            '/play': 2
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


    it("aggregateLoad should add nums", () => {
        let aggregate: GraphParam = aggregateParams([makeNum(10), makeNum(20)]);
        aggregate.type.should.equal('NUMBER');
        aggregate.value.should.equal(30);
    });

});
