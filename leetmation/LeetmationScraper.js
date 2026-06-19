import {getElementBySelector, getElementByXPath, sleep} from "../utils/utils.js";
import {
  SCRAPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPER_SUBMITTED_CODE_NAME_XPATH,
} from "../utils/constants.js";
import Logger from "../utils/Logger.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";
import FileManager from "../managers/FileManager.js";

class LeetmationScraper {
  static async #scrapeAndSaveCodeFromSubmissionId(id) {
    const {browser} = await getBrowserDetails();
    const page = await browser.newPage();

    try {
      await page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
        waitUntil: "networkidle2",
      });

      const statusDiv = await getElementByXPath(page, "//*[@id='result_state']", 3, 0);
      const textContent = await statusDiv[0].evaluate((el) => el.textContent);
      if (textContent !== 'Accepted') return;

      // Get name from the link in the name href
      const nameDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_NAME_XPATH, 3, 0);
      const hrefHandle = await nameDiv[0].getProperty("href");
      const href = await hrefHandle.jsonValue();
      const arr = await href.split("/");
      const nameDivValue = arr[arr.length - 2];

      // Get the language from the submission page
      const languageDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3, 0);
      const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

      const copiedText = await this.#extractSubmittedCode(page);
      if (!copiedText) {
        Logger.error(`[SKIPPING]\t\t\t:${nameDivValue}. Unable to extract submitted code.`);
        return;
      }

      let fileContent = {problemName: nameDivValue, language: languageDivValue, code: copiedText};
      await FileManager.saveScrapedSolution(fileContent);
    } catch (err) {
      Logger.error('Something went wrong!', err);
    } finally {
      await page.close();
    }
  }

  static async #extractSubmittedCode(page) {
    await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_DIV_XPATH, 10, 0);

    return await page.evaluate(() => {
      const getVisibleText = (selector) => {
        const element = Array.from(document.querySelectorAll(selector))
          .find((item) => item.offsetParent !== null && item.innerText?.trim());
        return element?.innerText?.trim() || "";
      };

      const monacoEditor = window.monaco?.editor?.getEditors?.()[0];
      const monacoCode = monacoEditor?.getModel?.()?.getValue?.();
      if (monacoCode?.trim()) return monacoCode;

      const codeMirrorText = getVisibleText(".cm-content, .CodeMirror-code");
      if (codeMirrorText) return codeMirrorText;

      const codeBlockText = getVisibleText("pre, code");
      if (codeBlockText) return codeBlockText;

      const lineNodes = Array.from(document.querySelectorAll(".view-line, .cm-line"))
        .filter((line) => line.offsetParent !== null);
      if (!lineNodes.length) return "";

      return lineNodes.map((line) => line.innerText).join("\n").trim();
    });
  }

  static async #scrapeSubmissionIdsFromPageId(id) {
    const {page} = await getBrowserDetails();
    await page.goto(`https://leetcode.com/submissions/#/${id}`, {
      waitUntil: 'networkidle2',
    });

    let rows = [];
    try {
      rows = await getElementBySelector(page, '.text-success', 10, 0);
    } catch (_) {
    }

    return await Promise.all(rows.map(async row => {
      const href = await row.evaluate(el => el.getAttribute('href'));
      return href.split('/').slice(-2, -1)[0];
    }));
  }

  static async #scrapeCodeFromAllSubmissions(browser) {
    for (let page_no = 1; page_no <= 1000; page_no++) {
      try {
        const submission_ids = await this.#scrapeSubmissionIdsFromPageId(page_no, browser);
        Logger.success(`Submission ids fetched from page number ${page_no}`, submission_ids);

        const promises = [];
        for (let idx = 0; idx < submission_ids.length; idx++) {
          promises.push(this.#scrapeAndSaveCodeFromSubmissionId(submission_ids[idx], browser));
        }
        await Promise.all(promises);
        promises.length = 0;
      } catch (err) {
        Logger.error('Something went wrong, Most Likely Invalid page id', err);
        return;
      }
    }
  }

  static async scrapeAcceptedSolutions() {
    Logger.success('[SCRAPER] Starting...');
    await this.#scrapeCodeFromAllSubmissions();
    Logger.success('[SCRAPER] Done.');
  }

  /**
   * This is only for testing and scraping global solutions not relevant to the users.
   */
  static async scrapeAcceptedSolutionsGlobally() {
    Logger.success('[SCRAPER] Starting global scrape...');
    const {browser} = getBrowserDetails();
    try {
      let id_no = 1010011580
      while (id_no > 0) {
        const promises = [];
        for (let idx = 0; idx < 30; idx++) {
          promises.push(this.#scrapeAndSaveCodeFromSubmissionId(id_no, browser));
          id_no++;
        }
        await Promise.all(promises);
        await sleep(3)
        Logger.warn('LAST FETCHED IS ', id_no);
        promises.length = 0;
      }
    } catch (e) {
      Logger.error(e);
    }
    Logger.success('[SCRAPER] Global scrape done.');
  }
}

export default LeetmationScraper;
