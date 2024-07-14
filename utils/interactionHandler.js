import fetch from "node-fetch";

export default function setupInteractionHandler(
  dclient,
  fnbrclient,
  discordlog,
  Config,
  findCosmetic
) {
  console.log("[LOGS] Setting up Interaction Handler...");
  dclient.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName, options } = interaction;

    if (interaction.user.id != parseInt(Config.DISCORD_BOT_OWNER)) {
      discordlog(
        "[Permission] Denied:",
        "Only **Ryuk** can interact with this bot!",
        0x880808,
        interaction
      );
    } else {
      if (commandName === "status") {
        discordlog(
          "[Command] Status:",
          `Shit's Working!`,
          0x00ff00,
          interaction
        );
      } else if (commandName === "add") {
        const user = options.getString("user") || null;
        if (user === null) {
          discordlog(
            "[Command] add:",
            "No user provided",
            0x880800,
            interaction
          );
        } else {
          try {
            await fnbrclient.friend.add(user);
            discordlog(
              "[Command] add:",
              `**${user}** has been sent a friend request`,
              0x00ff00,
              interaction
            );
          } catch (err) {
            if (err.message.includes("already friends")) {
              discordlog(
                "[Command] add error:",
                `**${user}** is already your friend!`,
                0x880800,
                interaction
              );
            } else {
              discordlog(
                "[Command] add error:",
                `An error occurred while trying to send a friend request to **${user}**.`,
                0x880800,
                interaction
              );
            }
            console.error(err);
          }
        }
      } else if (commandName === "unadd") {
        const unadduser = options.getString("usertounadd");
        try {
          await fnbrclient.friend.remove(unadduser);
          discordlog(
            "[Command] unadd:",
            `**${unadduser}** has been unadded!`,
            0x00ff00,
            interaction
          );
        } catch (err) {
          if (
            err.message.includes("The friend") &&
            err.message.includes("does not exist")
          ) {
            discordlog(
              "[Command] unadd error:",
              `**${unadduser}** not found!`,
              0x880800,
              interaction
            );
          } else {
            discordlog(
              "[Command] unadd error:",
              `An error occurred while trying to unadd **${unadduser}**.`,
              0x880800,
              interaction
            );
          }
          console.error(err);
        }
      } else if (commandName === "friends") {
        const friendList = fnbrclient.friend.list;
        let friendNames = [];
        friendList.forEach((friend) => {
          if (friend && friend.displayName) {
            friendNames.push(`Name: ${friend.displayName} -> ID: ${friend.id}`);
          }
        });
        let friendNamesString = friendNames.join(",").replace(/,/g, "\n");

        discordlog(
          "[Command] Friends list:",
          `**${friendNamesString}**`,
          0x00ff00,
          interaction
        );
      } else if (commandName === "playlist") {
        const setplaylist = options.getString("playlist");
        fnbrclient.party.setPlaylist({ playlistName: setplaylist });
        discordlog(
          "[Command] playlist:",
          `Playlist Id: **${setplaylist}** has been set as the playlist!`,
          0x00ff00,
          interaction
        );
      } else if (commandName === "stoptimer") {
        if (timerstatus == true) {
          timerstatus = false;
          let id = this.ID;
          console.log(`[PARTY] timer id: ${id}`);
          clearTimeout(id);
          console.log("[PARTY] Time has stoped!");
          discordlog(
            "[Command] stoptimer:",
            `TimerID: **${id}** has now been stoped!`,
            0x00ff00,
            interaction
          );
        } else {
          discordlog(
            "[Command] stoptimer:",
            `Timer not running`,
            0xffa500,
            interaction
          );
        }
      } else if (commandName === "setemote") {
        const emotename = options.getString("emotename");
        const emote = findCosmetic(emotename, "emote", null, true);
        if (emote) {
          if (emote.exists) {
            fnbrclient.party.me.setEmote(emote.cosmeticmatch.id);
            discordlog(
              "[Command] setemote:",
              `**${emote.cosmeticmatch.name}** has been set as the emote!`,
              0x00ff00,
              interaction
            );
          } else {
            fnbrclient.party.me.setEmote(emote.cosmeticmatch.id);
            discordlog(
              "[Command] setemote error:",
              `Emote **${emotename}** doesn't exist...\n\nBut match "**${emote.cosmeticmatch.name}**" has been set anyway!`,
              0xffa500,
              interaction
            );
          }
        } else
          discordlog(
            "[Command] Error:",
            `Emote **${emotename}** not found!`,
            0x880800,
            interaction
          );
      } else if (commandName === "setoutfit") {
        const skinname = options.getString("skinname");
        const skin = findCosmetic(skinname, "outfit", null, true);
        if (skin) {
          if (skin.exists) {
            fnbrclient.party.me.setOutfit(skin.cosmeticmatch.id);
            discordlog(
              "[Command] setoutft:",
              `Skin set to **${skin.cosmeticmatch.name}**!`,
              0x00ff00,
              interaction
            );
          } else {
            fnbrclient.party.me.setOutfit(skin.cosmeticmatch.id);
            discordlog(
              "[Command] setoutfit error:",
              `Skin **${skinname}** doesn't exist...\n\nBut match "**${skin.cosmeticmatch.name}**" has been set anyway!`,
              0xffa500,
              interaction
            );
          }
        } else
          discordlog(
            "[Command] Error:",
            `Skin **${skinname}** not found!`,
            0x880800,
            interaction
          );
      } else if (commandName === "restartfnclient") {
        discordlog(
          "[Command] restartfnclient:",
          `Client is restarting`,
          0xffa500,
          interaction
        );
        try {
          await fnbrclient.restart();
          discordlog(
            "[Command] restartfnclient:",
            `Client restarted successfully`,
            0x00ff00,
            interaction,
            true
          );
        } catch (e) {
          console.log(e);
          discordlog(
            "[Command] Error:",
            `fnbrclient restart encountered an error ,try /loginfnclient `,
            0x880800,
            interaction,
            true
          );
        }
      } else if (commandName === "logoutfnclient") {
        discordlog(
          "[Command] logoutfnclient:",
          `Client is logging out`,
          0xffa500,
          interaction
        );
        try {
          await fnbrclient.logout();
          discordlog(
            "[Command] logoutfnclient:",
            `Client logged out`,
            0x00ff00,
            interaction,
            true
          );
        } catch (e) {
          console.log(e);
          discordlog(
            "[Command] Error:",
            `fnbrclient logout encountered an error`,
            0x880800,
            interaction,
            true
          );
        }
      } else if (commandName === "loginfnclient") {
        discordlog(
          "[Command] loginfnclient:",
          `Client is logging in`,
          0xffa500,
          interaction
        );
        try {
          await fnbrclient.login();
          discordlog(
            "[Command] loginfnclient:",
            `Client logged in`,
            0x00ff00,
            interaction,
            true
          );
        } catch (e) {
          console.log(e);
          discordlog(
            "[Command] Error:",
            `fnbrclient login encountered an error`,
            0x880800,
            interaction,
            true
          );
        }
      } else if (commandName === "exit") {
        discordlog(
          "[Command] exit:",
          `All clients are currently being killed!`,
          0xffa500,
          interaction
        );

        function killbot() {
          process.exit(1);
        }
        setTimeout(killbot, 1000);
      } else if (commandName === "leaveparty") {
        fnbrclient.party.leave();

        discordlog(
          "[Command] leaveparty:",
          `left the current party!`,
          0xffa500,
          interaction
        );
      } else if (commandName === "members") {
        const pdisplayNamesList = [];
        client.party.members.forEach((member) => {
          pdisplayNamesList.push(member.displayName);
        });
        const pdisplayNames = pdisplayNamesList.join("\n");

        discordlog(
          "[Command] Party members:",
          `**${pdisplayNames}**`,
          0x00ff00,
          interaction
        );
      } else if (commandName === "sendpartychatmessage") {
        const message = options.getString("message");
        fnbrclient.party.chat.send(message);

        discordlog(
          "[Command] sendpartychatmessage:",
          `**${message}** has been sent in the party chat!`,
          0x00ff00,
          interaction
        );
      } else if (commandName === "level") {
        const leveltoset = options.getNumber("level");
        fnbrclient.party.me.setLevel(parseInt(leveltoset, 10));

        discordlog(
          "[Command] level:",
          `level was set to **${leveltoset}**`,
          0x00ff00,
          interaction
        );
      } else if (commandName === "sitout") {
        const sitvalue = options.getBoolean("sitingout");
        if (sitvalue === true) {
          client.party.me.setSittingOut(true);

          discordlog(
            "[Command] sitout:",
            `Siting out state set to **${sitvalue}**`,
            0x00ff00,
            interaction
          );
        } else if (sitvalue === false) {
          client.party.me.setSittingOut(false);

          discordlog(
            "[Command] sitout:",
            `Siting out state set to **${sitvalue}**`,
            0x00ff00,
            interaction
          );
        }
      } else if (commandName === "readystate") {
        const readystate = options.getBoolean("state");
        if (readystate === true) {
          client.party.me.setReadiness(true);

          discordlog(
            "[Command] readystate:",
            `I am now ready`,
            0x00ff00,
            interaction
          );
        } else if (readystate === false) {
          client.party.me.setReadiness(false);

          discordlog(
            "[Command] readystate:",
            `I am now unready`,
            0x880800,
            interaction
          );
        }
      } else if (commandName === "crash") {
        if (interaction.user.id === 935761038496907315) {
          discordlog("[Command] crash:", `Not Valid`, 0x880800, interaction);
        } else {
          client.party.me.setEmote("/setemote emoteid:eid_floss");
          fnbrclient.party.leave();
          console.log("Left party");

          discordlog(
            "[Command] crash:",
            `Party was crashed`,
            0x880800,
            interaction
          );
        }
      } else if (commandName === "block") {
        const blockuser = options.getString("usertoblock");
        fnbrclient.blockUser(blockuser);

        discordlog(
          "[Command] block:",
          `**${blockuser}** has been blocked!`,
          0xffa500,
          interaction
        );
      } else if (commandName === "cosmetics") {
        const url = "https://fortnite-api.com/v2/cosmetics/br";

        try {
          const response = await fetch(url);
          const json = await response.json();

          const file_path = `${process.cwd()}/cosmetics.json`;
          fs.writeFileSync(file_path, JSON.stringify(json?.data, null, 2));

          discordlog(
            "[Command] cosmetics:",
            "Cosmetics JSON file has been updated from Fortnite API",
            0x00ff00,
            interaction
          );
        } catch (error) {
          discordlog("[Error] cosmetics:", `${error}`, 0xff0000, interaction);
        }
      } else if (commandName === "unblock") {
        const unblockuser = options.getString("usertounblock");
        fnbrclient.unblockUser(unblockuser);

        discordlog(
          "[Command] block:",
          `**${unblockuser}** has been unblocked!`,
          0xffa500,
          interaction
        );
      } else {
        console.log("Command Not Found");
        return;
      }
    }
  });
}
