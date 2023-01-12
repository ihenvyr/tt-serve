const fetch = require("node-fetch");
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

(async () => {
  const browser = await puppeteer.launch({headless: true});

  app.get("/hashtag/:hashtag/:period?", async (req, res) => {
    const { hashtag, period } = req.params;

    const url = `https://ads.tiktok.com/business/creativecenter/hashtag/${hashtag}/pc/en?period=${period || 7}`;
    const json = await fetch(url)
      .then(res => res.text())
      .then(res => JSON.parse(res.match(/{"props":.+?(?=<\/script>)/)[0]));

    res.json(json);
  });

  app.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);

    await page.goto(`https://www.tiktok.com/@${username}`);

    const html = await page.$eval('*', (el) => el.innerHTML);
    const json = JSON.parse(html.match(/{"AppContext.+?(?=<\/script>)/)[0]);

    delete json["AppContext"];
    delete json["BizContext"];
    delete json["SEO"];
    delete json["SharingMeta"];
    delete json["UserPage"];
    delete json["RecommendUserList"];

    await page.close();

    res.json(json);
  });

  app.listen(3000, () => console.log("ok"));
})();