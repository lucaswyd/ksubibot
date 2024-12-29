const { readFile, writeFile } = require('fs').promises;
const fnbr = require('fnbr');

(async () => {
    let auth;

    try {
        // Attempt to read existing device auth info
        auth = { deviceAuth: JSON.parse(await readFile('./deviceAuth.json')) };
    } catch (e) {
        // If reading from the file fails (it may not exist), prompt for an authorization code
        auth = {
            authorizationCode: async () => Client.consoleQuestion('Please enter an authorization code: ')
        };
    }

    const client = new fnbr.Client({ auth });

    // Listen for the event when a device auth is created and save it
    client.on('deviceauth:created', (da) => {
        writeFile('./deviceAuth.json', JSON.stringify(da, null, 2));
        console.log('Device auth saved!');
    });

    // Listen for the ready event
    client.on('ready', async () => {
        let displayName;

        try {
            displayName = client.user.self._displayName || 'Unknown User';
        } catch (error) {
            console.error('Error fetching user data:', error);
            displayName = 'Unknown User';
        }

        console.log(`Logged in as: ${displayName}`);

        // Friend management logic
        if (client.friend) {
            client.on('friend:request', async (request) => {
                try {
                    await request.accept();
                    const senderName = request.sender?._displayName || request.sender?.name || 'Unknown Sender';
                    console.log(`Automatically accepted a friend request from: ${senderName}`);
                } catch (error) {
                    console.error('Failed to accept friend request:', error);
                }
            });
        }

        // Listen for party invitations
        client.on('party:invite', async (invitation) => {
            console.log("Received a party invitation.");

            try {
                await invitation.accept();
                const senderName = invitation.sender?._displayName || invitation.sender?.name || 'Unknown Sender';
                console.log(`Automatically accepted a party invitation from: ${senderName}`);

                // Delay to allow the bot to join the party
                setTimeout(async () => {
                    try {
                        // Emote functionality removed
                        // await client.party.me.setEmote('EID_Skeemote_K5J4Jz'); 
                        // console.log('Played the Slalom Style emote.');
                    } catch (error) {
                        console.error('Failed to play the Slalom Style emote:', error);
                    }
                }, 2000); // 2-second delay
            } catch (error) {
                console.error('Failed to accept party invitation:', error);
            }
        });

        // Listen for readiness updates
        client.on('party:member:readiness:updated', async (eventData) => {
            console.log("Readiness state updated.");

            try {
                const memberId = eventData.memberId;
                const isReady = eventData.isReady;

                if (memberId === client.user.id && !isReady) {
                    await client.party.me.setReadiness(true);
                    console.log("Automatically marked self as ready.");
                }
            } catch (error) {
                console.error('Failed to set self as ready:', error);
            }
        });

        // Set bot's level
        try {
            const partyMember = client.party.me;
            const newLevel = -999999999;
            await partyMember.setLevel(newLevel);
            console.log(`Bot's level set to: ${newLevel}`);
        } catch (error) {
            console.error('Failed to set the bot\'s level:', error);
        }

        // Set bot's outfit
        try {
            await client.party.me.setOutfit('CID_175_Athena_Commando_M_Celestial'); 
            console.log('Equipped the Galaxy outfit.');
        } catch (error) {
            console.error('Failed to equip the Galaxy outfit:', error);
        }

        // Stop the program after 2 minutes
        setTimeout(() => {
            console.log("Stopping the program after 2 minutes.");
            process.exit(0);
        }, 2 * 60 * 1000); // 2 minutes in milliseconds
    });

    // Attempt to log in
    await client.login();
})().catch(error => {
    console.error('Failed to log in:', error);
});
