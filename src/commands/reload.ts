import { CommandOptions } from '../structures';

import { MessageBuilder } from '../core';
import config from '../config/config';

import { Message } from 'discord.js';
import { Client } from '../core';

const commandCallback = async (
  client: Client,
  message: Message,
  args: string[]
) => {
  var cmd: string | undefined = args[0];

  if (cmd == undefined) {
    var error = new MessageBuilder(message)
      .setTitle(`Reload Command Error`)
      .setDescription(
        `You need to provide a valid command to be reloaded. Please run this command again.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  var botCommand: any = client.commands.get(cmd);

  if (!botCommand) {
    var error = new MessageBuilder(message)
      .setTitle(`Reload Command Error`)
      .setDescription(
        `Command \`${cmd}\` was not found. Please run this command again with a valid command.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  delete require.cache[require.resolve(`../commands/${botCommand.name}.js`)];
  botCommand = require(`../commands/${botCommand.name}.js`).default;

  client.commands.set(botCommand.name, botCommand);
  botCommand.aliases.map((alias: string) => {
    client.commands.set(alias, botCommand);
  });

  var embed = new MessageBuilder(message)
    .setTitle(`Reload Command Success`)
    .setDescription(
      `Command \`${cmd}\` was successfully reloaded. You can run this command with the updated code.`
    )
    .setColor(config.colors.success);

  message.channel.send(embed);
};

const commandOptions: CommandOptions = {
  name: 'reload',
  aliases: ['r'],
  callback: commandCallback,
  isPrivate: true,
  showOnHelpCommand: false
};

export default commandOptions;
