const { default: Telegraf } = require("telegraf");
let db = require('./database/connection');

class EnvyBot extends Telegraf {
    
    constructor(BOT_TOKEN){
        super(BOT_TOKEN);
        this.MODE;
        this.answer;
        this.mediaToDelete;
        this.photos = [];
        this.audios = [];
        this.voices = [];
        this.media = [];
    }

    async init(){
        this.MODE = "CLEAR";
        this.photos = await this.fetchPhotosFromDB();
        this.audios = await this.fetchAudiosFromDB();
        this.voices = await this.fetchVoicesFromDB();
        this.mediaToDelete = "";
        this.media = this.photos.concat(this.audios).concat(this.voices);
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

    async fetchAudiosFromDB() {
        try {
            return await db.from('audios');

        } catch (err) {
            console.error("Nao consegui acessar o banco!")
            console.error(err);
            return this.audios ? this.audios : [];
        }
    }

    async fetchVoicesFromDB() {
        try {
            return await db.from('voices');

        } catch (err) {
            console.error("Nao consegui acessar o banco!")
            console.error(err);
            return this.voices ? this.voices : [];
        }
    }

    isWorking() {
        return this.MODE === 'CLEAR' ? false : true;
    }
    
    isRegister(){
        return ((this.MODE === "URL") || (this.MODE === "TAG") || (this.MODE.includes("TITLE"))) ? true : false;
    }
    
    isRegisterPhoto() {
        return this.MODE === "URL" ? true : false;
    }
    
    isRegisterTag() {
        return this.MODE === "TAG" ? true : false;
    }

    isRegisterTitleAudio() {
        return this.MODE === "TITLE_AUDIO" ? true : false;
    }
    
    isRegisterTitleVoice() {
        return this.MODE === "TITLE_VOICE" ? true : false;
    }

    isDelete() {
        return (this.MODE === "DELETE") ? true : false;
    }    

    isConfirm() {
        return (this.MODE === "CONFIRM") ? true : false;
    }

    clearAnswer() {
        this.answer = "";
    }

    setAnswer(string) {
        this.answer = string;
    }

    setMode(string) {
        this.MODE = string;
    }

}

module.exports = EnvyBot;