import {getElementByXPath, isVerificationPage, sleep, waitForVerificationToFinish} from "../utils/utils.js";
import {
  IS_QUESTION_PREMIUM,
  IS_SOLUTION_ACCEPTED_DIV_XPATH,
  QUESTIONS_LANGUAGE_BTN_XPATH,
  QUESTIONS_LANGUAGE_DIV_XPATH,
  QUESTIONS_SUBMIT_ACCEPTED_XPATH,
  QUESTIONS_SUBMIT_DIV_XPATH,
} from "../utils/constants.js";
import Logger from "../utils/Logger.js";
import FileManager from "../managers/FileManager.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";

class LeetmationSolver {
  static #languageLabels = {
    cpp: ["C++"],
    java: ["Java"],
    python: ["Python"],
    python3: ["Python3", "Python 3"],
    mysql: ["MySQL"],
    javascript: ["JavaScript"],
    typescript: ["TypeScript"],
    c: ["C"],
    csharp: ["C#"],
    golang: ["Go"],
    go: ["Go"],
    ruby: ["Ruby"],
    rust: ["Rust"],
    scala: ["Scala"],
    kotlin: ["Kotlin"],
    swift: ["Swift"],
    bash: ["Bash"],
    mssql: ["MS SQL Server"],
    oracle: ["Oracle"],
    pandas: ["Pandas"],
    pythondata: ["Pandas"],
  };

  static async #checkIfSolvedEarlier(problemName) {
    const solvedProblemSet = await FileManager.getSolvedProblemSet()
    return solvedProblemSet.has(problemName);
  }

  static async #getPageText(page) {
    return await page.evaluate(() => document.body?.innerText || "");
  }

  static async #gotoProblem(page, problemName) {
    const url = `https://leetcode.com/problems/${problemName}`;
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
    } catch (err) {
      if (err.name !== "TimeoutError") throw err;
      Logger.warn(`[NAVIGATION_TIMEOUT]\t:${problemName}. Continuing with the loaded page.`);
    }
  }

  static async #clickByXPath(page, xpath, timeoutDelay = 3) {
    const elements = await getElementByXPath(page, xpath, timeoutDelay, 0);
    if (!elements.length) return false;
    await elements[0].click();
    return true;
  }

  static async #clickButtonByText(page, text, timeoutDelay = 10) {
    await page.waitForFunction((buttonText) => {
      return Array.from(document.querySelectorAll("button"))
        .some((button) => button.innerText.trim() === buttonText && !button.disabled);
    }, {timeout: timeoutDelay * 1000}, text);

    return await page.evaluate((buttonText) => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((element) => element.innerText.trim() === buttonText && !element.disabled);
      if (!button) return false;
      button.click();
      return true;
    }, text);
  }

  static async #selectLanguage(page, language) {
    const languageLabels = this.#languageLabels[language?.toLowerCase()];
    if (!languageLabels) {
      Logger.error(`[SKIPPING]\t\t\t:${language} is not a supported LeetCode language.`);
      return false;
    }

    const alreadySelected = await page.evaluate((labels) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some((button) => labels.includes(button.innerText.trim()));
    }, languageLabels);
    if (alreadySelected) return true;

    let opened = false;
    try {
      opened = await this.#clickByXPath(page, QUESTIONS_LANGUAGE_BTN_XPATH, 3);
    } catch (_) {
    }

    if (!opened) {
      opened = await page.evaluate((labels) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const languageButton = buttons.find((button) => {
          const text = button.innerText.trim();
          return Object.values(labels).flat().includes(text) || button.getAttribute("aria-haspopup") === "dialog";
        });
        if (!languageButton) return false;
        languageButton.click();
        return true;
      }, this.#languageLabels);
    }

    if (!opened) {
      Logger.error(`[SKIPPING]\t\t\t: Unable to open language selector.`);
      return false;
    }

    await sleep(1);
    try {
      const oldLanguageOptions = await getElementByXPath(page, QUESTIONS_LANGUAGE_DIV_XPATH, 2, 0);
      for (const element of oldLanguageOptions) {
        const text = await element.evaluate((el) => el.textContent.trim());
        if (languageLabels.includes(text)) {
          await element.click();
          await sleep(1);
          return true;
        }
      }
    } catch (_) {
    }

    const selected = await page.evaluate((labels) => {
      const candidates = Array.from(document.querySelectorAll("[role='option'], [role='menuitem'], div, span"))
        .filter((element) => labels.includes(element.textContent.trim()));
      const option = candidates.find((element) => element.offsetParent !== null);
      if (!option) return false;
      option.click();
      return true;
    }, languageLabels);

    if (!selected) {
      Logger.error(`[SKIPPING]\t\t\t: Unable to select ${language} from language selector.`);
      await page.keyboard.press("Escape");
      return false;
    }

    await sleep(1);
    return true;
  }

  static async #setEditorCode(page, code) {
    await page.waitForSelector(".monaco-editor textarea, textarea", {
      visible: true,
      timeout: 10000,
    });

    const changedByMonaco = await page.evaluate((sourceCode) => {
      const monacoContainer = document.querySelector(".monaco-editor");
      if (!monacoContainer || !window.monaco?.editor) return false;

      const editor = window.monaco.editor.getEditors()
        .find((item) => item.getDomNode()?.contains(monacoContainer));
      if (!editor) return false;

      editor.focus();
      editor.setValue(sourceCode);
      return editor.getValue() === sourceCode;
    }, code);

    if (changedByMonaco) return true;

    const textarea = await page.$(".monaco-editor textarea, textarea");
    if (!textarea) return false;

    await textarea.click({clickCount: 3});
    const modifier = process.platform === "win32" ? "Control" : "Meta";
    await page.keyboard.down(modifier);
    await page.keyboard.press("KeyA");
    await page.keyboard.up(modifier);
    await page.keyboard.insertText(code);
    return true;
  }

  static async #submit(page) {
    try {
      return await this.#clickButtonByText(page, "Submit", 10);
    } catch (_) {
      return await this.#clickByXPath(page, QUESTIONS_SUBMIT_DIV_XPATH, 5);
    }
  }

  static async #waitForAcceptedVerdict(page, problemName) {
    try {
      const accepted = await getElementByXPath(page, IS_SOLUTION_ACCEPTED_DIV_XPATH, 15, 0);
      const acceptedText = await accepted[0].evaluate((ele) => ele.textContent.trim());
      if (acceptedText) return acceptedText;
    } catch (_) {
    }

    await page.waitForFunction(() => {
      const text = document.body?.innerText || "";
      return /\bAccepted\b/.test(text) || /\bWrong Answer\b|\bRuntime Error\b|\bCompile Error\b|\bTime Limit Exceeded\b/.test(text);
    }, {timeout: 30000});

    const text = await this.#getPageText(page);
    const verdict = text.match(/\b(Accepted|Wrong Answer|Runtime Error|Compile Error|Time Limit Exceeded|Memory Limit Exceeded)\b/);
    if (!verdict) throw new Error(`${problemName} verdict was not found after submit.`);
    return verdict[1];
  }

  static async #trySolution(page, problemName, solution, attemptNumber, totalAttempts) {
    const {code, language} = solution;
    Logger.warn(`[LOADED_SOLUTION]\t\t:${problemName} (language: ${language}, ${code.length} chars, attempt ${attemptNumber}/${totalAttempts})`);

    Logger.warn(`[SWITCHING_LANGUAGE]\t\t:${language}`);
    const languageSelected = await this.#selectLanguage(page, language);
    if (!languageSelected) {
      await FileManager.recordSubmissionResult(problemName, {
        status: 'skipped',
        language,
        reason: `Unable to select ${language} in the LeetCode editor.`,
        countAttempt: false,
      });
      return {status: 'skipped', verdict: null};
    }

    Logger.warn(`[PASTING_CODE]\t\t:${problemName}`);
    const codeWasSet = await this.#setEditorCode(page, code);
    if (!codeWasSet) {
      Logger.error(`[SKIPPING]\t\t\t: Unable to paste code for ${problemName}.`);
      await FileManager.recordSubmissionResult(problemName, {
        status: 'skipped',
        language,
        reason: 'Unable to paste code into the LeetCode editor.',
        countAttempt: false,
      });
      return {status: 'skipped', verdict: null};
    }

    Logger.warn(`[SUBMITTING]\t\t\t:${problemName}`);
    const submitted = await this.#submit(page);
    if (!submitted) {
      Logger.error(`[SKIPPING]\t\t\t: Unable to find Submit button for ${problemName}.`);
      await FileManager.recordSubmissionResult(problemName, {
        status: 'skipped',
        language,
        reason: 'Unable to find or click the Submit button.',
        countAttempt: false,
      });
      return {status: 'skipped', verdict: null};
    }

    Logger.warn(`[AWAITING_VERDICT]\t\t:${problemName}`);
    const verdict = await this.#waitForAcceptedVerdict(page, problemName);

    if (verdict === 'Accepted') {
      Logger.success(`[ACCEPTED]\t\t\t:${problemName}`);
      await FileManager.setSolvedProblemSet(problemName);
      await FileManager.recordSubmissionResult(problemName, {
        status: 'accepted',
        verdict,
        language,
        reason: `Submission accepted on attempt ${attemptNumber}/${totalAttempts}.`,
      });
      return {status: 'accepted', verdict};
    }

    Logger.error(`[REJECTED]\t\t\t:${problemName} ${verdict} (${language})`);
    await FileManager.recordSubmissionResult(problemName, {
      status: 'failed',
      verdict,
      language,
      reason: `LeetCode returned a non-accepted verdict on attempt ${attemptNumber}/${totalAttempts}.`,
      message: `${problemName} ${verdict} using ${language}.`,
    });
    return {status: 'failed', verdict};
  }

  static async #solveProblemWithName(problemName) {
    Logger.warn(`[NAVIGATING]\t\t\t:${problemName}`);
    const {page} = await getBrowserDetails();
    await this.#gotoProblem(page, problemName);
    if (await isVerificationPage(page)) {
      Logger.warn(`[VERIFICATION]\t\t:${problemName}. Complete it in Chrome; automation is paused.`);
      await waitForVerificationToFinish(page, 600);
    }

    let savedLanguage = null;

    try {
      try {
        const acceptedDiv = await getElementByXPath(page, QUESTIONS_SUBMIT_ACCEPTED_XPATH, 4);
        const acceptedText = await acceptedDiv[0].evaluate((ele) => ele.textContent);
        if (acceptedText.includes("Solved")) {
          Logger.error(`[ALREADY_SOLVED]\t\t:${problemName}`);
          await FileManager.setSolvedProblemSet(problemName);
          await FileManager.recordSubmissionResult(problemName, {
            status: 'already_solved',
            verdict: 'Solved',
            reason: 'Problem was already marked solved on LeetCode.',
            countAttempt: false,
          });
          return;
        }
      } catch (_) {
      }

      try {
        const acceptedDiv = await getElementByXPath(page, IS_QUESTION_PREMIUM, 1, 0.1);
        const acceptedText = await acceptedDiv[0].evaluate((ele) => ele.textContent);
        if (acceptedText.includes("Subscribe")) {
          Logger.error(`[PREMIUM_QUESTION]\t\t:${problemName}. Marking this as solved.`);
          await FileManager.setSolvedProblemSet(problemName);
          await FileManager.recordSubmissionResult(problemName, {
            status: 'premium',
            verdict: 'Premium',
            reason: 'Premium problem could not be submitted.',
            countAttempt: false,
          });
          return;
        }
      } catch (_) {
      }

      Logger.success(`[SOLVING]\t\t\t:${problemName}`);

      const {code, language, solutions = []} = await FileManager.getProblemDetails(problemName);
      savedLanguage = language;
      const validSolutions = solutions.filter((solution) => solution?.code && solution?.language);
      if (!validSolutions.length && (!code || !language)) {
        Logger.error(`[SKIPPING]\t\t\t:${problemName} has no code or language saved.`);
        await FileManager.recordSubmissionResult(problemName, {
          status: 'skipped',
          language,
          reason: 'Missing code or language in the local problem JSON.',
          countAttempt: false,
        });
        return;
      }

      const attempts = validSolutions.length ? validSolutions : [{code, language}];
      let lastResult = null;
      for (let index = 0; index < attempts.length; index++) {
        lastResult = await this.#trySolution(page, problemName, attempts[index], index + 1, attempts.length);
        if (lastResult.status === 'accepted') {
          await sleep(1);
          return;
        }
      }

      const verdictError = new Error(`${problemName} ${lastResult?.verdict || 'not accepted'} after ${attempts.length} language attempt(s).`);
      verdictError.verdict = lastResult?.verdict || null;
      verdictError.language = attempts[attempts.length - 1]?.language || savedLanguage;
      throw verdictError;
    } catch (err) {
      Logger.error(`[FAILED]\t\t: Failed to solve the ${problemName} problem with error`, err);
      await FileManager.recordSubmissionResult(problemName, {
        status: 'failed',
        verdict: err?.verdict || null,
        language: err?.language || savedLanguage,
        reason: err?.verdict ? 'LeetCode returned a non-accepted verdict.' : 'Solver failed before an accepted verdict was recorded.',
        message: err?.message || String(err),
      });
    }
  }

  static async #solveProblems(problemNames) {
    for (const problemName of problemNames) {
      const checkIfSolved = await this.#checkIfSolvedEarlier(problemName);
      if (!checkIfSolved) {
        await this.#solveProblemWithName(problemName);
      } else {
        Logger.success(`[SOLVED_EARLIER]\t\t:${problemName}`);
      }
    }
  }

  static async solve() {
    Logger.success('[SOLVER] Starting...');
    const allProblemsName = await FileManager.getAllProblemsNames();
    Logger.success(`[QUEUED]\t\t\t:${allProblemsName.length} problems to process`);
    await this.#solveProblems(allProblemsName);
    Logger.success('[SOLVER] Done.');
  }
}

export default LeetmationSolver;
