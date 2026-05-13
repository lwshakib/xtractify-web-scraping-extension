import { version as appVersion } from "../package.json"

export const EXTENSION_VERSION = appVersion

export const EXTENSION_RELEASE_TAG = `v${EXTENSION_VERSION}`

export const EXTENSION_ZIP_BASENAME = "xtractify"

export const EXTENSION_ZIP_FILENAME = `${EXTENSION_ZIP_BASENAME}-${EXTENSION_VERSION}.zip`

export const EXTENSION_DOWNLOAD_URL = `https://github.com/lwshakib/xtractify-web-scraping-extension/releases/download/${EXTENSION_RELEASE_TAG}/${EXTENSION_ZIP_FILENAME}`
