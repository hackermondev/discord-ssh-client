import { CommandOptions } from "../structures"

import { MessageBuilder } from "../core"
import config from "../config/config"

import { Message } from "discord.js"
import { Client } from "../core"


const commandCallback = async (client: Client, message: Message, args: string[]) => {
    var embed: MessageBuilder = new MessageBuilder(message)
        .setTitle(`Bot Ping`)
        .setColor(config.colors.success)

        .addField(`WS Ping`, `${client.ws.ping}ms`, true)
        .addField(`Message Ping`, `Calculating...`, true)
        .addField(`Database Ping`, `Unknown`, true)

    var startTime: number = new Date().getTime()

    var m: Message = await message.channel.send(embed)
    var endTime: number = new Date().getTime()

    embed = new MessageBuilder(message)
        .setTitle(`Bot Ping`)
        .setColor(config.colors.success)

        .addField(`WS Ping`, `${client.ws.ping}ms`, true)
        .addField(`Message Ping`, `${endTime - startTime}ms`, true)
        .addField(`Database Ping`, `Unknown`, true)
    
    m.edit(embed)
}

const commandOptions: CommandOptions = {
    name: "ping",
    aliases: ["p"],
    callback: commandCallback,
    description: `See the bot ping! Use this command if the bot is not responding to testing the bot ping.`
}

export default commandOptions