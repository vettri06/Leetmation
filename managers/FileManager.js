import {promises as fs} from "fs";
import {
  FAILED_SUBMISSIONS_PATH,
  LEETMATION_DATA_PATH,
  LEETMATION_SCRAPED_SOLUTIONS_PATH,
  SOLVED_PROBLEMS_PATH,
  SUBMISSION_REPORT_PATH,
} from "../data.js";
import Logger from "../utils/Logger.js";
import path from 'path';

class FileManager {
  static async getAllProblemsNames() {
    const fileList = await fs.readdir('./problems');
    const files = fileList.map(file => file.split(".")[0]);
    Logger.success(`Total Problems found ${files.length}`, files);
    return files;
  }

  static async getProblemDetails(problemName) {
    const file = await fs.readFile(`./problems/${problemName}.json`, 'utf-8');
    const data = JSON.parse(file);
    const solutions = [{language: data.language, code: data.code, sourcePath: data.sourcePath || null}];
    const seen = new Set([`${data.language}:${data.sourcePath || 'local-primary'}`]);

    for (const candidate of data.sourceCandidates || []) {
      const sourcePath = typeof candidate === 'string' ? candidate : candidate.sourcePath;
      const language = typeof candidate === 'string' ? null : candidate.language;
      if (!sourcePath || !language) continue;

      const key = `${language}:${sourcePath}`;
      if (seen.has(key)) continue;
      seen.add(key);

      try {
        const code = await fs.readFile(sourcePath, 'utf-8');
        solutions.push({
          language,
          code: code.replace(/^\uFEFF/, '').trimEnd(),
          sourcePath,
        });
      } catch (err) {
        Logger.warn(`[SOURCE_CANDIDATE_MISSING]\t:${problemName} -> ${sourcePath}`, err);
      }
    }

    const obj = {language: data.language, code: data.code, solutions};
    Logger.warn(`[PROBLEM_DETAILS]\t\t:`, obj);
    return obj;
  }

  static #solvedProblemSet = null;

