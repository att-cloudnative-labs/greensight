
export interface TreeNodeVersion {
    id: string;
    versionId: number;
    timestamp: string;
    ownerId: string;
    ownerName: string;
    description: string;
    objectId: string;
    currentUserAccessPermissions: string[];
    releasable: boolean;
}

