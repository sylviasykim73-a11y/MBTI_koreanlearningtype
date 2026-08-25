/**
 * Korean Learning Type - Storage helpers
 * Session-scoped only. Nothing is sent to a server; nothing persists
 * beyond the browser tab's session.
 */

const STORAGE_KEYS = {
  NICKNAME: "klt_nickname",
  SOUND: "klt_sound_enabled",
};

const Storage = {
  getNickname() {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.NICKNAME) || "";
    } catch (e) {
      return "";
    }
  },
  setNickname(name) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.NICKNAME, name);
    } catch (e) {
      /* sessionStorage unavailable — fail silently, feature is non-critical */
    }
  },
  getSoundEnabled() {
    try {
      const val = sessionStorage.getItem(STORAGE_KEYS.SOUND);
      return val === null ? true : val === "true";
    } catch (e) {
      return true;
    }
  },
  setSoundEnabled(enabled) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
    } catch (e) {
      /* ignore */
    }
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Storage, STORAGE_KEYS };
}
