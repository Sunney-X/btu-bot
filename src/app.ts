import * as dotenv from "dotenv";
import {
  Client,
  GuildChannel,
  MessageReaction,
  MessageSelectMenu,
  TextChannel,
  User,
} from "discord.js";
import {
  BTU_GUILD_ID,
  GAMING_ROLES_CHANNEL_ID,
  MEMES_CHANNEL_ID,
  MESSAGES,
  ROLES_CHANNEL_ID,
  WATCHING_MESSAGES,
} from "./consts";
import { handleMemes, isMeme, processMessageReaction } from "./utils";

dotenv.config();

if (!process.env.DISCORD_TOKEN) {
  console.log("Please provide a Discord token as an environment variable.");
  process.exit(0);
}

const client = new Client({
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
  ],
});

client.on("ready", async () => {
  console.log(`BTU bot is on ✅`);

  client.user?.setActivity("BTU", { type: "WATCHING" });

  const guild = await client.guilds.fetch(BTU_GUILD_ID);
  const rolesChannel = (await guild.channels.fetch(
    ROLES_CHANNEL_ID
  )) as TextChannel;
  const memesChannel = (await guild.channels.fetch(
    MEMES_CHANNEL_ID
  )) as TextChannel;
  const gamingRolesChannel = (await guild.channels.fetch(
    GAMING_ROLES_CHANNEL_ID
  )) as TextChannel;

  (async () => {
    await rolesChannel.messages.fetch();
    await gamingRolesChannel.messages.fetch();
    console.log("Fetched all messages");
  })();
});

client.on("messageReactionAdd", (reaction, user) =>
  processMessageReaction(reaction as MessageReaction, user as User, "add")
);

client.on("messageReactionRemove", (reaction, user) =>
  processMessageReaction(reaction as MessageReaction, user as User, "remove")
);

client.on("messageCreate", async (message) => {
  if (message.channelId === MEMES_CHANNEL_ID && isMeme(message))
    handleMemes(message);
});

client.login(process.env.DISCORD_TOKEN);
