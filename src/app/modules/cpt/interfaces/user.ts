export interface User {
    username: string;
    password: string;
    role: string;
    id: string;
    userGroupId: string;
    settings: Map<string, any>;
}
