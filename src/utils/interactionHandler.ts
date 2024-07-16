import { Client as DiscordClient, CommandInteraction, Interaction } from 'discord.js';
import { Client as FnbrClient } from 'fnbr';
import type { Config, Cosmetic } from "./types.js";
import fetch from 'node-fetch';
import fs from 'fs';


export default function setupInteractionHandler(
  dclient: DiscordClient,
  fnbrclient: FnbrClient,
  discordlog: (title: string, description: string, color: number, interaction: CommandInteraction, flag?: boolean) => void,
  config: Config,
  findCosmetic: (name: string, type: string, id: string | null, strict: boolean) => Cosmetic,
  timerstatus: boolean,
  timerId: NodeJS.Timeout | undefined
) {
  console.log('[LOGS] Setting up Interaction Handler...');

  dclient.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const commandInteraction = interaction as CommandInteraction;
    const { commandName, options } = commandInteraction;

    if (commandInteraction.user.id !== config.env.DISCORD_BOT_OWNER) {
      discordlog(
        '[Permission] Denied:',
        'Only **Ryuk** can interact with this bot!',
        0x880808,
        commandInteraction
      );
      return;
    }

    switch (commandName) {
      case 'status':
        discordlog('[Command] Status:', `Shit's Working!`, 0x00ff00, commandInteraction);
        break;

      case 'add':
        const user = options.get('user')?.value as string;
        if (!user) {
          discordlog('[Command] add:', 'No user provided', 0x880800, commandInteraction);
        } else {
          try {
            await fnbrclient.friend.add(user);
            discordlog('[Command] add:', `**${user}** has been sent a friend request`, 0x00ff00, commandInteraction);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            if (errorMessage.includes('already friends')) {
              discordlog('[Command] add error:', `**${user}** is already your friend!`, 0x880800, commandInteraction);
            } else {
              discordlog('[Command] add error:', `An error occurred while trying to send a friend request to **${user}**.`, 0x880800, commandInteraction);
            }
            console.error(err);
          }
        }
        break;

      case 'unadd':
        const unadduser = options.get('usertounadd')?.value as string;
        if (!unadduser) {
          discordlog('[Command] unadd:', 'No user provided', 0x880800, commandInteraction);
        } else {
          try {
            await fnbrclient.friend.remove(unadduser);
            discordlog('[Command] unadd:', `**${unadduser}** has been unadded!`, 0x00ff00, commandInteraction);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            if (errorMessage.includes('The friend') && errorMessage.includes('does not exist')) {
              discordlog('[Command] unadd error:', `**${unadduser}** not found!`, 0x880800, commandInteraction);
            } else {
              discordlog('[Command] unadd error:', `An error occurred while trying to unadd **${unadduser}**.`, 0x880800, commandInteraction);
            }
            console.error(err);
          }
        }
        break;

      case 'friends':
        const friendList = fnbrclient.friend.list;
        const friendNames = friendList.map(friend => `Name: ${friend.displayName} -> ID: ${friend.id}`);
        const friendNamesString = friendNames.join('\n');
        discordlog('[Command] Friends list:', `**${friendNamesString}**`, 0x00ff00, commandInteraction);
        break;

      case 'playlist':
        const setplaylist = options.get('playlist')?.value as string;
        if (setplaylist) {
          fnbrclient?.party?.setPlaylist(setplaylist);
          discordlog('[Command] playlist:', `Playlist Id: **${setplaylist}** has been set as the playlist!`, 0x00ff00, commandInteraction);
        } else {
          discordlog('[Command] playlist:', 'No playlist provided', 0x880800, commandInteraction);
        }
        break;

      case 'stoptimer':
        if (timerstatus) {
          timerstatus = false;
          const id = timerId;
          console.log(`[PARTY] timer id: ${id}`);
          clearTimeout(id);
          console.log('[PARTY] Time has stopped!');
          discordlog('[Command] stoptimer:', `TimerID: **${id}** has now been stopped!`, 0x00ff00, commandInteraction);
        } else {
          discordlog('[Command] stoptimer:', 'Timer not running', 0xffa500, commandInteraction);
        }
        break;

      case 'setemote':
        const emotename = options.get('emotename')?.value as string;
        const emote = emotename ? findCosmetic(emotename, 'emote', null, true) : null;
        if (emote) {
          fnbrclient?.party?.me.setEmote(emote.cosmeticmatch.id);
          if (emote.exists) {
            discordlog('[Command] setemote:', `**${emote.cosmeticmatch.name}** has been set as the emote!`, 0x00ff00, commandInteraction);
          } else {
            discordlog('[Command] setemote error:', `Emote **${emotename}** doesn't exist...\n\nBut match "**${emote.cosmeticmatch.name}**" has been set anyway!`, 0xffa500, commandInteraction);
          }
        } else {
          discordlog('[Command] Error:', `Emote **${emotename}** not found!`, 0x880800, commandInteraction);
        }
        break;

      case 'setoutfit':
        const skinname = options.get('skinname')?.value as string;
        const skin = skinname ? findCosmetic(skinname, 'outfit', null, true) : null;
        if (skin) {
          fnbrclient?.party?.me.setOutfit(skin.cosmeticmatch.id);
          if (skin.exists) {
            discordlog('[Command] setoutfit:', `Skin set to **${skin.cosmeticmatch.name}**!`, 0x00ff00, commandInteraction);
          } else {
            discordlog('[Command] setoutfit error:', `Skin **${skinname}** doesn't exist...\n\nBut match "**${skin.cosmeticmatch.name}**" has been set anyway!`, 0xffa500, commandInteraction);
          }
        } else {
          discordlog('[Command] Error:', `Skin **${skinname}** not found!`, 0x880800, commandInteraction);
        }
        break;

      case 'restartfnclient':
        discordlog('[Command] restartfnclient:', 'Client is restarting', 0xffa500, commandInteraction);
        try {
          await fnbrclient.restart();
          discordlog('[Command] restartfnclient:', 'Client restarted successfully', 0x00ff00, commandInteraction, true);
        } catch (e) {
          console.error(e);
          discordlog('[Command] Error:', 'fnbrclient restart encountered an error, try /loginfnclient', 0x880800, commandInteraction, true);
        }
        break;

      case 'logoutfnclient':
        discordlog('[Command] logoutfnclient:', 'Client is logging out', 0xffa500, commandInteraction);
        try {
          await fnbrclient.logout();
          discordlog('[Command] logoutfnclient:', 'Client logged out', 0x00ff00, commandInteraction, true);
        } catch (e) {
          console.error(e);
          discordlog('[Command] Error:', 'fnbrclient logout encountered an error', 0x880800, commandInteraction, true);
        }
        break;

      case 'loginfnclient':
        discordlog('[Command] loginfnclient:', 'Client is logging in', 0xffa500, commandInteraction);
        try {
          await fnbrclient.login();
          discordlog('[Command] loginfnclient:', 'Client logged in', 0x00ff00, commandInteraction, true);
        } catch (e) {
          console.error(e);
          discordlog('[Command] Error:', 'fnbrclient login encountered an error', 0x880800, commandInteraction, true);
        }
        break;

      case 'exit':
        discordlog('[Command] exit:', 'All clients are currently being killed!', 0xffa500, commandInteraction);
        setTimeout(() => process.exit(1), 1000);
        break;

      case 'leaveparty':
        fnbrclient?.party?.leave();
        discordlog('[Command] leaveparty:', 'Left the current party!', 0xffa500, commandInteraction);
        break;

      case 'members':
        const partyMembers = fnbrclient?.party?.members;
        const memberNames = partyMembers?.map(member => member.displayName).join('\n');
        discordlog('[Command] Party members:', `**${memberNames}**`, 0x00ff00, commandInteraction);
        break;

      case 'sendpartychatmessage':
        const message = options.get('message')?.value as string;
        if (message) {
          fnbrclient?.party?.chat.send(message);
          discordlog('[Command] sendpartychatmessage:', `**${message}** has been sent in the party chat!`, 0x00ff00, commandInteraction);
        } else {
          discordlog('[Command] sendpartychatmessage:', 'No message provided', 0x880800, commandInteraction);
        }
        break;

      case 'level':
        const level = options.get('level')?.value as number;
        if (level !== null) {
          fnbrclient?.party?.me.setLevel(level);
          discordlog('[Command] level:', `Level was set to **${level}**`, 0x00ff00, commandInteraction);
        } else {
          discordlog('[Command] level:', 'No level provided', 0x880800, commandInteraction);
        }
        break;

      case 'sitout':
        const sitValue = options.get('sitingout')?.value as boolean;
        if (sitValue !== null) {
          fnbrclient?.party?.me.setSittingOut(sitValue);
          discordlog('[Command] sitout:', `Sitting out state set to **${sitValue}**`, 0x00ff00, commandInteraction);
        } else {
          discordlog('[Command] sitout:', 'No siting out value provided', 0x880800, commandInteraction);
        }
        break;

      case 'readystate':
        const readyState = options.get('state')?.value as boolean;
        if (readyState !== null) {
          fnbrclient?.party?.me.setReadiness(readyState);
          discordlog('[Command] readystate:', readyState ? 'I am now ready' : 'I am now unready', readyState ? 0x00ff00 : 0x880800, commandInteraction);
        } else {
          discordlog('[Command] readystate:', 'No readiness state provided', 0x880800, commandInteraction);
        }
        break;

      case 'crash':
          fnbrclient?.party?.me.setEmote('/setemote emoteid:eid_floss');
          fnbrclient?.party?.leave();
          console.log('Left party');
          discordlog('[Command] crash:', 'Party was crashed', 0x880800, commandInteraction);
        break;

      case 'block':
        const blockuser = options.get('usertoblock')?.value as string;
        if (blockuser) {
          fnbrclient.user.block(blockuser);
          discordlog('[Command] block:', `**${blockuser}** has been blocked!`, 0xffa500, commandInteraction);
        } else {
          discordlog('[Command] block:', 'No user to block provided', 0x880800, commandInteraction);
        }
        break;

      case 'cosmetics':
        const url = 'https://fortnite-api.com/v2/cosmetics/br';
        try {
          const response = await fetch(url);
          const json = await response.json();
          const filePath = `${process.cwd()}/cosmetics.json`;
          fs.writeFileSync(filePath, JSON.stringify(json.data, null, 2));
          discordlog('[Command] cosmetics:', 'Cosmetics JSON file has been updated from Fortnite API', 0x00ff00, commandInteraction);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          discordlog('[Error] cosmetics:', errorMessage, 0xff0000, commandInteraction);
        }
        break;

      case 'unblock':
        const unblockuser = options.get('usertounblock')?.value as string;
        if (unblockuser) {
          fnbrclient.user.unblock(unblockuser);
          discordlog('[Command] unblock:', `**${unblockuser}** has been unblocked!`, 0xffa500, commandInteraction);
        } else {
          discordlog('[Command] unblock:', 'No user to unblock provided', 0x880800, commandInteraction);
        }
        break;

      default:
        console.log('Command Not Found');
        return;
    }
  });
}
