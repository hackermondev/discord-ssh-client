import { Client, DatabaseClient, Logger } from "./core"
import { Message, RateLimitData } from "discord.js"

import { CommandOptions } from "./structures"

import path from "path"
import config from "./config/config"

import disbut from "discord-buttons"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config()

const logger = new Logger()

// process.on('uncaughtException', (err) => {
//     logger.error(err)
//     process.exit(1)
// })

logger.debug(`started program`)

const database = new DatabaseClient()
const bot: Client = new Client({
    prefix: `?`,
    token: process.env.TOKEN || config.botConfig.token,

    // stay for 5 hours
    messageCacheLifetime: 18000,
    messageSweepInterval: 10800,

    disableMentions: `all`,
    retryLimit: Infinity,
    encryptionKey: config.botConfig.encryptionKey,
    databaseClient: database
})

disbut(bot)
database.on('connect', ()=>{
    logger.debug(`connected to postgresql database.`)
})

bot.on('rateLimit', (data: RateLimitData)=>{
    logger.debug(`rate limit on ${data.method} ${data.path}, timeout is ${data.timeout}`)
})

bot.on('ready', async () => {
    bot.user?.setActivity(config.botConfig.activity.text, { type: config.botConfig.activity.type })
    bot.user?.setStatus(config.botConfig.activity.status)

    logger.debug(`got ready event, loading commands...`)

    let commands: string[] = fs.readdirSync(path.join(__dirname, `commands`))

    commands.forEach((command: string) => {
        var cmd: CommandOptions = require(`./commands/${command}`).default

        if(!cmd){
            return logger.error(`could not load command ${command}`)
        }

        bot.commands.set(cmd.name, cmd)

        if(cmd.aliases){
            cmd.aliases.forEach((alias: string)=>{
                bot.commands.set(alias, cmd)
            })
        }

        logger.debug(`loaded command ${cmd.name}`)
    })

    logger.debug(`loaded commands.`)

    logger.debug(`testing postgresql`)

    await database.createRequiredTables()

    var dateQuery = await database.runQuery(`SELECT NOW() as now`)
    var date: Date = dateQuery[0].now
    
    logger.debug(`postgresql date: ${date.toString()}`)
})

bot.on('message', (message: Message)=>{
    if(message.author.bot) return
    if(!message.content.startsWith(config.botConfig.prefix)) return

    let args: string[] = message.content.slice(config.botConfig.prefix.length).trim().split(" ")
    let commandName: string | undefined = args.shift()?.toLowerCase()
    var command: CommandOptions | any = bot.commands.get(commandName)

    if(!command) return
    if(command.isPrivate && !config.botConfig.owners.includes(message.author.id)) return

    logger.debug(`${message.author.tag} running command ${command.name}`)

    command.callback(bot, message, args)
})

bot.on('debug', (debugText: string) => {
    logger.debug(debugText)
})

bot.run(() => {
    logger.log(`started bot on ${bot.user?.tag}`)
})

// console.log(bot)