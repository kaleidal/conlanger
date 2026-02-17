const AVE_CONNECT_URL = import.meta.env.VITE_AVE_CONNECT_URL || "https://aveid.net/connect";
const CLIENT_ID =
  import.meta.env.VITE_AVE_CLIENT_ID || "app_410708d4acd03edd8eeb8a8eb88ecfe7";

const CONNECTOR_STATE_KEY = "ave_connector_oauth_state";
const CONNECTOR_CODE_VERIFIER_KEY = "ave_connector_code_verifier";
const CONNECTOR_RESOURCE_KEY = "ave_connector_resource";
const CONNECTOR_SCOPE_KEY = "ave_connector_scope";
const CONNECTOR_MODE_KEY = "ave_connector_mode";
const CONNECTOR_RETURN_TO_KEY = "ave_connector_return_to";

type ConnectorMode = "user_present" | "background";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

export async function startAveConnectorFlow(options: {
  redirectUri: string;
  resource: string;
  scope: string;
  mode: ConnectorMode;
  returnTo: string;
}): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  sessionStorage.setItem(CONNECTOR_CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(CONNECTOR_STATE_KEY, state);
  sessionStorage.setItem(CONNECTOR_RESOURCE_KEY, options.resource);
  sessionStorage.setItem(CONNECTOR_SCOPE_KEY, options.scope);
  sessionStorage.setItem(CONNECTOR_MODE_KEY, options.mode);
  sessionStorage.setItem(CONNECTOR_RETURN_TO_KEY, options.returnTo);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: options.redirectUri,
    resource: options.resource,
    scope: options.scope,
    mode: options.mode,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${AVE_CONNECT_URL}?${params.toString()}`;
}

export function handleConnectorCallback(): {
  code: string;
  codeVerifier: string | null;
  resource: string;
  scope: string;
  mode: ConnectorMode;
  returnTo: string;
} | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error || !code || !state) {
    return null;
  }

  const savedState = sessionStorage.getItem(CONNECTOR_STATE_KEY);
  if (!savedState || savedState !== state) {
    return null;
  }

  const resource = sessionStorage.getItem(CONNECTOR_RESOURCE_KEY) || "iris:inference";
  const scope = sessionStorage.getItem(CONNECTOR_SCOPE_KEY) || "iris.infer";
  const mode =
    (sessionStorage.getItem(CONNECTOR_MODE_KEY) as ConnectorMode | null) || "user_present";
  const returnTo = sessionStorage.getItem(CONNECTOR_RETURN_TO_KEY) || "/languages";
  const codeVerifier = sessionStorage.getItem(CONNECTOR_CODE_VERIFIER_KEY);

  return {
    code,
    codeVerifier,
    resource,
    scope,
    mode,
    returnTo,
  };
}

export function clearConnectorState(): void {
  sessionStorage.removeItem(CONNECTOR_STATE_KEY);
  sessionStorage.removeItem(CONNECTOR_CODE_VERIFIER_KEY);
  sessionStorage.removeItem(CONNECTOR_RESOURCE_KEY);
  sessionStorage.removeItem(CONNECTOR_SCOPE_KEY);
  sessionStorage.removeItem(CONNECTOR_MODE_KEY);
  sessionStorage.removeItem(CONNECTOR_RETURN_TO_KEY);
  window.history.replaceState({}, document.title, window.location.pathname);
}
