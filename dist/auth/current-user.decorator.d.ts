export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
