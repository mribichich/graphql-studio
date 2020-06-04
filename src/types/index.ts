export type AuthConfig = { name: string; domain: string; client_id: string; audience: string };

export type AuthConfigDb = { [name: string]: AuthConfig };
