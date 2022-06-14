/*
 * Telegram BOT API
 *
 *
 * @author 
 * @modified 김하빈 2019-03-01
 * @lastModified 김하빈 2019-03-07
 */
let fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const {token, chatId} = require('../config/telegramConfig.json');
//const {token, chatId} = require('/Users/cjos/Development/community-scraper/config/telegramConfig.json');
var fileContent = fs.readFileSync('../config/gIdSet.json'); 
//var fileContent = fs.readFileSync('/Users/cjos/Development/community-scraper/config/gIdSet.json'); 
var idArray = JSON.parse(fileContent); 

// let g_idSet = new Set();
//테스트 아이디 등록
//483661463, 564123876
// if(g_idSet.has('564123876') ==  false) {
// 	g_idSet.add(564123876);
// 	console.log('####################### [g_idSet] Added : ', '564123876');
// 	console.log('####################### [g_idSet]  : ', g_idSet);
// }
// if(g_idSet.has('483661463') ==  false) {
// 	g_idSet.add(483661463);
// 	console.log('####################### [g_idSet] Added : ', '483661463');
// 	console.log('####################### [g_idSet]  : ', g_idSet);
// }
// if(g_idSet.has('639898908') ==  false) {
// 	g_idSet.add(639898908);
// 	console.log('####################### [g_idSet] Added : ', '639898908');
// 	console.log('####################### [g_idSet]  : ', g_idSet);
// }

// BOT setup
let bot = new TelegramBot(token, {polling : true});

/*
    CASE 1 : /start 명령어
*/
bot.onText(/\/start/, (msg, match) => {
    var isRegistered = false;
    idArray.find((element, idx) => {
        if(element.ID === msg.chat.id) {
            isRegistered = true;
            return ;
        }
    });
    if(!isRegistered) {
        var idSet = new Object();
        idSet.ID = msg.chat.id;
        idArray.push(idSet);
        fs.writeFileSync('../config/gIdSet.json', JSON.stringify(idArray));
        //fs.writeFileSync('/Users/cjos/Development/community-scraper/config/gIdSet.json', JSON.stringify(idArray));
        console.log('####################### [telegram.js] Added : ', msg.chat.id);
        console.log('####################### [telegram.js]  : ', JSON.stringify(idArray));
    } else {
        console.log('####################### [telegram.js] already Added : ', JSON.stringify(idArray));
    }
    onChatMessage(msg, '안녕하세요. CJ 관련 게시물 스크랩 봇입니다.\n현재 [CJ] 키워드 검출 중입니다. 핫 게시물 검출 시 알람 드리겠습니다.\n\n기능 명령\n/start : 알림 받기 시작\n/quit : 알림 받기 멈춤');
});

/*
    CASE 2 : /quit 명령어
*/
bot.onText(/\/quit/, (msg, match) => {
    idArray.find((element, idx) => {
        if(element.ID === msg.chat.id) {
            idArray.splice(idx, 1);
            fs.writeFileSync('../config/gIdSet.json', JSON.stringify(idArray));
            //fs.writeFileSync('/Users/cjos/Development/community-scraper/config/gIdSet.json', JSON.stringify(idArray));
            console.log('####################### [telegram.js] Deleted : ', msg.chat.id);
            console.log('####################### [telegram.js]  : ', JSON.stringify(idArray));
            onChatMessage(msg, '안녕히 가세요. 돌아오세요..');
        }
    });
});

/*
    CASE 3 : any 명령어
*/
bot.on('message', function (msg) {
	console.log(msg);
	if(msg['text']){
	  return onChatMessage(msg, '저는 CJ 봇입니다.');
	}
  });
function onChatMessage(msg, chatMsg){
	var chatId = msg.chat.id;
	bot.sendMessage(chatId, chatMsg, {
		disable_notification: true,
	}).then(function () {
	// reply sent!
	});
}
async function telegramSendMessage(detectedMsgArr) {
    idArray.forEach(function(element) {
         detectedMsgArr.forEach(function(msg) {
             bot.sendMessage(element.ID, msg[0]+'\n\n'+ '게시판 : ' +msg[1]+'\n'+ '작성자 : ' +msg[2]+'\n'+ '댓글 수 : '  +msg[4]+'\n'+ '작성일자 : ' +msg[5]+'\n'+ '게시판링크 : ' +msg[6]);
         });
    });
}

module.exports = console;
module.exports.onChatMessage = onChatMessage;
module.exports.telegramSendMessage = telegramSendMessage;
