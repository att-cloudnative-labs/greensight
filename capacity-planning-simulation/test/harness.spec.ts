import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { CptSimulationHarness } from '../src/cpt-simulation-harness';
import { fetchSheetVariables} from '../src/test-data/forecast-be-shim';
import { fetchModel } from '../src/test-data/model-be-shim';
import { getSimulationConfiguration } from '../src/test-data/simulation-configurations';


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
        let simConf = getSimulationConfiguration('INOUT');
        return sh.runSimulationConfiguration(simConf).should.eventually.have.property('nodes').and
    });
});
