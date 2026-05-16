// import { push } from "../../utils/array";

// export function formatSitesFixesConfig(fixes, options) {
//     const lines = [];
//     fixes.forEach((fix, i) => {
//         push(lines, fix.url);
//         options.props.forEach((prop) => {
//             const command = options.getPropCommandName(prop);
//             const value = fix[prop];
//             if (options.shouldIgnoreProp(prop, value)) {
//                 return;
//             }
//             lines.push("");
//             lines.push(command);
//             const formattedValue = options.formatPropValue(prop, value);
//             if (formattedValue) {
//                 lines.push(formattedValue);
//             }
//         });
//         if (i < fixes.length - 1) {
//             lines.push("");
//             lines.push("=".repeat(32));
//             lines.push("");
//         }
//     });
//     lines.push("");
//     return lines.join("\n");
// }
