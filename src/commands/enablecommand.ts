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

  var command: string | undefined = args[0];
  var cmd: any = client.commands.get(command);

  var guildSettings = await client.db.getGuildData(message.guild.id);

  if (!command || !cmd) {
    var error = new MessageBuilder(message)
      .setTitle(`Invalid command.`)
      .setDescription(`You need to provide a valid command to enable.`)
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  if (!guildSettings?.guild_data.disabledCommands.includes(cmd.name)) {
    var error = new MessageBuilder(message)
      .setTitle(`This command is not disabled.`)
      .setDescription(
        `This command is not disabled. You cannot enable a command that is already enabled.`
      )
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

  await Promise.all(
    guildSettings.guild_data.disabledCommands.map((disabled, index) => {
      if (disabled == cmd.name) {
        guildSettings?.guild_data.disabledCommands.splice(index, 1);
      }
    })
  );

  try {
    await client.db.query(`UPDATE guilds SET guild_data=$1 WHERE guild_id=$2`, [
      guildSettings.guild_data,
      message.guild.id
    ]);

    var embed = new MessageBuilder(message)
      .setTitle(`Command was enabled.`)
      .setDescription(`The \`${cmd.name}\`command was successfully enabled.`)

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
  name: 'enablecommand',
  aliases: ['enable', 'enablecmd'],
  callback: commandCallback,
  description: `Enable a command on the bot.`,
  usage: `enablecommad <command>`
};

export default commandOptions;
