import { startPkceLogin } from '@ave-id/sdk/client';

export const AVE_CLIENT_ID =
	import.meta.env.VITE_AVE_CLIENT_ID || 'app_410708d4acd03edd8eeb8a8eb88ecfe7';

export async function startAveLogin(redirectUri: string): Promise<void> {
	await startPkceLogin({
		clientId: AVE_CLIENT_ID,
		redirectUri,
		scope: 'openid profile email'
	});
}
