const db = require('../database/connection');

class AudioService {

    searchAudio(audios, criteria) {

        let audioResults = audios && audios.length
            ? audios.filter(audio => {
            
                return audio.title.toUpperCase().includes(criteria.toUpperCase())
                    ? true : false;
        }) : []    

        return audioResults && audioResults.length
            ? audioResults.map((audio) => ({
                id: audio.telegram_unique_id,
                type: "document",
                document_file_id: audio.telegram_id,
                title: audio.title
            })) : []  
    }

    async registerAudio(message, audio){
    
        try {

            audio.telegram_id = message.audio.file_id;
            audio.telegram_unique_id = message.audio.file_unique_id;

        } catch (err) {
            throw err;
        }
    }

    async persistAudio(audio) {

        try {        

            await db('audios')
                .insert({
                    telegram_id: audio.telegram_id, 
                    telegram_unique_id: audio.telegram_unique_id, 
                    title: audio.title
                });

            return true;
        } catch (err) {        
            throw err;            
        }
    }

}

module.exports = AudioService 