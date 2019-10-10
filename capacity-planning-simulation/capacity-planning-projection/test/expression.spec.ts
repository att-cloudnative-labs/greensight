import { expect } from 'chai';
import { Expression } from '../src/expression';
import { IdentifierValues, IdentifierReferences, ScopedIdentifierValues } from '../src/expression-utils';
import jsep = require('jsep');



describe("Expression", () => {
    let simpleRefs: { [refName: string]: string } = { "x": "x-id" };
    let simpleVals: IdentifierValues = { "x-id": 10 };
    let simpleZeroVals: IdentifierValues = { "x-id": 0 };
    let simpleDVals: ScopedIdentifierValues = { "distribution": { "x-id": 15 } };
    let simpleExpression: jsep.Expression = jsep("x");
    let simpleUnaryExpression: jsep.Expression = jsep("-x");
    let complexExpression: jsep.Expression = jsep("1+(2*x)");
    let simpleDExpression: jsep.Expression = jsep("d(x)");
    let emptyDExpression: jsep.Expression = jsep("d()");
    let unsupportedCallExpression: jsep.Expression = jsep("x(x)");
    let emptyExpression: jsep.Expression = jsep("");
    let basicLiteralExpression: jsep.Expression = jsep("1+1");
    let divideByZeroExpression: jsep.Expression = jsep("1/0");
    let complexLiteralExpression: jsep.Expression = jsep("1+(10*2+2)");

    function checkForCalcResult(expression: jsep.Expression, expResult: number | Error, refs?: IdentifierReferences, refsVal?: IdentifierValues, scopeRefVals?: ScopedIdentifierValues): () => any {
        return () => {
            let result = Expression.create(expression, refs);
            expect(result).not.instanceOf(Error);
            let ae = result as Expression;
            let calcResult = ae.calculate(refsVal, scopeRefVals);
            if (typeof expResult === 'number') {
                expect(calcResult).not.instanceOf(Error);
                expect(calcResult).equal(expResult);
            } else {
                expect(calcResult).instanceOf(Error);
            }
        };
    }

    it("shouldn return an error on an empty expression", () => {
        let result = Expression.parse("");
        expect(result).instanceOf(Error);
    });

    it("shouldn't return an error on an simple expression", () => {
        let result = Expression.parse("1+1");
        expect(result).not.instanceOf(Error);
    });

    it("should return an error on an expression with unavailable ops", () => {
        let result = Expression.parse("1 || 1");
        expect(result).instanceOf(Error);
    });

    it("should return an error on an expression with an unbound unary expressions", () => {
        let result = Expression.parse("100--");
        expect(result).instanceOf(Error);
    });


    it("should fail to parse against an empty variable set if the expression has an identifier", () => {
        let exp = Expression.parse("x");
        expect(exp).instanceOf(Error);
    });

    it("should fail to parse against an empty variable set if the complex expression has an identifier", () => {
        let exp = Expression.parse("1+(2*x)");
        expect(exp).instanceOf(Error);
    });

    it("should return an error on an simple identifier expression without refs", () => {
        let result = Expression.create(simpleExpression);
        expect(result).instanceOf(Error);
    });

    it("should return an error on more complex identifier expression without refs", () => {
        let result = Expression.create(complexExpression);
        expect(result).instanceOf(Error);
    });

    it("should successfully create an expression with a d() call", () => {
        let result = Expression.create(simpleDExpression, simpleRefs);
        expect(result).instanceOf(Expression);
    });

    it("should fail to create an expression with a d() call with missing refs", () => {
        let result = Expression.create(simpleDExpression);
        expect(result).instanceOf(Error);
    });

    it("should fail to create an expression with a d() call without identifier", () => {
        let result = Expression.create(emptyDExpression, simpleRefs);
        expect(result).instanceOf(Error);
    });

    it("should fail to create an expression with an unsupported call", () => {
        let result = Expression.create(unsupportedCallExpression, simpleRefs);
        expect(result).instanceOf(Error);
    });

    it("should apply refs on root level", () => {
        let result = Expression.create(simpleExpression, simpleRefs);
        expect(result).not.instanceOf(Error);
        let ae = result as Expression;
        let neededRefs = ae.getNeededRefs();
        expect(neededRefs).to.have.length(1);
        expect(neededRefs[0]).to.equal(simpleRefs.x);
    });

    it("should apply refs on lower level", () => {
        let result = Expression.create(complexExpression, simpleRefs);
        expect(result).not.instanceOf(Error);
        let ae = result as Expression;
        let neededRefs = ae.getNeededRefs();
        expect(neededRefs).to.have.length(1);
        expect(neededRefs[0]).to.equal(simpleRefs.x);
    });

    it("should calculate a basic literal expression", checkForCalcResult(basicLiteralExpression, 2));

    it("should calculate a complex literal expression", checkForCalcResult(complexLiteralExpression, 23));

    it("should return infinity on divide by zero", checkForCalcResult(divideByZeroExpression, Infinity));

    it("should calculate a simple expression", checkForCalcResult(simpleExpression, 10, simpleRefs, simpleVals));

    it("should calculate a simple expression with a zero reference value", checkForCalcResult(simpleExpression, 0, simpleRefs, simpleZeroVals));

    it("should calculate a complex expression", checkForCalcResult(complexExpression, 21, simpleRefs, simpleVals));

    it("should calculate a simple unary expression", checkForCalcResult(simpleUnaryExpression, -10, simpleRefs, simpleVals));

    it("should fail calculating a complex expression without values", checkForCalcResult(complexExpression, new Error(), simpleRefs));

    it("should calculate a basic distribution expression", checkForCalcResult(simpleDExpression, 15, simpleRefs, simpleVals, simpleDVals));

    it("should fail calculating a basic distribution expression without values", checkForCalcResult(simpleDExpression, new Error(), simpleRefs, simpleVals));

});
