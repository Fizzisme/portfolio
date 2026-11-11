import manifest from "./image-assets.json";

/** New, unprocessed uploads still work; converted assets use their smaller sidecar. */
export function imageAsset(src: string) {
  return (manifest as Record<string, string>)[src] ?? src;
}
