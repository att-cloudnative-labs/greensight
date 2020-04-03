import { Variable } from '@cpt/capacity-planning-projection';
import requestPromise = require('request-promise-native');


interface VariableNode {
    content: Variable,
    id: string,
    metadata?: any,
    version: number
}

export function fetchBranchVariables(branchId: string): Promise<Variable[]> {
    let beFcHost: string = process.env.BACKEND_FC_HOST || "127.0.0.1";
    let beFcPort: number = parseInt(process.env.BACKEN_FC_PORT || "8443");
    let authToken = process.env.AUTH_TOKEN;

    let p = new Promise<Variable[]>((resolve, reject) => {
        if (!authToken) {
            return reject("no auth token");
        }
        let options = {
            url: 'http://' + beFcHost + ':' + beFcPort + '/variable/' + branchId,
            headers: {
                'Authorization': 'Bearer ' + authToken,
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
                        return reject(v);
                    } else {
                        variables.push(v);
                    }

                }
                return resolve(variables);
            } else {
                return reject("node a branch node");
            }
        }).catch(err => {
            return reject(err);
        })
    });
    return p;
}
