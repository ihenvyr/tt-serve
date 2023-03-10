const fetch = require("node-fetch");
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

(async () => {
  const isProduction = process.env.NODE_ENV === "production";
  const port = isProduction ? 8080 : 3000;
  const browser = await puppeteer.launch({headless: true});

  // only top 3 hashtags
  // http://localhost:3000/hashtag/trend
  app.get("/hashtag/trend/:period?", async (req, res) => {
    const { period } = req.params;

    // hashtags insights data
    const url = `https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?page=1&size=20&sort_by=popular`;
    const json = await fetch(url)
      .then(res => res.text())
      .then(res => JSON.parse(res.match(/{"props":.+?(?=<\/script>)/)[0]));

    res.json(json?.props?.pageProps?.data?.list || {});
  });

  // period=1095 //   3 years
  // period=365  //  12 months
  // period=120  // 120 days
  // period=30   //  30 days
  // period=7    //  7 days
  // http://localhost:3000/hashtag/noodles
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

  // http://localhost:3000/videos/noodles
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

  // http://localhost:3000/user/gingersnark
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

  app.listen(port, () => console.log(`server: ok, port: ${port}`));
})();