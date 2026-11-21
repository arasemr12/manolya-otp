export interface Otp {
    name: string;
    issuer: string;
    secret: string;
    code?: string;
}
