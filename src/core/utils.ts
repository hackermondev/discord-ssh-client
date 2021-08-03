import { Collection, Message } from 'discord.js';
import { MessageBuilder, SSHClient } from '.';
import config from '../config/config';
import { AuthData, ServerData } from '../structures';

function parseTerminalOutput(output: string): string {
  output = output
    .split('[01;34m')
    .join('')
    .split('[0m')
    .join('')
    .split('[01;32m')
    .join('')
    .split('[33m')
    .join('')
    .split('[39m')
    .join('');

  if (output.length > 3000) {
    output = `...\n${output.slice(-3000)}`;
  }

  return output;
}

function connectToSSHAndReturnClient(
  hostData: ServerData,
  auth: AuthData,
  message: Message
): Promise<SSHClient> {
  return new Promise(async (resolve, reject) => {
    var c: SSHClient = new SSHClient();

    await c.connect({
      host: hostData.ipAddress,
      port: parseInt(hostData.port.toString()),
      username: auth.username,
      password: auth.password,
      readyTimeout: 5000
    });

    try {
      var success = await new Promise((resolve, reject) => {
        c.once('ready', resolve);
        c.on('error', (err: Error) => {
          c.end();

          reject(err);
        });
      });

      var changePassword: boolean = false;

      c.once(`change password`, async (prompt: string, done: Function) => {
        changePassword = true;

        var embed = new MessageBuilder(message)
          .setTitle(`Password Change Requested`)
          .setDescription(
            `The server requested that will asked you to change your password. Please change the new password in this DM, otherwise say \`cancel\`.\n\nPrompt: \`${prompt}\` `
          )

          .setColor(config.colors.processing)
          .setFooter(`You have 5 minutes to answer.`);

        var m: Message = await message.author.send(embed);

        var passwordCollector: Collection<string, Message> =
          await m.channel.awaitMessages(
            () => {
              return true;
            },
            {
              max: 1,
              time: 300000
            }
          );

        var password: Message | undefined = passwordCollector.first();

        if (!password || password.content.toLowerCase() == `cancel`) {
          c.end();
          reject(
            new Error(
              `Password change was canceled or user didn't respond with password.`
            )
          );

          return message.author.send(
            `Password change was canceled or user didn't respond with password. Closing server.`
          );
        }

        done(password.content);
        resolve(c);
      });

      setTimeout(() => {
        if (changePassword == false) {
          resolve(c);
        }
      }, 1000);

      // resolve(c)
    } catch (err) {
      reject(err);
    }
  });
}

// parser server ip address (0.0.0.0:99 -> {ip: 0.0.0.0, port: 99}, 0.0.0.0 -> {ip: 0.0.0.0, port: 22})

function parseServerData(server: string): ServerData {
  var textData = server.split(':');
  var data: ServerData = {
    ipAddress: textData[0],
    port: textData[1] || 22
  };

  return data;
}

export default {
  parseServerData,
  connectToSSHAndReturnClient,
  parseTerminalOutput
};
