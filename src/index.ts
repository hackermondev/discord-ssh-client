import { Client, DatabaseClient, Logger } from './core';
import { Message, RateLimitData } from 'discord.js';

import { CommandOptions, GuildData } from './structures';

import path from 'path';
import config from './config/config';

import disbut from 'discord-buttons';
import dotenv from 'dotenv';
import fs from 'fs';

process.on('uncaughtException', (err) => {
  logger.error(err);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`unhandled rejection: ${reason}`);
});

dotenv.config();

const logger = new Logger();

// process.on('uncaughtException', (err) => {
//     logger.error(err)
//     process.exit(1)
// })

logger.debug(`started program`);

const database = new DatabaseClient();
const bot: Client = new Client({
  prefix: `?`,
  token: process.env.TOKEN || config.botConfig.token,

  // stay for 5 hours
  messageCacheLifetime: 18000,
  messageSweepInterval: 10800,

  disableMentions: `all`,
  retryLimit: Infinity,
  encryptionKey: config.botConfig.encryptionKey,
  databaseClient: database,
  topggKey: config.botConfig.topggKey
});

disbut(bot);
database.on('connect', () => {
  logger.debug(`connected to postgresql database.`);
});

bot.on('rateLimit', (data: RateLimitData) => {
  logger.debug(
    `rate limit on ${data.method} ${data.path}, timeout is ${data.timeout}`
  );
});

bot.on('ready', async () => {
  console.log(
    `${config.botConfig.activity.type} ${config.botConfig.activity.text}`
  );

  bot.user?.setPresence({
    activity: {
      type: config.botConfig.activity.type,
      name: config.botConfig.activity.text
    },
    status: config.botConfig.activity.status
  });

  // bot.user?.setActivity(config.botConfig.activity.text, { type: config.botConfig.activity.type })
  // bot.user?.setStatus(config.botConfig.activity.status)

  logger.debug(`got ready event, loading commands...`);

  let commands: string[] = fs.readdirSync(path.join(__dirname, `commands`));

  commands.forEach((command: string) => {
    var cmd: CommandOptions = require(`./commands/${command}`).default;

    if (!cmd) {
      return logger.error(`could not load command ${command}`);
    }

    bot.commands.set(cmd.name, cmd);

    if (cmd.aliases) {
      cmd.aliases.forEach((alias: string) => {
        bot.commands.set(alias, cmd);
      });
    }

    logger.debug(`loaded command ${cmd.name}`);
  });

  logger.debug(`loaded commands.`);

  logger.debug(`testing postgresql`);

  await database.createRequiredTables();

  var dateQuery = await database.runQuery(`SELECT NOW() as now`);
  var date: Date = dateQuery[0].now;

  logger.debug(`postgresql date: ${date.toString()}`);
});

bot.on('message', async (message: Message) => {
  if (message.author.bot) return;

  var prefix: string = '$';
  var guildData: GuildData | undefined = undefined;

  if (message.guild) {
    guildData = await bot.db.getGuildData(message.guild.id);

    if (guildData == undefined) {
      // create guild data
      guildData = {
        guild_id: message.guild.id,
        guild_data: {
          prefix: '$',
          ownerID: message.guild.ownerID,
          blacklistedUsers: [],
          disabledCommands: []
        },
        created_at: new Date()
      };

      await bot.db.query(
        `INSERT INTO guilds (guild_id, guild_data, created_at) VALUES ($1, $2, $3)`,
        [guildData.guild_id, guildData.guild_data, guildData.created_at]
      );
    }

    // if(guildData.guild_is_blacklisted) return message.guild.leave()
    // if(guildData.guild_is_blacklisted) return

    prefix = guildData.guild_data.prefix;

    // message.guildData = guildData
  }

  if (!message.content.startsWith(prefix)) return;

  let args: string[] = message.content
    .slice(config.botConfig.prefix.length)
    .trim()
    .split(' ');
  let commandName: string | undefined = args.shift()?.toLowerCase();
  var command: CommandOptions | any = bot.commands.get(commandName);

  if (!command) return;
  if (command.isPrivate && !config.botConfig.owners.includes(message.author.id))
    return;

  if (
    message.guild &&
    guildData?.guild_data.blacklistedUsers.includes(message.author.id)
  )
    return message.react(`❌`);

  if (guildData?.guild_data.disabledCommands.includes(command.name)) {
    return;
  }

  logger.debug(`${message.author.tag} running command ${command.name}`);

  command.callback(bot, message, args);
});

bot.on('debug', (debugText: string) => {
  logger.debug(debugText);
});

bot.run(async () => {
  logger.log(`started bot on ${bot.user?.tag}`);

  if (config.botConfig.topggKey) {
    logger.debug(`posting updated stats to top.gg`);

    var ok: boolean = await bot.postTopggStats();

    if (ok == false) {
      return logger.error(`could not post bot stats to top.gg`);
    }

    async function update() {
      logger.debug(`updating stats on top.gg`);

      var ok: boolean = await bot.postTopggStats();

      if (ok == false) {
        return logger.error(`could not post bot stats to top.gg`);
      }

      logger.debug(`updated stats on top.gg`);
    }

    bot.on('guildCreate', update);
    bot.on('guildDelete', update);
  }
});

// console.log(bot)
