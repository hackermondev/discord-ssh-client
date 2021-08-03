import { CommandOptions, ServerData, AuthData } from '../structures';

import config from '../config/config';
import { MessageBuilder, Client, SSHClient } from '../core';

import { Message, Collection } from 'discord.js';

const commandCallback = async (
  client: Client,
  message: Message,
  args: string[]
) => {
  var embed = new MessageBuilder(message)
    .setTitle(`Welcome to ${client.user?.tag}`)
    .setDescription(
      `Welcome, first thank for you using this bot! This discord bot is a bot that allows you to ssh into your servers from Discord. You create this things called **auth keys :key:** with the command \`${config.botConfig.prefix}auth <username> <password>\` and change the username and password with the username and password of your SSH server. This will then give you a key you will use when connecting to your server. If your server IP address is \`69.69.69.69\` and the ssh server is on port 22, then you can test your auth keys with \`${config.botConfig.prefix}sshping 69.69.69.69:22 <auth_key>\` and if the credentials are correct for that server you get a message saying so. But pinging your SSH server doesn't let you do anything! To run a command on the SSH server, run: \`${config.botConfig.prefix}command 69.69.69.69:22 <auth_key> <command>\` (remember to change it to your server ip and your auth key) and then the command your specify will be run on your server and you will get the output! To start a terminal, use the \`${config.botConfig.prefix}bash <server_ip:port> <auth_key>\` command! \n\nYour passwords are stored encrypted in our database so you can be sure they cannot be leaked.`
    )

    .setColor(config.colors.success);

  message.channel.send(embed);
};

const commandOptions: CommandOptions = {
  name: 'guide',
  aliases: ['info'],
  callback: commandCallback,
  description: `See information about the bot and how to use it.`
};

export default commandOptions;
