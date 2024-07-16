import {
  Client as DClient,
  GatewayIntentBits,
  Partials,
  ApplicationCommandOptionType,
  ActivityType,
} from "discord.js";
import { config } from "./Config.js";
import { discordlog } from "./Helpers.js";

console.log("[LOGS] Initializing Discord Client...");

export const dclient = new DClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

export function setUpDClient() {
  dclient.once("ready", () => {
    console.log("[DISCORD] client is online!");
    if (config.logs.enable_logs === true) {
      discordlog("Bot status:", `${config.logs.name} is now online!`, 0x00ff00);
    } else {
      console.log("[LOGS] disabled.");
    }

    dclient.user?.setActivity(config.discord.status, {
      type: config.discord.status_type as ActivityType,
    });

    const commands = dclient.application?.commands;

    commands?.create({
      name: "cosmetics",
      description: "update cosmetics json file",
    });

    commands?.create({
      name: "friends",
      description: "Shows current friend list (displaynames)",
    });

    commands?.create({
      name: "status",
      description: "just SENDS the STATUS!",
    });

    commands?.create({
      name: "add",
      description: "adds a user",
      options: [
        {
          name: "user",
          description: "user to add",
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });

    commands?.create({
      name: "unadd",
      description: "user to unadd",
      options: [
        {
          name: "usertounadd",
          description: "user to unadd",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });

    commands?.create({
      name: "playlist",
      description: "sets the current playlist if the bot is party leader",
      options: [
        {
          name: "playlist",
          description: "sets the party playlist",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });

    commands?.create({
      name: "stoptimer",
      description: "stops the setTimeout function aka the party timer",
    });

    commands?.create({
      name: "members",
      description: "show current party members of the bot's lobby",
    });

    commands?.create({
      name: "setemote",
      description: "sets the clients emote with an id",
      options: [
        {
          name: "emotename",
          description: "name of the emote",
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });

    commands?.create({
      name: "setoutfit",
      description: "sets an outfit with an id",
      options: [
        {
          name: "skinname",
          description: "name of the skin",
          type: ApplicationCommandOptionType.String,
        },
      ],
    });

    commands?.create({
      name: "restartfnclient",
      description: "restart",
    });

    commands?.create({
      name: "loginfnclient",
      description: "login",
    });

    commands?.create({
      name: "logoutfnclient",
      description: "logout",
    });

    commands?.create({
      name: "exit",
      description: "Kills the process",
    });

    commands?.create({
      name: "leaveparty",
      description: "leaves the current party",
    });

    commands?.create({
      name: "sendpartychatmessage",
      description: "sends a message to the fortnite party chat!",
      options: [
        {
          name: "message",
          description: "the message to send!",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });

    commands?.create({
      name: "level",
      description: "sets the clients level",
      options: [
        {
          name: "level",
          description: "the level to set",
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
      ],
    });

    commands?.create({
      name: "sitout",
      description: "sets the sitting out state",
      options: [
        {
          name: "sittingout",
          description: "sets the sitting out state",
          required: true,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    });

    commands?.create({
      name: "readystate",
      description: "sets the bots ready state",
      options: [
        {
          name: "state",
          description: "the state of the ready option",
          required: true,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    });

    commands?.create({
      name: "block",
      description: "Blocks a user",
      options: [
        {
          name: "usertoblock",
          description: "Displayname of the user to block",
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });

    commands?.create({
      name: "unblock",
      description: "unblocks a user",
      options: [
        {
          name: "usertounblock",
          description: "Displayname of the user to unblock",
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });

    commands?.create({
      name: "crash",
      description: "Make the client dance",
    });
  });
}
