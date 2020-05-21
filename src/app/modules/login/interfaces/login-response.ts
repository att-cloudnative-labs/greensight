export interface LoginResponse {
    role: 'ADMIN' | 'READ_AND_WRITE' | 'READ_ONLY';
    token: string;
    userId: string;
}
