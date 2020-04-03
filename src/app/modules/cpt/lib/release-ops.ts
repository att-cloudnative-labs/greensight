import { TreeNode } from '@cpt/interfaces/tree-node';
import { ReleaseProcessPinning, TreeNodeRelease, TreeNodeReleaseCreateDto } from '@cpt/interfaces/tree-node-release';
import { Observable, of } from 'rxjs';
import { combineAll, flatMap, map } from 'rxjs/operators';
import { GraphModel, Process, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import {
    GraphModelReleaseFailedToPrepareException,
    GraphModelReleaseNeedsPinningException
} from '@cpt/state/release.actions';
import produce from 'immer';
import { runSyncGraphModel } from '@cpt/lib/synchronize-graph-model';
import { Store } from '@ngxs/store';
import { GraphModelInterfaceState, GraphModelInterfaceStateModel } from '@cpt/state/graph-model-interface.state';


function processesNeedPinning(processes: Process[], pinningDecisions: ReleaseProcessPinning[]): Process[] {
    const pinnableProcesses = processes.filter(p => p.tracking && p.tracking === 'LATEST_RELEASE');
    return pinnableProcesses.filter(p => pinningDecisions.findIndex(pin => pin.processId === p.objectId) < 0);
}

function processesNotPinnable(peState: GraphModelInterfaceStateModel, processes: Process[]): Process[] {
    return processes.filter(p => !p.tracking || p.tracking === 'CURRENT_VERSION' || (p.tracking === 'LATEST_RELEASE' && !peState.latestRelease[p.ref]));
}

function applyPinnings(store: Store, treeNode: TreeNode, pinningDecision: ReleaseProcessPinning[]): TreeNode {
    if (!pinningDecision || !pinningDecision.length) {
        return treeNode;
    }
    const updatedNode = produce(treeNode, (draftNode) => {
        // update all processes with pinning decisions to fixed and the
        // the respective release number
        for (const pin of pinningDecision) {
            const process = draftNode.content.processes[pin.processId] as Process;
            if (process) {
                process.tracking = 'FIXED';
                process.releaseNr = pin.releaseNr;
            }
        }
        runSyncGraphModel(draftNode, p => GraphModelInterfaceState.findPid(store, p));
    });

    const updatedGraphModelProcesses = Object.values((updatedNode.content as GraphModel).processes).filter(p => p.type === 'GRAPH_MODEL');
    if (processesNeedPinning(updatedGraphModelProcesses, []).length) {
        throw new Error('Failed to pin graph model');
    }
    return updatedNode;
}


function prepareReleaseOfGraphModel(store: Store, treeNode: TreeNode, pinningDecisions: ReleaseProcessPinning[]): Observable<TreeNodeReleaseCreateDto> {
    const gms = store.selectSnapshot(GraphModelInterfaceState) as GraphModelInterfaceStateModel;
    return of(treeNode).pipe(
        flatMap(tn => {
            const gm = treeNode.content as GraphModel;
            const graphModelProcesses = Object.values(gm.processes).filter(p => p.type === 'GRAPH_MODEL');
            const unpinnableProcesses = processesNotPinnable(gms, graphModelProcesses);
            if (unpinnableProcesses.length) {
                throw new GraphModelReleaseFailedToPrepareException({ failedProcesses: unpinnableProcesses });
            }
            const pinningProcesses = processesNeedPinning(graphModelProcesses, pinningDecisions);
            if (pinningProcesses.length === 0) {
                const releaseDto = {
                    objectId: treeNode.id,
                    versionId: treeNode.version,
                    treeNode: applyPinnings(store, treeNode, pinningDecisions)
                } as TreeNodeReleaseCreateDto;
                return of(releaseDto);
            } else {
                // fixme: this is just for the demo
                const pinSuggestions: ReleaseProcessPinning[] = pinningProcesses.map(proc => {
                    const releasePid = GraphModelInterfaceState.findPid(store, proc);
                    const pinning: ReleaseProcessPinning = {
                        graphModelId: treeNode.id,
                        processId: proc.objectId,
                        releaseNr: releasePid.releaseNr
                    };
                    return pinning;
                });
                throw new GraphModelReleaseNeedsPinningException({ toBePinnedProcesses: pinningProcesses, pinningSuggestions: pinSuggestions });
            }
        })
    );
}

export function prepareReleaseOfTreeNode(store: Store, treeNode: TreeNode, pinningDecisions: ReleaseProcessPinning[]): Observable<TreeNodeReleaseCreateDto> {

    return of(treeNode).pipe(
        flatMap(tn => {
            switch (tn.type) {
                case 'FC_SHEET':
                    return of({
                        objectId: treeNode.id,
                        versionId: treeNode.version,
                        treeNode: treeNode
                    } as TreeNodeReleaseCreateDto);
                case 'MODEL':
                    return prepareReleaseOfGraphModel(store, tn, pinningDecisions);
                default:
                    break;
            }
        })
    );
}
