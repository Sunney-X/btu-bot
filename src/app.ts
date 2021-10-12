import * as dotenv from "dotenv";
import { Client, MessageReaction, TextChannel, User } from "discord.js";
import {
  BTU_GUILD_ID,
  GAMING_ROLES_CHANNEL_ID,
  MEMES_CHANNEL_ID,
  ROLES_CHANNEL_ID,
} from "./consts";
import {
  handleMemes,
  handleMessageCreate,
  isMeme,
  processMessageReaction,
} from "./utils";
import SocialCreditSystem from "./scs";

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

  const scs = new SocialCreditSystem();

  guild.members.fetch().then((members) => {
    members.forEach(async (member) => {
      if (member.user.bot) return;

      const acc = await scs.getAccount(member.id);

      if (!acc) {
        scs.addAccount({
          id: member.user.id,
          username: `${member.user.username}#${member.user.discriminator}`,
          credit: 100,
        });
      }
    });
  });
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

  handleMessageCreate(message);
});

client.login(process.env.DISCORD_TOKEN);
