require('dotenv/config');

const EnvyBot = require('./envy-bot')
const bot = new EnvyBot(process.env.BOT_TOKEN);

const MediaService = require('./service/media.service');
const PhotoService = require('./service/photo.service');
const AudioService = require('./service/audio.service');
const VoiceService = require('./service/voice.service');

const mediaService = new MediaService();
const photoService = new PhotoService();
const audioService = new AudioService();
const voiceService = new VoiceService();

const PhotoModel = require('./model/photo.model');
const AudioModel = require('./model/audio.model');
const VoiceModel = require('./model/voice.model');

let photo = new PhotoModel();
let audio = new AudioModel();
let voice = new VoiceModel();

main();

function main(){

    bot.init();   

    bot.command('registrar', ctx => setRegisterMode(ctx));
    bot.command('cancelar', async ctx => handleCancel(ctx));
    bot.command('deletar', async ctx => setDeleteMode(ctx));
    bot.on('photo', ctx => handlePhoto(ctx));
    bot.on('audio', async ctx => handleAudio(ctx));
    bot.on('voice', async ctx => handleVoice(ctx));
    bot.on('inline_query', async ctx => handleInline(ctx));
    bot.on('text', async ctx => handleText(ctx));

    bot.launch();
}

async function handleAudio(ctx){

    if (bot.isRegister()){
        try {
            await audioService.registerAudio(ctx.message, audio);
            bot.setMode("TITLE_AUDIO");
            bot.setAnswer("Áudio armazenado, agora insira o título");
        } catch (err) {

            console.error(err)
            bot.setAnswer("Ocorreu um erro, tente novamente.");
        }
    }

    if (bot.isDelete()) {
        ctx.message.audio.type = "audios"
        await handleDelete(ctx, ctx.message.audio);
    }
    
    returnAnswer(ctx);
}

async function handleVoice(ctx){

    
    if (bot.isRegister()){
        try {
            await voiceService.registerVoice(ctx.message, voice);
            bot.setMode("TITLE_VOICE");
            bot.setAnswer("Mensagem de voz armazenada, agora insira o título");
        } catch (err) {

            console.error(err)
            bot.setAnswer("Ocorreu um erro, tente novamente.");
        }
    }

    if (bot.isDelete()) {
        ctx.message.voice.type = "voices"
        await handleDelete(ctx, ctx.message.voice);
    }
    
    returnAnswer(ctx);
}

async function handlePhoto(ctx){

    if (bot.isRegister()) {

        try {
            await photoService.registerPhoto(ctx.message, photo);
            bot.setMode("TAG");
            bot.setAnswer("Imagem armazenada, agora insira as TAGs separadas por vírgulas");
        } catch (err) {

            console.error(err)
            bot.setAnswer("Ocorreu um erro, tente novamente.");
        }
    }

    if (bot.isDelete()) {
        ctx.message.photo[0].type = "photos"
        await handleDelete(ctx, ctx.message.photo[0]);
    }

    returnAnswer(ctx);

}

async function handleInline(ctx){

    let results = ""

    if (ctx.inlineQuery.query === "") results = bot.media;    

    const photoResults = photoService.searchPhoto(bot.photos, ctx.inlineQuery.query);
    const audioResults = audioService.searchAudio(bot.audios, ctx.inlineQuery.query);
    const voiceResults = voiceService.searchVoice(bot.voices, ctx.inlineQuery.query);

    results = photoResults.concat(audioResults).concat(voiceResults);

    ctx.answerInlineQuery(results)    
}

function setRegisterMode(ctx) {
    bot.setAnswer("Envie a mídia:");
    bot.setMode("URL");
    returnAnswer(ctx);
}

async function handleText(ctx) {
    
    if (bot.isRegisterTag()) {

        photo.tags = photoService.handleTags(ctx.update.message.text);

        try {            
            await photoService.persistPhoto(photo)
            await bot.init();
            bot.setAnswer("Carta cadastrada com sucesso!");
        } catch (err){
            console.error(err)
            bot.setAnswer("Ocorreu um erro, tente novamente.");
        }
    }

    if (bot.isRegisterTitleAudio()) {

        audio.title = ctx.update.message.text;

        try {            
            await audioService.persistAudio(audio)
            await bot.init();
            bot.setAnswer("Áudio cadastrado com sucesso!");
        } catch (err){
            console.error(err)
            bot.setAnswer("Ocorreu um erro, tente novamente.");
        }
    }

    if (bot.isRegisterTitleVoice()) {

        voice.title = ctx.update.message.text;

        try {            
            await voiceService.persistVoice(voice)
            await bot.init();
            bot.setAnswer("Áudio cadastrado com sucesso!");
        } catch (err){
            console.error(err)
            bot.setAnswer("Ocorreu um erro, tente novamente.");
        }
    }    

    if (bot.isConfirm()) await deleteMedia(ctx);

    returnAnswer(ctx);
    
}

function returnAnswer(ctx) {
    if (bot.answer) {
        ctx.reply(bot.answer) 
        bot.clearAnswer();
    }
}


async function handleCancel(ctx) {
    if (bot.isWorking()){
        await bot.init();
        await ctx.replyWithMarkdown('Cancelado',
        { reply_markup : {
            remove_keyboard : true
        }})           
    } else {
        await ctx.replyWithMarkdown('Não há nada pra cancelar!',
        { reply_markup : {
            remove_keyboard : true
        }})           
    }
}

async function setDeleteMode(ctx) {
    bot.setAnswer("Envie a mídia a deletar:");
    bot.setMode("DELETE");
    returnAnswer(ctx);
}

async function handleDelete(ctx, media) {

    bot.mediaToDelete = media;
    bot.setMode("CONFIRM");
    await ctx.replyWithMarkdown('Tem certeza?',
    { reply_markup : {
        keyboard : [["Sim"],["Não"]],
        one_time_keyboard : true,
        resize_keyboard : true
    }})
}

async function deleteMedia(ctx) {

    if (ctx.update.message.text === "Sim") {

        try {  
            
            await mediaService.deleteMedia(bot.mediaToDelete);

            await bot.init();
            await ctx.replyWithMarkdown('Mídia deletada com sucesso!',
            { reply_markup : {
                remove_keyboard : true
            }})  
        } catch (err) {        
            console.error(err)
            await ctx.replyWithMarkdown('Ocorreu um erro, tente novamente.',
            { reply_markup : {
                remove_keyboard : true
            }})              
        }  
    } else {
        await handleCancel(ctx);       
    }
}