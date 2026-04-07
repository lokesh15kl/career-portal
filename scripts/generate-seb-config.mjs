import { mkdir, writeFile } from "node:fs/promises";
import { gzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);

const outputPath = new URL("../public/seb/quiz.seb", import.meta.url);
const startUrl = "https://lokesh15kl.github.io/career-portal/";

const settings = [
  ["allowBrowsingBackForward", true],
  ["allowAudioCapture", false],
  ["allowDictation", false],
  ["allowDictionaryLookup", false],
  ["allowDisplayMirroring", false],
  ["allowDownUploads", false],
  ["allowFlashFullscreen", false],
  ["allowNavigation", true],
  ["allowPreferencesWindow", false],
  ["allowPDFPlugIn", false],
  ["allowReload", true],
  ["allowSiri", false],
  ["allowScreenCapture", false],
  ["allowScreenSharing", false],
  ["allowSpellCheck", false],
  ["allowSwitchToApplications", false],
  ["allowUserAppFolderInstall", false],
  ["allowUserSwitching", false],
  ["allowVideoCapture", false],
  ["allowVirtualMachine", false],
  ["allowWlan", false],
  ["allowQuit", true],
  ["allowedDisplayBuiltin", true],
  ["allowedDisplaysMaxNumber", 1],
  ["blockPopUpWindows", true],
  ["blockScreenShotsLegacy", true],
  ["enablePrivateClipboardMacEnforce", true],
  ["showURLs", false],
  ["startURL", startUrl]
];

const serializeValue = (value) => {
  if (typeof value === "boolean") {
    return value ? "<true/>" : "<false/>";
  }

  return `<integer>${value}</integer>`;
};

const plistBody = settings
  .map(([key, value]) => `  <key>${key}</key>\n  ${typeof value === "string" ? `<string>${value}</string>` : serializeValue(value)}`)
  .join("\n");

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${plistBody}
</dict>
</plist>
`;

const payload = Buffer.concat([
  Buffer.from("plnd", "utf8"),
  Buffer.from(plist, "utf8")
]);

await mkdir(new URL("../public/seb", import.meta.url), { recursive: true });
await writeFile(outputPath, await gzipAsync(payload));
