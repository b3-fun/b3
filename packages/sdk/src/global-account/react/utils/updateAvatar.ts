import app, { extractAvatarIdFromUrl } from "@b3dotfun/sdk/global-account/bsmnt";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";

const debug = debugB3React("updateAvatar");

export async function updateAvatar(avatar: string) {
  try {
    // Extract avatar ID from URL
    const avatarID = extractAvatarIdFromUrl(avatar);

    if (!avatarID) {
      throw new Error("Invalid avatar URL");
    }

    // Set the avatar in the profiles service
    return await app.service("profiles").setAvatar({ avatarUrl: String(avatar), avatarID: String(avatarID) }, {});
  } catch (error) {
    debug("Failed to update avatar:", error);
    throw error; // Re-throw to handle in component
  }
}
