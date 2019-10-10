import { Variable } from './variable';
import jsep = require('jsep');


// these binary operations are not supported for now
export var unavailableJsepBinaryOps = [
    '||', '&&', '|', '^', '&',
    '==', '!=', '===', '!==',
    '<', '>', '<=', '>=',
    '<<', '>>', '>>>'
];

export var unavailableExpressionType: jsep.ExpressionType[] = [
    'ArrayExpression', 'ConditionalExpression', 'LogicalExpression',
    'MemberExpression', 'ThisExpression', 'Compound'
];

export var unavailableUnaryOps = [
    '!', '~'
];

export interface ReferencedIdentifier extends jsep.Identifier {
    reference?: string;
}

export type IdentifierReferences = { [idName: string]: string };
export type IdentifierValues = { [ref: string]: number };
export type ScopedIdentifierValues = { [scope: string]: IdentifierValues };

/**
 * Helper to iterate through all subexpressions of an expression.
 * @param expr the expression to iterate through
 * @param cbIdentifier callback given each expression
 */
export function forAllSubExpr(expr: jsep.Expression, cbSubExpr: (subExpr: jsep.Expression, parent?: jsep.Expression) => any, parent?: jsep.Expression) {
    cbSubExpr(expr, parent);
    switch (expr.type) {
        case "ArrayExpression":
            {
                let arrayExpr = expr as jsep.ArrayExpression;
                for (let x of arrayExpr.elements) {
                    forAllSubExpr(x, cbSubExpr, arrayExpr);
                }
            }
            break;
        case "BinaryExpression":
            {
                let biExp = expr as jsep.BinaryExpression;
                forAllSubExpr(biExp.left, cbSubExpr, biExp);
                forAllSubExpr(biExp.right, cbSubExpr, biExp);
            }
            break;
        case "CallExpression":
            {
                let callExp = expr as jsep.CallExpression;
                forAllSubExpr(callExp.callee, cbSubExpr, callExp);
                for (let x of callExp.arguments) {
                    forAllSubExpr(x, cbSubExpr, callExp);
                }
            }
            break;

        case "Compound":
            {
                let compExp = expr as jsep.Compound;
                for (let x of compExp.body) {
                    forAllSubExpr(x, cbSubExpr, compExp);
                }
            }
            break;
        case "ConditionalExpression":
            {
                let condExp = expr as jsep.ConditionalExpression;
                forAllSubExpr(condExp.test, cbSubExpr, condExp);
                forAllSubExpr(condExp.consequent, cbSubExpr, condExp);
                forAllSubExpr(condExp.alternate, cbSubExpr, condExp);
            }
            break;
        case "LogicalExpression":
            {
                let logExp = expr as jsep.LogicalExpression;
                forAllSubExpr(logExp.left, cbSubExpr, logExp);
                forAllSubExpr(logExp.right, cbSubExpr, logExp);
            }
            break;
        case "MemberExpression":
            {
                let memExp = expr as jsep.MemberExpression;
                forAllSubExpr(memExp.object, cbSubExpr, memExp);
                forAllSubExpr(memExp.property, cbSubExpr, memExp);
            }
            break;
        case "UnaryExpression":
            {
                let unExp = expr as jsep.UnaryExpression;
                forAllSubExpr(unExp.argument, cbSubExpr, unExp);
            }
            break;
        default:
            // ignoring everything else for now
            break;
    }
    return undefined;
}


/**
 * Helper to iterate through all Identifiers of an expression.
 * @param expr the expression to iterate through
 * @param cbIdentifier callback given each identifier
 */
export function forAllIdentifiers(expr: jsep.Expression, cbIdentifier: (id: ReferencedIdentifier, parent?: jsep.Expression) => any) {
    forAllSubExpr(expr, (e, p) => {
        switch (e.type) {
            case "Identifier":
                let identifier = e as ReferencedIdentifier;
                if (p && p.type === "CallExpression" && identifier.name === "d") {
                    // special case: call expressions have identifiers
                    // as name. we support the call d() to pick up distributions.
                    // this is not reported as identifier
                } else {
                    cbIdentifier(identifier, p);
                }
                break;
            default:
                // ignoring everything else for now
                break;
        }
    });
}

// check if an expression is used that is not supported
export function hasUnavailableExpressions(expr: jsep.Expression): boolean {
    let foundUnavailble = false;
    forAllSubExpr(expr, (e) => {
        if (unavailableExpressionType.indexOf(e.type) > -1) {
            foundUnavailble = true;
        }
        //  only allow d(<identifier) call expressions
        if (e.type === "CallExpression") {
            if (!isValidDCallExpression(e as jsep.CallExpression)) {
                foundUnavailble = true;
            }
        }
    });
    return foundUnavailble;
}

// check if a unary expression is used without an argument
export function hasUnboundUnaryExpressions(expr: jsep.Expression): boolean {
    let foundUnbound = false;
    forAllSubExpr(expr, (e) => {
        if (e.type === "UnaryExpression") {
            let u = e as jsep.UnaryExpression;
            if (!u.argument) {
                foundUnbound = true;
            }
        }
    });
    return foundUnbound;
}

// use name to lookup reference
export function hasMissingRefs(expr: jsep.Expression, refs?: IdentifierReferences): boolean {
    let missingRef = false;
    forAllIdentifiers(expr, (i) => {
        if (!refs || !refs[i.name]) {
            missingRef = true;
        }
    });
    return missingRef;
}


// use reference to look up value
export function hasMissingValues(expr: jsep.Expression, idValues?: IdentifierValues): boolean {
    let missingRefVal = false;
    forAllIdentifiers(expr, (i) => {
        if (!idValues || !i.reference || idValues[i.reference] == undefined) {
            missingRefVal = true;
        }
    });
    return missingRefVal;
}

