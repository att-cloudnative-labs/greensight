import { SimulationConfiguration } from '@cpt/capacity-planning-simulation-types';
import { TreeNode } from './model-service';
import worker = require('worker_threads');
import { runSimulationSync } from "./simulation-service";


const authToken: string = worker.workerData.authToken;
const sc: SimulationConfiguration = worker.workerData.config;
const srTreeNode: TreeNode = worker.workerData.srTreeNode;
const workerId: number = worker.workerData.workerId;

console.log('running worker ' + workerId);

runSimulationSync(authToken, sc, srTreeNode, `worker${workerId}:`);
