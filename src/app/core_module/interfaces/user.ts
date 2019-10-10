export interface User {
    username: String;
    password: String;
    role: String;
    id: String;
    projectId: String;
    branchId: String;
    modelBranchId: String;
    userGroupId: String;
    settings: Map<string, any>;
}