function isValidDCallExpression(callexp: jsep.CallExpression): boolean {
    if (callexp.arguments.length !== 1 || callexp.arguments[0].type !== 'Identifier') {
        return false;
    }
    if (callexp.callee.type !== 'Identifier') {
        return false;
    }
    let callee = callexp.callee as jsep.Identifier;
    if (callee.name !== 'd') {
        return false;
    }

    return true;
}

/**
 *  A basic resolver for expressions.
 *  It supports +,-,*,/,%. For each identifier used in the expression a value has to be passed in.
 *
 */
export class ExpressionResolver {
    private constructor(private idValues?: IdentifierValues, private scopedIdValues?: ScopedIdentifierValues) {

    }

    /**
     * Resolve an Expression to final value
     * @param expr the expression to solve
     * @param idValues a map from identifier references to identifier values
     * @param scopedIdValues extra identifier value maps (not used atm)
     * @returns number if the calculation succeeds.
     * @returns Error if an error occurs (i.e. missing identifier values)
     *
     */
    public static resolve(expr: jsep.Expression, idValues?: IdentifierValues, scopedIdValues?: ScopedIdentifierValues): number | Error {
        let er = new ExpressionResolver(idValues, scopedIdValues);
        return er.resolveExpression(expr);
    }

    /**
     * Resolve a binary expression.
     * @param expr the binary expression to be resolved
     * @returns number if resolving was successful
     * @returns Error otherwise
     */
    private resolveBinary(expr: jsep.BinaryExpression): number | Error {
        let left = this.resolveExpression(expr.left);
        let right = this.resolveExpression(expr.right);
        if (typeof left !== 'number') {
            return left;
        }
        if (typeof right !== 'number') {
            return right;
        }
        switch (expr.operator) {
            case "+":
                return left + right;
            case "-":
                return left - right;
            case "*":
                return left * right;
                break;
            case "/":
                return left / right;
                break;
            case "%":
                return left % right;
            default:
                return new Error("unsupported operator");
        }
    }

    /**
     * Resolve an unary expression.
     * @param expr the unary expression to be resolved
     * @returns number if resolving was successful
     * @returns Error otherwise
     */
    private resolveUnary(expr: jsep.UnaryExpression): number | Error {
        if (!expr.prefix) {
            return new Error("non prefix unary not supported");
        }
        switch (expr.operator) {
            case '+':
                return this.resolveExpression(expr.argument);
            case '-':
                let ret = this.resolveExpression(expr.argument);
                if (typeof ret === "number") {
                    return -1 * ret;
                } else {
                    return ret;
                }
            default:
                return new Error("unary operator not supported");

        }
    }

    /**
     * Resolve a literal.
     * @param expr the literal expression to be resolved
     * @returns number if resolving was successful
     * @returns Error otherwise
     */
    private resolveLiteral(literal: jsep.Literal): number | Error {
        if (typeof literal.value !== 'number')
            return new Error("literal not a number");
        return literal.value;
    }


    /**
     * Resolve an identifier.
     * @param expr the literal expression to be resolved
     * @returns number if resolving was successful
     * @returns Error otherwise
     */
    private resolveIdentifier(identifier: ReferencedIdentifier, scope?: string): number | Error {
        let vals: IdentifierValues | undefined = this.idValues;
        if (scope) {
            if (this.scopedIdValues) {
                vals = this.scopedIdValues[scope];
            } else {
                return new Error("unavailable scope: " + scope);
            }
        }
        if (!vals || !identifier.reference || vals[identifier.reference] === undefined) {
            return new Error("no value found for identifier");
        } else {
            return vals[identifier.reference];
        }
    }

    /**
     * Resolve a call expression.
     * @param call the call expression
     * @returns number if resolving was successful
     * @returns Error otherwise
     */
    private resolveCall(call: jsep.CallExpression): number | Error {
        if (call.callee.type === 'Identifier') {
            let callee = call.callee as jsep.Identifier;
            if (callee.name !== 'd') {
                return new Error("only the call d(<Identifier>) is supported");
            } else {
                return (this.resolveDistributionCall(call));
            }
        }
        return new Error("failed to resolve call " + call.callee);
    }


    /**
     * Resolve the d(x) expression
     * It fetches the distribution for x
     * @param call the call expression
     * @returns number if resolving was successful
     * @returns Error otherwise
     */

    private resolveDistributionCall(call: jsep.CallExpression): number | Error {
        // we only support the "d(<Identifier>)" call, which fetches a distribution for a given literal.

        if (!this.scopedIdValues) {
            return new Error("can't resolve d() expression without values");
        }
        if (!isValidDCallExpression(call)) {
            return new Error("not a valid d() call");
        }
        return this.resolveIdentifier(call.arguments[0] as jsep.Identifier, "distribution");
    }

    /**
     * Resolve an expression.
     * @param expr the expression to be resolved
     * @returns number if resolving was successful
     * @returns Error otherwise
     */
    private resolveExpression(expr: jsep.Expression): number | Error {
        switch (expr.type) {
            case 'BinaryExpression':
                return this.resolveBinary(expr as jsep.BinaryExpression);
                break;
            case 'UnaryExpression':
                return this.resolveUnary(expr as jsep.UnaryExpression);
            case 'Literal':
                return this.resolveLiteral(expr as jsep.Literal);
            case 'Identifier':
                return this.resolveIdentifier(expr as jsep.Identifier);
            case 'CallExpression':
                return this.resolveCall(expr as jsep.CallExpression);
            default:
                return new Error("unresolvable expression");
        }
    }


}
