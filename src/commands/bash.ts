import { CommandOptions, ServerData, AuthData } from '../structures';

import { MessageBuilder, Client, SSHClient, PastebinAPI } from '../core';
import config from '../config/config';

import utils from '../core/utils';
import { Message, MessageCollector } from 'discord.js';
import { Channel } from 'ssh2';

const commandCallback = async (
  client: Client,
  message: Message,
  args: string[]
) => {
  var server: string | undefined = args[0];
  var authKey: string | undefined = args[1];

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

    if (data.password) {
      data.password = await client.encryption.decrypt(data.password);
    }

    if (data['created_by'] != message.author.id) {
      var error = new MessageBuilder(message)
        .setTitle(`Invalid auth key.`)
        .setDescription(
          `You provided a valid auth key but it isn't yours. Please make sure you are only using keys that you have generated.`
        )
        .setColor(config.colors.error);

      return message.channel.send(error);
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
          `We've connected to the ssh server. Starting terminal...`
        )
        .setColor(config.colors.success);

      await connectingMessage.edit(success);

      c.shell((err: Error | undefined, stream: Channel) => {
        if (err) {
          c.end();

          var error = new MessageBuilder(message)
            .setTitle(`SSH Command Error`)
            .setDescription(
              `An error occured while starting the shell.\n\n \`${err}\``
            )
            .setColor(config.colors.error);

          return connectingMessage.edit(error);
        }

        var output: string = ``;
        var lastContent: string = ``;
        var lastSentContent: number = new Date().getTime();

        stream.on('data', (chunk: string) => {
          output += chunk;
        });

        stream.stderr.on('data', (chunk: string) => {
          output += chunk;
        });

        stream.on('end', () => {
          stream.emit('close');
        });

        stream.on('close', async () => {
          c.end();

          // console.log(`close`)
          clearInterval(interval);

          output += `\n\nStream was closed...`;

          var paste = new PastebinAPI(config.botConfig.pastebinApiKey);
          var pasteURL: string = await paste.createPaste(output);

          var embed = new MessageBuilder(message)
            .setTitle(`SSH Shell Closed`)
            .setColor(config.colors.success)
            .setDescription(
              `SSH shell has been closed. The text below is the log of the terminal\n\n \`\`\`${utils.parseTerminalOutput(
                output
              )}\`\`\` \n\n[Pastebin](${pasteURL})`
            );

          connectingMessage.edit(embed);
        });

        var interval: any = setInterval(() => {
          var sinceTime = new Date().getTime() - lastSentContent;

          if (sinceTime > 300000) {
            output += `\n\nStopping terminal, inactivity detected...`;
            stream.emit('close');

            return;
          }

          if (lastContent == output) {
            return;
          }

          var embed = new MessageBuilder(message)
            .setTitle(`SSH Shell`)
            .setColor(config.colors.fancy)
            .setDescription(
              `SSH shell is current ongoing. Type something in the chat to see it entered in the terminal or enter \`cancel\` to exit the terminal! The output below will get updated every few seconds with updated from the shell.\n\n \`\`\`${utils.parseTerminalOutput(
                output
              )}\`\`\` `
            );

          lastContent = output;
          connectingMessage.edit(embed);
        }, 100);

        const collector: MessageCollector =
          message.channel.createMessageCollector((m) => {
            return m.author.id == message.author.id;
          }, {});

        collector.on('collect', async (m: Message) => {
          lastSentContent = new Date().getTime();

          if (m.content == `cancel`) {
            output += `\n\nStopping terminal, requested by discord user...`;

            stream.emit('close');
            collector.stop();
            return;
          }

          stream.write(m.content + `\n`);

          if (m.deletable) {
            m.delete();
          }
        });
      });
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
  name: 'bash',
  aliases: ['terminal', 'tty'],
  callback: commandCallback,
  description: `Connect to a SSH session, and start a bash session.`,
  usage: `bash <ip:port> <auth_key>`
};

export default commandOptions;
