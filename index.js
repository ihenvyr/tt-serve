const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

(async () => {
  const browser = await puppeteer.launch({headless: true});

  app.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    const page = await browser.newPage();
    await page.goto(`https://www.tiktok.com/@${username}`);

    const extractedText = await page.$eval('*', (el) => el.innerHTML);
    const json = JSON.parse(extractedText.match(/{"AppContext.+?(?=<\/script>)/)[0]);
    await page.close();

    res.json(json);
  });

  app.listen(3000, () => console.log("ok"));
})();