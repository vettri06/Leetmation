export const sleep = async (time) => {
  await new Promise((resolve) => setTimeout(resolve, time * 1000));
};

export const getElementByXPath = async (element, xpath, timeoutDelay = 30, delay = 1.3) => {
  await sleep(delay);
  await element.waitForXPath(xpath, {
    visible: true,
    timeout: timeoutDelay * 1000,
  });
  return await element.$x(xpath);
};

export const getElementBySelector = async (element, selector, timeoutDelay = 30, delay = 1.3) => {
  await sleep(delay);
  await element.waitForSelector(selector, {
    visible: true,
    timeout: timeoutDelay * 1000,
  });
  return await element.$$(selector);
};

export const isVerificationPage = async (page) => {
  return await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const title = document.title || "";
    return [
      "Verify you are human",
      "Checking if the site connection is secure",
      "Just a moment",
      "review the security",
      "Cloudflare",
    ].some((phrase) => text.includes(phrase) || title.includes(phrase))
      || Boolean(document.querySelector("#challenge-running, .cf-challenge, iframe[src*='challenges.cloudflare.com']"));
  });
};

export const waitForVerificationToFinish = async (page, timeoutDelay = 600) => {
  if (!(await isVerificationPage(page))) return;

  await page.waitForFunction(() => {
    const text = document.body?.innerText || "";
    const title = document.title || "";
    const verificationText = [
      "Verify you are human",
      "Checking if the site connection is secure",
      "Just a moment",
      "review the security",
      "Cloudflare",
    ].some((phrase) => text.includes(phrase) || title.includes(phrase));
    const verificationElement = document.querySelector("#challenge-running, .cf-challenge, iframe[src*='challenges.cloudflare.com']");
    return !verificationText && !verificationElement;
  }, {timeout: timeoutDelay * 1000});
};

let cntrlKey = process.platform === "win32" ? "Control" : "Meta";

export const selectAllHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyA");
  await page.keyboard.up(cntrlKey);
};

export const copyHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyC");
  await page.keyboard.up(cntrlKey);
};

export const pasteHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyV");
  await page.keyboard.up(cntrlKey);
};
