import { expect } from 'chai'
import { getMonths } from '../src/date';

describe("getMonths()", () => {
    it("should return no months if endtime earlier than startime", () => {
        const months = getMonths("2018-09", "2018-04");
        expect(months).to.be.empty;
    });
});
