import { TreeNodeReferenceTracking, TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';


export function refNeedsUpdate(tnti: TreeNodeInfo, tnrt: TreeNodeReferenceTracking, versionNr?: number): null | { releaseNr?: number, versionNr?: number } {
    if (tnrt.tracking === 'CURRENT_VERSION' || (tnrt.tracking === 'LATEST_RELEASE' && !tnti.releaseNr)) {
        if (versionNr && versionNr >= tnti.currentVersionNr) {
            return null;
        } else {
            return { versionNr: tnti.currentVersionNr };
        }
    } else if (tnrt.tracking === 'LATEST_RELEASE' && tnti.releaseNr) {
        if (tnrt.releaseNr === tnti.releaseNr) {
            return null;
        } else {
            return { releaseNr: tnti.releaseNr };
        }
    }
    return null;
}
