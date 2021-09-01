import * as dotenv from "dotenv";
import { Client, MessageReaction, TextChannel, User } from "discord.js";
import { BTU_GUILD_ID, MESSAGES, ROLES, ROLES_CHANNEL_ID } from "./consts";

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

client.login(process.env.DISCORD_TOKEN);
