import { CommandOptions, ServerData, AuthData, GuildData } from "../structures"

import config from "../config/config"
import { MessageBuilder, Client, SSHClient } from "../core"

import { Message, Collection } from "discord.js"

const commandCallback = async (client: Client, message: Message, args: string[]) => {
    if (!message.guild) {
        var error = new MessageBuilder(message)
            .setTitle(`You cannot run this command.`)
            .setDescription(`You need to be in a server to run this command.`)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }

    if (!message.member?.hasPermission('MANAGE_GUILD')) {
        var error = new MessageBuilder(message)
            .setTitle(`You don't have permission to run this.`)
            .setDescription(`You need the \`MANAGE_GUILD\` permission to run this command.`)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }

    var name: string = args[0]

    var guildData: GuildData | undefined = await client.db.getGuildData(message.guild.id)

    if (!guildData) {
        // guild data should load on message handler
        return message.channel.send(`internal server error`)
    }

    if (!name) {
        var blacklistedUsers: string = ``

        if (guildData.guild_data.blacklistedUsers.length > 0) {
            blacklistedUsers = guildData.guild_data.blacklistedUsers.join(',')
        } else {
            blacklistedUsers = `None`
        }

        var disabledCommands: string = ``

        if (guildData.guild_data.disabledCommands.length > 0) {
            disabledCommands = guildData.guild_data.disabledCommands.join(',')
        } else {
            disabledCommands = `None`
        }

        var embed = new MessageBuilder(message)
            .setTitle(`Guild data for "${message.guild.name}"`)
            .addField(`Prefix`, `\`${guildData.guild_data.prefix}\``, true)
            .addField(`Blacklisted Users`, `\`${blacklistedUsers}\``, true)
            .addField(`Disabled Commands`, `\`${disabledCommands}\``, true)
            .setColor(config.colors.fancy)
            .setDescription(`Change a value with \`${guildData.guild_data.prefix}guildsettings <name> <value>\` `)

        return message.channel.send(embed)
    }

    if (name == 'prefix') {
        var newPrefix: string = args[1]

        if (!newPrefix) {
            var error = new MessageBuilder(message)
                .setTitle(`You need to provide the new prefix to change to.`)
                .setDescription(`You need to specify what prefix it should be changed to.`)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }

        try {
            guildData.guild_data.prefix = newPrefix

            await client.db.query(`UPDATE guilds SET guild_data=$1 WHERE guild_id=$2`, [guildData.guild_data, message.guild.id])

            var success = new MessageBuilder(message)
                .setTitle(`Updated guild data.`)
                .setDescription(`Change the prefix of the guild to \`${newPrefix}\`!`)
                .setColor(config.colors.success)

            message.channel.send(success)
        }
        catch (err) {
            console.error(err)

            var error = new MessageBuilder(message)
                .setTitle(`Internal server error.`)
                .setDescription(`An error occured while updating your data on our database. Please contact the owners of the bot for more information.`)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }
    }
}

const commandOptions: CommandOptions = {
    name: "guildsettings",
    aliases: ["settings"],
    callback: commandCallback,
    description: `Change certain settings of the bot for your guild.`
}

export default commandOptions