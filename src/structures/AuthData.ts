
interface AuthData{
    id: number,
    username: string,
    password: string | undefined,
    private_key: string | null,
    created_at: Date,
    hash: string
    created_by: string
}

export default AuthData