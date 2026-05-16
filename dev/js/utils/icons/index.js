import { users } from "./users";
import { rightArrow } from "./rightArrow";
import { search } from "./search";
import { plug } from "./plug";
import { brush } from "./brush";
import { filePlus } from "./filePlus";
import { circlePlus } from "./circlePlus";
import { camera } from "./camera";
import { logout } from "./logout";
import { key } from "./key";
import { refresh } from "./refresh";
import { power } from "./power";
import { powerOff } from "./powerOff";
import { trash } from "./trash";
import { fileInput } from "./fileInput";
import { editFile } from "./editFile";
import { uploadCloud } from "./uploadCloud";
import { download } from "./download";
import { downloadCloud } from "./downloadCloud";
import { wordpress } from "./wordpress";
import { cloudCog } from "./cloudCog";
import { sun } from "./sun";
import { moon } from "./moon";
import { laptop } from "./laptop";
import { view } from "./view";
import { close } from "./close";
import { multiHome } from "./multiHome";
import { cornerupleft } from "./cornerupleft";
import { external } from "./external";
import { cornerRightUp } from "./cornerRightUp";
import { link } from "./link";
import { cog } from "./cog";
import { king } from "./king";

export const getIcon = (iconsName) => {
  let icon;
  switch (iconsName) {
    case "cornerupleft":
      icon = cornerupleft;
      break;
    case "external":
      icon = external;
      break;
    case "users":
      icon = users;
      break;
    case "rightArrow":
      icon = rightArrow;
      break;
    case "search":
      icon = search;
      break;
    case "plug":
      icon = plug;
      break;
    case "brush":
      icon = brush;
      break;
    case "filePlus":
      icon = filePlus;
      break;
    case "circlePlus":
      icon = circlePlus;
      break;
    case "camera":
      icon = camera;
      break;
    case "logout":
      icon = logout;
      break;
    case "key":
      icon = key;
      break;
    case "refresh":
      icon = refresh;
      break;
    case "power":
      icon = power;
      break;
    case "powerOff":
      icon = powerOff;
      break;
    case "trash":
      icon = trash;
      break;
    case "fileInput":
      icon = fileInput;
      break;
    case "editFile":
      icon = editFile;
      break;
    case "uploadCloud":
      icon = uploadCloud;
      break;
    case "download":
      icon = download;
      break;
    case "downloadCloud":
      icon = downloadCloud;
      break;
    case "wordpress":
      icon = wordpress;
      break;
    case "cloudCog":
      icon = cloudCog;
      break;
    case "sun":
      icon = sun;
      break;
    case "moon":
      icon = moon;
      break;
    case "laptop":
      icon = laptop;
      break;
    case "view":
      icon = view;
      break;
    case "close":
      icon = close;
      break;
    case "multiHome":
      icon = multiHome;
      break;
    case "cornerRightUp":
      icon = cornerRightUp;
      break;
    case "link":
      icon = link;
      break;
    case "cog":
      icon = cog;
      break;
    case "king":
      icon = king;
      break;
    default:
      null;
  }
  return icon;
};
