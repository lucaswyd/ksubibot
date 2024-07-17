import { Client as DiscordClient, CommandInteraction, Interaction } from 'discord.js';
import type { ReceivedFriendMessage } from "fnbr";
import { Client as FnbrClient } from 'fnbr';
import type { Config, Cosmetic } from "./types.js";
import fetch from 'node-fetch';
import fs from 'fs';

function handleError(
  err: unknown,
  description: string,
  commandInteraction: CommandInteraction,
  discordlog: (title: string, description: string, color: number, interaction: CommandInteraction, flag?: boolean) => void,
  errorCode: string = 'Unknown error'
) {
  const errorMessage = err instanceof Error ? err.message : errorCode;
  discordlog(`[Command] ${description} error:`, errorMessage, 0x880800, commandInteraction);
  console.error(err);
}

export default function setupInteractionHandler(
  dclient: DiscordClient,
  fnbrclient: FnbrClient,
  discordlog: (title: string, description: string, color: number, interaction: CommandInteraction, flag?: boolean) => void,
  config: Config,
  findCosmetic: (query: string, type: string, message: ReceivedFriendMessage | null, discord?: boolean | undefined) => Cosmetic,
  timerstatus: boolean,
  timerId: NodeJS.Timeout | undefined
) {
  console.log('[LOGS] Setting up Interaction Handler...');

  dclient.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const commandInteraction: CommandInteraction = interaction;
    const { commandName, options } = commandInteraction;

    if (commandInteraction.user.id !== config.env.DISCORD_BOT_OWNER) {
      discordlog('[Permission] Denied:', `Only **${config.system.bot_owner_name}** can interact with this bot!`, 0x880808, commandInteraction);
      return;
    }

    try {
      switch (commandName) {
        case 'status':
          discordlog('[Command] Status:', 'Shit\'s Working!', 0x00ff00, commandInteraction);
          break;

        case 'add':
          const user = options.get('user')?.value as string;
          if (!user) {
            discordlog('[Command] add:', 'No user provided', 0x880800, commandInteraction);
          } else {
            await fnbrclient.friend.add(user);
            discordlog('[Command] add:', `**${user}** has been sent a friend request`, 0x00ff00, commandInteraction);
          }
          break;

        case 'unadd':
          const unadduser = options.get('usertounadd')?.value as string;
          if (!unadduser) {
            discordlog('[Command] unadd:', 'No user provided', 0x880800, commandInteraction);
          } else {
            await fnbrclient.friend.remove(unadduser);
            discordlog('[Command] unadd:', `**${unadduser}** has been unadded!`, 0x00ff00, commandInteraction);
          }
          break;

        case 'friends':
          const friendList = fnbrclient.friend.list;
          const friendNames = friendList.map(friend => `Name: ${friend.displayName} -> ID: ${friend.id}`).join('\n');
          discordlog('[Command] Friends list:', `**${friendNames}**`, 0x00ff00, commandInteraction);
          break;

        case 'playlist':
          const setplaylist = options.get('playlist')?.value as string;
          if (!setplaylist) {
            discordlog('[Command] playlist:', 'No playlist provided', 0x880800, commandInteraction);
          } else {
            await fnbrclient?.party?.setPlaylist(setplaylist);
            discordlog('[Command] playlist:', `Playlist Id: **${setplaylist}** has been set as the playlist!`, 0x00ff00, commandInteraction);
          }
          break;

        case 'stoptimer':
          if (timerstatus) {
            timerstatus = false;
            clearTimeout(timerId);
            console.log('[PARTY] Time has stopped!');
            discordlog('[Command] stoptimer:', `TimerID: **${timerId}** has now been stopped!`, 0x00ff00, commandInteraction);
          } else {
            discordlog('[Command] stoptimer:', 'Timer not running', 0xffa500, commandInteraction);
          }
          break;

        case 'setemote':
          const emotename = options.get('emotename')?.value as string;
          const emote = emotename ? findCosmetic(emotename, 'emote', null, true) : null;
          if (emote) {
            await fnbrclient?.party?.me.setEmote(emote.cosmeticmatch.id);
            discordlog('[Command] setemote:', emote.exists
              ? `**${emote.cosmeticmatch.name}** has been set as the emote!`
              : `Emote **${emotename}** doesn't exist...\n\nBut match "**${emote.cosmeticmatch.name}**" has been set anyway!`,
              emote.exists ? 0x00ff00 : 0xffa500,
              commandInteraction);
          } else {
            discordlog('[Command] Error:', `Emote **${emotename}** not found!`, 0x880800, commandInteraction);
          }
          break;

        case 'setoutfit':
          const skinname = options.get('skinname')?.value as string;
          const skin = skinname ? findCosmetic(skinname, 'outfit', null, true) : null;
          if (skin) {
            await fnbrclient?.party?.me.setOutfit(skin.cosmeticmatch.id);
            discordlog('[Command] setoutfit:', skin.exists
              ? `Skin set to **${skin.cosmeticmatch.name}**!`
              : `Skin **${skinname}** doesn't exist...\n\nBut match "**${skin.cosmeticmatch.name}**" has been set anyway!`,
              skin.exists ? 0x00ff00 : 0xffa500,
              commandInteraction);
          } else {
            discordlog('[Command] Error:', `Skin **${skinname}** not found!`, 0x880800, commandInteraction);
          }
          break;

        case 'setadvancedskin':
          const advSkinName = options.get('skin')?.value as string;
          const style = options.get('style')?.value as string;
          const variant = options.get('variant')?.value as string;

          if (advSkinName && style && variant) {
            const skin = findCosmetic(advSkinName, 'outfit', null, true);
            if (skin) {
              await fnbrclient?.party?.me.setOutfit(skin.cosmeticmatch.id, [
                { channel: style, variant: variant },
              ]);
              discordlog('[Command] setadvancedskin:', skin.exists
                ? `Skin set to **${skin.cosmeticmatch.name}** with style **${style}** and variant **${variant}**!`
                : `Skin **${advSkinName}** doesn't exist...\n\nBut match "**${skin.cosmeticmatch.name}**" with style **${style}** and variant **${variant}** has been set anyway!`,
                skin.exists ? 0x00ff00 : 0xffa500,
                commandInteraction);
            } else {
              discordlog('[Command] Error:', `Skin **${advSkinName}** not found!`, 0x880800, commandInteraction);
            }
          } else {
            discordlog('[Command] Error:', `Invalid Syntax, Usage: !advskin <skin> <style> <variant>`, 0x880800, commandInteraction);
          }
          break;

        case 'setbackpack':
          const backpack = options.get('backpack')?.value as string;
          const bp = backpack ? findCosmetic(backpack, 'backpack', null, true) : null;
          if (bp) {
            await fnbrclient?.party?.me.setBackpack(bp.cosmeticmatch.id);
            discordlog('[Command] setbackpack:', bp.exists
              ? `Backpack set to **${bp.cosmeticmatch.name}**!`
              : `Backpack **${backpack}** doesn't exist...\n\nBut match "**${bp.cosmeticmatch.name}**" has been set anyway!`,
              bp.exists ? 0x00ff00 : 0xffa500,
              commandInteraction);
          } else {
            discordlog('[Command] Error:', `Backpack **${backpack}** not found!`, 0x880800, commandInteraction);
          }
          break;

        case 'restartfnclient':
          discordlog('[Command] restartfnclient:', 'Client is restarting', 0xffa500, commandInteraction);
          await fnbrclient.restart();
          discordlog('[Command] restartfnclient:', 'Client restarted successfully', 0x00ff00, commandInteraction, true);
          break;

        case 'logoutfnclient':
          discordlog('[Command] logoutfnclient:', 'Client is logging out', 0xffa500, commandInteraction);
          await fnbrclient.logout();
          discordlog('[Command] logoutfnclient:', 'Client logged out', 0x00ff00, commandInteraction, true);
          break;

        case 'loginfnclient':
          discordlog('[Command] loginfnclient:', 'Client is logging in', 0xffa500, commandInteraction);
          await fnbrclient.login();
          discordlog('[Command] loginfnclient:', 'Client logged in', 0x00ff00, commandInteraction, true);
          break;

        case 'exit':
          discordlog('[Command] exit:', 'All clients are currently being killed!', 0xffa500, commandInteraction);
          setTimeout(() => process.exit(1), 1000);
          break;

        case 'leaveparty':
          await fnbrclient?.party?.leave();
          discordlog('[Command] leaveparty:', 'Left the current party!', 0xffa500, commandInteraction);
          break;

        case 'members':
          const partyMembers = fnbrclient?.party?.members;
          const memberNames = partyMembers?.map(member => member.displayName).join('\n');
          discordlog('[Command] Party members:', `**${memberNames}**`, 0x00ff00, commandInteraction);
          break;

        case 'sendpartychatmessage':
          const message = options.get('message')?.value as string;
          if (!message) {
            discordlog('[Command] sendpartychatmessage:', 'No message provided', 0x880800, commandInteraction);
          } else {
            await fnbrclient?.party?.chat.send(message);
            discordlog('[Command] sendpartychatmessage:', `**${message}** has been sent in the party chat!`, 0x00ff00, commandInteraction);
          }
          break;

        case 'level':
          const level = options.get('level')?.value as number;
          if (level === null) {
            discordlog('[Command] level:', 'No level provided', 0x880800, commandInteraction);
          } else {
            await fnbrclient?.party?.me.setLevel(level);
            discordlog('[Command] level:', `Level was set to **${level}**`, 0x00ff00, commandInteraction);
          }
          break;

        case 'sitout':
          const sitValue = options.get('sittingout')?.value as boolean;
          if (sitValue === null) {
            discordlog('[Command] sitout:', 'No siting out value provided', 0x880800, commandInteraction);
          } else {
            fnbrclient?.party?.me.setSittingOut(sitValue);
            discordlog('[Command] sitout:', `Client is now ${sitValue ? 'sitting out' : 'not sitting out'}!`, 0x00ff00, commandInteraction);
          }
          break;

        case 'block':
          const blockuser = options.get('usertoblock')?.value as string;
          if (blockuser) {
            await fnbrclient.user.block(blockuser);
            discordlog('[Command] block:', `**${blockuser}** has been blocked!`, 0xffa500, commandInteraction);
          } else {
            discordlog('[Command] block:', 'No user to block provided', 0x880800, commandInteraction);
        }
        break;

        case 'unblock':
          const unblockuser = options.get('usertounblock')?.value as string;
          if (unblockuser) {
            await fnbrclient.user.unblock(unblockuser);
            discordlog('[Command] unblock:', `**${unblockuser}** has been unblocked!`, 0xffa500, commandInteraction);
          } else {
            discordlog('[Command] unblock:', 'No user to unblock provided', 0x880800, commandInteraction);
          }
        break;

        case 'cosmetics':
          const url = 'https://fortnite-api.com/v2/cosmetics/br';
          const response = await fetch(url);
          const json = await response.json();
          const filePath = `${process.cwd()}/cosmetics.json`;
          fs.writeFileSync(filePath, JSON.stringify(json.data, null, 2));
          discordlog('[Command] cosmetics:', 'Cosmetics JSON file has been updated from Fortnite API', 0x00ff00, commandInteraction);

        break;

        default:
          discordlog('[Command] Error:', 'Unknown command', 0x880800, commandInteraction);
          break;
      }
    } catch (err: any) {
      handleError(err, commandName, commandInteraction, discordlog);
    }
  });
}
