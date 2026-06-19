import Logger from "./utils/Logger.js";
import chalk from "chalk";
import readline from 'readline';
import LeetmationAuthenticator from "./leetmation/LeetmationAuthenticator.js";
import {EXITING_LEETMATION, LEETMATION_ASCII_ART, LEETMATION_MODE_QUESTION} from "./utils/constants.js";
import LeetmationSolver from "./leetmation/LeetmationSolver.js";
import {closeBrowser} from "./managers/BrowserManager.js";
import LeetmationScraper from "./leetmation/LeetmationScraper.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const printBanner = () => {
  const lines = LEETMATION_ASCII_ART.split('\n');
  const colors = ['#FFD700', '#FFCC00', '#FFC000', '#FFB200', '#FFA500', '#FF9500', '#FF8500', '#FF7700', '#FF6600'];
  lines.forEach((line, i) => {
    const color = colors[Math.min(i, colors.length - 1)];
    console.log(chalk.hex(color)(line));
  });
  console.log(chalk.hex('#FFA500')(LEETMATION_MODE_QUESTION));
};

(async () => {
  try {
    printBanner();
    const type = await question('Select mode (1, 2 or other): ');

    if (type === '1') {
      await LeetmationAuthenticator.loginUser();
      await LeetmationSolver.solve();
    } else if (type === '2') {
      await LeetmationAuthenticator.loginUser();
      await LeetmationScraper.scrapeAcceptedSolutions();
    } else if (type === '3') {
      await LeetmationAuthenticator.loginUser();
      await LeetmationScraper.scrapeAcceptedSolutionsGlobally();
    }
  } catch (err) {
    Logger.error('Something went wrong!', err);
  } finally {
    Logger.success(EXITING_LEETMATION);
    rl.close();
    await closeBrowser();
    process.exit();
  }
})();