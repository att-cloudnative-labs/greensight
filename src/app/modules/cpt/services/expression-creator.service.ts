import { Injectable } from '@angular/core';
import { ForecastVariableTreeNode } from '../interfaces/forecast-variable';
import { Expression } from '@cpt/capacity-planning-projection/lib/expression';

@Injectable()
export class ExpressionCreatorService {
    // FIXME: this should not be a service
    // and it should not rely on it's internal state
    // to compute output

    dynamicExpressionArray = [];
    newContent = [];
    /**
     * Recursive function that parses the Jsep Expression into a format that the
     * autocomplete.input.component can interpret
     * @param expression
     * @param groupTogether
     */
    parseExpression(expression, groupTogether?: boolean) {
        if (expression.type === 'Identifier') {
            this.dynamicExpressionArray.push({
                id: expression.reference,
                type: 'variable',
                title: expression.name,
                color: 'black'
            });
        } else if (expression.type === 'BinaryExpression') {
            if (groupTogether) {
                this.dynamicExpressionArray.push({
                    id: '',
                    type: 'operator',
                    title: '(',
                    color: 'black'
                });
            }

            if (expression.left) {
                this.parseExpression(expression.left, true);
            }

            if (expression.operator) {
                this.dynamicExpressionArray.push({
                    id: '',
                    type: 'operator',
                    title: expression.operator,
                    color: 'blue'
                });
            }

            if (expression.right) {
                this.parseExpression(expression.right, true);
            }
            if (groupTogether) {
                this.dynamicExpressionArray.push({
                    id: '',
                    type: 'operator',
                    title: ')',
                    color: 'black'
                });
            }

        } else if (expression.type === 'Literal') {
            this.dynamicExpressionArray.push({
                id: '',
                type: 'const',
                title: expression.value,
                color: 'green'
            });
        } else if (expression.type === 'UnaryExpression') {
            if (expression.operator) {
                this.dynamicExpressionArray.push({
                    id: '',
                    type: 'operator',
                    title: expression.operator,
                    color: 'blue'
                });
            }

            if (expression.argument) {
                this.parseExpression(expression.argument, true);
            }
        }
    }

    clearExpressionArray() {
        this.dynamicExpressionArray = [];
    }

    /**
     * Creates plain text expression strings for the projection library to interpret
     */
    formulateExpression(expression) {
        let plainTextExpression = '';
        for (const element of expression) {
            plainTextExpression = plainTextExpression + element.title;
        }
        return plainTextExpression;
    }

    /**
     * Create a list of variables in a structure that the Expression.parse function in the
     * projection library can interpret
     */
    transformVariablesForExpression(variableList) {
        this.newContent = variableList.map((variable: any) => {
            return {
                'id': variable.id,
                'name': variable.content.title,
                'variableType': variable.content.variableType,
                'unit': variable.content.unit,
                'color': variable.content.color,
                'description': variable.content.description,
                'timeSegments': variable.content.timeSegments,
                'actuals': variable.content.actuals,
                'breakdownIds': variable.content.breakdownIds,
                'defaultBreakdown': variable.content.defaultBreakdown
            };
        });
    }

    parseAsExpressionObject(expression) {
        return Expression.parse(expression, this.newContent);
    }
}
