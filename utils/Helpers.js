// helper functions
import { EmbedBuilder } from "discord.js";
import { logchannel } from "./Config.js";
import { dclient } from "./discordClient.js";
import axios from "axios";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function discordlog(
  title,
  content,
  color,
  interaction,
  followup = false
) {
  const channel = dclient.channels.cache.get(logchannel);
  const logs = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(content);
  try {
    if (interaction && followup === false) {
      await interaction.reply({ embeds: [logs] });
    } else if (interaction && followup === true) {
      await sleep(500);
      await interaction.followUp({ embeds: [logs] });
    } else channel.send({ embeds: [logs] });
  } catch (e) {
    if (interaction) {
      const channelid = interaction.channelId;
      const fallBack = dclient.channels.cache.get(channelid);
      console.log("error triggered falllback: ", channelid);
      await fallBack.send({ embeds: [logs] });
    } else {
      await channel.send({ embeds: [logs] });
    }
    console.log(e);
  }
}

export async function calcChecksum(ticketPayload, signature) {
  const plaintext =
    ticketPayload.slice(10, 20) + "Don'tMessWithMMS" + signature.slice(2, 10);
  const data = Buffer.from(plaintext, "utf16le");
  const sha1 = crypto.createHash("sha1").update(data).digest();
  const checksum = sha1.slice(2, 10).toString("hex").toUpperCase();
  return checksum;
}

export async function UpdateCosmetics() {
  console.log("Updating cosmetics...");
  const CosApiUrl = "https://fortnite-api.com/v2/cosmetics/br";
  const file_path = path.join(process.cwd(), "cosmetics.json");

  axios
    .get(CosApiUrl)
    .then((response) => {
      const jsonCos = response.data;
      fs.writeFileSync(file_path, JSON.stringify(jsonCos.data, null, 2));
      console.log("Done updating cosmetics!");
    })
    .catch((error) => {
      console.error("An error occurred while updating cosmetics:", error);
    });

  let cosmetics = [];
  fs.readFile("cosmetics.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading cosmetics.json:", err);
      return;
    }
    try {
      cosmetics = JSON.parse(data);
      console.log("Cosmetics data loaded successfully.");
    } catch (error) {
      console.error("Error parsing cosmetics.json:", error);
    }
  });
}
