import { from, Subject, Observable, Observer, of, throwError } from 'rxjs';
import { Variable } from '@cpt/capacity-planning-projection';

import requestPromise = require('request-promise-native');
import uuid = require('uuid/v4');


interface VariableNode {
    content: Variable,
    id: string,
    metadata?: any,
    version: number
}


export class ForecastService {
    beFcHost: string = process.env.BACKEND_FC_HOST || "127.0.0.1";
    beFcPort: number = parseInt(process.env.BACKEN_FC_PORT || "8080");

    public fetchBranchVariables(authToken: string, branchId: string): Observable<Variable[]> {
        let o$ = Observable.create((obs: Observer<Variable[]>) => {
            let options = {
                url: 'http://' + this.beFcHost + ':' + this.beFcPort + '/variable/' + branchId,
                headers: {
                    'Authorization': authToken,
                },
                json: true
            };
            requestPromise(options).then(res => {
                if (res.hasOwnProperty('data')) {
                    let variables: Variable[] = [];
                    let varNodes = res.data as VariableNode[];
                    for (let varNode of varNodes) {
                        // patch in variable id
                        varNode.content.id = varNode.id;
                        varNode.content.name = (varNode.content as any)["title"];
                        let v = Variable.deserialize(varNode.content);
                        if (v instanceof Error) {
                            return obs.error(v);
                        } else {
                            variables.push(v);
                        }

                    }
                    obs.next(variables);
                    obs.complete();
                } else {
                    return obs.error("node a branch node");
                }
            }).catch(err => {
                return obs.error(err);
            });

        });

        return o$;
    }
}
