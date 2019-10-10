import { Variable } from './variable';
import { forAllIdentifiers, hasMissingRefs, hasUnavailableExpressions, hasMissingValues, ExpressionResolver, ReferencedIdentifier, IdentifierReferences, ScopedIdentifierValues, IdentifierValues, unavailableExpressionType, unavailableUnaryOps, unavailableJsepBinaryOps, hasUnboundUnaryExpressions } from './expression-utils';
import jsep = require('jsep');




/**
 * Expression represents a mathematical expression.
 * It uses jsep for parsing and supports referenced identifiers
 * to cater for safe identification of identifiers when their name
 * changes.
 *
 * If an expression is parsed it's represented as an abstract
 * syntax tree.
 * Example: "1+x" => BinaryOp(op:'+', left:Literal(1), right: Identifier(x))
 *
 *
 */
export class Expression {

    /**
     * Build a new Expression by parsing a string. A list of variables can be passed in
     * to enrich the parsed expression with the IDs of the variables
     * @param exprString the mathematical expression
     * @param vars a list of variables parsed for IDs
     * @returns Expression if parsing was successfull
     * @returns Error if parsing failed or an identifier is used without a matching variable
     */
    public static parse(exprString: string, vars?: Variable[]): Expression | Error {

        let expr: Expression | Error;
        try {
            // remove literals is missing from the typings
            (jsep as any).removeAllLiterals();
            for (let op of unavailableJsepBinaryOps) {
                jsep.removeBinaryOp(op);
            }
            for (let uop of unavailableUnaryOps) {
                jsep.removeUnaryOp(uop);
            }
            let jse = jsep(exprString);
            let refs: IdentifierReferences = {};
            if (vars) {
                for (let v of vars) {
                    refs[v.name] = v.id;
                }
            }
            expr = Expression.create(jse, refs);
        }
        catch (e) {
            expr = new Error("failed to parse expression");

        }
        return expr;
    }



    /**
     * Build a new Expression by enriching the identifiers of the given parsed expression with the references
     * passed in.
     * @param expr parserd mathematical expression
     * @param refs a list of identifier references (identifier name -> unique id)
     * @returns Expression if succesfull
     * @returns Error if an identifier is used without a reference
     */
    public static create(expr: jsep.Expression, refs?: IdentifierReferences): Expression | Error {
        if (hasMissingRefs(expr, refs)) {
            return new Error("missing reference for identifier");
        }
        if (hasUnavailableExpressions(expr)) {
            return new Error("expression uses unavailable subexpressions");
        }

        if (hasUnboundUnaryExpressions(expr)) {
            return new Error("expression uses unbound subexpressions");
        }
        // add the references to the parsed identifiers
        forAllIdentifiers(expr, (id) => {
            if (refs && refs[id.name]) {
                id.reference = refs[id.name];
            }
        });
        return new Expression(expr);
    }


    public static deserialize(data: any): Expression | Error {
        if (data.hasOwnProperty("jsepExpression")) {
            return new Expression(data.jsepExpression);
        }
        return new Error("invalid data");
    }

    // not supposed to be used externally
    private constructor(private jsepExpression: jsep.Expression) {

    }


    /**
     * Assembles a list of all identifier references needed by an expression (think: variable id).
     * Can be used to determine calculation ordering.
     * @returns list of identifier references
     */
    public getNeededRefs(): string[] {
        let refs: string[] = [];
        forAllIdentifiers(this.jsepExpression, (id) => { if (id.reference) { refs.push(id.reference) } });
        return refs;
    }

    /**
     * Assembles a list of all identifier references needed by an expression (think: variable id).
     * Including names.
     * @returns list of identifier references
     */
    public getNeededRefsExt(): IdentifierReferences {
        let idref: IdentifierReferences = {};
        forAllIdentifiers(this.jsepExpression, (id) => {
            if (id.reference) {
                idref[id.name] = id.reference;
            }
        });
        return idref;
    }

    /**
     * Figure out if the expression is static.
     * This is the case when there are no refs needed.
     * @returns true if the expression is static
     */
    public isStatic(): boolean {
        return this.getNeededRefs().length === 0;
    }

    /**
     * calculate the value of an expression given it's identifier values.
     *
     * @param idValues values of all identifiers (identifier reference->number)
     * @param extraIdValues values of all extra identifiers. this can be used to i.e. pass in distributions
     * @returns number if calculated succesfully
     * @returns Error calculation fails (identifier values missing, ...)
     */
    public calculate(idValues?: IdentifierValues, extraIdValues?: ScopedIdentifierValues): number | Error {
        if (hasMissingValues(this.jsepExpression, idValues)) {
            return new Error("identifier value is missing");
        }
        if (hasUnavailableExpressions(this.jsepExpression)) {
            return new Error("expression uses unavailable subexpressions");
        }
        return ExpressionResolver.resolve(this.jsepExpression, idValues, extraIdValues);
    }
}
