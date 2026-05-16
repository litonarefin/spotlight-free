// import { ThemeEngine } from "./generators/theme-engines";
// import { isMacOS, isWindows, isCSSColorSchemePropSupported } from "./utils/platform";
// import { AutomationMode } from "./utils/automation";

export const DEFAULT_COLORS = {
    darkScheme: {
        // background: "#181a1b",
        // text: "#e8e6e3",

        background: "#131516",
        text: "#d8d4cf",

        // background: "black",
        // text: "white",
    },
    lightScheme: {
        // background: "#dcdad7",
        // text: "#181a1b",

        background: "#004daa",
        text: "#e8e6e3",
    },
};

export const DEFAULT_THEME = {
    mode: 1,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    imgGrayscale: false, // boolean true | flase
    imgGrayscalePercent: "100%", // (min:0% | max:100% )
    videoGrayscale: false,
    videoGrayscalePercent: "100%",
    useFont: false,
    // fontFamily: isMacOS ? "Helvetica Neue" : isWindows ? "Segoe UI" : "Open Sans",
    fontFamily: "Open Sans",
    textStroke: 0,
    engine: "", //ThemeEngine.dynamicTheme,
    stylesheet: "",
    darkSchemeBackgroundColor: DEFAULT_COLORS.darkScheme.background,
    darkSchemeTextColor: DEFAULT_COLORS.darkScheme.text,
    lightSchemeBackgroundColor: DEFAULT_COLORS.lightScheme.background,
    lightSchemeTextColor: DEFAULT_COLORS.lightScheme.text,
    // scrollbarColor: isMacOS ? "" : "auto",
    scrollbarColor: "auto",
    selectionColor: "auto",
    styleSystemControls: false,
    lightColorScheme: "Default",
    darkColorScheme: "Default",
    immediateModify: false,
};

export const DEFAULT_COLORSCHEME = {
    light: {
        Default: {
            backgroundColor: DEFAULT_COLORS.lightScheme.background,
            textColor: DEFAULT_COLORS.lightScheme.text,
        },
    },
    dark: {
        Default: {
            backgroundColor: DEFAULT_COLORS.darkScheme.background,
            textColor: DEFAULT_COLORS.darkScheme.text,
        },
    },
};

export const DEFAULT_SETTINGS = {
    enabled: true,
    fetchNews: true,
    theme: DEFAULT_THEME,
    presets: [],
    customThemes: [],
    siteList: [],
    siteListEnabled: [],
    applyToListedOnly: false,
    changeBrowserTheme: false,
    syncSettings: true,
    syncSitesFixes: false,
    automation: {
        enabled: false,
        mode: "", //AutomationMode.NONE,
        behavior: "OnOff",
    },
    time: {
        activation: "18:00",
        deactivation: "9:00",
    },
    location: {
        latitude: null,
        longitude: null,
    },
    previewNewDesign: false,
    enableForPDF: true,
    enableForProtectedPages: false,
    enableContextMenus: false,
    detectDarkTheme: false,
};
