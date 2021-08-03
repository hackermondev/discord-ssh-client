import { CommandOptions } from '../structures';

import { MessageBuilder } from '../core';
import config from '../config/config';

import { Message } from 'discord.js';
import { Client } from '../core';

interface AuthData {
  hash: string;
  type: string;
  username: string;
  created_by: string;

  password?: string;
}

const commandCallback = async (
  client: Client,
  message: Message,
  args: string[]
) => {
  var username: string = args[0];
  var password: string | undefined = args[1];

  if (!username) {
    var error = new MessageBuilder(message)
      .setTitle(`Error`)
      .setDescription(
        `You need to include the username that the auth key will use when connecting to your server.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  var data: AuthData = {
    hash:
      Math.random().toString(36).substring(7) +
      Math.random().toString(36).substring(7) +
      Math.random().toString(36).substring(7),
    type: 'password',
    username: username,
    created_by: message.author.id
  };

  if (password != undefined) {
    data.type = 'password';

    data.password = await client.encryption.encrypt(password);
  } else {
    // TODO(hackermon) support ssh keys as auth types

    data.type = 'none';
    data.password = undefined;
  }

  try {
    if (data.type == `none`) {
      await client.db.query(
        `INSERT INTO auth (username, created_at, hash, created_by) VALUES ($1, $2, $3, $4);`,
        [data.username, new Date(), data.hash, message.author.id]
      );
    } else if (data.type == 'password') {
      await client.db.query(
        `INSERT INTO auth (username, created_at, hash, created_by, password) VALUES ($1, $2, $3, $4, $5);`,
        [data.username, new Date(), data.hash, message.author.id, data.password]
      );
    }

    var keyText = ``;

    if (message.channel.type == 'dm') {
      keyText = `The auth key is :key: \`${data.hash}\`. Remember to keep this safe and not send this to anyone`;
    } else {
      message.author.send(
        `:key: Your auth key is \`${data.hash}\`! Remember to keep this safe and not send this to anyone.`
      );

      keyText = `The key was sent to your DM!`;
    }

    var embed = new MessageBuilder(message)
      .setTitle(`🔑 Auth was created!`)
      .setDescription(
        `Your auth key was generated. ${keyText} Connect to your server using \`${config.botConfig.prefix}connect <ip> <auth-key>\` `
      )
      .setColor(config.colors.success);

    message.channel.send(embed);
  } catch (err) {
    console.error(err);

    var error = new MessageBuilder(message)
      .setTitle(`Error`)
      .setDescription(
        `An error occured while adding the auth key to our database. Please contact the owners for more information.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }
};

const commandOptions: CommandOptions = {
  name: 'auth',
  aliases: ['login'],
  callback: commandCallback,
  description: `Create a new auth key to use when connecting to your server.`,
  usage: `auth <username> <password>`
};

export default commandOptions;
