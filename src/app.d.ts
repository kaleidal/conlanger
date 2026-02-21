/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CONVEX_URL: string;
	readonly VITE_AVE_CLIENT_ID: string;
	readonly VITE_AVE_CONNECT_URL?: string;
	readonly VITE_IRIS_HTTP_URL?: string;
	readonly VITE_IRIS_CONNECTOR_RESOURCE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {}
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

export {};
