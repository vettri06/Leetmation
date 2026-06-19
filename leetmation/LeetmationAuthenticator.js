import {getElementBySelector, isVerificationPage, waitForVerificationToFinish} from "../utils/utils.js";
import Logger from "../utils/Logger.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";

class LeetmationAuthenticator {
  static async #gotoLeetcode(page, url) {
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
    } catch (err) {
      if (err.name !== "TimeoutError") throw err;
      Logger.warn(`Navigation timed out for ${url}, continuing with the loaded page.`);
    }
  }

  static async #isLoggedIn(page) {
    if (await isVerificationPage(page)) return false;

    try {
      await getElementBySelector(page, '#navbar_user_avatar, [data-cy="navbar-user-avatar"]', 5, 0);
      return true;
    } catch (_) {
    }

    const cookies = await page.cookies("https://leetcode.com");
    return cookies.some((cookie) => cookie.name === "LEETCODE_SESSION" && cookie.value);
  }

  static #loginUserHandler = async () => {
    const {page} = await getBrowserDetails();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(30000);

    await this.#gotoLeetcode(page, `https://leetcode.com/`);
    if (await isVerificationPage(page)) {
      Logger.warn('LeetCode verification detected. Complete it in Chrome; automation is paused.');
      await waitForVerificationToFinish(page, 600);
    }

    if (await this.#isLoggedIn(page)) {
      Logger.success('User was already logged in.')
      return;
    }

    await this.#gotoLeetcode(page, `https://leetcode.com/accounts/login/`);
    if (await isVerificationPage(page)) {
      Logger.warn('LeetCode verification detected. Complete it in Chrome; automation is paused.');
      await waitForVerificationToFinish(page, 600);
    }

    if (await this.#isLoggedIn(page)) {
      Logger.success('User was already logged in.')
      return;
    }

    Logger.success('Please log in to LeetCode using your credentials.');

    await getElementBySelector(page, '#navbar_user_avatar, [data-cy="navbar-user-avatar"]', 600, 0);
    Logger.success('User Logged in successfully');
  };

  static loginUser = async () => {
    Logger.success('[AUTH] Starting authentication...');
    await this.#loginUserHandler();
    Logger.success('[AUTH] Authentication complete.');
  };
}

export default LeetmationAuthenticator;
