import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
// Vertical, the only aspect ratio that matters for Reels / Shorts / TikTok.
Config.setOverwriteOutput(true);
