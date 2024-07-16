import type { ReceivedFriendMessage, Friend, Client } from "fnbr";
import { findCosmetic, discordlog, stringToBool, sleep } from "./Helpers.js";
import { config } from "./Config.js";

function handleError(
  err: unknown,
  description: string,
  message: ReceivedFriendMessage
) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  message.reply(`An error occurred: ${errorMessage}`);
  console.error(`[Command Error] ${description}:`, err);
}

export const handleCommand = async (
  message: ReceivedFriendMessage,
  sender: Friend,
  client: Client,
  timerstatus: boolean,
  timerId: NodeJS.Timeout | undefined
) => {
  console.log(`${sender.displayName}: ${message.content}`);
  if (!message.content.startsWith("!")) return;

  const args: string[] = message.content.slice(1).split(" ");
  const command: string | undefined = args?.shift()?.toLowerCase();
  const content: string = args.join(" ");

  if (sender.id === config.fortnite.owner_epicid) {
    try {
      switch (command) {
        case "skin":
          const skin = findCosmetic(content, "outfit", message);
          if (skin) await client.party?.me.setOutfit(skin.id);
          else message.reply(`Skin ${content} wasn't found!`);
          break;

        case "emote":
          const emote = findCosmetic(content, "emote", message);
          if (emote) await client.party?.me.setEmote(emote.id);
          else message.reply(`Emote ${content} wasn't found!`);
          break;

        case "leave":
          await client.party?.leave();
          message.reply("I just left the party!");
          break;

        case "pickaxe":
          const pickaxe = findCosmetic(content, "pickaxe", message);
          if (pickaxe) await client.party?.me.setPickaxe(pickaxe.id);
          else message.reply(`Pickaxe ${content} wasn't found!`);
          break;

        case "ready":
          await client.party?.me.setReadiness(true);
          break;

        case "unready":
          await client.party?.me.setReadiness(false);
          break;

        case "purpleskull":
          await client.party?.me.setOutfit("CID_030_Athena_Commando_M_Halloween", [
            { channel: "ClothingColor", variant: "Mat1" },
          ]);
          break;

        case "pinkghoul":
          await client.party?.me.setOutfit("CID_029_Athena_Commando_F_Halloween", [
            { channel: "Material", variant: "Mat3" },
          ]);
          break;

        case "level":
          await client.party?.me.setLevel(parseInt(content, 10));
          break;

        case "add":
          try {
            await client.friend.add(content);
            message.reply(`${content} has been sent a friend request!`);
          } catch (err: any) {
            if (err.message.includes("already friends")) {
              message.reply(`${content} is already your friend!`);
            } else {
              handleError(err, `adding friend ${content}`, message);
            }
          }
          break;

        case "unadd":
          try {
            await client.friend.remove(content);
            message.reply(`${content} has been unadded!`);
          } catch (err: any) {
            if (
              err.message.includes("The friend") &&
              err.message.includes("does not exist")
            ) {
              message.reply(`Error: ${content} not found!`);
            } else {
              handleError(err, `unadding friend ${content}`, message);
            }
          }
          break;

        case "restartclient":
          message.reply("Fortnite Client Is Restarting!");
          await client.restart();
          break;

        case "friends":
        case "frds":
          let friendList = client.friend.list;
          let friendNames = "";

          friendList.forEach((friend) => {
            friendNames += `Name: ${friend.displayName} -> ID: ${friend.id}\n`;
          });

          message.reply(`Friend list:\n${friendNames}`);
          break;

        case "kill":
          message.reply("Bot is dead");
          console.log("[PARTY] RIP bot\nBot was killed!");
          discordlog("Bot was killed!", "Bot was killed from Party!", 0xff0000);
          await sleep(1500);
          process.exit(1);
          break;

        case "stoptimer":
          if (timerstatus === true) {
            timerstatus = false;
            let id = timerId;
            console.log(`[PARTY] timer id: ${id}`);
            clearTimeout(id);
            console.log("[PARTY] Time has stopped!");
            message.reply("Time has been stopped!");
          }
          break;

        case "sitout":
          if (stringToBool(content) === true) {
            client?.party?.me.setSittingOut(true);
            message.reply("I'm sitting out!");
          } else if (stringToBool(content) === false) {
            client?.party?.me.setSittingOut(false);
            message.reply("I'm not sitting out!");
          }
          break;

        default:
          message.reply(`Command ${command} is not recognized.`);
          break;
      }
    } catch (err) {
      handleError(err, command ?? 'unknown command', message);
    }
  } else {
    message.reply(`Only Ryuk is allowed to use commands`);
  }
};
