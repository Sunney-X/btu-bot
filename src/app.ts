import * as dotenv from "dotenv";
import {
  Client,
  Message,
  MessageReaction,
  ReactionEmoji,
  TextChannel,
  User,
} from "discord.js";
import {
  blacklistedMemers,
  BTU_GUILD_ID,
  MEMES_CHANNEL_ID,
  MESSAGES,
  ROLES,
  ROLES_CHANNEL_ID,
} from "./consts";

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

client.on("ready", () => {
  console.log(`BTU bot is on ✅`);

  client.user?.setActivity("BTU", { type: "WATCHING" });

  client.guilds.fetch(BTU_GUILD_ID).then((guild) =>
    guild.channels.fetch(ROLES_CHANNEL_ID).then((channel) => {
      (channel as TextChannel).messages.fetch(MESSAGES.COURSES);
      (channel as TextChannel).messages.fetch(MESSAGES.FACULTIES);
    })
  );
});

const processMessageReaction = (
  reaction: MessageReaction,
  user: User,
  action: "add" | "remove"
) => {
  if (
    ![MESSAGES.COURSES, MESSAGES.FACULTIES].includes(reaction.message.id) ||
    !reaction.emoji.name
  ) {
    return;
  }

  const roleId = ROLES.find((r) => r.emoji === reaction.emoji.name)?.id;
  const role = reaction.message.guild?.roles.cache.find((r) => r.id === roleId);

  if (!role) {
    return;
  }

  const member = reaction.message.guild?.members.cache.get(user.id);

  action === "add" ? member?.roles.add(role) : member?.roles.remove(role);
};

client.on("messageReactionAdd", (reaction, user) =>
  processMessageReaction(reaction as MessageReaction, user as User, "add")
);

client.on("messageReactionRemove", (reaction, user) =>
  processMessageReaction(reaction as MessageReaction, user as User, "remove")
);

const isMeme = (message: Message) =>
  message.attachments.size > 0 ||
  message.embeds.length > 0 ||
  message.content.match(/\.(jpe?g|png|gif|webp|bmp|tiff?)$/i);

client.on("messageCreate", async (message) => {
  if (message.channelId != MEMES_CHANNEL_ID || !isMeme(message)) {
    return;
  }

  if (blacklistedMemers.includes(message.author.id)) {
    const msg = await message.reply(
      `${message.author} you are blacklisted from this sending memes. 😓`
    );

    setTimeout(() => msg.delete(), 5000);

    await message.delete();
  }

  await message.react("😆");
  await message.react("💩");
  message
    .awaitReactions({
      filter: (reaction) => reaction.emoji.name === "💩",
      max: 5,
      time: 30 * 1000,
    })
    .then(async (reactions) => {
      if (reactions.size > 4) {
        blacklistedMemers.push(message.author.id);
        await message.channel.send(
          `${message.author} has been blacklisted from sending memes 😔`
        );
      }
    });
});

client.login(process.env.DISCORD_TOKEN);
