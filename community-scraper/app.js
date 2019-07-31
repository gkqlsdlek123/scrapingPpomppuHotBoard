var Bot = require('node-telegram-bot-api');

const {token, chatId} = require('./config/telegram.json');
//텔레그램_HTTP_API_token에는 텔레그램에서 받은 api token을 넣어야 합니다.
var bot = new Bot(token, { polling: true });
//token generated by the bot you created

bot.on('message', function (msg) {
  console.log(msg);
  if(msg['text']){
    return onChatMessage(msg);
  }
});


function onChatMessage(msg){
  var chatId = msg.chat.id;
  bot.sendMessage(chatId, "oh, hello", {
    disable_notification: true,
  }).then(function () {
  // reply sent!
  });
}