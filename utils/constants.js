// SCRAPERs XPATH
export const SCRAPER_SUBMITTED_CODE_NAME_XPATH = "/html/body/div[2]/div/div[1]/div/div[1]/h4/a";
export const SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH =
  "/html/body/div[2]/div/div[1]/div/div[2]/div[7]/div/div[1]/div/div[1]/span";
export const SCRAPER_SUBMITTED_CODE_DIV_XPATH =
  "/html/body/div[2]/div/div[1]/div/div[2]/div[7]/div/div[3]/div/div/div[3]/div/div[3]";

// Questions Solver XPath
export const QUESTIONS_CODE_DIV_XPATH =
  "/html/body/div[1]/div[2]/div/div/div[4]/div/div/div[8]/div/div[2]/div[1]/div/div/div[1]/div[2]/div[1]/div[5]";
export const QUESTIONS_SUBMIT_DIV_XPATH =
  "/html/body/div[1]/div[2]/div/div/div[3]/nav/div[2]/div/div[1]/div/div/div[2]/div/div[2]/div/div[3]/div[3]/div/button";
export const QUESTIONS_SUBMIT_ACCEPTED_XPATH =
  "/html/body/div[1]/div[2]/div/div/div[4]/div/div/div[4]/div/div[1]/div[1]/div[2]";
export const QUESTIONS_LANGUAGE_BTN_XPATH =
  "/html/body/div[1]/div[2]/div/div/div[4]/div/div/div[8]/div/div[1]/div[1]/div[1]/button";
export const QUESTIONS_LANGUAGE_DIV_XPATH =
  "/html/body/div[7]/div/div/div/div";
export const IS_SOLUTION_ACCEPTED_DIV_XPATH= "/html/body/div[1]/div[2]/div/div/div[4]/div/div/div[11]/div/div/div/div[2]/div/div[1]/div[1]/div[1]/span";
export const IS_QUESTION_PREMIUM = "/html/body/div[1]/div[2]/div/div/div[4]/div[2]/div/div[2]"

export const LEETMATION_ASCII_ART = `
    ██╗     ███████╗███████╗████████╗███╗   ███╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
    ██║     ██╔════╝██╔════╝╚══██╔══╝████╗ ████║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
    ██║     █████╗  █████╗     ██║   ██╔████╔██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
    ██║     ██╔══╝  ██╔══╝     ██║   ██║╚██╔╝██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
    ███████╗███████╗███████╗   ██║   ██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
    ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

    Developed by : https://github.com/vettri06
    `;

export const LEETMATION_MODE_QUESTION = `
     Select a mode
     [1] Start Leetmation Bot.
     [2] Scrape Solved Leetcode Problems.
     [other] Exit.
    `;

export const EXITING_LEETMATION = `Exiting Leetmation. Goodbye!`;