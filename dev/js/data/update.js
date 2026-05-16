export const updateOptions = [
  {
    id: "plugins",
    title: "Plugins",
    url: "",
    icon: "plug",
    dependency: true,
    direction: "cornerRightUp",
  },
  {
    id: "themes",
    title: "Themes",
    url: "",
    icon: "brush",
    dependency: true,
    direction: "cornerRightUp",
  },
  {
    id: "wordpress_core",
    title: "WordPress Core",
    url: "",
    icon: "wordpress",
    callback: true,
    isPremium: !WPSPOTLIGHT_CORE.is_premium,
    direction: "cornerRightUp",
  },
];
