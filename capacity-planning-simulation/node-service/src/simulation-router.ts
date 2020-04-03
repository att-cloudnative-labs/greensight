import { Router } from 'express';
import { Response, Request } from 'express';

import { SimulationResult } from '@cpt/capacity-planning-simulation-types';

import { ModelService } from './model-service';
import { SimulationService } from './simulation-service';
import { headerAuth } from './auth';
const packageInfo = require('../package.json')

export const simulationRouter: Router = Router();

let modelService = new ModelService();
let simulationService = new SimulationService();
simulationRouter.post("/:simConfigId/run", headerAuth, (req: Request, res: Response) => {
    let simConfigId = req.params['simConfigId'];
    let authToken = req.get("Authorization") as string;
    try {
        if (!simConfigId) {
            throw Error("no simulation config id passed in");
        }

        modelService.fetchSimulationConfiguration(authToken, simConfigId).subscribe(sc => {
            console.log(JSON.stringify(sc));
            modelService.createSimulationResult(authToken, sc).subscribe(srTreeNode => {
                let sr: SimulationResult = srTreeNode.content as SimulationResult;
                console.log(JSON.stringify(sr));
                let responseData = {
                    data: { resultId: sr.objectId },
                    errorMessage: null,
                    status: 'CREATED'
                }
                res.status(201).send(responseData);
                simulationService.runSimulationSync(authToken, sc, srTreeNode);
            }, err => {
                console.log("create result failed " + err)
                res.sendStatus(500);
            });

        }, err => {
            console.log("fetch sim failed " + err)
            res.sendStatus(500);
        })


    } catch (e) {
        res.sendStatus(500);
    }
});

simulationRouter.get("/version", headerAuth, (req: Request, res: Response) => {
    res.send({ 'version': packageInfo.version, 'date': '2019', 'tag': 'n/a' })
});
