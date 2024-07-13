const nconf = require('nconf')
const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('fs');
const axios = require('axios').default;
const config = nconf.argv().env().file({ file: 'config.json' })
const { Client: FNclient, ClientOptions, Enums, Party } = require('fnbr');
const clientOptions = {
    defaultStatus: "Launching",
    auth: {},
    debug: console.log,
    xmppDebug: false,
    platform: 'WIN',
    partyConfig: {
        chatEnabled: true,
        maxSize: 4
    }
};
const client = new FNclient(clientOptions);
const cid = nconf.get("fortnite:cid")
const bid = nconf.get('fortnite:bid')
const eid = nconf.get('fortnite:eid')
const level = nconf.get('fortnite:level')
const battle_pass_owned = nconf.get('fortnite:battle_pass_owned')
const battle_pass_lvl = nconf.get('fortnite:battle_pass_lvl')
const banner = nconf.get('fortnite:banner')
const discord_status = nconf.get('discord:status')
const discord_status_type = nconf.get('discord:status_type')
const discord_commands_guild = nconf.get('discord:command_guild')
const web_message = nconf.get('system:web_message')
const stringSimilarity = require('string-similarity')
const DISCORD_TOKEN = process.env['DISCORD_TOKEN']
const DISCORD_BOT_OWNER = process.env['DISCORD_BOT_OWNER']
const discord_command_status_message = nconf.get("discord:guild_slash_status_response")
const bot_loading_message = nconf.get('system:bot_loading_message')
const bot_use_status = nconf.get('fortnite:inuse_status')
const bot_use_onlinetype = nconf.get('fortnite:inuse_onlinetype')
const bot_invite_status = nconf.get('fortnite:invite_status')
const bot_invite_onlinetype = nconf.get('fortnite:invite_onlinetype')
const bot_join_message = nconf.get('fortnite:join_message')
const bot_leave_time = nconf.get('fortnite:leave_time')
const addusers = nconf.get('fortnite:add_users')
const run_discord_client = nconf.get('discord:run_discord_client')
const dologs = nconf.get("logs:enable_logs")
const logchannel = nconf.get("logs:channel")
const BotOwnerId = nconf.get("discord:bot_owner_epicid");
const displayName = nconf.get("logs:name")
const express = require("express");
const path = require('path');
const app = express()
const { Client: Dclient, GatewayIntentBits, Partials, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const dclient = new Dclient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

// fuck polynite api lol
async function calcChecksum(ticketPayload, signature) {
    const plaintext = ticketPayload.slice(10, 20) + "Don'tMessWithMMS" + signature.slice(2, 10);
    const data = Buffer.from(plaintext, 'utf16le');
    const sha1 = crypto.createHash('sha1').update(data).digest();
    const checksum = sha1.slice(2, 10).toString('hex').toUpperCase();
    return checksum;
}

console.log("updating cosmetics...");

const CosApiUrl = 'https://fortnite-api.com/v2/cosmetics/br';
const file_path = path.join(process.cwd(), 'cosmetics.json');

axios.get(CosApiUrl)
    .then(response => {
        const jsonCos = response.data;
        fs.writeFileSync(file_path, JSON.stringify(jsonCos.data, null, 2));
        console.log('Done updating cosmetics!');
    })
    .catch(error => {
        console.error('An error occurred while updating cosmetics:', error);
    });

let cosmetics = [];
fs.readFile('cosmetics.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading cosmetics.json:', err);
        return;
    }
    try {
        cosmetics = JSON.parse(data);
        console.log('Cosmetics data loaded successfully.');
    } catch (error) {
        console.error('Error parsing cosmetics.json:', error);
    }
});

function discordlog(title, content, color, interaction) {
    const logs = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(content);
    const channel = dclient.channels.cache.get(logchannel);
    if (interaction) interaction.reply({ embeds: [logs] });
    else channel.send({ embeds: [logs] });
}

