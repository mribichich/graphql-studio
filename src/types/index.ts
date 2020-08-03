export type AuthConfig = { name: string; domain: string; client_id: string; audience: string };

export type AuthConfigDb = { [name: string]: AuthConfig };

export type HeaderConfig = { enabled: boolean; name: string; value: string };

export type HeadersConfigDb = HeaderConfig[];
