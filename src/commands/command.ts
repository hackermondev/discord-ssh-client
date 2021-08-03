import { CommandOptions, ServerData, AuthData } from '../structures';

import { MessageBuilder, Client, SSHClient } from '../core';
import config from '../config/config';

import utils from '../core/utils';
import { Message } from 'discord.js';
import { Channel } from 'ssh2';

const commandCallback = async (
  client: Client,
  message: Message,
  args: string[]
) => {
  var server: string | undefined = args.shift();
  var authKey: string | undefined = args.shift();
  var commandToBeExecuted: string = args.join(' ');

  if (!server) {
    var error = new MessageBuilder(message)
      .setTitle(`SSH Command Error`)
      .setDescription(
        `You need to provide a valid server ip and/or port. Please run the command again. Example: \`${config.botConfig.prefix}sshping 69.69.69.69:22\` `
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  if (!authKey) {
    var error = new MessageBuilder(message)
      .setTitle(`SSH Command Error`)
      .setDescription(
        `You need to provide a valid auth key. Please run the command again. Example: \`${config.botConfig.prefix}sshping 69.69.69.69:22 your_auth_key\` `
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  if (commandToBeExecuted == ``) {
    var error = new MessageBuilder(message)
      .setTitle(`SSH Command Error`)
      .setDescription(
        `You need to provide a valid command to be executed. Please run the command again. Example: \`${config.botConfig.prefix}command 69.69.69.69:22 your_auth_key ls\` `
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }

  var serverData: ServerData = utils.parseServerData(server);

  try {
    var auth = await client.db.query(`SELECT * FROM auth WHERE hash=$1`, [
      authKey
    ]);

    if (auth.rowCount == 0) {
      var error = new MessageBuilder(message)
        .setTitle(`Invalid auth key.`)
        .setDescription(
          `You provided an invalid auth key. If you don't have an auth key, generate one with: \`${config.botConfig.prefix}auth <username> <password>\` `
        )
        .setColor(config.colors.error);

      return message.channel.send(error);
    }

    var data: AuthData = auth.rows[0];

    if (data['created_by'] != message.author.id) {
      var error = new MessageBuilder(message)
        .setTitle(`Invalid auth key.`)
        .setDescription(
          `You provided a valid auth key but it isn't yours. Please make sure you are only using keys that you have generated.`
        )
        .setColor(config.colors.error);

      return message.channel.send(error);
    }

    if (data.password) {
      data.password = await client.encryption.decrypt(data.password);
    }

    var messageEmbed = new MessageBuilder(message)
      .setDescription(
        `Attempting to connect to server \`${serverData.ipAddress}:${serverData.port}\` with the provided auth key. This might take a few seconds...`
      )
      .setColor(config.colors.processing);

    var connectingMessage: Message = await message.channel.send(messageEmbed);

    try {
      var c: SSHClient = await utils.connectToSSHAndReturnClient(
        serverData,
        data,
        message
      );

      // console.log(`connected...`)

      var success = new MessageBuilder(message)
        .setTitle(`SSH Connected`)
        .setDescription(
          `We've connected to the ssh server. Running command \`${commandToBeExecuted}\` `
        )
        .setColor(config.colors.success);

      await connectingMessage.edit(success);
      c.exec(
        commandToBeExecuted,
        {
          env: {
            DEBIAN_FRONTEND: 'noninteractive'
          }
        },
        (err: Error | undefined, stream: Channel) => {
          if (err) {
            var error = new MessageBuilder(message)
              .setTitle(`SSH Command Error`)
              .setDescription(
                `An error occured while running the command.\n\n \`${err}\``
              )
              .setColor(config.colors.error);

            return connectingMessage.edit(error);
          }

          var output: string = ``;
          var closed: boolean = false;

          stream.on('data', (data: string) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data: string) => {
            output += data.toString();
          });

          stream.on('close', (code: Number) => {
            closed = true;

            if (output == '') {
              output = `(No data was recieved from the server)`;
            }

            c.end();

            if (code == 1) {
              var error = new MessageBuilder(message)
                .setTitle(`SSH Command Executed - Exit Status Code ${code}`)
                .setDescription(
                  `The ssh command was executed on the server. The status code was ${code}. Output:\n\n \`${output}\` `
                )

                .setColor(config.colors['error']);

              return connectingMessage.edit(error);
            }

            var embed = new MessageBuilder(message)
              .setTitle(`SSH Command Executed - Exit Status Code ${code}`)
              .setDescription(
                `The ssh command was executed on the server. The status code was ${code}. Output:\n \`\`\`${output}\`\`\` `
              )

              .setColor(config.colors['success']);

            connectingMessage.edit(embed);
          });

          setTimeout(() => {
            if (closed == false) {
              output = `The server didn't respond with any text in 15 seconds. The stream was closed.`;

              stream.emit(`close`, 1);
            }
          }, 15000);
        }
      );
    } catch (err) {
      var error = new MessageBuilder(message)
        .setTitle(`SSH Handshake Failed.`)
        .setDescription(
          `The ssh handshake failed. The port is closed or the auth data for the provided auth key is invalid for the server provided. Please create a new auth key with correct creds or change the creds from the server.\n\n \`${err}\` `
        )
        .setColor(config.colors.error);

      return connectingMessage.edit(error);
    }
  } catch (err) {
    console.error(err);

    var error = new MessageBuilder(message)
      .setTitle(`Error`)
      .setDescription(
        `An error occured while fetching the auth key from our database. Please contact the owners for more information.`
      )
      .setColor(config.colors.error);

    return message.channel.send(error);
  }
};

const commandOptions: CommandOptions = {
  name: 'command',
  aliases: ['cmd', 'sshcommand'],
  callback: commandCallback,
  description: `Connect to a SSH session, run a command then exit.`,
  usage: 'command <ip:port> <auth_key> [command]'
};

export default commandOptions;