dclient.once('ready', () => {
    console.log("[DISCORD] client is online!");
    if (dologs === true) {
        discordlog("Bot status:", `${displayName} is now online!`, 0x00FF00);
    } else {
        console.log("[LOGS] disabled.");
    }

    dclient.user.setActivity(discord_status, { type: discord_status_type });

    const commands = dclient.application?.commands;

    commands?.create({
        name: 'cosmetics',
        description: 'update cosmetics json file',
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
        name: 'add',
        description: 'adds a user',
        options: [
            {
                name: "user",
                description: 'user to add',
                required: true,
                type: ApplicationCommandOptionType.String,
            }
        ],
    });

    commands?.create({
        name: 'unadd',
        description: "user to unadd",
        options: [
            {
                name: 'usertounadd',
                description: "user to unadd",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    });

    commands?.create({
        name: 'playlist',
        description: 'sets the current playlist if the bot is party leader',
        options: [
            {
                name: 'playlist',
                description: 'sets the party playlist',
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    });

    commands?.create({
        name: 'stoptimer',
        description: 'stops the setTimeout function aka the party timer',
    });

    commands?.create({
        name: 'members',
        description: "show current party members of the bot's lobby",
    });

    commands?.create({
        name: 'setemote',
        description: 'sets the clients emote with an id',
        options: [
            {
                name: 'emotename',
                description: 'name of the emote',
                required: true,
                type: ApplicationCommandOptionType.String,
            }
        ],
    });

    commands?.create({
        name: 'setoutfit',
        description: 'sets an outfit with an id',
        options: [
            {
                name: 'skinname',
                description: 'name of the skin',
                type: ApplicationCommandOptionType.String,
            }
        ],
    });

    commands?.create({
        name: "restartfnclient",
        description: "restart",
    });

    commands?.create({
        name: "logoutfnclient",
        description: "logout",
    });

    commands?.create({
        name: 'exit',
        description: 'Kills the process',
    });

    commands?.create({
        name: 'leaveparty',
        description: "leaves the current party",
    });

    commands?.create({
        name: 'sendpartychatmessage',
        description: "sends a message to the fortnite party chat!",
        options: [
            {
                name: 'message',
                description: 'the message to send!',
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    });

    commands?.create({
        name: 'level',
        description: 'sets the clients level',
        options: [
            {
                name: 'level',
                description: 'the level to set',
                type: ApplicationCommandOptionType.Number,
                required: true,
            }
        ],
    });

    commands?.create({
        name: 'sitout',
        description: 'sets the sitting out state',
        options: [
            {
                name: 'sittingout',
                description: 'sets the sitting out state',
                required: true,
                type: ApplicationCommandOptionType.Boolean,
            }
        ],
    });

    commands?.create({
        name: 'readystate',
        description: 'sets the bots ready state',
        options: [
            {
                name: 'state',
                description: 'the state of the ready option',
                required: true,
                type: ApplicationCommandOptionType.Boolean,
            }
        ],
    });

    commands?.create({
        name: 'block',
        description: 'Blocks a user',
        options: [
            {
                name: "usertoblock",
                description: "Displayname of the user to block",
                required: true,
                type: ApplicationCommandOptionType.String,
            }
        ],
    });

    commands?.create({
        name: 'unblock',
        description: 'unblocks a user',
        options: [
            {
                name: "usertounblock",
                description: "Displayname of the user to unblock",
                required: true,
                type: ApplicationCommandOptionType.String,
            }
        ],
    });
});

app.get('/', (req, res) => {
    res.send(web_message)
})

app.listen(3000, () => {
    console.log(bot_loading_message)
})

const url = require('url')
var os = require('os');
const Websocket = require('ws');
var HttpsProxyAgent = require('https-proxy-agent');
const { allowedPlaylists, websocketHeaders } = require('./utils/constants');
const xmlparser = require('xml-parser');
require('colors');

const bLog = true;
const GetVersion = require('./utils/version');

/**
 * @typedef {import('./utils/types').MMSTicket} MMSTicket
 * @typedef {import('./utils/types').PartyMatchmakingInfo} PartyMatchmakingInfo
 */

// based on ollie's fortnitejs bot

(async () => {
    const lastest = await GetVersion();
    const Platform = os.platform() === "win32" ? "Windows" : os.platform();
    const UserAgent = `Fortnite/${lastest.replace('-Windows', '')} ${Platform}/${os.release()}`

    axios.defaults.headers["user-agent"] = UserAgent;
    console.log("UserAgent set to", axios.defaults.headers["user-agent"]);

    /**
     * @type {ClientOptions}
     */

    const deviceauths = {
        "accountId": process.env['accountId'],
        "deviceId": process.env['deviceId'],
        "secret": process.env['secret']
    }
    try {
        clientOptions.auth.deviceAuth = deviceauths;
    } catch (e) {
        clientOptions.auth.authorizationCode = async () => Client.consoleQuestion('Please enter an authorization code: ');
    }

    const client = new FNclient(clientOptions);
    await client.login();
    console.log(`[LOGS] Logged in as ${client.user.self.displayName}`);
    const fnbrclient = client
    client.setStatus(bot_invite_status, bot_invite_onlinetype)
    await client.party.me.setOutfit(cid);
    await client.party.setPrivacy(Enums.PartyPrivacy.PRIVATE);
    await client.party.me.setLevel(level)
    await client.party.me.setBattlePass(battle_pass_owned, parseInt(battle_pass_lvl), 100, 100)
    await client.party.me.setBanner(banner)
    await client.party.me.setBackpack(bid)

    const findCosmetic = (query, type, message, discord) => {
        const queryLower = query.toLowerCase();
        const matchingCosmetics = cosmetics.filter((c) => c.type.value === type);

        const exactMatches = matchingCosmetics.filter((c) =>
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
                    exists: false
                };
            }
        };
        return null;
    }

    dclient.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) {
            return
        }

        const { commandName, options } = interaction;
        const ephemeralMessage = `Reply is loading and will be sent in <#${logchannel}>`;

        if (interaction.user.id != parseInt(DISCORD_BOT_OWNER)) {
            discordlog('[Permission] Denied:', 'Only **Ryuk** can interact with this bot!', 0x880808, interaction)

        } else {
            if (commandName === 'status') {
                discordlog("[Command] Status:", `Shit's Working!`, 0x00FF00, interaction)

            } else if (commandName === 'add') {
                const user = options.getString('user') || null;
                if (user === null) {
                    discordlog('[Command] add:', 'No user provided', 0x880800, interaction);
                } else {
                    try {
                        await fnbrclient.friend.add(user);
                        discordlog("[Command] add:", `**${user}** has been sent a friend request`, 0x00FF00, interaction);
                    } catch (err) {
                        if (err.message.includes("already friends")) {
                            discordlog("[Command] add error:", `**${user}** is already your friend!`, 0x880800, interaction);
                        } else {
                            discordlog("[Command] add error:", `An error occurred while trying to send a friend request to **${user}**.`, 0x880800, interaction);
                        }
                        console.error(err);
                    }
                }
            } else if (commandName === 'unadd') {
                const unadduser = options.getString('usertounadd');
                try {
                    await fnbrclient.friend.remove(unadduser);
                    discordlog("[Command] unadd:", `**${unadduser}** has been unadded!`, 0x00FF00, interaction);
                } catch (err) {
                    if (err.message.includes("The friend") && err.message.includes("does not exist")) {
                        discordlog("[Command] unadd error:", `**${unadduser}** not found!`, 0x880800, interaction);
                    } else {
                        discordlog("[Command] unadd error:", `An error occurred while trying to unadd **${unadduser}**.`, 0x880800, interaction);
                    }
                    console.error(err);
                }
            } else if (commandName === 'friends') {
                const friendList = fnbrclient.friend.list;
                let friendNames = [];
                friendList.forEach((friend) => {
                    if (friend && friend.displayName) {
                        friendNames.push(`Name: ${friend.displayName} -> ID: ${friend.id}`);
                    }
                });
                let friendNamesString = friendNames.join(',').replace(/,/g, '\n');

                discordlog("[Command] Friends list:", `**${friendNamesString}**`, 0x00FF00, interaction)

            } else if (commandName === 'playlist') {
                const setplaylist = options.getString('playlist')
                fnbrclient.party.setPlaylist({ playlistName: setplaylist })
                discordlog("[Command] playlist:", `Playlist Id: **${setplaylist}** has been set as the playlist!`, 0x00FF00, interaction)

            } else if (commandName === 'stoptimer') {
                if (timerstatus == true) {
                    timerstatus = false
                    let id = this.ID
                    console.log(`[PARTY] timer id: ${id}`)
                    clearTimeout(id)
                    console.log("[PARTY] Time has stoped!")
                    discordlog("[Command] stoptimer:", `TimerID: **${id}** has now been stoped!`, 0x00FF00, interaction)

                } else {

                    discordlog("[Command] stoptimer:", `Timer not running`, 0xFFA500, interaction)
                }
            } else if (commandName === 'setemote') {
                const emotename = options.getString('emotename')
                const emote = findCosmetic(emotename, 'emote', null, true)
                if (emote) {
                    if (emote.exists) {
                        fnbrclient.party.me.setEmote(emote.cosmeticmatch.id);
                        discordlog("[Command] setemote:", `**${emote.cosmeticmatch.name}** has been set as the emote!`, 0x00FF00, interaction);
                    } else {
                        fnbrclient.party.me.setEmote(emote.cosmeticmatch.id);
                        discordlog("[Command] setemote error:", `Emote **${emotename}** doesn't exist...\n\nBut match "**${emote.cosmeticmatch.name}**" has been set anyway!`, 0xFFA500, interaction);
                    }
                }
                else discordlog("[Command] Error:", `Emote **${emotename}** not found!`, 0x880800, interaction);

            } else if (commandName === 'setoutfit') {
                const skinname = options.getString('skinname')
                const skin = findCosmetic(skinname, 'outfit', null, true)
                if (skin) {
                    if (skin.exists) {
                        fnbrclient.party.me.setOutfit(skin.cosmeticmatch.id);
                        discordlog("[Command] setoutft:", `Skin set to **${skin.cosmeticmatch.name}**!`, 0x00FF00, interaction);
                    } else {
                        fnbrclient.party.me.setOutfit(skin.cosmeticmatch.id);
                        discordlog("[Command] setoutfit error:", `Skin **${skinname}** doesn't exist...\n\nBut match "**${skin.cosmeticmatch.name}**" has been set anyway!`, 0xFFA500, interaction);
                    }
                }
                else discordlog("[Command] Error:", `Skin **${skinname}** not found!`, 0x880800, interaction);

            } else if (commandName === 'restartfnclient') {
                fnbrclient.restart();

                discordlog("[Command] restartfnclient:", `Client is restarting`, 0xFFA500, interaction)

            } else if (commandName === 'logoutfnclient') {
                fnbrclient.logout();

                discordlog("[Command] logoutfnclient:", `Client is logging out`, 0xFFA500, interaction)

            } else if (commandName === 'exit') {

                discordlog("[Command] exit:", `All clients are currently being killed!`, 0xFFA500, interaction)

                function killbot() {
                    process.exit(1)
                }
                setTimeout(killbot, 1000)

            } else if (commandName === 'leaveparty') {
                fnbrclient.party.leave()

                discordlog("[Command] leaveparty:", `left the current party!`, 0xFFA500, interaction)

            } else if (commandName === 'members') {
                const pdisplayNamesList = [];
                client.party.members.forEach(member => {
                    pdisplayNamesList.push(member.displayName);
                });
                const pdisplayNames = pdisplayNamesList.join('\n');

                discordlog("[Command] Party members:", `**${pdisplayNames}**`, 0x00FF00, interaction)

            } else if (commandName === 'sendpartychatmessage') {
                const message = options.getString('message')
                fnbrclient.party.chat.send(message)

                discordlog("[Command] sendpartychatmessage:", `**${message}** has been sent in the party chat!`, 0x00FF00, interaction)

            } else if (commandName === 'level') {
                const leveltoset = options.getNumber('level')
                fnbrclient.party.me.setLevel(parseInt(leveltoset, 10));

                discordlog("[Command] level:", `level was set to **${leveltoset}**`, 0x00FF00, interaction)

            } else if (commandName === 'sitout') {

                const sitvalue = options.getBoolean('sitingout')
                if (sitvalue === true) {
                    client.party.me.setSittingOut(true)

                    discordlog("[Command] sitout:", `Siting out state set to **${sitvalue}**`, 0x00FF00, interaction)

                } else if (sitvalue === false) {
                    client.party.me.setSittingOut(false)

                    discordlog("[Command] sitout:", `Siting out state set to **${sitvalue}**`, 0x00FF00, interaction)

                }
            } else if (commandName === 'readystate') {

                const readystate = options.getBoolean('state')
                if (readystate === true) {
                    client.party.me.setReadiness(true)

                    discordlog("[Command] readystate:", `I am now ready`, 0x00FF00, interaction)

                } else if (readystate === false) {
                    client.party.me.setReadiness(false)

                    discordlog("[Command] readystate:", `I am now unready`, 0x880800, interaction)
                }
            } else if (commandName === 'crash') {
                if (interaction.user.id === 935761038496907315) {

                    discordlog("[Command] crash:", `Not Valid`, 0x880800, interaction)
                } else {
                    client.party.me.setEmote('/setemote emoteid:eid_floss')
                    fnbrclient.party.leave()
                    console.log("Left party")

                    discordlog("[Command] crash:", `Party was crashed`, 0x880800, interaction)
                }
            } else if (commandName === "block") {
                const blockuser = options.getString('usertoblock')
                fnbrclient.blockUser(blockuser)

                discordlog("[Command] block:", `**${blockuser}** has been blocked!`, 0xFFA500, interaction)

            } else if (commandName === "cosmetics") {
                const url = 'https://fortnite-api.com/v2/cosmetics/br';

                try {
                    const response = await fetch(url);
                    const json = await response.json();

                    const file_path = `${process.cwd()}/cosmetics.json`;
                    await fs.writeFileSync(file_path, JSON.stringify(json?.data, null, 2));

                    discordlog("[Command] cosmetics:", "Cosmetics JSON file has been updated from Fortnite API", 0x00FF00, interaction);
                } catch (error) {
                    discordlog("[Error] cosmetics:", `${error}`, 0xFF0000, interaction);
                }

            } else if (commandName === "unblock") {
                const unblockuser = options.getString('usertounblock')
                fnbrclient.unblockUser(unblockuser)

                discordlog("[Command] block:", `**${unblockuser}** has been unblocked!`, 0xFFA500, interaction)
            } else {
                console.log("Command Not Found")
                return
            }
        }
    });

    axios.interceptors.response.use(undefined, function (error) {
        if (error.response) {

            if (error.response.data.errorCode && client && client.party) {
                client.party.sendMessage(`HTTP Error: ${error.response.status} ${error.response.data.errorCode} ${error.response.data.errorMessage}`)
            }

            console.error(error.response.status, error.response.data)
            if (dologs === true) {

                discordlog("Error: ${error.response.status}", `**${error.response.data}**`, 0x880808)

            } else return;
        }

        return error;
    });

    var bIsMatchmaking = false;

    client.on('party:updated', async (updated) => {

        switch (updated.meta.schema["Default:PartyState_s"]) {
            case "BattleRoyalePreloading": {

                var loadout = client.party.me.meta.set("Default:LobbyState_j",
                    {
                        "LobbyState": {
                            "hasPreloadedAthena": true
                        }
                    }
                );

                await client.party.me.sendPatch({
                    'Default:LobbyState_j': loadout,
                });

                break;
            }

            case "BattleRoyaleMatchmaking": {
                if (bIsMatchmaking) {
                    console.log('Members has started matchmaking!')
                    if (dologs === true) {

                        discordlog("[Logs] Matchmaking", "Members started Matchmaking!", 0x00FFFF)

                    } else return;
                    return;
                }
                bIsMatchmaking = true;
                if (bLog) { console.log(`[${'Matchmaking'.cyan}]`, 'Matchmaking Started') }

                /**
                 * @type {PartyMatchmakingInfo}
                 */
                const PartyMatchmakingInfo = JSON.parse(updated.meta.schema["Default:PartyMatchmakingInfo_j"]).PartyMatchmakingInfo;


                const playlistId = PartyMatchmakingInfo.playlistName.toLocaleLowerCase();

                if (!allowedPlaylists.includes(playlistId)) {
                    console.log("Unsupported playlist", playlistId)
                    client.party.chat.send(`Playlist id: ${playlistId} is not a supported gamemode!`)
                    client.party.me.setReadiness(false);
                    return;
                }
                var partyPlayerIds = client.party.members.filter(x => x.isReady).map(x => x.id).join(',')

                const bucketId = `${PartyMatchmakingInfo.buildId}:${PartyMatchmakingInfo.playlistRevision}:${PartyMatchmakingInfo.regionId}:${playlistId}`
                console.log(bucketId)
                if (dologs === true) {

                    discordlog("[Logs] New BucketId:", `**${bucketId}**`, 0x00FFFF)

                } else return;

                // auth.missing_player_id

                console.log(partyPlayerIds)

                var query = new URLSearchParams();
                query.append("partyPlayerIds", partyPlayerIds);
                query.append("player.platform", "Windows");
                query.append("player.option.partyId", client.party.id);
                query.append("input.KBM", "true");
                query.append("player.input", "KBM");
                query.append("bucketId", bucketId);

                client.party.members.filter(x => x.isReady).forEach(Member => {
                    const platform = Member.meta.get("Default:PlatformData_j");
                    if (!query.has(`party.{PlatformName}`)) {
                        query.append(`party.{PlatformName}`, "true")
                    }
                });

                const token = client.auth.sessions.get("fortnite").accessToken;

                const TicketRequest = (
                    await axios.get(
                        `https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/matchmakingservice/ticket/player/${client.user.self.id}?${query}`,
                        {
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${token}`
                            }
                        }
                    )
                );

                if (TicketRequest.status != 200) {
                    console.log(`[${'Matchmaking'.cyan}]`, 'Error while obtaining ticket'.red);
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
                    console.log(`[${'Matchmaking'.cyan}]`, 'Error while obtaining Hash'.red);
                    client.party.me.setReadiness(false);
                    return;
                }

                const hash = await calcChecksum(payload, signature);

                console.log(ticket.payload, ticket.signature, hash)

                var MMSAuth = [
                    "Epic-Signed",
                    ticket.ticketType,
                    payload,
                    signature,
                    hash
                ];

                const matchmakingClient = new Websocket(
                    ticket.serviceUrl,
                    {
                        perMessageDeflate: false,
                        rejectUnauthorized: false,
                        headers: {
                            Origin: ticket.serviceUrl.replace('ws', 'http'),
                            Authorization: MMSAuth.join(" "),
                            ...websocketHeaders
                        }
                    }
                );

                matchmakingClient.on('unexpected-response', (request, response) => {
                    let data = '';
                    response.on('data', (chunk) => data += chunk);

                    response.on('end', () => {
                        const baseMessage = `[MATCHMAKING] Error Error while connecting to matchmaking service: (status ${response.statusCode} ${response.statusMessage})`;

                        client.party.chat.send(`Error while connecting to matchmaking service: (status ${response.statusCode} ${response.statusMessage})`)

                        if (data == '') {
                            console.error(baseMessage);
                            if (dologs === true) {

                                discordlog("[Logs] Error", baseMessage, 0x880808)

                            } else return;

                        }

                        else if (response.headers['content-type'].startsWith('application/json')) {

                            const jsonData = JSON.parse(data);

                            if (jsonData.errorCode) {

                                console.error(`${baseMessage}, ${jsonData.errorCode} ${jsonData.errorMessage || ''}`);
                                client.party.chat.send(`Error while connecting to matchmaking service: ${jsonData.errorCode} ${jsonData.errorMessage || ''}`)

                            } else {
                                console.error(`${baseMessage} response body: ${data}`)
                            }

                        }

                        else if (response.headers['x-epic-error-name']) {

                            console.error(`${baseMessage}, ${response.headers['x-epic-error-name']} response body: ${data}`);

                        }

                        else if (response.headers['content-type'].startsWith('text/html')) {
                            const parsed = xmlparser(data);

                            if (parsed.root) {

                                try {

                                    const title = parsed.root.children.find(x => x.name == 'head').children.find(x => x.name == 'title');

                                    console.error(`${baseMessage} HTML title: ${title}`)

                                } catch { console.error(`${baseMessage} HTML response body: ${data}`) }

                            }

                            else { console.error(`${baseMessage} HTML response body: ${data}`) }
                        }

                        else { console.error(`${baseMessage} response body: ${data}`) }
                    })
                })

                if (bLog) {
                    matchmakingClient.on('close', function () {
                        console.log(`[${'Matchmaking'.cyan}]`, 'Connection to the matchmaker closed')
                        if (dologs === true) {

                            discordlog("[Logs] Matchmaking", "Matchmaking closed", 0xFFA500)

                        } else return;
                    });
                }

                matchmakingClient.on('message', (msg) => {
                    const message = JSON.parse(msg);
                    if (bLog) {
                        console.log(`[${'Matchmaking'.cyan}]`, 'Message from the matchmaker', message)
                    }

                    if (message.name === 'Error') {
                        bIsMatchmaking = false;
                    }
                });

                break;
            }

            case "BattleRoyalePostMatchmaking": {
                if (bLog) { console.log(`[${'Party'.magenta}]`, 'Players entered loading screen, Exiting party...') }
                if (dologs === true) {

                    discordlog("[Logs] Matchmaking", "Members now in game. leaving party...", 0xFFA500)

                } else return;

                if (client.party?.me?.isReady) {
                    client.party.me.setReadiness(false)
                }
                bIsMatchmaking = false;
                client.party.leave();
                break;
            }

            case "BattleRoyaleView": {
                break;
            }

            default: {
                if (bLog) { console.log(`[${'Party'.magenta}]`, 'Unknow PartyState'.yellow, updated.meta.schema["Default:PartyState_s"]) }
                break;
            }
        }
    })

    const handleCommand = async (message, sender) => {

        console.log(`${sender.displayName}: ${message.content}`);
        if (!message.content.startsWith('!')) return;

        const args = message.content.slice(1).split(' ');
        const command = args.shift().toLowerCase();
        const content = args.join(' ');

        if (sender.id == BotOwnerId) {
            if (command === 'skin') {
                const skin = findCosmetic(content, 'outfit', message);
                if (skin) client.party.me.setOutfit(skin.id);
                else message.reply(`Skin ${content} wasn't found!`);
            } else if (command === 'emote') {
                const emote = findCosmetic(content, 'emote', message);
                if (emote) client.party.me.setEmote(emote.id);
                else message.reply(`Emote ${content} wasn't found!`);
            } else if (command === 'leave') {
                fnbrclient.party.leave()
                message.reply("I just left the party!")
            } else if (command === 'pickaxe') {
                const pickaxe = findCosmetic(content, 'pickaxe', message);
                if (pickaxe) client.party.me.setPickaxe(pickaxe.id);
                else message.reply(`Pickaxe ${content} wasn't found!`);
            } else if (command === 'ready') {
                client.party.me.setReadiness(true);
            } else if (command === 'unready') {
                client.party.me.setReadiness(false);
            } else if (command === 'purpleskull') {
                client.party.me.setOutfit('CID_030_Athena_Commando_M_Halloween', [{ channel: 'ClothingColor', variant: 'Mat1' }]);
            } else if (command === 'pinkghoul') {
                client.party.me.setOutfit('CID_029_Athena_Commando_F_Halloween', [{ channel: 'Material', variant: 'Mat3' }]);
            } else if (command === 'level') {
                client.party.me.setLevel(parseInt(content, 10));
            } else if (command === 'add') {
                try {
                    await client.friend.add(content)
                    message.reply(`${content} has been sent a friend request!`)
                } catch (err) {
                    if (err.message.includes("already friends")) {
                        message.reply(`${content} is already your friend!`)
                    } else {
                        message.reply(`An error occurred when trying to send a friend request to ${content}.`)
                        console.log(err)
                    }
                }
            } else if (command === 'unadd') {
                try {
                    await client.friend.remove(content)
                    message.reply(`${content} has been unadded!`)
                } catch (err) {
                    if (err.message.includes("The friend") && err.message.includes("does not exist")) {
                        message.reply(`Error: ${content} not found!`)
                    } else {
                        message.reply(`An error occured when trying to add ${content}!`)
                        console.log(err)
                    }
                }
            } else if (command === 'restartclient') {
                message.reply("Fortnite Client Is Restarting!")
                client.restart()
            } else if (command === 'friends' || command === 'frds') {
                let friendList = fnbrclient.friend.list;
                let friendNames = '';

                friendList.forEach((friend) => {
                    friendNames += `Name: ${friend.displayName} -> ID: ${friend.id}\n`;
                });

                message.reply(`Friend list:\n${friendNames}`)
            } else if (command === 'kill') {
                message.reply("Bot is dead")
                console.log("[PARTY] RIP bot\nBot was killed!")
                process.exit(1)
            } else if (command === "stoptimer") {
                if (timerstatus === true) {
                    timerstatus = false
                    let id = this.ID
                    console.log(`[PARTY] timer id: ${id}`)
                    clearTimeout(id)
                    console.log("[PARTY] Time has stoped!")
                    message.reply("Time has been stoped!")
                }
            }
        } else {
            if (command) {
                message.reply(`Only Ryuk is allowed to use commands`);
            }
        }

    };

    client.on('friend:message', (m) => handleCommand(m, m.author));
    //  client.on('party:member:message', (m) => handleCommand(m, m.author));

    client.on("party:member:updated", async (Member) => {
        if (Member.id == client.user.self.id) {
            return;
        }


        if (!client.party.me) {
            return;
        }


        if ((Member.isReady && (client?.party?.me?.isLeader || Member.isLeader) && !client.party?.me?.isReady) && !client.party.bManualReady) {
            // Ready Up
            if (client.party?.me?.isLeader) {
                await Member.promote();
            }

            client.party.me.setReadiness(true);
        }
        else if ((!Member.isReady && Member.isLeader) && !client.party.bManualReady) {
            try {
                client.WSS.close()
            } catch { }
            client.party.me.setReadiness(false);
        }


        var bAllmembersReady = true;

        client.party.members.forEach(member => {
            if (!bAllmembersReady) {
                return;
            }

            bAllmembersReady = member.isReady;
        });

    })

    client.on('friend:request', async (request) => {
        if (addusers === true) {
            await request.accept()
        } else if (addusers === false) {
            await request.decline();
            client.party.chat.send(`Sorry, ${request.displayName} I dont accept friend requests!`)
        }
    }
    )

    client.on('party:invite', async (request) => {
        party = client.party
        if ([1] == party.size) {
            await request.accept();
        }
        else {
            await request.decline()
        }
    }
    );


    async function sleep(seconds) {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }

    let timerstatus = false;

    client.on('party:member:joined', async (join) => {
        client.party.me.sendPatch({ 'Default:AthenaCosmeticLoadout_j': '{"AthenaCosmeticLoadout":{"cosmeticStats":[{"statName":"TotalVictoryCrowns","statValue":0},{"statName":"TotalRoyalRoyales","statValue":999},{"statName":"HasCrown","statValue":0}]}}', })
        await client.party.me.setOutfit(cid);
        const BotName = client.user.displayName;
        const partyLeader = join.party.leader;
        await partyLeader.fetch();
        let partyLeaderDisplayName = partyLeader.displayName;
        console.log(`Joined ${partyLeaderDisplayName}`)
        if (dologs === true) {
            discordlog("[Logs] Party:", `Joined **${partyLeaderDisplayName}**'s party`, 0x00FFFF)
        } else return;

        const party = client.party
        await client.party.me.setBackpack(bid)
        await sleep(1.5)
        const minute = 600000

        let time = 1 * minute
        async function leavepartyexpire() {
            client.party.chat.send("Time expired!")
            await sleep(1.2)
            client.party.leave()
            console.log("[PARTY] Left party due to party time expiring!")
            if (dologs === true) {

                discordlog("[Logs] Party:", "Party Time expired.", 0xFFA500)

            } else return;
            console.log("[PARTY] Time tracking stoped!")
            timerstatus = false
        }
        if ([1] != party.size) {
            const isOwnerInLobby = party.members.some(member => member.id === BotOwnerId);
            if (isOwnerInLobby) {
                console.log("Timer has been disabled cause Ryuk is in lobby!")
                client.party.chat.send(`Timer has been disabled cause Ryuk is in lobby!`)

                discordlog("[Logs] Timer:", `Timer has been disabled cause **Ryuk** is in lobby!`, 0x00FFFF)
                timerstatus = false
            } else {
                console.log("[PARTY] Time has started!")
                client.party.chat.send(`Timer has started, ready up before the bot leaves`)
                this.ID = setTimeout(leavepartyexpire, bot_leave_time)
                timerstatus = true
            }

        }
        client.party.me.setEmote(eid);
        if ([2] == party.size) {
            client.party.chat.send(`${bot_join_message}\n Bot By Ryuk`)
            client.setStatus(bot_use_status, bot_use_onlinetype)
        }
        if ([3] == party.size) {
            client.party.chat.send(`${bot_join_message}\n Bot By Ryuk`)
            client.setStatus(bot_use_status, bot_use_onlinetype)
        }
        if ([4] == party.size) {
            client.party.chat.send(`${bot_join_message}\n Bot By Ryuk`)
            client.setStatus(bot_use_status, bot_use_onlinetype)
        }
        if ([1] == party.size) {
            client.setStatus(bot_invite_status, bot_invite_onlinetype)
            await client.party.setPrivacy(Enums.PartyPrivacy.PRIVATE);
            if (client.party?.me?.isReady) {
                client.party.me.setReadiness(false);
            };
            if (timerstatus === true) {
                timerstatus = false
                let id = this.ID
                clearTimeout(id)
                console.log("[PARTY] Time has stoped!")
            };
        }
    })

    client.on('party:member:left', async (left) => {
        console.log(`member left: ${left.displayName}`)
        const party = client.party
        if (dologs === true) {

            discordlog("[Logs] Party Members:", `**${left.displayName}** has left.`, 0xFFA500)

        } else return;
        if ([2] == party.size) {
            client.party.chat.send(`${bot_join_message}\n Bot By Ryuk`)
            client.setStatus(bot_use_status, bot_use_onlinetype)
        }
        if ([3] == party.size) {
            client.party.chat.send(`${bot_join_message}\n Bot By Ryuk`)
            client.setStatus(bot_use_status, bot_use_onlinetype)
        }
        if ([4] == party.size) {
            client.party.chat.send(`${bot_join_message}\n Bot By Ryuk`)
            client.setStatus(bot_use_status, bot_use_onlinetype)
        }
        if ([1] == party.size) {
            client.setStatus(bot_invite_status, bot_invite_onlinetype)
            await client.party.setPrivacy(Enums.PartyPrivacy.PRIVATE);
            if (client.party?.me?.isReady) {
                client.party.me.setReadiness(false);
            };
            if (timerstatus === true) {
                timerstatus = false
                let id = this.ID
                clearTimeout(id)
                console.log("[PARTY] Time has stoped!")
            };
        }
    })
    if (run_discord_client === true) {
        dclient.login(DISCORD_TOKEN)
    } else if (run_discord_client === false) {
        console.log("[DISCORD] client is disabled!")
    }
})();
