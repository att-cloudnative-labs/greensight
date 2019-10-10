import { Process, GraphModel, SimulationConfiguration, SimulationResult } from '@cpt/capacity-planning-simulation-types';
import { Variable } from '@cpt/capacity-planning-projection';
import requestPromise = require('request-promise-native');

export function fetchModel(id: string, version?: string): Promise<GraphModel> {
    let beModelHost: string = process.env.BACKEND_MODEL_HOST || "127.0.0.1";
    let beModelPort: number = parseInt(process.env.BACKEN_MODEL_PORT || "8080");
    let authToken = process.env.AUTH_TOKEN;

    let p = new Promise<GraphModel>((resolve, reject) => {
        if (!authToken) {
            return reject("no auth token");
        }
        let options = {
            url: 'http://' + beModelHost + ':' + beModelPort + '/tree/' + id + '?sparse=false',
            headers: {
                'Authorization': 'Bearer ' + authToken,
            },
            json: true
        };

        requestPromise(options).then(res => {
            if (res.data[0].hasOwnProperty('type') && res.data[0].type === 'MODEL') {
                // todo: selecting 0 is prob not right.
                // we need to iterate through all entries and just grab the one
                // with the right id.
                let gm = res.data[0].content as GraphModel;
                gm.objectId = id;
                gm.label = res.data[0].name;
                return resolve(gm);
            } else {
                return reject("node a MODEL node");
            }
        }).catch(err => {
            return reject(err);
        })

    });


    return p;
}
