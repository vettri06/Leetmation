# Leetmation

Automate login, solving, and scraping on LeetCode so you can focus on learning — not busywork.

---

> [!IMPORTANT]
> **Key Compatibility Requirements:**
> * Works on **LeetCode's newer dynamic layout** only.
> * Supported on **Windows** operating systems.
> * **Use responsibly** and in line with LeetCode's terms.
> * **Privacy first:** All data is stored locally on your machine.

Leetmation is designed to streamline problem-solving and scraping. With its optimized automation flow, **Leetmation can process on the order of ~200 problems per hour** (network and UI loading speed permitting).

---

## Features

1. **Automated Problem Solving**  
   Automatically loads saved solutions and submits them directly in the LeetCode editor.
2. **Seamless Authentication**  
   Utilizes a persistent local Chrome profile, keeping you logged in and bypassing repeated login hurdles.
3. **Solution Scraping**  
   Scrapes and archives accepted submissions into a structured local repository.
4. **Resumable Runs**  
   Tracks successfully submitted and already solved problems to ensure runs continue where they left off without redundant checks.

---

## Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/vettri06/Leetmation.git
cd Leetmation
yarn install
```

### 2. Configuration
Create a `.env` file in the root directory:
```env
# Profile folder name matching your LeetCode account email
USER_EMAIL=your_email@example.com

# Executable path to your Google Chrome browser
GOOGLE_CHROME_EXECUTABLE_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
```

### 3. Execution
Launch the interactive command line interface:
```bash
node index.js
```

---

## Data Directories & Cache Files

All configurations and solved history are stored locally under the user profile directories:

| Data Type | Path | Description |
| :--- | :--- | :--- |
| **Solved Problems Cache** | `./UserData/<your_email>/LeetcoderData/SolvedProblems.json` | JSON list of problem slugs that have been successfully solved. These are **skipped automatically** on startup. |
| **Submission Reports** | `./UserData/<your_email>/LeetcoderData/SubmissionReport.json` | Detailed telemetry of your solved, failed, and skipped runs. |
| **Scraped Solutions** | `./UserData/<your_email>/LeetcoderData/ScrapedSolutions/` | Folder containing all downloaded accepted solutions. |
| **Chrome Profile Data** | `./UserData/<your_email>/ProfileData/` | Local user profile data containing session cookies and configuration. |

---

## Skip Logic for Already Solved Problems

To optimize speed and prevent redundant checks, Leetmation performs two layers of verification:

1. **In-Memory & Disk Cache Check:**  
   Before navigations occur, Leetmation checks if the problem's slug exists in the local `./UserData/<your_email>/LeetcoderData/SolvedProblems.json` file. If present, it logs `[SOLVED_EARLIER]` and skips it without opening the page.
2. **On-Page Verification:**  
   If a problem is opened but not in the cache, Leetmation inspects the UI for the "Solved" label. If found, it records it in `SolvedProblems.json` and skips it, avoiding unnecessary submissions.

---

## License

Open source under the [MIT License](LICENSE). Free to use and modify.
