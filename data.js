import dotenv from 'dotenv';

dotenv.config();

export const GOOGLE_CHROME_EXECUTABLE_PATH = process.env.GOOGLE_CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

export const USER_EMAIL = process.env.USER_EMAIL || 'temp@temp.com';

/**
 * Chrome Profile directory
 */
export const CHROME_PROFILE_PATH = `./UserData/${USER_EMAIL}/ProfileData`;
/**
 * User Leetcode Data Directory
 */
export const LEETMATION_DATA_PATH = `./UserData/${USER_EMAIL}/LeetcoderData`;
/**
 * User Leetcode Data Directory
 */
export const LEETMATION_SCRAPED_SOLUTIONS_PATH = `${LEETMATION_DATA_PATH}/ScrapedSolutions`;
/**
 * Solved Problems are stored in this location so that the bot can continue solving from the unsolved problems.
 */
export const SOLVED_PROBLEMS_PATH = `${LEETMATION_DATA_PATH}/SolvedProblems.json`;
/**
 * Submission results are stored here so failed submissions can be reviewed and fixed later.
 */
export const SUBMISSION_REPORT_PATH = `${LEETMATION_DATA_PATH}/SubmissionReport.json`;
/**
 * Current and historical failed submissions are stored here for quick fixing.
 */
export const FAILED_SUBMISSIONS_PATH = `${LEETMATION_DATA_PATH}/FailedSubmissions.json`;
