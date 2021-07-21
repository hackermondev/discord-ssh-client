import { CommandOptions, ServerData, AuthData, GuildData } from "../structures"

import config from "../config/config"
import { MessageBuilder, Client, SSHClient } from "../core"

import { Message, Collection } from "discord.js"

const commandCallback = async (client: Client, message: Message, args: string[]) => {
    var guildData: GuildData | undefined = undefined

    if(message.guild){
        guildData = await client.db.getGuildData(message.guild.id)
    }
    
    var command: string | undefined = args[0]
    var embed = new MessageBuilder(message)
        .setTitle(`Help Command`)
        .setColor(config.colors.success)

    if(!command){
        var commandExists: any = {}
        var commandsText = ``

        client.commands.each((cmd: any)=>{
            if(commandExists[cmd.name] || cmd.showOnHelpCommand == false){
                return
            }

            commandExists[cmd.name] = true
            commandsText += `\`${cmd.name}\` `
        })
        
        commandsText += `\n\nRun \`${guildData?guildData.guild_data.prefix:config.botConfig.prefix}help <command>\` to learn more information`
        embed.setDescription(commandsText)
    } else {
        var commandInfo: any = client.commands.get(command)

        if(!commandInfo){
            embed.setDescription(`Command was not found.`)
        } else {
            embed.setDescription(`\`${guildData?guildData.guild_data.prefix:config.botConfig.prefix}${commandInfo.usage || commandInfo.name}\` \n${commandInfo.description}\n\nAliases: ${commandInfo.aliases.map((a: string)=>{ return ` \`${a}\` `})}`)
        }
    }

    message.channel.send(embed)
}

const commandOptions: CommandOptions = {
    name: "help",
    aliases: ["h"],
    callback: commandCallback,
    description: `See information about the bot and what commands you can use.`
}

export default commandOptions