export interface Branch {
    id: string;
    projectId: string;
    title: string;
    description: string;
    isMaster: boolean;
    ownerId: string;
    ownerName: string;
    startTime: string;
    endTime: string;
}
