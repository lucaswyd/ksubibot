import axios from "axios";
import { ExpressApp } from "./utils/Express.js";
import pkg from "fnbr";
const { Client: FnbrClient, ClientOptions, Enums } = pkg;
import os from "os";
import stringSimilarity from "string-similarity";
import { allowedPlaylists, websocketHeaders } from "./utils/constants.js";
import WebSocket from "ws";
import xmlparser from "xml-parser";
import GetVersion from "./utils/version.js";
import { discordlog, calcChecksum, UpdateCosmetics } from "./utils/Helpers.js";
import * as Config from "./utils/Config.js";
import { dclient, setUpDClient } from "./utils/discordClient.js";
import setupInteractionHandler from "./utils/interactionHandler.js";

await UpdateCosmetics();
const app = ExpressApp;
const bLog = true;
setUpDClient();

/**
 * @typedef {import('./utils/types').MMSTicket} MMSTicket
 * @typedef {import('./utils/types').PartyMatchmakingInfo} PartyMatchmakingInfo
 */

(async () => {
  const lastest = await GetVersion();
  const Platform = os.platform() === "win32" ? "Windows" : os.platform();
  const UserAgent = `Fortnite/${lastest.replace(
    "-Windows",
    ""
  )} ${Platform}/${os.release()}`;

  axios.defaults.headers["user-agent"] = UserAgent;
  console.log("UserAgent set to", axios.defaults.headers["user-agent"]);

  /**
   * @type {ClientOptions}
   */

  try {
    Config.clientOptions.auth.deviceAuth = Config.deviceauths;
  } catch (e) {
    Config.clientOptions.auth.authorizationCode = async (C) =>
      C.consoleQuestion("Please enter an authorization code: ");
  }

  const client = new FnbrClient(Config.clientOptions);
  await client.login();
  console.log(`[LOGS] Logged in as ${client.user.self.displayName}`);
  const fnbrclient = client;
  client.setStatus(Config.bot_invite_status, Config.bot_invite_onlinetype);
  await client.party.me.setOutfit(Config.cid);
  await client.party.setPrivacy(Enums.PartyPrivacy.PRIVATE);
  await client.party.me.setLevel(Config.level);
  await client.party.me.setBattlePass(
    Config.battle_pass_owned,
    parseInt(Config.battle_pass_lvl),
    100,
    100
  );
  await client.party.me.setBanner(Config.banner);
  await client.party.me.setBackpack(Config.bid);

  const findCosmetic = (query, type, message, discord) => {
    const queryLower = query.toLowerCase();
    const matchingCosmetics = cosmetics.filter((c) => c.type.value === type);

    const exactMatches = matchingCosmetics.filter(
      (c) =>
        c.id.toLowerCase() === queryLower || c.name.toLowerCase() === queryLower
    );

    if (exactMatches.length > 0) {
      if (discord) return { cosmeticmatch: exactMatches[0], exists: true };
      else return exactMatches[0];
    }
    const allNames = matchingCosmetics.map((c) => c.name.toLowerCase());
    const closestMatches = stringSimilarity.findBestMatch(queryLower, allNames);

    if (closestMatches.bestMatch.rating > 0.5) {
      const closestCosmetic = matchingCosmetics.find(
        (c) => c.name.toLowerCase() === closestMatches.bestMatch.target
      );
      try {
        message.reply(`Did you mean ${closestMatches.bestMatch.target}?`);
        return closestCosmetic;
      } catch (e) {
        // discordlog("[Command] Match error:", `**${query}** => nope, found **${closestMatches.bestMatch.target}** instead and set it`,  0xFFA500)
        return {
          cosmeticmatch: closestCosmetic,
          exists: false,
        };
      }
    }
    return null;
  };

  setupInteractionHandler(
    dclient,
    fnbrclient,
    discordlog,
    Config,
    findCosmetic
  );

  axios.interceptors.response.use(undefined, function (error) {
    if (error.response) {
      if (error.response.data.errorCode && client && client.party) {
        client.party.sendMessage(
          `HTTP Error: ${error.response.status} ${error.response.data.errorCode} ${error.response.data.errorMessage}`
        );
      }

      console.error(error.response.status, error.response.data);
      if (Config.dologs === true) {
        discordlog(
          "Error: ${error.response.status}",
          `**${error.response.data}**`,
          0x880808
        );
      } else return;
    }

    return error;
  });

  var bIsMatchmaking = false;

  client.on("party:updated", async (updated) => {
    switch (updated.meta.schema["Default:PartyState_s"]) {
      case "BattleRoyalePreloading": {
        var loadout = client.party.me.meta.set("Default:LobbyState_j", {
          LobbyState: {
            hasPreloadedAthena: true,
          },
        });

        await client.party.me.sendPatch({
          "Default:LobbyState_j": loadout,
        });

        break;
      }

      case "BattleRoyaleMatchmaking": {
        if (bIsMatchmaking) {
          console.log("Members has started matchmaking!");
          if (Config.dologs === true) {
            discordlog(
              "[Logs] Matchmaking",
              "Members started Matchmaking!",
              0x00ffff
            );
          } else return;
          return;
        }
        bIsMatchmaking = true;
        if (bLog) {
          console.log(`[${"Matchmaking".cyan}]`, "Matchmaking Started");
        }

        /**
         * @type {PartyMatchmakingInfo}
         */
        const PartyMatchmakingInfo = JSON.parse(
          updated.meta.schema["Default:PartyMatchmakingInfo_j"]
        ).PartyMatchmakingInfo;

        const playlistId =
          PartyMatchmakingInfo.playlistName.toLocaleLowerCase();

        if (!allowedPlaylists.includes(playlistId)) {
          console.log("Unsupported playlist", playlistId);
          client.party.chat.send(
            `Playlist id: ${playlistId} is not a supported gamemode!`
          );
          client.party.me.setReadiness(false);
          return;
        }
        var partyPlayerIds = client.party.members
          .filter((x) => x.isReady)
          .map((x) => x.id)
          .join(",");

        const bucketId = `${PartyMatchmakingInfo.buildId}:${PartyMatchmakingInfo.playlistRevision}:${PartyMatchmakingInfo.regionId}:${playlistId}`;
        console.log(bucketId);
        if (Config.dologs === true) {
          discordlog("[Logs] New BucketId:", `**${bucketId}**`, 0x00ffff);
        } else return;

        // auth.missing_player_id

        console.log(partyPlayerIds);

        var query = new URLSearchParams();
        query.append("partyPlayerIds", partyPlayerIds);
        query.append("player.platform", "Windows");
        query.append("player.option.partyId", client.party.id);
        query.append("input.KBM", "true");
        query.append("player.input", "KBM");
        query.append("bucketId", bucketId);

        client.party.members
          .filter((x) => x.isReady)
          .forEach((Member) => {
            const platform = Member.meta.get("Default:PlatformData_j");
            if (!query.has(`party.{PlatformName}`)) {
              query.append(`party.{PlatformName}`, "true");
            }
          });

        const token = client.auth.sessions.get("fortnite").accessToken;

        const TicketRequest = await axios.get(
          `https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/matchmakingservice/ticket/player/${client.user.self.id}?${query}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (TicketRequest.status != 200) {
          console.log(
            `[${"Matchmaking".cyan}]`,
            "Error while obtaining ticket".red
          );
          client.party.me.setReadiness(false);
          return;
        }

        /**
         * @type {MMSTicket}
         */
        const ticket = TicketRequest.data;
        const payload = ticket.payload;
        const signature = ticket.signature;

        if (TicketRequest.status != 200) {
          console.log(
            `[${"Matchmaking".cyan}]`,
            "Error while obtaining Hash".red
          );
          client.party.me.setReadiness(false);
          return;
        }

        const hash = await calcChecksum(payload, signature);

        console.log(ticket.payload, ticket.signature, hash);

        var MMSAuth = [
          "Epic-Signed",
          ticket.ticketType,
          payload,
          signature,
          hash,
        ];

        const matchmakingClient = new WebSocket(ticket.serviceUrl, {
          perMessageDeflate: false,
          rejectUnauthorized: false,
          headers: {
            Origin: ticket.serviceUrl.replace("ws", "http"),
            Authorization: MMSAuth.join(" "),
            ...websocketHeaders,
          },
        });

        matchmakingClient.on("unexpected-response", (request, response) => {
          let data = "";
          response.on("data", (chunk) => (data += chunk));

          response.on("end", () => {
            const baseMessage = `[MATCHMAKING] Error Error while connecting to matchmaking service: (status ${response.statusCode} ${response.statusMessage})`;

            client.party.chat.send(
              `Error while connecting to matchmaking service: (status ${response.statusCode} ${response.statusMessage})`
            );

            if (data == "") {
              console.error(baseMessage);
              if (Config.dologs === true) {
                discordlog("[Logs] Error", baseMessage, 0x880808);
              } else return;
            } else if (
              response.headers["content-type"].startsWith("application/json")
            ) {
              const jsonData = JSON.parse(data);

              if (jsonData.errorCode) {
                console.error(
                  `${baseMessage}, ${jsonData.errorCode} ${
                    jsonData.errorMessage || ""
                  }`
                );
                client.party.chat.send(
                  `Error while connecting to matchmaking service: ${
                    jsonData.errorCode
                  } ${jsonData.errorMessage || ""}`
                );
              } else {
                console.error(`${baseMessage} response body: ${data}`);
              }
            } else if (response.headers["x-epic-error-name"]) {
              console.error(
                `${baseMessage}, ${response.headers["x-epic-error-name"]} response body: ${data}`
              );
            } else if (
              response.headers["content-type"].startsWith("text/html")
            ) {
              const parsed = xmlparser(data);

              if (parsed.root) {
                try {
                  const title = parsed.root.children
                    .find((x) => x.name == "head")
                    .children.find((x) => x.name == "title");

                  console.error(`${baseMessage} HTML title: ${title}`);
                } catch {
                  console.error(`${baseMessage} HTML response body: ${data}`);
                }
              } else {
                console.error(`${baseMessage} HTML response body: ${data}`);
              }
            } else {
              console.error(`${baseMessage} response body: ${data}`);
            }
          });
        });

        if (bLog) {
          matchmakingClient.on("close", function () {
            console.log(
              `[${"Matchmaking".cyan}]`,
              "Connection to the matchmaker closed"
            );
            if (Config.dologs === true) {
              discordlog("[Logs] Matchmaking", "Matchmaking closed", 0xffa500);
            } else return;
          });
        }

        matchmakingClient.on("message", (msg) => {
          const message = JSON.parse(msg);
          if (bLog) {
            console.log(
              `[${"Matchmaking".cyan}]`,
              "Message from the matchmaker",
              message
            );
          }

          if (message.name === "Error") {
            bIsMatchmaking = false;
          }
        });

        break;
      }

      case "BattleRoyalePostMatchmaking": {
        if (bLog) {
          console.log(
            `[${"Party".magenta}]`,
            "Players entered loading screen, Exiting party..."
          );
        }
        if (Config.dologs === true) {
          discordlog(
            "[Logs] Matchmaking",
            "Members now in game. leaving party...",
            0xffa500
          );
        } else return;

        if (client.party?.me?.isReady) {
          client.party.me.setReadiness(false);
        }
        bIsMatchmaking = false;
        client.party.leave();
        break;
      }

      case "BattleRoyaleView": {
        break;
      }

      default: {
        if (bLog) {
          console.log(
            `[${"Party".magenta}]`,
            "Unknow PartyState".yellow,
            updated.meta.schema["Default:PartyState_s"]
          );
        }
        break;
      }
    }
  });

  const handleCommand = async (message, sender) => {
    console.log(`${sender.displayName}: ${message.content}`);
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).split(" ");
    const command = args.shift().toLowerCase();
    const content = args.join(" ");

    if (sender.id == Config.BotOwnerId) {
      if (command === "skin") {
        const skin = findCosmetic(content, "outfit", message);
        if (skin) client.party.me.setOutfit(skin.id);
        else message.reply(`Skin ${content} wasn't found!`);
      } else if (command === "emote") {
        const emote = findCosmetic(content, "emote", message);
        if (emote) client.party.me.setEmote(emote.id);
        else message.reply(`Emote ${content} wasn't found!`);
      } else if (command === "leave") {
        fnbrclient.party.leave();
        message.reply("I just left the party!");
      } else if (command === "pickaxe") {
        const pickaxe = findCosmetic(content, "pickaxe", message);
        if (pickaxe) client.party.me.setPickaxe(pickaxe.id);
        else message.reply(`Pickaxe ${content} wasn't found!`);
      } else if (command === "ready") {
        client.party.me.setReadiness(true);
      } else if (command === "unready") {
        client.party.me.setReadiness(false);
      } else if (command === "purpleskull") {
        client.party.me.setOutfit("CID_030_Athena_Commando_M_Halloween", [
          { channel: "ClothingColor", variant: "Mat1" },
        ]);
      } else if (command === "pinkghoul") {
        client.party.me.setOutfit("CID_029_Athena_Commando_F_Halloween", [
          { channel: "Material", variant: "Mat3" },
        ]);
      } else if (command === "level") {
        client.party.me.setLevel(parseInt(content, 10));
      } else if (command === "add") {
        try {
          await client.friend.add(content);
          message.reply(`${content} has been sent a friend request!`);
        } catch (err) {
          if (err.message.includes("already friends")) {
            message.reply(`${content} is already your friend!`);
          } else {
            message.reply(
              `An error occurred when trying to send a friend request to ${content}.`
            );
            console.log(err);
          }
        }
      } else if (command === "unadd") {
        try {
          await client.friend.remove(content);
          message.reply(`${content} has been unadded!`);
        } catch (err) {
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
      } else if (command === "restartclient") {
        message.reply("Fortnite Client Is Restarting!");
        client.restart();
      } else if (command === "friends" || command === "frds") {
        let friendList = fnbrclient.friend.list;
        let friendNames = "";

        friendList.forEach((friend) => {
          friendNames += `Name: ${friend.displayName} -> ID: ${friend.id}\n`;
        });

        message.reply(`Friend list:\n${friendNames}`);
      } else if (command === "kill") {
        message.reply("Bot is dead");
        console.log("[PARTY] RIP bot\nBot was killed!");
        process.exit(1);
      } else if (command === "stoptimer") {
        if (timerstatus === true) {
          timerstatus = false;
          let id = this.ID;
          console.log(`[PARTY] timer id: ${id}`);
          clearTimeout(id);
          console.log("[PARTY] Time has stoped!");
          message.reply("Time has been stoped!");
        }
      }
    } else {
      if (command) {
        message.reply(`Only Ryuk is allowed to use commands`);
      }
    }
  };

  client.on("friend:message", (m) => handleCommand(m, m.author));
  //  client.on('party:member:message', (m) => handleCommand(m, m.author));

  client.on("party:member:updated", async (Member) => {
    if (Member.id == client.user.self.id) {
      return;
    }

    if (!client.party.me) {
      return;
    }

    if (
      Member.isReady &&
      (client?.party?.me?.isLeader || Member.isLeader) &&
      !client.party?.me?.isReady &&
      !client.party.bManualReady
    ) {
      // Ready Up
      if (client.party?.me?.isLeader) {
        await Member.promote();
      }

      client.party.me.setReadiness(true);
    } else if (
      !Member.isReady &&
      Member.isLeader &&
      !client.party.bManualReady
    ) {
      try {
        client.WSS.close();
      } catch {}
      client.party.me.setReadiness(false);
    }

    var bAllmembersReady = true;

    client.party.members.forEach((member) => {
      if (!bAllmembersReady) {
        return;
      }

      bAllmembersReady = member.isReady;
    });
  });

  client.on("friend:request", async (request) => {
    if (Config.addusers === true) {
      await request.accept();
    } else if (Config.addusers === false) {
      await request.decline();
      client.party.chat.send(
        `Sorry, ${request.displayName} I dont accept friend requests!`
      );
    }
  });

  client.on("party:invite", async (request) => {
    const party = client.party;
    if ([1] == party.size) {
      await request.accept();
    } else {
      await request.decline();
    }
  });

  async function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  let timerstatus = false;

  client.on("party:member:joined", async (join) => {
    client.party.me.sendPatch({
      "Default:AthenaCosmeticLoadout_j":
        '{"AthenaCosmeticLoadout":{"cosmeticStats":[{"statName":"TotalVictoryCrowns","statValue":0},{"statName":"TotalRoyalRoyales","statValue":999},{"statName":"HasCrown","statValue":0}]}}',
    });
    await client.party.me.setOutfit(Config.cid);
    const partyLeader = join.party.leader;
    await partyLeader.fetch();
    let partyLeaderDisplayName = partyLeader.displayName;
    console.log(`Joined ${partyLeaderDisplayName}`);
    if (Config.dologs === true) {
      discordlog(
        "[Logs] Party:",
        `Joined **${partyLeaderDisplayName}**'s party`,
        0x00ffff
      );
    } else return;

    const party = client.party;
    await client.party.me.setBackpack(Config.bid);
    await sleep(1.5);
    const minute = 600000;

    let time = 1 * minute;
    async function leavepartyexpire() {
      client.party.chat.send("Time expired!");
      await sleep(1.2);
      client.party.leave();
      console.log("[PARTY] Left party due to party time expiring!");
      if (Config.dologs === true) {
        discordlog("[Logs] Party:", "Party Time expired.", 0xffa500);
      } else return;
      console.log("[PARTY] Time tracking stoped!");
      timerstatus = false;
    }
    if ([1] != party.size) {
      const isOwnerInLobby = party.members.some(
        (member) => member.id === Config.BotOwnerId
      );
      if (isOwnerInLobby) {
        console.log("Timer has been disabled cause Ryuk is in lobby!");
        client.party.chat.send(
          `Timer has been disabled cause Ryuk is in lobby!`
        );

        discordlog(
          "[Logs] Timer:",
          `Timer has been disabled cause **Ryuk** is in lobby!`,
          0x00ffff
        );
        timerstatus = false;
      } else {
        console.log("[PARTY] Time has started!");
        client.party.chat.send(
          `Timer has started, ready up before the bot leaves`
        );
        this.ID = setTimeout(leavepartyexpire, Config.bot_leave_time);
        timerstatus = true;
      }
    }
    client.party.me.setEmote(Config.eid);
    if ([2] == party.size) {
      client.party.chat.send(`${Config.bot_join_message}\n Bot By Ryuk`);
      client.setStatus(Config.bot_use_status, Config.bot_use_onlinetype);
    }
    if ([3] == party.size) {
      client.party.chat.send(`${Config.bot_join_message}\n Bot By Ryuk`);
      client.setStatus(Config.bot_use_status, Config.bot_use_onlinetype);
    }
    if ([4] == party.size) {
      client.party.chat.send(`${Config.bot_join_message}\n Bot By Ryuk`);
      client.setStatus(Config.bot_use_status, Config.bot_use_onlinetype);
    }
    if ([1] == party.size) {
      client.setStatus(Config.bot_invite_status, Config.bot_invite_onlinetype);
      await client.party.setPrivacy(Enums.PartyPrivacy.PRIVATE);
      if (client.party?.me?.isReady) {
        client.party.me.setReadiness(false);
      }
      if (timerstatus === true) {
        timerstatus = false;
        let id = this.ID;
        clearTimeout(id);
        console.log("[PARTY] Time has stoped!");
      }
    }
  });

  client.on("party:member:left", async (left) => {
    console.log(`member left: ${left.displayName}`);
    const party = client.party;
    if (Config.dologs === true) {
      discordlog(
        "[Logs] Party Members:",
        `**${left.displayName}** has left.`,
        0xffa500
      );
    } else return;
    if ([2] == party.size) {
      client.party.chat.send(`${Config.bot_join_message}\n Bot By Ryuk`);
      client.setStatus(Config.bot_use_status, Config.bot_use_onlinetype);
    }
    if ([3] == party.size) {
      client.party.chat.send(`${Config.bot_join_message}\n Bot By Ryuk`);
      client.setStatus(Config.bot_use_status, Config.bot_use_onlinetype);
    }
    if ([4] == party.size) {
      client.party.chat.send(`${Config.bot_join_message}\n Bot By Ryuk`);
      client.setStatus(Config.bot_use_status, Config.bot_use_onlinetype);
    }
    if ([1] == party.size) {
      client.setStatus(Config.bot_invite_status, Config.bot_invite_onlinetype);
      await client.party.setPrivacy(Enums.PartyPrivacy.PRIVATE);
      if (client.party?.me?.isReady) {
        client.party.me.setReadiness(false);
      }
      if (timerstatus === true) {
        timerstatus = false;
        let id = this.ID;
        clearTimeout(id);
        console.log("[PARTY] Time has stoped!");
      }
    }
  });
  if (Config.run_discord_client === true) {
    dclient.login(Config.DISCORD_TOKEN);
  } else if (Config.run_discord_client === false) {
    console.log("[DISCORD] client is disabled!");
  }
})();
