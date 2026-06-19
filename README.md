<h1 align="center">Leetmation</h1>

<p align="center">
  Automate login, solving, and scraping on LeetCode so you can focus on learning — not busywork.
</p>

---

## Important notes

1. Works on **LeetCode's newer dynamic layout** only.
2. **Windows only** for now.
3. **Use responsibly** and in line with LeetCode's terms.
4. **Privacy:** no data is sent anywhere outside your machine by this tool.

Leetmation is built to make problem-solving and scraping more efficient. With its automated flow, **Leetmation can solve on the order of ~200 problems in about an hour** (network and UI permitting).

## Features

1. ### Automated problem solving  
   Automates solving LeetCode questions from your saved solutions.

2. ### Seamless login  
   Handles authentication via a persistent Chrome profile.

3. ### Solution scraping  
   Scrapes and organizes accepted solutions into a local archive.

4. ### Resume where you left off  
   Remembers solved problem names so runs can continue after interruption.

## Usage disclaimer

Leetmation is for **educational use**. Do not use it to misrepresent your progress or break LeetCode's rules. Always follow [LeetCode's terms of service](https://leetcode.com/terms/) and community guidelines.

## Getting started

1. Clone the repo.
   ```bash
   git clone https://github.com/vettri06/Leetmation
   ```
2. Open the project in your editor.
3. In the terminal: `yarn install`
4. Create a `.env` in the project root:
   ```text
   ; Used only for the local Chrome profile folder name.
   USER_EMAIL=your_email_here
   ; Chrome → chrome://version/ → Executable Path
   GOOGLE_CHROME_EXECUTABLE_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
   ```
5. Run: `node index.js`

### Where data lives

| Kind | Path |
|------|------|
| Scraped solutions | `./UserData/your_email/LeetmationData/ScrapedSolutions` |
| Solved problem list (resume) | `./UserData/your_email/LeetmationData/SolvedProblems.json` |
| Chrome profile (stay logged in) | `./UserData/your_email/ProfileData` |

## Compatibility

Leetmation targets **Windows**. Behavior on macOS is not supported today.

## License

Open source under the [MIT License](LICENSE). Free to use and modify for fun or learning; no warranty.
