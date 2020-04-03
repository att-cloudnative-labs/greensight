import { from, Subject, Observable, Observer, of, throwError } from 'rxjs';
import { map, reduce, switchMap } from 'rxjs/operators';

import { SimulationConfiguration, SimulationResult, GraphModel } from '@cpt/capacity-planning-simulation-types';
import requestPromise = require('request-promise-native');
import uuid = require('uuid/v4');
import { Variable } from '@cpt/capacity-planning-projection';



export interface TreeNode {
    content: any,
    id: string,
    metadata?: any,
    version?: number,
    name: string,
    type: string,
    parentId: string,
    acl?: any,
    accessControl: string,
}

interface TreeNodeResponse {
    data: TreeNode[] | TreeNode
    errorMessage: string | null,
    status: string,
}

interface SheetContent {
    variables: { [varId: string]: any };
}


export class ModelService {
    beModelHost: string = process.env.BACKEND_MODEL_HOST || "127.0.0.1";
    beModelPort: number = parseInt(process.env.BACKEN_MODEL_PORT || "8080");

    private getTreeNode(authToken: string, nodeId: string): Observable<TreeNode> {
        return this.getTreeNodes(authToken, nodeId, false).pipe(map(tns => tns[0]));
    }

    private getTreeNodes(authToken: string, nodeId: string, withChildren: boolean): Observable<TreeNode[]> {
        const url = `http://${this.beModelHost}:${this.beModelPort}/tree/${nodeId}?sparse=false&sparseChildren=false&withChildren=${withChildren}`;
        let o$ = Observable.create((obs: Observer<TreeNode[]>) => {
            let options = {
                url: url,
                headers: {
                    'Authorization': authToken,
                },
                json: true
            };

            requestPromise(options).then(res => {
                let tnResponse = res as TreeNodeResponse;
                let treeNodes = (tnResponse.data as TreeNode[]);
                obs.next(treeNodes);
                obs.complete();
            }).catch(err => {
                obs.error(err);
            })
        });

        return o$;
    }


    private postTreeNode(authToken: string, node: TreeNode): Observable<TreeNode> {
        let o$ = Observable.create((obs: Observer<TreeNode>) => {
            let options = {
                url: 'http://' + this.beModelHost + ':' + this.beModelPort + '/tree',
                headers: {
                    'Authorization': authToken,
                },
                body: node,
                json: true,
                method: 'POST'

            };

            requestPromise(options).then(res => {
                let tnResponse = res as TreeNodeResponse;
                obs.next(tnResponse.data as TreeNode);
                obs.complete();
            }).catch(err => {
                obs.error(err);
            })
        });

        return o$;
    }

    private putTreeNode(authToken: string, node: TreeNode): Observable<TreeNode> {
        let o$ = Observable.create((obs: Observer<TreeNode>) => {
            let options = {
                url: 'http://' + this.beModelHost + ':' + this.beModelPort + '/tree/' + node.id + '?v=' + node.version,
                headers: {
                    'Authorization': authToken,
                },
                body: node,
                json: true,
                method: 'PUT'

            };

            requestPromise(options).then(res => {
                let tnResponse = res as TreeNodeResponse;
                obs.next(tnResponse.data as TreeNode);
                obs.complete();
            }).catch(err => {
                obs.error(err);
            })
        });

        return o$;
    }

    public fetchSimulationConfiguration(authToken: string, simConfId: string): Observable<SimulationConfiguration> {
        return this.getTreeNode(authToken, simConfId).pipe(map(tn => {
            let sc = tn.content as SimulationConfiguration
            sc.objectId = simConfId;
            sc.objectType = 'SIMULATION_CONFIGURATION';
            return sc;
        }));
    }

    public fetchModel(authToken: string, modelId: string, version?: string): Observable<{ version: string, gm: GraphModel }> {
        const requestId = version && version !== 'latest' ? `${modelId}@${version}` : modelId;
        return this.getTreeNode(authToken, requestId).pipe(map(tn => {
            let gm = tn.content as GraphModel;
            gm.objectId = modelId;
            gm.objectType = 'GRAPH_MODEL';
            if (!gm.label) {
                gm.label = tn.name;
            }
            let reportVersion = version ? version : "latest";
            return { gm: gm, version: reportVersion };
        }));
    }

    public updateSimulationResult(authToken: string, srNode: TreeNode): Observable<TreeNode> {
        return this.putTreeNode(authToken, srNode);
    }

    public createSimulationResult(authToken: string, sc: SimulationConfiguration): Observable<TreeNode> {
        let srId = uuid();
        let createTimeString = new Date().toISOString();
        let resultName = createTimeString.slice(0, -5);
        let sr: SimulationResult = {
            state: 'QUEUED',
            simulationConfigurationId: sc.objectId,
            simulationConfigurationVersion: 'latest',
            stepStart: sc.stepStart,
            stepLast: sc.stepLast,
            queuedAt: createTimeString,
            objectType: 'SIMULATION_RESULT',
            objectId: srId,
            nodes: {},
            scenarios: {}
        };
        let node: TreeNode = {
            id: srId,
            content: sr,
            name: resultName,
            parentId: sc.objectId,
            type: 'SIMULATIONRESULT',
            accessControl: 'INHERIT',
            version: 1

        };
        return this.postTreeNode(authToken, node);
    }


    public fetchSheet(authToken: string, sheetId: string, version?: string): Observable<{ version: string, variables: Variable[] }> {
        const requestId = version && version !== 'latest' ? `${sheetId}@${version}` : sheetId;
        return this.getTreeNode(authToken, requestId).pipe(map(tn => {
            let variables: Variable[] = [];
            const sheetContent = tn.content as SheetContent;
            for (const variableId in sheetContent.variables) {
                const variable = sheetContent.variables[variableId];
                const varSerialized = { ...variable, id: variable.objectId, name: variable.title };
                let v = Variable.deserialize(varSerialized);
                if (v instanceof Error) {
                    // ignore for now
                } else {
                    variables.push(v);
                }
            }
            let reportVersion = version ? version : "latest";
            return { variables: variables, version: reportVersion };
        }));
    }

    public fetchBranchVariables(authToken: string, branchId: string): Observable<Variable[]> {
        return this.getTreeNodes(authToken, branchId, true).pipe(map(tns => {
            let variableNodes = tns.filter(tn => tn.type.startsWith('FC_VARIABLE'));
            let variables: Variable[] = [];
            for (var i = variableNodes.length - 1; i >= 0; i--) {
                let node = variableNodes[i];
                node.content.id = node.id;
                node.content.name = node.content.title;
                let v = Variable.deserialize(node.content);
                if (v instanceof Error) {
                    // ignore for now
                } else {
                    variables.push(v);
                }
            }
            return variables;
        }));
    }
}
