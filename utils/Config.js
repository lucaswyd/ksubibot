import nconf from "nconf";
nconf.argv().env().file({ file: "config.json" });

export const cid = nconf.get("fortnite:cid");
export const bid = nconf.get("fortnite:bid");
export const eid = nconf.get("fortnite:eid");
export const level = nconf.get("fortnite:level");
export const battle_pass_owned = nconf.get("fortnite:battle_pass_owned");
export const battle_pass_lvl = nconf.get("fortnite:battle_pass_lvl");
export const banner = nconf.get("fortnite:banner");
export const discord_status = nconf.get("discord:status");
export const discord_status_type = nconf.get("discord:status_type");
export const web_message = nconf.get("system:web_message");
export const DISCORD_TOKEN = process.env["DISCORD_TOKEN"];
export const DISCORD_BOT_OWNER = process.env["DISCORD_BOT_OWNER"];
export const bot_loading_message = nconf.get("system:bot_loading_message");
export const bot_use_status = nconf.get("fortnite:inuse_status");
export const bot_use_onlinetype = nconf.get("fortnite:inuse_onlinetype");
export const bot_invite_status = nconf.get("fortnite:invite_status");
export const bot_invite_onlinetype = nconf.get("fortnite:invite_onlinetype");
export const bot_join_message = nconf.get("fortnite:join_message");
export const bot_leave_time = nconf.get("fortnite:leave_time");
export const addusers = nconf.get("fortnite:add_users");
export const run_discord_client = nconf.get("discord:run_discord_client");
export const dologs = nconf.get("logs:enable_logs");
export const BotOwnerId = nconf.get("discord:bot_owner_epicid");
export const displayName = nconf.get("logs:name");
export const logchannel = nconf.get("logs:channel");

export const clientOptions = {
  defaultStatus: "Launching",
  auth: {},
  debug: console.log,
  xmppDebug: false,
  platform: "WIN",
  partyConfig: {
    chatEnabled: true,
    maxSize: 4,
  },
};

export const deviceauths = {
  accountId: process.env["accountId"],
  deviceId: process.env["deviceId"],
  secret: process.env["secret"],
};
