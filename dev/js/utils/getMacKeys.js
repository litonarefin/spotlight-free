import { macShortcutKeys } from "../data/macShortcutKeys";

export const getMacKeys = (options = []) => {
  let macOptions = [];

  options.forEach((opt) => {
    const macKey = macShortcutKeys[opt.id] ? macShortcutKeys[opt.id] : {};
    macOptions.push({
      ...opt,
      ...macKey,
    });
  });

  return macOptions;
};
