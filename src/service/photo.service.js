const db = require('../database/connection');

class PhotoService {

    searchPhoto(photos, criteria) {

        let photoResults = photos && photos.length
            ? photos.filter(photo => {
            
                return photo.tags.some(tag => tag.toUpperCase().includes(criteria.toUpperCase()))
                    ? true : false;
        }) : []    

        return photoResults && photoResults.length
            ? photoResults.map((photo) => ({
                id: photo.telegram_unique_id,
                type: "photo",
                photo_file_id: photo.telegram_id,
                thumb_url: photo.telegram_id
            })) : []
    }

    async registerPhoto(message, photo){
    
        try {

            photo.telegram_id = message.photo[0].file_id;
            photo.telegram_unique_id = message.photo[0].file_unique_id;

        } catch (err) {
            throw err;
        }
    }

    handleTags(txt){
        const preTags = txt.toUpperCase().split(',');
        const midTags = preTags.map(tag => tag.trim());
        return midTags.toString();
    }

    async persistPhoto(photo) {

        try {        

            await db('photos')
                .insert({
                    telegram_id: photo.telegram_id, 
                    telegram_unique_id: photo.telegram_unique_id, 
                    tags: photo.tags
                });

            return true;
        } catch (err) {        
            throw err;            
        }
    }

}

module.exports = PhotoService 