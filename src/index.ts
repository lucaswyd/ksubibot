import axios from "axios";
import { Express } from "express";
import { ExpressApp } from "./utils/Express.js";
import fnbr, {
  ClientParty,
  ClientPartyMember,
  PartyMember,
  ReceivedPartyInvitation,
  IncomingPendingFriend,
  ReceivedFriendMessage,
} from "fnbr";
import { ClientRequest, IncomingMessage } from "http";
import os from "os";
import { allowedPlaylists, websocketHeaders } from "./utils/constants.js";
import WebSocket from "ws";
import xmlparser from "xml-parser";
import GetVersion from "./utils/version.js";
import {
  discordlog,
  calcChecksum,
  UpdateCosmetics,
  findCosmetic,
  sleep,
} from "./utils/Helpers.js";
import {
  config,
  clientOptions,
  deviceauths,
  PrivateParty,
  AuthSessionStoreKey,
} from "./utils/Config.js";
import { dclient, setUpDClient } from "./utils/discordClient.js";
import setupInteractionHandler from "./utils/interactionHandler.js";
import { handleCommand } from "./utils/commandHandler.js";

UpdateCosmetics();
const app: Express = ExpressApp;
const bLog: boolean = true;
let timerstatus: boolean = false;
let timerId: NodeJS.Timeout | undefined = undefined;
setUpDClient();

type MMSTicket = import("./utils/types.js").MMSTicket;
type PartyMatchmakingInfo = import("./utils/types.js").PartyMatchmakingInfo;
type Config = import("./utils/types.js").Config;

