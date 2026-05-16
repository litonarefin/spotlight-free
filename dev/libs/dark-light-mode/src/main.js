import { removeDynamicTheme, run_createThemeAndWatchForUpdates } from "./inject/dynamic-theme";

export function run_spotlight(config) {
  run_createThemeAndWatchForUpdates(config);
}

export function remove_spotlight() {
  removeDynamicTheme();
}
