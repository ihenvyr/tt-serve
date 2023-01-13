const fetch = require("node-fetch");
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

(async () => {
  const browser = await puppeteer.launch({headless: true});

  app.get("/hashtag/:hashtag/:period?", async (req, res) => {
    const { hashtag, period } = req.params;

    // hashtags insights data
    const url1 = `https://ads.tiktok.com/business/creativecenter/hashtag/${hashtag}/pc/en?period=${period || 7}`;
    const json1 = await fetch(url1)
      .then(res => res.text())
      .then(res => JSON.parse(res.match(/{"props":.+?(?=<\/script>)/)[0]));

    // top 3 of trending creators
    const url2 = `https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/creator?hashtag=${hashtag}`;
    const json2 = await fetch(url2)
      .then(res => res.json());

    res.json({
      ...json1?.props?.pageProps?.data || {},
      trendingCreators: json2?.data?.creators || [],
    });
  });

  app.get("/videos/:hashtag", async (req, res) => {
    const { hashtag } = req.params;
    const page = await browser.newPage(); // open new tab
    await page.setJavaScriptEnabled(false);

    await page.goto(`https://www.tiktok.com/tag/${hashtag}`);

    const html = await page.$eval('*', (el) => el.innerHTML);
    const json = JSON.parse(html.match(/{"AppContext.+?(?=<\/script>)/)[0]);

    // remove unnecessary data
    delete json["AppContext"];
    delete json["BizContext"];
    delete json["SEO"];
    delete json["SharingMeta"];
    delete json["ItemList"];
    delete json["ChallengePage"];

    await page.close(); // close tab

    res.json({
      recentVideos: json?.ItemModule || {},
      users: json?.UserModule?.users || {},
      stats: json?.UserModule?.stats || {},
    });
  });

  app.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    const page = await browser.newPage(); // open new tab
    await page.setJavaScriptEnabled(false);

    await page.goto(`https://www.tiktok.com/@${username}`);

    const html = await page.$eval('*', (el) => el.innerHTML);
    const json = JSON.parse(html.match(/{"AppContext.+?(?=<\/script>)/)[0]);

    // remove unnecessary data
    delete json["AppContext"];
    delete json["BizContext"];
    delete json["SEO"];
    delete json["SharingMeta"];
    delete json["ItemList"];
    delete json["UserPage"];
    delete json["RecommendUserList"];

    await page.close(); // close tab

    res.json({
      ...json?.UserModule?.users?.[username] || {},
      stats: json?.UserModule?.stats?.[username] || {},
      recentVideos: json?.ItemModule || {},
    });
  });

  app.listen(3000, () => console.log("ok"));
})();