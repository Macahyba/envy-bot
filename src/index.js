const EnvyBot = require('./envy-bot')
require('dotenv/config');

const bot = new EnvyBot(process.env.BOT_TOKEN);
const db = require('./database/connection');

main();

function main(){

    bot.init();   

    bot.command('registrar', ctx => setRegisterMode(ctx));
    bot.command('cancelar', async ctx => handleCancel(ctx));
    bot.command('deletar', async ctx => setDeleteMode(ctx));
    bot.on('photo', ctx => handlePhoto(ctx));
    bot.on('inline_query', async ctx => handleInline(ctx));
    bot.on('text', async ctx => handleText(ctx));
    bot.launch();
}

async function handleInline(ctx){

    let results = ""

    if (ctx.inlineQuery.query === "") results = bot.photos;

    const searchResults = searchPhoto(ctx.inlineQuery.query);
    results = 
        searchResults && searchResults.length
        ? searchResults.map((photo, id) => ({
            id,
            type: "photo",
            photo_file_id: photo.telegram_id,
            thumb_url: photo.telegram_id
        })) : []
  
    ctx.answerInlineQuery(results)    
}

function searchPhoto(criteria) {

    return bot.photos && bot.photos.length
        ? bot.photos.filter(photo => {
        
            return photo.tags.some(tag => tag.startsWith(criteria.toUpperCase()))
                ? true : false;
    }) : []    
}

function setRegisterMode(ctx) {
    ctx.reply('Envie a imagem:');
    bot.MODE = "URL";
}

async function handleText(ctx) {
    
    this.mensagem = ctx.update.message.text;

    if (isRegister()) await handleRegister(ctx);
    if (isDelete()) await handleDelete(ctx);

    returnAnswer(ctx);
    
}

function returnAnswer(ctx) {
    if (bot.answer) {
        ctx.reply(bot.answer) 
        bot.answer = "";
    }
}

async function handleRegister(ctx) {

    if (isRegisterPhoto()) await registerPhoto(ctx); 
    if (isRegisterTag()) await registerTags(ctx);                            
}

async function handleCancel(ctx) {
    if (isWorking()){
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

function isWorking() {
    return bot.MODE === 'CLEAR' ? false : true;
}

function isRegister(){
    return ((bot.MODE === "URL") || (bot.MODE === "TAG")) ? true : false;
}

function isRegisterPhoto() {
    return bot.MODE === "URL" ? true : false;
}

function isRegisterTag() {
    return bot.MODE === "TAG" ? true : false;
}

function isDelete() {
    return ((bot.MODE === "DELETE") || (bot.MODE === "CONFIRM")) ? true : false;
}

async function registerPhoto(ctx){

    try {
        bot.telegram_id = ctx.message.photo[0].file_id;
        bot.telegram_unique_id = ctx.message.photo[0].file_unique_id;
        bot.MODE = "TAG";
        ctx.reply('Imagem armazenada, agora insira as TAGs separadas por vírgulas');
    } catch (err) {
        console.error(err)
        ctx.reply("Ocorreu um erro, tente novamente.");
    }
}

async function registerTags(ctx) {

    try {        
        bot.tags = handleTags(this.mensagem);
        await db('photos')
            .insert({
                telegram_id: bot.telegram_id, 
                telegram_unique_id: bot.telegram_unique_id, 
                tags: bot.tags
            });
        await bot.init();
        ctx.reply('Carta cadastrada com sucesso!')
    } catch (err) {        
        console.error(err)
        ctx.reply("Ocorreu um erro, tente novamente.");
    }
}

function handleTags(txt){
    const preTags = txt.toUpperCase().split(',');
    const midTags = preTags.map(tag => tag.trim());
    return midTags.toString();
}

async function handlePhoto(ctx) {
    if (isRegisterPhoto()) await registerPhoto(ctx);
    if (isDelete()) await deletePhoto(ctx);
}

async function setDeleteMode(ctx) {
    ctx.reply('Envie a carta a deletar:');
    bot.MODE = "DELETE";
}

async function deletePhoto(ctx) {

    bot.telegram_unique_id = ctx.message.photo[0].file_unique_id;
    bot.MODE = "CONFIRM";
    await ctx.replyWithMarkdown('Tem certeza?',
    { reply_markup : {
        keyboard : [["Sim"],["Não"]],
        one_time_keyboard : true,
        resize_keyboard : true
    }})
}

async function handleDelete(ctx) {

    if (this.mensagem === "Sim") {

        try {        
            await db('photos')
                .where('telegram_unique_id', bot.telegram_unique_id)
                .del();
            await bot.init();
            await ctx.replyWithMarkdown('Carta deletada com sucesso!',
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