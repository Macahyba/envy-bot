const EnvyBot = require('./envy-bot')
require('dotenv/config');
const fetch = require('node-fetch');

const bot = new EnvyBot(process.env.BOT_TOKEN);
bot.init();

let db = require('./database/connection');

bot.command('registrar', ctx => registerPhoto(ctx))

bot.command('cancelar', ctx => handleCancel(ctx))

bot.on('inline_query', async ctx => {
    
    let results = ""

    if (ctx.inlineQuery.query === "") results = bot.photos;

    const searchResults = searchPhoto(ctx.inlineQuery.query);
    results = 
        searchResults && searchResults.length
        ? searchResults.map((photo, id) => ({
            id,
            type: "photo",
            photo_url: photo.url,
            thumb_url: photo.url,
        })) : []
  
    ctx.answerInlineQuery(results)
})

bot.on('text', async ctx => handleText(ctx))

bot.launch()

function searchPhoto(criteria) {

    return bot.photos && bot.photos.length
        ? bot.photos.filter(photo => {
        
            return photo.tags.some(tag => tag.startsWith(criteria.toUpperCase()))
                ? true : false;
    }) : []    
}

function registerPhoto(ctx) {
    ctx.reply('Envie a url da imagem:');
    bot.MODE = "LINK";
}

async function handleText(ctx) {
    
    this.mensagem = ctx.update.message.text;

    await handleRegister(ctx);
    returnAnswer(ctx);
    
}

function returnAnswer(ctx) {
    if (bot.answer) {
        ctx.reply(bot.answer) 
        bot.answer = "";
    }
}

async function handleRegister(ctx) {

    if (isRegisterLink()) await registerLink(ctx); 
    if (isRegisterTag()) await registerTags(ctx);              
}

function handleCancel(ctx) {
    if (isRegister()){
        bot.MODE = "CLEAR";
        ctx.reply("Cancelado");
    } else {
        ctx.reply("Não há nada pra cancelar!");
    }
}

function isRegister(){
    return ((bot.MODE === "LINK") || (bot.MODE === "TAG")) ? true : false;
}

function isRegisterLink() {
    return bot.MODE === "LINK" ? true : false;
}

function isRegisterTag() {
    return bot.MODE === "TAG" ? true : false;
}

async function registerLink(ctx){

    if (isLink(this.mensagem)) {
        
        try {
            if (await getUrl()){
                bot.MODE = "TAG";
                bot.url = this.mensagem;
                ctx.reply('Link armazenado, agora insira as TAGs separadas por vírgulas');
            } else {
                ctx.reply('O link não é uma imagem válida, tente novamente');
            }
        } catch (err) {
            ctx.reply(err.message);
        }
    }  else {
        bot.answer = 'Por favor insira um link válido!'
    }

}

function isLink(){
    return this.mensagem.startsWith('http') ? true : false;
}

async function getUrl(){
    try {
        const res = await fetch(this.mensagem);
        
        return (res.ok && isValidImage(res.headers.get('content-type'))) ? true : false

    } catch (err) {
        throw new Error('Link offline, tente novamente');
    }    
}

function isValidImage(content) {
    return content.startsWith('image') ? true : false;
}

async function registerTags(ctx) {
    if (!isLink()){

        try {        
            bot.tags = handleTags(this.mensagem);
            await db('photos').insert({url: bot.url, tags: bot.tags});
            await bot.init();
            ctx.reply('Carta cadastrada com sucesso!')
        } catch (err) {
            console.error(err)
        }

    }
}

function handleTags(txt){
    const preTags = txt.toUpperCase().split(',');
    const midTags = preTags.map(tag => tag.trim());
    return midTags.toString();
}