(async () => {
  const latest = await GetVersion();
  const Platform = os.platform() === "win32" ? "Windows" : os.platform();
  const UserAgent = `Fortnite/${latest.replace(
    "-Windows",
    ""
  )} ${Platform}/${os.release()}`;

  axios.defaults.headers["user-agent"] = UserAgent;
  console.log("UserAgent set to", axios.defaults.headers["user-agent"]);
  clientOptions.auth.deviceAuth = deviceauths;
  const client = new fnbr.Client(clientOptions);
  await client.login();
  console.log(`[LOGS] Logged in as ${client?.user?.self?.displayName}`);
  const fnbrclient = client;
  client.setStatus(
    config.fortnite.invite_status,
    config.fortnite.invite_onlinetype
  );
  await client?.party?.me.setOutfit(config.fortnite.cid);
  await client?.party?.setPrivacy(PrivateParty);
  await client?.party?.me.setLevel(config.fortnite.level);
  await client?.party?.me.setBattlePass(
    config.fortnite.battle_pass_owned,
    config.fortnite.battle_pass_lvl,
    100,
    100
  );
  await client?.party?.me?.setBanner(config.fortnite.eid, "black");
  await client?.party?.me.setBackpack(config.fortnite.bid);

  setupInteractionHandler(
    dclient,
    fnbrclient,
    discordlog,
    config,
    findCosmetic,
    timerstatus,
    timerId
  );

  axios.interceptors.response.use(undefined, function (error) {
    if (error.response) {
      if (error.response.data.errorCode && client && client.party) {
        client.party.sendMessage(
          `HTTP Error: ${error.response.status} ${error.response.data.errorCode} ${error.response.data.errorMessage}`
        );
      }

      console.error(error.response.status, error.response.data);
      if (config.logs.enable_logs === true) {
        discordlog(
          "Error: ${error.response.status}",
          `**${error.response.data}**`,
          0x880808
        );
      } else return;
    }

    return error;
  });

  let bIsMatchmaking = false;

  client.on("party:updated", async (updated: ClientParty) => {
    switch (updated.meta.schema["Default:PartyState_s"]) {
      case "BattleRoyalePreloading": {
        const loadout = client?.party?.me.meta.set("Default:LobbyState_j", {
          LobbyState: {
            hasPreloadedAthena: true,
          },
        });

        await client?.party?.me.sendPatch({
          "Default:LobbyState_j": loadout,
        });

        break;
      }

      case "BattleRoyaleMatchmaking": {
        if (bIsMatchmaking) {
          console.log("Members has started matchmaking!");
          if (config.logs.enable_logs === true) {
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
          console.log(`[${"Matchmaking"}]`, "Matchmaking Started");
        }

        const PartyMatchmakingInfo: PartyMatchmakingInfo = JSON.parse(
          updated.meta.schema["Default:PartyMatchmakingInfo_j"] ?? ""
        ).PartyMatchmakingInfo;

        const playlistId =
          PartyMatchmakingInfo.playlistName.toLocaleLowerCase();

        if (!allowedPlaylists.includes(playlistId)) {
          console.log("Unsupported playlist", playlistId);
          client?.party?.chat.send(
            `Playlist id: ${playlistId} is not a supported gamemode!`
          );
          client?.party?.me.setReadiness(false);
          return;
        }
        const partyPlayerIds = client?.party?.members
          .filter((x: any) => x.isReady)
          .map((x: any) => x.id)
          .join(",");

        const bucketId = `${PartyMatchmakingInfo.buildId}:${PartyMatchmakingInfo.playlistRevision}:${PartyMatchmakingInfo.regionId}:${playlistId}`;
        console.log(bucketId);
        if (config.logs.enable_logs === true) {
          discordlog("[Logs] New BucketId:", `**${bucketId}**`, 0x00ffff);
        } else return;

        console.log(partyPlayerIds);

        const query = new URLSearchParams();
        query.append("partyPlayerIds", partyPlayerIds ? partyPlayerIds : "");
        query.append("player.platform", "Windows");
        query.append(
          "player.option.partyId",
          client.party?.id ? client.party?.id : ""
        );
        query.append("input.KBM", "true");
        query.append("player.input", "KBM");
        query.append("bucketId", bucketId);

        client?.party?.members
          .filter((x: PartyMember) => x.isReady)
          .forEach((Member: PartyMember) => {
            const platform = Member.meta.get("Default:PlatformData_j");
            if (!query.has(`party.${platform?.PlatformName}`)) {
              query.append(`party.${platform?.PlatformName}`, "true");
            }
          });

        const token = client?.auth?.sessions?.get(
          AuthSessionStoreKey.Fortnite
        )?.accessToken;

        const TicketRequest = await axios.get(
          `https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/matchmakingservice/ticket/player/${client?.user?.self?.id}?${query}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (TicketRequest.status != 200) {
          console.log(`[${"Matchmaking"}]`, "Error while obtaining ticket");
          client?.party?.me.setReadiness(false);
          return;
        }

        const ticket: MMSTicket = TicketRequest.data;
        const payload = ticket.payload;
        const signature = ticket.signature;

        if (TicketRequest.status != 200) {
          console.log(`[${"Matchmaking"}]`, "Error while obtaining Hash");
          client?.party?.me.setReadiness(false);
          return;
        }

        const hash = await calcChecksum(payload, signature);

        console.log(ticket.payload, ticket.signature, hash);

        const MMSAuth = [
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

        matchmakingClient.on(
          "unexpected-response",
          (request: ClientRequest, response: IncomingMessage) => {
            let data = "";
            response.on("data", (chunk) => (data += chunk));

            response.on("end", () => {
              const baseMessage = `[MATCHMAKING] Error Error while connecting to matchmaking service: (status ${response.statusCode} ${response.statusMessage})`;

              client?.party?.chat.send(
                `Error while connecting to matchmaking service: (status ${response.statusCode} ${response.statusMessage})`
              );

              const contentType = response.headers["content-type"] ?? "error";

              if (data == "") {
                console.error(baseMessage);
                if (config.logs.enable_logs === true) {
                  discordlog("[Logs] Error", baseMessage, 0x880808);
                } else return;
              } else if (contentType.startsWith("application/json")) {
                const jsonData = JSON.parse(data);

                if (jsonData.errorCode) {
                  console.error(
                    `${baseMessage}, ${jsonData.errorCode} ${
                      jsonData.errorMessage || ""
                    }`
                  );
                  client?.party?.chat.send(
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
              } else if (contentType.startsWith("text/html")) {
                const parsed = xmlparser(data);

                if (parsed.root) {
                  try {
                    const head = parsed.root.children?.find(
                      (x: any) => x.name === "head"
                    );
                    const titleElement = head?.children?.find(
                      (x: any) => x.name === "title"
                    );
                    const title = titleElement
                      ? titleElement.children[0].content
                      : "No title found";

                    console.error(`${baseMessage} HTML title: ${title}`);
                  } catch (error) {
                    console.error(`${baseMessage} HTML response body: ${data}`);
                  }
                } else {
                  console.error(`${baseMessage} HTML response body: ${data}`);
                }
              } else {
                console.error(`${baseMessage} response body: ${data}`);
              }
            });
          }
        );

        if (bLog) {
          matchmakingClient.on("close", function () {
            console.log(
              `[${"Matchmaking"}]`,
              "Connection to the matchmaker closed"
            );
            if (config.logs.enable_logs === true) {
              discordlog("[Logs] Matchmaking", "Matchmaking closed", 0xffa500);
            } else return;
          });
        }

        matchmakingClient.on("message", (msg: string) => {
          const message = JSON.parse(msg);
          if (bLog) {
            console.log(
              `[${"Matchmaking"}]`,
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
            `[${"Party"}]`,
            "Players entered loading screen, Exiting party..."
          );
        }
        if (config.logs.enable_logs === true) {
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
        client?.party?.leave();
        break;
      }

      case "BattleRoyaleView": {
        break;
      }

      default: {
        if (bLog) {
          console.log(
            `[${"Party"}]`,
            "Unknow PartyState",
            updated.meta.schema["Default:PartyState_s"]
          );
        }
        break;
      }
    }
  });

  client.on("friend:message", (m: ReceivedFriendMessage) =>
    handleCommand(m, m.author, client, timerstatus, timerId)
  );
  //  client.on('party:member:message', (m) => handleCommand(m, m.author));

  client.on(
    "party:member:updated",
    async (Member: ClientPartyMember | PartyMember) => {
      if (Member.id == client?.user?.self?.id) {
        return;
      }

      if (!client?.party?.me) {
        return;
      }

      if (
        Member.isReady &&
        (client?.party?.me?.isLeader || Member.isLeader) &&
        !client.party?.me?.isReady
      ) {
        // Ready Up
        if (client.party?.me?.isLeader) {
          await Member.promote();
        }

        client.party.me.setReadiness(true);
      } else if (!Member.isReady && Member.isLeader) {
        client.party.me.setReadiness(false);
      }

      var bAllmembersReady = true;

      client.party.members.forEach(
        (member: ClientPartyMember | PartyMember) => {
          if (!bAllmembersReady) {
            return;
          }

          bAllmembersReady = member.isReady;
        }
      );
    }
  );

  client.on("friend:request", async (request: IncomingPendingFriend) => {
    if (config.fortnite.add_users === true) {
      await request.accept();
    } else if (config.fortnite.add_users === false) {
      await request.decline();
      client?.party?.chat.send(
        `Sorry, ${request.displayName} I dont accept friend requests!`
      );
    }
  });

  client.on("party:invite", async (request: ReceivedPartyInvitation) => {
    const party = client.party;
    if (party?.size === 1) {
      await request.accept();
    } else {
      await request.decline();
    }
  });

  timerstatus = false;

  client.on(
    "party:member:joined",
    async (join: PartyMember | ClientPartyMember) => {
      client?.party?.me.sendPatch({
        "Default:AthenaCosmeticLoadout_j":
          '{"AthenaCosmeticLoadout":{"cosmeticStats":[{"statName":"TotalVictoryCrowns","statValue":0},{"statName":"TotalRoyalRoyales","statValue":999},{"statName":"HasCrown","statValue":0}]}}',
      });

      await client?.party?.me.setOutfit(config.fortnite.cid);

      const partyLeader = join.party.leader;
      await partyLeader?.fetch();
      const partyLeaderDisplayName = partyLeader?.displayName;
      console.log(`Joined ${partyLeaderDisplayName}`);

      if (config.logs.enable_logs) {
        discordlog(
          "[Logs] Party:",
          `Joined **${partyLeaderDisplayName}**'s party`,
          0x00ffff
        );
      } else return;

      const party = client.party;
      await client?.party?.me.setBackpack(config.fortnite.bid);
      await sleep(1500);

      async function leavepartyexpire() {
        client?.party?.chat.send("Time expired!");
        await sleep(1200);
        client?.party?.leave();
        console.log("[PARTY] Left party due to party time expiring!");

        if (config.logs.enable_logs) {
          discordlog("[Logs] Party:", "Party Time expired.", 0xffa500);
        } else return;

        console.log("[PARTY] Time tracking stopped!");
        timerstatus = false;
      }

      if (party?.size !== 1) {
        const isOwnerInLobby = party?.members.some(
          (member) => member.id === config.fortnite.owner_epicid
        );

        if (isOwnerInLobby) {
          console.log("Timer has been disabled because Ryuk is in the lobby!");
          client?.party?.chat.send(
            `Timer has been disabled because Ryuk is in the lobby!`
          );

          discordlog(
            "[Logs] Timer:",
            `Timer has been disabled because **Ryuk** is in the lobby!`,
            0x00ffff
          );
          timerstatus = false;
        } else {
          console.log("[PARTY] Time has started!");
          client?.party?.chat.send(
            `Timer has started, ready up before the bot leaves`
          );
          timerId = setTimeout(leavepartyexpire, config.fortnite.leave_time);
          timerstatus = true;
        }
      }

      client?.party?.me.setEmote(config.fortnite.eid);

      switch (party?.size) {
        case 1:
          client.setStatus(
            config.fortnite.invite_status,
            config.fortnite.invite_onlinetype
          );
          await client?.party?.setPrivacy(PrivateParty);
          if (client.party?.me?.isReady) {
            client.party.me.setReadiness(false);
          }
          if (timerstatus) {
            timerstatus = false;
            clearTimeout(timerId);
            console.log("[PARTY] Time has stopped!");
          }
          break;
        case 2:
        case 3:
        case 4:
          client?.party?.chat.send(
            `${config.fortnite.join_message}\n Bot By Ryuk`
          );
          client.setStatus(
            config.fortnite.inuse_status,
            config.fortnite.inuse_onlinetype
          );
          break;
        default:
          console.warn(`Unexpected party size: ${party?.size}`);
          break;
      }
    }
  );

  client.on("party:member:left", async (left: PartyMember) => {
    console.log(`member left: ${left.displayName}`);

    if (config.logs.enable_logs === true) {
      discordlog(
        "[Logs] Party Members:",
        `**${left.displayName}** has left.`,
        0xffa500
      );
    } else return;

    client.on("party:member:left", async (left: PartyMember) => {
      console.log(`member left: ${left.displayName}`);
      const party = client.party;

      if (config.logs.enable_logs) {
        discordlog(
          "[Logs] Party Members:",
          `**${left.displayName}** has left.`,
          0xffa500
        );
      }
      if (!party) {
        console.warn("No party instance available.");
        return;
      }

      const partySize = party.size;
      switch (partySize) {
        case 1:
          client.setStatus(
            config.fortnite.invite_status,
            config.fortnite.invite_onlinetype
          );
          await party.setPrivacy(PrivateParty);

          if (party.me?.isReady) {
            party.me.setReadiness(false);
          }

          if (timerstatus) {
            timerstatus = false;
            clearTimeout(timerId);
            console.log("[PARTY] Time has stopped!");
          }
          break;

        case 2:
        case 3:
        case 4:
          party.chat.send(`${config.fortnite.join_message}\n Bot By Ryuk`);
          client.setStatus(
            config.fortnite.inuse_status,
            config.fortnite.inuse_onlinetype
          );
          break;

        default:
          console.warn(`Unexpected party size: ${partySize}`);
          break;
      }
    });
  });

  if (config.discord.run_discord_client === true) {
    dclient.login(config.env.DISCORD_TOKEN);
  } else if (config.discord.run_discord_client === false) {
    console.log("[DISCORD] client is disabled!");
  }
})();
