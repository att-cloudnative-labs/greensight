
export interface ApiResult<T> {
    status: 'OK' | 'ERROR' | 'UNPROCESSABLE_ENTITY' | 'CREATED';
    errorMessage: string | null;
    data: T;
}
