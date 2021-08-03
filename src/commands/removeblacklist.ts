import { CommandOptions, GuildData } from '../structures';

import { MessageBuilder } from '../core';
import config from '../config/config';

import { Message, User } from 'discord.js';
import { Client } from '../core';

const commandCallback = async (
  client: Client,
  message: Message,
  args: string[]
) => {
  if (!message.guild) {
    var error = new MessageBuilder(message)
      .setTitle(`You cannot run this command.`)
      .setDescription(`You need to be in a guild to run this command.`)

      .setColor(config.colors.success);

    return message.channel.send(error);
  }

  if (!message.member?.hasPermission('MANAGE_GUILD')) {
    var error = new MessageBuilder(message)
      .setTitle(`You don't have permission to run this.`)
      .setDescription(
        `You need the \`MANAGE_GUILD\` permission to run this command.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  var user: User | string | undefined = message.mentions.users.first();

  if (!user) {
    user = args[0];
  } else {
    user = user.id;
  }

  if (!user || typeof user != 'string') {
    var error = new MessageBuilder(message)
      .setTitle(`Invalid user.`)
      .setDescription(`You need to provide a valid user to whitelist.`)
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  var guildSettings: GuildData | undefined = await client.db.getGuildData(
    message.guild.id
  );

  if (!guildSettings) {
    // the bot should have already loaded guild settings
    return message.channel.send(`internal server error`);
  }

  if (!guildSettings.guild_data.blacklistedUsers.includes(user)) {
    var error = new MessageBuilder(message)
      .setTitle(`User is not blacklisted.`)
      .setDescription(`This user is not blacklisted from using the bot.`)
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  await Promise.all(
    guildSettings.guild_data.blacklistedUsers.map((u, index) => {
      if (u == user) {
        guildSettings?.guild_data.blacklistedUsers.splice(index, 1);
      }
    })
  );

  try {
    await client.db.query(`UPDATE guilds SET guild_data=$1 WHERE guild_id=$2`, [
      guildSettings.guild_data,
      message.guild.id
    ]);

    var embed = new MessageBuilder(message)
      .setTitle(`User was whitelisted.`)
      .setDescription(
        `<@${user}> was successfully removed from the blacklisted.`
      )

      .setColor(config.colors.success);

    return message.channel.send(embed);
  } catch (err) {
    console.error(err);

    var error = new MessageBuilder(message)
      .setTitle(`Internal server error.`)
      .setDescription(
        `An error occured while updating your data on our database. Please contact the owners of the bot for more information.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }
};

const commandOptions: CommandOptions = {
  name: 'removeblacklist',
  aliases: ['whitelist'],
  callback: commandCallback,
  description: `Remove a user from the blacklist.`,
  usage: `removeblacklist <user>`
};

export default commandOptions;
