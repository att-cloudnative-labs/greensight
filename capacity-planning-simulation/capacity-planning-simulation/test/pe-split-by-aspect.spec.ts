import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';


import {
    genTestParent,
    generatePeProcess,
    genTestEnvironment,
    makeNum,
    makeResponseEnvironment, makeAspectNumber, assertSplit, makeString, getRandom, assertLatencyResponseNumber,
} from './test-util';
import { CptPeSplitByAspect, CptPeSplitByAspectDescription } from "../src/processing-elements/cpt-pe-splitbyaspect";
import { Process, processAddTemplate } from "@cpt/capacity-planning-simulation-types/lib";
import { isString } from "../src/cpt-load-ops";


describe("Processing Element: Split By Aspect", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeSplitByAspectDescription);
    let testEnv = genTestEnvironment()
    const responseEnv = makeResponseEnvironment();
    let pe: CptPeSplitByAspect;
    let seasonPe: CptPeSplitByAspect;

    const seasonProcess = generatePeProcess(CptPeSplitByAspectDescription);



    function setupSeasonProcess(extendedProcess: Process) {
        const templateId = Object.keys(CptPeSplitByAspectDescription.portTemplates)[0];
        function addSlicePort(sliceName: string) {
            const templateGroupId = processAddTemplate(extendedProcess, CptPeSplitByAspectDescription.portTemplates[templateId], getRandom);
            expect(templateGroupId).to.not.equal(null);
            const slicePort = Object.keys(extendedProcess.outports).map(k => extendedProcess.outports[k]).find(p => p.templateGroupId === templateGroupId);
            expect(slicePort).to.not.equal(null);
            slicePort.config = { type: 'STRING', value: sliceName };
        }
        addSlicePort('winter');
        addSlicePort('summer');
        addSlicePort('autumn');
        addSlicePort('spring');
    }

    function getSlicePortId(proc: Process, config: string): string {
        for (const portId in proc.outports) {
            const port = proc.outports[portId];
            if (isString(port.config)) {
                if (port.config.value === config) {
                    return portId;
                }
            }
        }
        return null;
    }

    before("setting up chai", () => {
        chai.should();
        setupSeasonProcess(seasonProcess);
    });

    beforeEach("", () => {
        pe = new CptPeSplitByAspect(testProcess, testParent);
        pe.init(testEnv);
        seasonPe = new CptPeSplitByAspect(seasonProcess, testParent);
        seasonPe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeSplitByAspect);
        seasonPe.should.be.instanceOf(CptPeSplitByAspect);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
        seasonPe.init(testEnv).should.equal(true);
    });

    it("should forward load", () => {
        pe.acceptLoad(makeNum(100, 'kpu'), pe.INPORT_LOAD_ID);
        pe.process();
        const load = pe.yieldLoad(pe.OUTPORT_UNDEFINED_ID);
        expect(load).to.not.equal(null);
        load.should.have.property("type");
        load.type.should.equal("NUMBER");
        load.value.should.equal(100);
    });

    it("should forward load with breakdown if no breakdown is selected", () => {
        pe.acceptLoad(makeAspectNumber(100, responseEnv.aspectSeason), pe.INPORT_LOAD_ID);
        pe.process();
        const undefinedLoad = pe.yieldLoad(pe.OUTPORT_UNDEFINED_ID);
        expect(undefinedLoad).to.not.equal(null);
    });

    it("should have empty undefined output load with breakdown", () => {
        pe.acceptLoad(makeAspectNumber(100, responseEnv.aspectSeason), pe.INPORT_LOAD_ID);
        pe.acceptLoad(makeString('season'), pe.INPORT_ASPECT_NAME_ID);
        pe.process();
        const undefinedLoad = pe.yieldLoad(pe.OUTPORT_UNDEFINED_ID);
        expect(undefinedLoad).to.equal(null);
    });

    it("should have output load split by breakdown", () => {
        const winterPortId = getSlicePortId(seasonProcess, 'winter');
        const summerPortId = getSlicePortId(seasonProcess, 'summer');
        seasonPe.acceptLoad(makeAspectNumber(100, responseEnv.aspectSeason), pe.INPORT_LOAD_ID);
        seasonPe.acceptLoad(makeString('season'), seasonPe.INPORT_ASPECT_NAME_ID);
        seasonPe.process();
        const undefinedLoad = seasonPe.yieldLoad(seasonPe.OUTPORT_UNDEFINED_ID);
        expect(undefinedLoad).to.equal(null);

        const winterLoad = seasonPe.yieldLoad(winterPortId);
        expect(winterLoad).to.not.equal(null);
        expect(winterLoad.type).to.equal('NUMBER');
        winterLoad.value.should.equal(4000);

        const summerLoad = seasonPe.yieldLoad(summerPortId);
        expect(summerLoad).to.not.equal(null);
        expect(summerLoad.type).to.equal('NUMBER');
        summerLoad.value.should.equal(4000);
    });

    it("should split assemble response by breakdown", () => {
        const winterPortId = getSlicePortId(seasonProcess, 'winter');
        const summerPortId = getSlicePortId(seasonProcess, 'summer');
        seasonPe.acceptLoad(makeAspectNumber(100, responseEnv.aspectSeason), pe.INPORT_LOAD_ID);
        seasonPe.acceptLoad(makeString('season'), seasonPe.INPORT_ASPECT_NAME_ID);
        seasonPe.process();
        const undefinedLoad = seasonPe.yieldLoad(seasonPe.OUTPORT_UNDEFINED_ID);
        expect(undefinedLoad).to.equal(null);

        const winterLoad = seasonPe.yieldLoad(winterPortId);
        expect(winterLoad).to.not.equal(null);
        expect(winterLoad.type).to.equal('NUMBER');
        winterLoad.value.should.equal(4000);

        const summerLoad = seasonPe.yieldLoad(summerPortId);
        expect(summerLoad).to.not.equal(null);
        expect(summerLoad.type).to.equal('NUMBER');
        summerLoad.value.should.equal(4000);

        seasonPe.acceptResponse(responseEnv.winterResponse, winterPortId);
        seasonPe.acceptResponse(responseEnv.summerResponse, summerPortId);

        seasonPe.processResponse();

        const response = seasonPe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit(respNum.value, [{ freq: 500, value: 60 }, { freq: 500, value: 40 }]);
    });


});
