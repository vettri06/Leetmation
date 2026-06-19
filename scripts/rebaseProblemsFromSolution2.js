import {promises as fs} from 'fs';
import {readFileSync} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {LEETMATION_DATA_PATH} from '../data.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problemsDir = path.join(rootDir, 'problems');
const solutionRoot = path.join(rootDir, 'solution2', 'leetcode', 'solution');
const reportPath = path.join(rootDir, LEETMATION_DATA_PATH, 'Solution2RebaseReport.json');

const extToLanguage = new Map([
  ['.cpp', 'cpp'],
  ['.java', 'java'],
  ['.py', 'python3'],
  ['.sql', 'mysql'],
  ['.js', 'javascript'],
  ['.ts', 'typescript'],
  ['.cs', 'csharp'],
  ['.go', 'golang'],
  ['.kt', 'kotlin'],
  ['.swift', 'swift'],
  ['.rs', 'rust'],
  ['.c', 'c'],
  ['.rb', 'ruby'],
  ['.scala', 'scala'],
  ['.sh', 'bash'],
]);

const languagePriority = [
  'python3',
  'c',
  'cpp',
  'java',
  'golang',
  'javascript',
  'typescript',
  'csharp',
  'mysql',
  'rust',
  'kotlin',
  'swift',
  'ruby',
  'scala',
  'bash',
];

const protectedLocalFixes = new Set([
  'apply-operations-to-make-all-array-elements-equal-to-zero',
  'avoid-flood-in-the-city',
  'basic-calculator',
  'brick-wall',
]);

function slugify(title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/`/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function walk(dir) {
  const output = [];
  const items = await fs.readdir(dir, {withFileTypes: true});
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      output.push(...await walk(fullPath));
    } else {
      output.push(fullPath);
    }
  }
  return output;
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function sourceRank(file) {
  const solutionMatch = file.basename.match(/^Solution(\d*)\./);
  const variant = solutionMatch?.[1] ? Number(solutionMatch[1]) : 0;
  const languageRank = languagePriority.indexOf(file.language);
  return [
    variant,
    languageRank === -1 ? Number.MAX_SAFE_INTEGER : languageRank,
    file.basename,
  ];
}

function compareRank(a, b) {
  const left = sourceRank(a);
  const right = sourceRank(b);
  for (let i = 0; i < left.length; i++) {
    if (left[i] < right[i]) return -1;
    if (left[i] > right[i]) return 1;
  }
  return 0;
}

function isCompatibleCandidate(file) {
  if (file.language !== 'cpp') return true;

  const code = readFileSync(file.absolutePath, 'utf8');
  return !/\.contains\s*\(|ranges::|std::ranges|\.starts_with\s*\(|\.ends_with\s*\(|\bssize\s*\(/.test(code);
}

function compatibleCandidates(entry) {
  const sorted = [...entry.files].sort(compareRank);
  return sorted.filter(isCompatibleCandidate);
}

function chooseSource(entry) {
  return compatibleCandidates(entry)[0] || [...entry.files].sort(compareRank)[0] || null;
}

function sourceCandidatePayload(entry) {
  return compatibleCandidates(entry).map((file) => ({
    language: file.language,
    sourcePath: file.relativePath,
    sourceFile: file.basename,
  }));
}

async function collectSolutionEntries() {
  const files = (await walk(solutionRoot))
    .filter((file) => /^Solution\d*\.[^.]+$/.test(path.basename(file)))
    .map((file) => {
      const extension = path.extname(file).toLowerCase();
      return {
        absolutePath: file,
        relativePath: path.relative(rootDir, file).replace(/\\/g, '/'),
        basename: path.basename(file),
        extension,
        language: extToLanguage.get(extension),
      };
    })
    .filter((file) => file.language);

  const byFolder = new Map();
  for (const file of files) {
    const folder = path.basename(path.dirname(file.absolutePath));
    const match = folder.match(/^(\d+)\.(.+)$/);
    if (!match) continue;

    const problemId = Number(match[1]);
    const title = match[2].trim();
    const slug = slugify(title);
    if (!slug) continue;

    if (!byFolder.has(folder)) {
      byFolder.set(folder, {
        folder,
        problemId,
        title,
        slug,
        files: [],
      });
    }
    byFolder.get(folder).files.push(file);
  }

  return [...byFolder.values()].sort((a, b) => a.problemId - b.problemId || a.slug.localeCompare(b.slug));
}

async function main() {
  const entries = await collectSolutionEntries();
  const existingFiles = await fs.readdir(problemsDir);
  const existingSlugs = new Set(existingFiles.filter((file) => file.endsWith('.json')).map((file) => path.basename(file, '.json')));

  const report = {
    sourceRoot: path.relative(rootDir, solutionRoot).replace(/\\/g, '/'),
    imported: 0,
    updated: 0,
    created: 0,
    protectedLocalFixes: [],
    skipped: [],
    entries: [],
  };

  for (const entry of entries) {
    const targetPath = path.join(problemsDir, `${entry.slug}.json`);
    const existing = await readJsonIfExists(targetPath);

    if (protectedLocalFixes.has(entry.slug) && existing?.code) {
      const sourceCandidates = sourceCandidatePayload(entry);
      const payload = {
        ...existing,
        problemName: entry.slug,
        problemId: entry.problemId,
        title: entry.title,
        problemUrl: `https://leetcode.com/problems/${entry.slug}/`,
        sourceCollection: 'solution2/leetcode/solution',
        sourceCandidates,
        rebasePolicy: 'protected-local-fix',
      };
      await fs.writeFile(targetPath, JSON.stringify(payload, null, 4) + '\n');
      report.protectedLocalFixes.push(entry.slug);
      report.entries.push({
        slug: entry.slug,
        status: existingSlugs.has(entry.slug) ? 'updated_metadata_protected_code' : 'created_protected_code',
        problemId: entry.problemId,
        title: entry.title,
        language: payload.language,
        problemUrl: payload.problemUrl,
      });
      continue;
    }

    const chosen = chooseSource(entry);
    if (!chosen) {
      report.skipped.push({
        slug: entry.slug,
        problemId: entry.problemId,
        title: entry.title,
        reason: 'No supported solution file found.',
      });
      continue;
    }

    const code = (await fs.readFile(chosen.absolutePath, 'utf8')).replace(/^\uFEFF/, '').trimEnd();
    const payload = {
      problemName: entry.slug,
      language: chosen.language,
      code,
      problemId: entry.problemId,
      title: entry.title,
      problemUrl: `https://leetcode.com/problems/${entry.slug}/`,
      sourceCollection: 'solution2/leetcode/solution',
      sourcePath: chosen.relativePath,
      sourceFile: chosen.basename,
      sourceCandidates: sourceCandidatePayload(entry),
    };

    await fs.writeFile(targetPath, JSON.stringify(payload, null, 4) + '\n');

    const existed = existingSlugs.has(entry.slug);
    report.imported++;
    if (existed) report.updated++;
    else report.created++;
    report.entries.push({
      slug: entry.slug,
      status: existed ? 'updated' : 'created',
      problemId: entry.problemId,
      title: entry.title,
      language: chosen.language,
      sourcePath: chosen.relativePath,
      problemUrl: payload.problemUrl,
    });
  }

  await fs.mkdir(path.dirname(reportPath), {recursive: true});
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');

  console.log(JSON.stringify({
    discovered: entries.length,
    imported: report.imported,
    updated: report.updated,
    created: report.created,
    protectedLocalFixes: report.protectedLocalFixes.length,
    skipped: report.skipped.length,
    reportPath: path.relative(rootDir, reportPath).replace(/\\/g, '/'),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
