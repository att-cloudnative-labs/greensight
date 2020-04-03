export interface User {
    username: String;
    password: String;
    role: String;
    id: String;
    userGroupId: String;
    settings: Map<string, any>;
}
