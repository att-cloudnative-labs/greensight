import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { genMonths } from '../src/cpt-date-ops';

describe("Date Ops", () => {

    before("Setting up test variables", () => {
        chai.should();
        chai.use(chaiAsPromised)
    });

    it("genMonths should return right number of months", () => {
        let m = genMonths('2019-01', '2019-10');
        m.length.should.equal(10);
    });

    it("genMonths should return right number of months over new year", () => {
        let m = genMonths('2019-10', '2020-02');
        m.length.should.equal(5);
    });

    it("genMonths should return none if s > e", () => {
        let m = genMonths('2020-10', '2020-02');
        m.length.should.equal(0);
    });

});
