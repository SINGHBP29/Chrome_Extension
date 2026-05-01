import { getGoogleAccessToken, googleApiGetJson } from "./googleIdentity";

export type GoogleUserProfile = {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export async function getGoogleUserProfile(): Promise<GoogleUserProfile | null> {
  const token = await getGoogleAccessToken(false);
  const profile = await googleApiGetJson<GoogleUserProfile>(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    token
  ).catch(() => null);
  if (!profile || typeof profile !== "object") return null;
  return profile;
}

export function getDisplayName(profile: GoogleUserProfile | null): string {
  if (!profile) return "";
  return (
    (profile.given_name || "").trim() ||
    (profile.name || "").trim() ||
    (profile.email || "").trim()
  );
}

