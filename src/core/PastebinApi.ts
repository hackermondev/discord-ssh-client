import fetch from "node-fetch"

class PastebinAPI {
    private token: string | undefined;

    constructor(token: string | undefined){
        this.token = token
    }

    async createPaste(text: string): Promise<string>{
        var date = new Date().toString()

        var res = await fetch(`https://pastebin.com/api/api_post.php`, {
            method: `POST`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: `api_dev_key=${this.token}&api_option=paste&api_paste_code=${encodeURIComponent(text)}&api_paste_private=1&api_paste_name=${encodeURIComponent(date)}&api_paste_format=bash`
        })

        var text = await res.text()

        return text
    }
}

export default PastebinAPI