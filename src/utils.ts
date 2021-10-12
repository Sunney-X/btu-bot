import { Message, MessageReaction, User } from "discord.js";
import { blacklistedMemers, ROLES, WATCHING_MESSAGES } from "./consts";
import SocialCreditSystem from "./scs";

export const isMeme = (message: Message) =>
  message.attachments.size > 0 ||
  message.embeds.length > 0 ||
  message.content.match(/\.(jpe?g|png|gif|webp|bmp|tiff?)$/i) ||
  message.content.includes("tenor.com");

export const processMessageReaction = (
  reaction: MessageReaction,
  user: User,
  action: "add" | "remove"
) => {
  console.log(`${action} reaction from ${user.username}`);

  if (
    !WATCHING_MESSAGES.includes(reaction.message.id) ||
    !reaction.emoji.name
  ) {
    return;
  }

  console.log(reaction.emoji.name);
  const roleId = ROLES.find((r) => r.emoji === reaction.emoji.name)?.id;
  const role = reaction.message.guild?.roles.cache.find((r) => r.id === roleId);

  if (!role) {
    return;
  }

  const member = reaction.message.guild?.members.cache.get(user.id);

  action === "add" ? member?.roles.add(role) : member?.roles.remove(role);
};

export const handleMemes = async (message: Message) => {
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
      time: 60 * 60 * 48 * 1000,
    })
    .then(async (reactions) => {
      if (reactions.size > 4) {
        blacklistedMemers.push(message.author.id);
        await message.channel.send(
          `${message.author} has been blacklisted from sending memes 😔`
        );
      }
    });
};

export const handleMessageCreate = async (message: Message) => {
  const scs = new SocialCreditSystem();
  // scs
  //   .getBalance(message.author.id)
  //   .then((balance) =>
  //     console.log(`${message.author.username} has ${balance}`)
  //   );

  if (message.content.startsWith("!balance")) {
    const balance = await scs.getBalance(message.author.id);
    await message.reply(`You have ${balance} Social Credits 💹`);
    await scs.modifyBalance(message.author.id, -1);
    await message.reply(`You have lost 1 Social Credit 💹 😡👮`);
  }

  if (isMeme(message)) {
    await handleMemes(message);
    await scs.modifyBalance(message.author.id, 10);
    message.reply(
      `<@${message.author.id}>  you have been awarded 10 Social Credit for sending a meme 😎💹`
    );
  }
};
