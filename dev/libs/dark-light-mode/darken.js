import { run_spotlight, remove_spotlight } from "./src/main";

window.SpotlightDarkMode = {
  enable: (config) => run_spotlight(config),
  disable: () => remove_spotlight(),
};
