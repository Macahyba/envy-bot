const db = require('../database/connection');

class VoiceService {

    searchVoice(voices, criteria) {

        let voiceResults = voices && voices.length
            ? voices.filter(voice => {
            
                return voice.title.toUpperCase().includes(criteria.toUpperCase())
                    ? true : false;
        }) : []   
        
        return voiceResults && voiceResults.length
            ? voiceResults.map((voice) => ({
                id: voice.telegram_unique_id,
                type: "voice",
                voice_file_id: voice.telegram_id,
                title: voice.title
            })) : []  
    }

    async registerVoice(message, voice){
    
        try {

            voice.telegram_id = message.voice.file_id;
            voice.telegram_unique_id = message.voice.file_unique_id;

        } catch (err) {
            throw err;
        }
    }

    async persistVoice(voice) {

        try {        

            await db('voices')
                .insert({
                    telegram_id: voice.telegram_id, 
                    telegram_unique_id: voice.telegram_unique_id, 
                    title: voice.title
                });

            return true;
        } catch (err) {        
            throw err;            
        }
    }

}

module.exports = VoiceService 