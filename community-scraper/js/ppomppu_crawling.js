/*
 * PPomppu Scraper
 *
 * Copyright (c) 2018 CJ ENM
 *
 * @author <habin_kim@cj.net>
 * @modified 김하빈 <habin_kim@cj.net> 2019-03-01
 * @lastModified 김하빈 <habin_kim@cj.net> 2019-03-07
 */
// provides a high-level API to control Chrome or Chromium over the DevTools Protocol
// requires at least Node v6.4.0, but the examples below use async/await which is only supported in Node v7.6.0 or greater

const puppeteer = require('puppeteer');
// file system
let fs = require('fs');
let dateFormat = require('dateformat');
let moment = require('moment');
/* 
 *  Cheerio implements a subset of core jQuery
 *  parses markup and provides an API for traversing/manipulating the resulting data structure
 */
const cheerio = require('cheerio');
//검출 게시물 담는 큐
let detectedTargetPage = [];
//최근 며칠까지 가져올 것인지에 대한 기준
const scrapTargetUrl = 'http://m.ppomppu.co.kr/new/hot_bbs.php';
const linkPrefixUrl = 'http://m.ppomppu.co.kr/new/';
const ppomppuUrl = 'http://m.ppomppu.co.kr';
const itemNameElementClassId = '.list_main01';
const matchingKeyWord1 = 'CJ';
const matchingKeyWord2 = 'cj';
const matchingKeyWord3 = '설탕몰';
const replyThreshold = 20;
var fileContent = fs.readFileSync('../config/crawlingTime.json'); 
//var fileContent = fs.readFileSync('/Users/cjos/Development/community-scraper/config/crawlingTime.json'); 
var crawlingTime = JSON.parse(fileContent); 
var recentCrawlingDate = crawlingTime.recentCrawlingDate;

async function launch (scrapTargetUrl, contentsLoadDelay) {
	var resultObj = {
		success : true,
		msg : 'success',
		resultData : ''
	};
	try {
		/*
			01. [Puppeteer] Browser Init
		*/
		//let browser = await puppeteer.launch({headless:false});
		let browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
		/* 
			02. [Puppeteer] New Browser
		*/
		let page = await browser.newPage();
		page.setViewport( { width: 1280, height: 800} );
		/*
			03. [Puppeteer] Go Url
		*/
		await page.goto(scrapTargetUrl, {waitUntil: 'domcontentloaded', timeout: 30000000});
		// add delay
		await page.waitFor(contentsLoadDelay);
		/*
			04. [Puppeteer] 뽐뿌 게시판 영역 확인
		*/
		let contentsHtml = await page.evaluate((sel) => {
			return $(sel).html();
		}, itemNameElementClassId);
		/*
			05. [Split] 뽐뿌 게시판 영역 별 분할
		*/
		let contentsDataArray = contentsHtml.split('<li>');
		let nowpageIdx = '';
		let nextpage = '';
		console.log('####################### [ppomppu_crawling.js] Target Keyword : ', matchingKeyWord1);
		/*
			06. [추출] 뽐뿌 게시판 각 영역 별 추출 항목 

			contentsElementsArr[0] : 게시판 제목
			contentsElementsArr[1] : 게시판 카테고리
			contentsElementsArr[2] : 게시자 ID
			contentsElementsArr[3] : 댓글 수, 등록 날짜
			contentsElementsArr[4] : 댓글 수
			contentsElementsArr[5] : 등록 날짜
		*/
		for(let contentsDataIndex = 0 ; contentsDataIndex < contentsDataArray.length ; contentsDataIndex++) {
			let contentsElementsArr = [];
			let contentsDataSource = contentsDataArray[contentsDataIndex].replace(/\t/gi,'').replace(/\n/gi,'');

			const $ = await cheerio.load(contentsDataSource);
			linkDetailPageUrl = linkPrefixUrl + $('a').attr('href');
			//크롤링
			$('span').each(function(i, elm){ //i는 인덱스, elm은 요소
				if($(this).text() != null && i < 6) {
					contentsElementsArr[i] = $(this).text().trim();
				} else {
					//현재 페이지 인덱스
					nowpageIdx = $('#actpg').html();
					console.log('nowpageIdx : ' + nowpageIdx);
				}
			});
			//크롤링 되기를 기대하는 6개의 필드 값이 모두 셋 되었을 경우
			if(contentsElementsArr.length >= 6) {
				//CASE 1 : 금일 날짜 업로드 게시물의 경우 시간만 
				if(contentsElementsArr[5].indexOf(':') > -1) {
					contentsElementsArr[5] = dateFormat(new Date(), 'yyyy-mm-dd') + ' ' + contentsElementsArr[5];
				} else {
				//CASE 2 : 금일 이외 날짜 업로드 게시물의 경우 시간을 12:00:00으로 셋팅
					contentsElementsArr[5] = '20' + contentsElementsArr[5] + ' ' + '12:00:00';
				}
				if(recentCrawlingDate > contentsElementsArr[5]) {
					await page.close();
					await browser.close();
					//스크랩한 시간 저장해두기
					crawlingTime.recentCrawlingDate = getLastScrapingDateTime();
					fs.writeFileSync('../config/crawlingTime.json', JSON.stringify(crawlingTime));
					//fs.writeFileSync('/Users/cjos/Development/community-scraper/config/crawlingTime.json', JSON.stringify(crawlingTime));
					resultObj.resultData = detectedTargetPage;
					return resultObj;
				}
				console.log(contentsElementsArr.join(", "));
				contentsElementsArr.push(linkDetailPageUrl);
				checkIsIssue(contentsElementsArr, nowpageIdx, linkDetailPageUrl);
			}
		}
		//다음 페이지 확인하여 재귀호출
		const $ = await cheerio.load(contentsHtml);
		if($('a.next').attr('href') != null) {
			nextpage = ppomppuUrl + $('a.next').attr('href');
			await launch(nextpage, 500);
		}		
		/*
			07. [fs] Finish
		*/
			await page.close();
			await browser.close();
			//크롤링한 시간 저장해두기
			crawlingTime.recentCrawlingDate = getLastScrapingDateTime();
			fs.writeFileSync('../config/crawlingTime.json', JSON.stringify(crawlingTime));
			//fs.writeFileSync('/Users/cjos/Development/community-scraper/config/crawlingTime.json', JSON.stringify(crawlingTime));
			resultObj.resultData = detectedTargetPage;
			return resultObj;
	} catch (err) {
		await errHandle(err, resultObj);
	} finally {
	}
}

/**
 * 게시물 검증 단계 
 * 1. matchingKeyWord 와 맞는지 검증
 * 2. 최근 날짜인지 검증
 * 3. 댓글 
 * 3. 텔레그램 전송
 */
function checkIsIssue(contentsElementsArr, nowpageIdx, linkUrl) {
	if( (contentsElementsArr[0].indexOf(matchingKeyWord1) > -1 || contentsElementsArr[0].indexOf(matchingKeyWord2) > -1 || contentsElementsArr[0].indexOf(matchingKeyWord3) > -1) ) {
		detectedTargetPage.push(contentsElementsArr);
        console.log('####################### [ppomppu_crawling.js] Detected!!! : ', contentsElementsArr);
	}

}
function getLastScrapingDateTime() {
	return moment().format('YYYY-MM-DD HH:mm:ss'); 
}
async function errHandle (err, resultObj) {
	console.error(err);
	resultObj.success = await false;
	resultObj.resultData = await err.toString();
}
//launch(scrapTargetUrl, 500);

module.exports = console;
module.exports.launch = launch;