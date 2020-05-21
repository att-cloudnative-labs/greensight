import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { CptSimulationHarness } from '../src/cpt-simulation-harness';
import { fetchSheetVariables } from '../src/test-data/forecast-be-shim';
import { fetchModel } from '../src/test-data/model-be-shim';
import { getSimulationConfiguration } from '../src/test-data/simulation-configurations';
import { SimulationResult } from "@cpt/capacity-planning-simulation-types";


describe("Simulation Harness", () => {
    let sh: CptSimulationHarness;

    before("Setting up test variables", () => {
        chai.should();
        chai.use(chaiAsPromised)
        sh = new CptSimulationHarness(fetchSheetVariables, fetchModel);
    });

    it("should be instantiable", () => {
        expect(this.sh).not.eq(null);
    });
    it("should run a simple configuration", () => {
        const simConf = getSimulationConfiguration('INOUT');
        const sr: SimulationResult = {
            state: 'QUEUED',
            simulationConfigurationId: simConf.objectId,
            simulationConfigurationVersion: 'latest',
            stepStart: simConf.stepStart,
            stepLast: simConf.stepLast,
            queuedAt: 'now',
            objectType: 'SIMULATION_RESULT',
            objectId: 'randomId',
            nodes: {},
            scenarios: simConf.scenarios
        };

        sh.runSimulationConfiguration(simConf, sr).should.be.fulfilled;
        // fixme: add content check

    });
});
