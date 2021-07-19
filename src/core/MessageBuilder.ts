import { MessageEmbed, Message } from "discord.js"


// TODO(hackermon) make this actually do whats its supposed to do
export default class MessageBuilder extends MessageEmbed{
    public text: string;

    constructor(message: Message){
        super() 

        // Automatically set some embed stuff based on the message
        this.setAuthor(message.author.username, message.author.displayAvatarURL())
        this.setTimestamp()
        
        this.text = ``
    }
}