  static async #ensureSolvedProblemSetFile() {
    try {
      await fs.access(SOLVED_PROBLEMS_PATH);
    } catch (_) {
      Logger.warn(`${SOLVED_PROBLEMS_PATH} was not found, created the file.`)
      await fs.mkdir(LEETMATION_DATA_PATH, {recursive: true});
      await fs.writeFile(SOLVED_PROBLEMS_PATH, JSON.stringify([]));
    }
  }

  static async getSolvedProblemSet() {
    if (this.#solvedProblemSet) {
      return this.#solvedProblemSet;
    }
    await this.#ensureSolvedProblemSetFile();
    const data = await fs.readFile(SOLVED_PROBLEMS_PATH, 'utf8');
    this.#solvedProblemSet = new Set(JSON.parse(data));
    return this.#solvedProblemSet;
  }

  static async setSolvedProblemSet(problemName) {
    const problemSet = await this.getSolvedProblemSet();
    problemSet.add(problemName);
    Logger.success(`[CACHED]\t\t\t:${problemName}`)
    await fs.writeFile(SOLVED_PROBLEMS_PATH, JSON.stringify(Array.from(problemSet)));
  }

  static async #ensureSubmissionReportFile() {
    try {
      await fs.access(SUBMISSION_REPORT_PATH);
    } catch (_) {
      Logger.warn(`${SUBMISSION_REPORT_PATH} was not found, created the file.`)
      await fs.mkdir(LEETMATION_DATA_PATH, {recursive: true});
      await fs.writeFile(SUBMISSION_REPORT_PATH, JSON.stringify({
        summary: {
          accepted: 0,
          failed: 0,
          skipped: 0,
          alreadySolved: 0,
          premium: 0,
          lastUpdatedAt: null,
        },
        submissions: {},
      }, null, 2));
    }
  }

  static async #ensureFailedSubmissionsFile() {
    try {
      await fs.access(FAILED_SUBMISSIONS_PATH);
    } catch (_) {
      Logger.warn(`${FAILED_SUBMISSIONS_PATH} was not found, created the file.`)
      await fs.mkdir(LEETMATION_DATA_PATH, {recursive: true});
      await fs.writeFile(FAILED_SUBMISSIONS_PATH, JSON.stringify({
        summary: {
          failed: 0,
          lastUpdatedAt: null,
        },
        failures: {},
        history: [],
      }, null, 2));
    }
  }

  static async #recordFailedSubmission(problemName, result, timestamp) {
    await this.#ensureFailedSubmissionsFile();

    const rawFailures = await fs.readFile(FAILED_SUBMISSIONS_PATH, 'utf8');
    const failureReport = JSON.parse(rawFailures);
    const previous = failureReport.failures?.[problemName];
    const failure = {
      problemName,
      verdict: result.verdict || null,
      language: result.language || null,
      reason: result.reason || null,
      message: result.message || null,
      lastFailedAt: timestamp,
      attempts: (previous?.attempts || 0) + 1,
    };

    failureReport.failures = failureReport.failures || {};
    failureReport.history = failureReport.history || [];
    failureReport.failures[problemName] = failure;
    failureReport.history.push(failure);
    failureReport.summary = {
      failed: Object.keys(failureReport.failures).length,
      lastUpdatedAt: timestamp,
    };

    await fs.writeFile(FAILED_SUBMISSIONS_PATH, JSON.stringify(failureReport, null, 2));
    Logger.warn(`[TRACKED_FAILURE]\t\t:${problemName} -> ${FAILED_SUBMISSIONS_PATH}`);
  }

  static async #clearFailedSubmission(problemName, timestamp) {
    await this.#ensureFailedSubmissionsFile();

    const rawFailures = await fs.readFile(FAILED_SUBMISSIONS_PATH, 'utf8');
    const failureReport = JSON.parse(rawFailures);
    if (!failureReport.failures?.[problemName]) return;

    delete failureReport.failures[problemName];
    failureReport.summary = {
      failed: Object.keys(failureReport.failures).length,
      lastUpdatedAt: timestamp,
    };

    await fs.writeFile(FAILED_SUBMISSIONS_PATH, JSON.stringify(failureReport, null, 2));
    Logger.success(`[CLEARED_FAILURE]\t\t:${problemName}`);
  }

  static async recordSubmissionResult(problemName, result) {
    await this.#ensureSubmissionReportFile();

    const rawReport = await fs.readFile(SUBMISSION_REPORT_PATH, 'utf8');
    const report = JSON.parse(rawReport);
    const now = new Date().toISOString();
    const previous = report.submissions?.[problemName];

    report.submissions = report.submissions || {};
    report.submissions[problemName] = {
      problemName,
      status: result.status,
      verdict: result.verdict || null,
      language: result.language || null,
      reason: result.reason || null,
      message: result.message || null,
      lastSubmittedAt: now,
      attempts: (previous?.attempts || 0) + (result.countAttempt === false ? 0 : 1),
    };

    const values = Object.values(report.submissions);
    report.summary = {
      accepted: values.filter((item) => item.status === 'accepted').length,
      failed: values.filter((item) => item.status === 'failed').length,
      skipped: values.filter((item) => item.status === 'skipped').length,
      alreadySolved: values.filter((item) => item.status === 'already_solved').length,
      premium: values.filter((item) => item.status === 'premium').length,
      lastUpdatedAt: now,
    };

    await fs.mkdir(LEETMATION_DATA_PATH, {recursive: true});
    await fs.writeFile(SUBMISSION_REPORT_PATH, JSON.stringify(report, null, 2));

    if (result.status === 'failed') {
      await this.#recordFailedSubmission(problemName, result, now);
    } else if (result.status === 'accepted') {
      await this.#clearFailedSubmission(problemName, now);
    }
  }

  static async saveScrapedSolution(fileContent) {
    const name = fileContent.problemName;
    await fs.mkdir(LEETMATION_SCRAPED_SOLUTIONS_PATH, {recursive: true});
    const filePath = path.join(LEETMATION_SCRAPED_SOLUTIONS_PATH, `${name}.json`);

    try {
      await fs.access(filePath);
      Logger.warn(`[ALREADY_SCRAPPED]\t\t:${name}`);
    } catch (error) {
      Logger.warn(`[SAVING]\t\t\t:${name}`);
      try {
        await fs.writeFile(filePath, JSON.stringify(fileContent, null, 4));
        Logger.success(`[SAVED]\t\t\t\t:${name}`);
      } catch (err) {
        Logger.success(`[FAILED]\t\t\t:${name}`, err);
      }
    }
  }
}

export default FileManager;
