/** Shared credential-like samples for the six host entry points. Synthetic markers only. */
export const ordinaryText = "ordinary project note";
export const privateKeyText = "-----BEGIN PRIVATE KEY-----\nMII-synthetic-body";
export const fieldAssignmentText = "password=synthetic";
export const bearerText = "Bearer synthetic-token";
export const credentialLikeSamples = [privateKeyText, fieldAssignmentText, bearerText] as const;
