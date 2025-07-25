import { createClient } from "@osdk/client";
import { createPublicOauthClient } from "@osdk/oauth";
import { $ontologyRid } from "@gtd/sdk";

const url = import.meta.env.VITE_FOUNDRY_API_URL;
const clientId = import.meta.env.VITE_FOUNDRY_CLIENT_ID;
const redirectUrl = import.meta.env.VITE_FOUNDRY_REDIRECT_URL;
checkEnv(url, "VITE_FOUNDRY_API_URL");
checkEnv(clientId, "VITE_FOUNDRY_CLIENT_ID");
checkEnv(redirectUrl, "VITE_FOUNDRY_REDIRECT_URL");
const scopes = [
    "api:use-ontologies-read",
    "api:use-ontologies-write",
    "api:use-admin-read",
    "api:use-aip-agents-read",
    "api:use-aip-agents-write",
];

function checkEnv(value: string | undefined, name: string): asserts value is string {
    if (value == null) {
        throw new Error(`Missing environment variable: ${name}`);
    }
}

/**
 * Initialize the client to interact with the Ontology SDK
 */
const auth = createPublicOauthClient(clientId, url, redirectUrl, true, "/login", "/", scopes);

const client = createClient(url, $ontologyRid, auth);

export { auth, client };
