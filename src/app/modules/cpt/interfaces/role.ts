export interface Role {
    id: String;
    roleName: String;
}

export type UserRole = 'ADMIN' | 'READ_ONLY' | 'READ_AND_WRITE';
