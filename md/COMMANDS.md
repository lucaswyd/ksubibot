# Command Documentation

## In-Game Commands

These commands are available for the in-game bot. To use a command, start the message with `!` and follow it with the command name and any necessary arguments.

### Commands

- **`!skin <name/id>`**
  - Sets the bot's outfit to the specified skin.
  - Example: `!skin Dark Voyager`

- **`!emote <name/id>`**
  - Sets the bot's emote to the specified emote.
  - Example: `!emote Floss`

- **`!advskin <skin> <style> <variant>`**
  - Sets the bot's outfit to the specified skin with a specific style and variant.
  - Example: `!advskin Dark Voyager Style1 Variant2`

- **`!bp`** or **`!backpack <name/id>`**
  - Sets the bot's backpack to the specified backpack.
  - Example: `!backpack Dark Matter`

- **`!leave`**
  - Leaves the current party.

- **`!pickaxe <name/id>`**
  - Sets the bot's pickaxe to the specified pickaxe.
  - Example: `!pickaxe Reaper`

- **`!ready`**
  - Sets the bot to ready status.

- **`!unready`**
  - Sets the bot to not ready status.

- **`!purpleskull`**
  - Sets the bot's outfit to the og skull outfit.

- **`!pinkghoul`**
  - Sets the bot's outfit to the og ghoul outfit.

- **`!level <number>`**
  - Sets the bot's level to the specified number.
  - Example: `!level 100`

- **`!add <user_id/user_name>`**
  - Sends a friend request to the specified user ID.

- **`!unadd <user_id/user_name>`**
  - Removes the specified user ID from friends.

- **`!restartclient`**
  - Restarts the Fortnite client.

- **`!friends`** or **`!frds`**
  - Lists all friends with their names and IDs.

- **`!kill`**
  - Terminates the bot.

- **`!stoptimer`**
  - Stops the currently running timer.

- **`!sitout <true|false>`**
  - Sets the bot to sit out or not based on the provided value.
  - Example: `!sitout true`

## Discord Commands

These commands are available for the Discord bot. To use a command, type the command name in a Discord channel where the bot has access.

### Commands

- **`/status`**
  - Checks the bot's status.

- **`/add <user_id/user_name>`**
  - Sends a friend request to the specified user.

- **`/unadd <user_id/user_name>`**
  - Removes the specified user from friends.

- **`/friends`**
  - Lists all friends with their names and IDs.

- **`/playlist <playlist_id>`**
  - Sets the current playlist to the specified playlist ID.

- **`/stoptimer`**
  - Stops the currently running timer.

- **`/setemote <name/id>`**
  - Sets the bot's emote to the specified emote name.

- **`/setoutfit <name/id>`**
  - Sets the bot's outfit to the specified skin name.

- **`/setadvancedskin <skin name/id> <style> <variant>`**
  - Sets the bot's outfit to the specified skin with a specific style and variant.

- **`/setbackpack <name/id>`**
  - Sets the bot's backpack to the specified backpack.

- **`/restartfnclient`**
  - Restarts the Fortnite client.

- **`/logoutfnclient`**
  - Logs out of the Fortnite client.

- **`/loginfnclient`**
  - Logs into the Fortnite client.

- **`/exit`**
  - Exits all running clients.

- **`/leaveparty`**
  - Leaves the current party.

- **`/members`**
  - Lists all party members.

- **`/sendpartychatmessage <message>`**
  - Sends a message in the party chat (in game).

- **`/level <level>`**
  - Sets the bot's level to the specified number.

- **`/sitout <true|false>`**
  - Sets the bot to sit out or not based on the provided value.

- **`/block <user_id/user_name>`**
  - Blocks the specified user.

- **`/unblock <user_id/user_name>`**
  - Unblocks the specified user.

- **`/cosmetics`**
  - Updates the cosmetics JSON file from the Fortnite API.

## Notes
Commands that require names (such as outfits, emotes, etc.) are not case-sensitive and can be slightly incorrect. For example, `!skin flos` will set "Floss" as the emote.

## Error Handling

If you encounter an error while using a command, the bot will attempt to reply with an error message and log the details for debugging. Ensure you have the necessary permissions and correct arguments for each command.

## Permissions

- **In-Game Commands:** Only available to the user with the Epic ID specified in the configuration.
- **Discord Commands:** Only available to the Discord user with the ID specified in the configuration.

---
