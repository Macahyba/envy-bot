const db = require('../database/connection');

class MediaService {
   
    async deleteMedia(media) {

        try {        
            await db(media.type)
                .where('telegram_unique_id', media.file_unique_id)
                .del();
        } catch (err) {        
            throw err;           
        }  
    }
}

module.exports = MediaService