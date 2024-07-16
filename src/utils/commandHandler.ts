import type { ReceivedFriendMessage, Friend, Client } from "fnbr";
import { findCosmetic, discordlog, stringToBool } from "./Helpers.js";
import { config } from "./Config.js";

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
    switch (command) {
      case "skin":
        const skin = findCosmetic(content, "outfit", message);
        if (skin) client.party?.me.setOutfit(skin.id);
        else message.reply(`Skin ${content} wasn't found!`);
        break;
      case "emote":
        const emote = findCosmetic(content, "emote", message);
        if (emote) client.party?.me.setEmote(emote.id);
        else message.reply(`Emote ${content} wasn't found!`);
        break;
      case "leave":
        client.party?.leave();
        message.reply("I just left the party!");
        break;
      case "pickaxe":
        const pickaxe = findCosmetic(content, "pickaxe", message);
        if (pickaxe) client.party?.me.setPickaxe(pickaxe.id);
        else message.reply(`Pickaxe ${content} wasn't found!`);
        break;
      case "ready":
        client.party?.me.setReadiness(true);
        break;
      case "unready":
        client.party?.me.setReadiness(false);
        break;
      case "purpleskull":
        client.party?.me.setOutfit("CID_030_Athena_Commando_M_Halloween", [
          { channel: "ClothingColor", variant: "Mat1" },
        ]);
        break;
      case "pinkghoul":
        client.party?.me.setOutfit("CID_029_Athena_Commando_F_Halloween", [
          { channel: "Material", variant: "Mat3" },
        ]);
        break;
      case "level":
        client.party?.me.setLevel(parseInt(content, 10));
        break;
      case "add":
        try {
          await client.friend.add(content);
          message.reply(`${content} has been sent a friend request!`);
        } catch (err: any) {
          if (err.message.includes("already friends")) {
            message.reply(`${content} is already your friend!`);
          } else {
            message.reply(
              `An error occurred when trying to send a friend request to ${content}.`
            );
            console.log(err);
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
            message.reply(`An error occured when trying to add ${content}!`);
            console.log(err);
          }
        }
        break;
      case "restartclient":
        message.reply("Fortnite Client Is Restarting!");
        client.restart();
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
        process.exit(1);
      case "stoptimer":
        if (timerstatus === true) {
          timerstatus = false;
          let id = timerId;
          console.log(`[PARTY] timer id: ${id}`);
          clearTimeout(id);
          console.log("[PARTY] Time has stoped!");
          message.reply("Time has been stoped!");
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
  } else {
    message.reply(`Only Ryuk is allowed to use commands`);
  }
};
