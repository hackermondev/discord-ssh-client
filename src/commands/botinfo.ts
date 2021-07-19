import { CommandOptions, ServerData, AuthData } from "../structures"

import config from "../config/config"
import { MessageBuilder, Client, SSHClient } from "../core"

import ms from "ms"
import { Message, Collection } from "discord.js"
import { MessageActionRow, MessageButton } from "discord-buttons"

const commandCallback = async (client: Client, message: Message, args: string[]) => {
    let topggLink = new MessageButton()
        .setStyle(`url`)
        .setURL(`https://top.gg/bot/${client.user?.id}/vote`)
        .setLabel(`Vote on Top.gg`)

    let githubLink = new MessageButton()
        .setStyle(`url`)
        .setURL(`https://github.com/hackermondev/discord-ssh-bot`)
        .setLabel(`GitHub`)

    let buttons = new MessageActionRow()
        .addComponent(topggLink)
        .addComponent(githubLink)

    const embed = new MessageBuilder(message)
        .setTitle(`Bot Information - ${client.user?.tag}`)
        .addField(`Server Count`, client.guilds.cache.size, true)
        .addField(`Cached Users Count`, client.users.cache.size, true)
        .addField(`Uptime`, ms(client.uptime || 0, { long: true }))

        .setColor(config.colors.success)
        .setThumbnail(client.user?.displayAvatarURL() || '')

    // console.log(buttons)
    message.channel.send(embed, buttons)
}

const commandOptions: CommandOptions = {
    name: "botinfo",
    aliases: ["stats"],
    callback: commandCallback,
    description: `See some information and stats about the bot!`
}

export default commandOptions