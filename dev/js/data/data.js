import { isMac } from "../utils/device";

export const mainOptions = {
  users: {
    id: "users",
    title: "Users",
    url: "",
    icon: "users",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "U", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "U", bg: true }],
    shortcutKey: "Alt+U",
  },
  plugins: {
    id: "plugins",
    title: "Plugins",
    url: "",
    icon: "plug",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "P", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "P", bg: true }],
    shortcutKey: "Alt+P",
  },
  themes: {
    id: "themes",
    title: "Themes",
    url: "",
    icon: "brush",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "T", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "T", bg: true }],
    shortcutKey: "Alt+T",
  },
  post_types: {
    id: "post_types",
    title: "Post Types",
    url: "",
    icon: "filePlus",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [
          { name: "⌥", bg: true },
          { name: "+" },
          { name: "Shift", bg: true },
          { name: "+" },
          { name: "P", bg: true },
        ]
      : [
          { name: "Alt", bg: true },
          { name: "+" },
          { name: "Shift", bg: true },
          { name: "+" },
          { name: "P", bg: true },
        ],

    shortcutKey: "Alt+Shift+P",
  },
  create: {
    id: "create",
    title: "New",
    url: "",
    icon: "circlePlus",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "N", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "N", bg: true }],
    shortcutKey: "Alt+N",
  },
  media: {
    id: "media",
    title: "Media",
    url: "",
    icon: "camera",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "M", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "M", bg: true }],
    shortcutKey: "Alt+M",
  },
  update: {
    id: "update",
    title: "Update",
    url: "",
    icon: "refresh",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [
          { name: "Ctrl", bg: true },
          { name: "+" },
          { name: "⌥", bg: true },
          { name: "+" },
          { name: "U", bg: true },
        ]
      : [
          { name: "Ctrl", bg: true },
          { name: "+" },
          { name: "Alt", bg: true },
          { name: "+" },
          { name: "U", bg: true },
        ],
    shortcutKey: "Ctrl+Alt+U",
  },
  logout: {
    id: "logout",
    title: "Logout",
    url: WPSPOTLIGHT_CORE.logout_url,
    icon: "logout",
    direction: "link",
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "L", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "L", bg: true }],
    shortcutKey: "Alt+L",
  },
  key_binding: {
    id: "key_binding",
    title: "Key Binding",
    url: "",
    icon: "key",
    direction: "cog",
    callback: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "K", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "K", bg: true }],
    shortcutKey: "Alt+K",
  },
};

export const defaultMainOptions = Object.values(mainOptions);

export const defaultSettingsOptions = {
  open_spotlight: {
    id: "open_spotlight",
    title: "Open Spotlight",
    url: "",
    direction: "cornerRightUp",
    dependency: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "S", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "S", bg: true }],
    shortcutKey: "Alt+S",
  },
  close_spotlight: {
    id: "close_spotlight",
    title: "Close Spotlight",
    url: "",
    direction: "cornerRightUp",
    dependency: true,
    tags: [{ name: "Esc", bg: true }],
    shortcutKey: "Escape",
  },
};

export const darkModeOption = [
  {
    id: "dark_light_mode",
    title: "Dark/Light Mode",
    url: "",
    icon: "brush",
    direction: "cornerRightUp",
    dependency: true,
    isPremium: !WPSPOTLIGHT_CORE.is_premium,
    // tags: [{ name: "T", bg: true }, { name: "+" }, { name: "M", bg: true }],
    //   shortcutKey: "t+m",
  },
];

export const multisiteOption = [
  {
    id: "multisite",
    title: "Sites",
    url: "",
    icon: "multiHome",
    direction: "cornerRightUp",
    dependency: true,
  },
];

export const backendMenuData = {
  wp_admin: {
    id: "wp_admin",
    title: "Back to WP Admin",
    url: WPSPOTLIGHT_CORE.admin_url,
    icon: "cornerupleft",
    direction: "link",
    newWindow: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "B", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "B", bg: true }],
    shortcutKey: "Alt+B",
  },
};

export const frontendMenuData = {
  view_website: {
    id: "view_website",
    title: "View Website",
    url: WPSPOTLIGHT_CORE.home_url,
    icon: "external",
    direction: "link",
    newWindow: true,
    tags: isMac
      ? [{ name: "⌥", bg: true }, { name: "+" }, { name: "V", bg: true }]
      : [{ name: "Alt", bg: true }, { name: "+" }, { name: "V", bg: true }],
    shortcutKey: "Alt+V",
  },
};

export const networkAdminMenuData = {
  network_admin: {
    id: "network_admin",
    title: "Back To Network Admin",
    url: WPSPOTLIGHT_CORE.network_admin_url,
    icon: "cornerupleft",
    direction: "link",
  },
};
