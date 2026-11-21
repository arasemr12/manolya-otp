export type Otp = {
    id: string;
    name: string;
    issuer: string;
    secret: string;
    code: string;
    nextCode?: string;
    algorithm?: "sha1" | "sha256" | "sha512";
    digits?: number;
    period?: number;
};
