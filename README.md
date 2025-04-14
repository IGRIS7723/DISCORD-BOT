## Step-by-Step Setup and Running Instructions

Follow these steps carefully to get the bot running:

**Step 1: Prerequisites - Install Node.js and npm**

* You need Node.js installed on your system, as this application is written in JavaScript for the Node.js environment. Installing Node.js usually installs `npm` (Node Package Manager) as well.
* **Check Installation:** Open your terminal or command prompt and type the following commands:
    ```bash
    node -v
    npm -v
    ```
* If these commands show version numbers (e.g., `v18.17.0`, `9.6.7`), you are good to go.
* **Installation:** If not installed, download and install Node.js (LTS version recommended) from the official website: [https://nodejs.org/](https://nodejs.org/)

**Step 2: Get the Bot Code**

* **Download or Clone:** Obtain the project files. If you have `git` installed, clone the repository:
    ```bash
    git clone <your-repository-url>
    cd discord-bot-tui-monitor
    ```
    (Replace `<your-repository-url>` with the actual URL of the code repository).
* Alternatively, download the code as a ZIP file and extract it to a folder on your computer. Navigate into that folder using your terminal (`cd path/to/your/folder`).

**Step 3: Install Dependencies**

* The bot relies on external libraries (`blessed` for the TUI, `axios` for API calls, `dotenv` for configuration). These are listed in the `package.json` file.
* **Install:** Run the following command in your terminal *inside the project folder*:
    ```bash
    npm install
