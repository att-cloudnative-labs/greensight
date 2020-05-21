import { Router } from 'express';
import { Response, Request } from 'express';

import { SimulationResult } from '@cpt/capacity-planning-simulation-types';

import { ModelService } from './model-service';
import { headerAuth } from './auth';
const packageInfo = require('../package.json');
import { Worker } from 'worker_threads';
import { runSimulationSync } from "./simulation-service";
import * as path from 'path';

export const simulationRouter: Router = Router();

let runningWorkers = 0;
const maxWorkers: number = parseInt(process.env.GSIGHT_MAX_WORKERS || "5");
let nextWorkerId = 0;

let modelService = new ModelService();

simulationRouter.post("/:simConfigId/run", headerAuth, (req: Request, res: Response) => {
    let simConfigId = req.params['simConfigId'];
    let authToken = req.get("Authorization") as string;
    try {
        if (!simConfigId) {
            throw Error("no simulation config id passed in");
        }

        modelService.fetchSimulationConfiguration(authToken, simConfigId).subscribe(sc => {
            console.log(JSON.stringify(sc));
            if (runningWorkers >= maxWorkers) {
                return res.sendStatus(429);
            } else {
                runningWorkers++;
            }
            modelService.createSimulationResult(authToken, sc).subscribe(srTreeNode => {
                let sr: SimulationResult = srTreeNode.content as SimulationResult;
                console.log(JSON.stringify(sr));
                let responseData = {
                    data: { resultId: sr.objectId },
                    errorMessage: null,
                    status: 'CREATED'
                };
                res.status(201).send(responseData);
                if (maxWorkers > 1) {
                    const workerId = nextWorkerId++;
                    const simFilePath = path.resolve(__dirname, 'simulation-worker.js');
                    const simWorker = new Worker(simFilePath, { workerData: { authToken: authToken, config: sc, srTreeNode: srTreeNode, workerId: workerId } });
                    simWorker.on('exit', (rc) => {
                        console.log(`worker ${workerId} done: ${rc}`);
                        runningWorkers--;
                    });
                } else {
                    runSimulationSync(authToken, sc, srTreeNode);
                    runningWorkers--;
                }

            }, err => {
                console.log("create result failed " + err);
                runningWorkers--;
                res.sendStatus(500);
            });

        }, err => {
            console.log("fetch sim failed " + err);
            res.sendStatus(500);
        })


    } catch (e) {
        res.sendStatus(500);
    }
});

simulationRouter.get("/version", headerAuth, (req: Request, res: Response) => {
    res.send({ 'version': packageInfo.version, 'date': '2019', 'tag': 'n/a' })
});
