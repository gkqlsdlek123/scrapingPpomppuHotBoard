/*
 * PPomppu Scraper
 *
 * Copyright (c) 2018 CJ ENM
 *
 * @author <habin_kim@cj.net>
 * @modified 김하빈 <habin_kim@cj.net> 2019-03-01
 * @lastModified 김하빈 <habin_kim@cj.net> 2019-03-07
 */
var ppomppuCrawling = require('./ppomppu_crawling.js');
var telegram = require('./telegram.js');
const scrapTargetUrl = 'http://m.ppomppu.co.kr/new/hot_bbs.php';


(async () => {
	try { 
		// debug mode
		// let browser = await puppeteer.launch({headless:false});
		console.log('####################### [cjMonitor.js] Scraping START #######################');
		console.time('scraping Time');
        let detectedMsg = await ppomppuCrawling.launch(scrapTargetUrl, 500);
        if(detectedMsg.resultData.length > 0) {
            telegram.telegramSendMessage(detectedMsg.resultData);
        }
        console.log('####################### [cjMonitor.js] Detected : ', detectedMsg.resultData.length);
	} catch (err) {
		console.error(err);	
	} finally {
		console.timeEnd('scraping Time');
        console.log('####################### [cjMonitor.js] Scraping END #######################');
	}
})()