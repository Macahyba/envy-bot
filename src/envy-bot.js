const { default: Telegraf } = require("telegraf");
let db = require('./database/connection');

class EnvyBot extends Telegraf {
    
    constructor(BOT_TOKEN){
        super(BOT_TOKEN);
        this.MODE;
        this.answer;
        this.photos;
    }

    async init(){
        this.MODE = "CLEAR";
        this.photos = await this.fetchPhotosFromDB();
    }

    async fetchPhotosFromDB() {
        try {
            const tempPhotos = await db.from('photos');

            tempPhotos.forEach( temp => {
                const newTags = temp.tags.split(',')
                temp.tags = newTags;                
            })

            return tempPhotos;
        } catch (err) {
            console.error("Nao consegui acessar o banco!")
            console.error(err);
            return this.photos ? this.photos : [];
        }
    }

}

module.exports = EnvyBot;