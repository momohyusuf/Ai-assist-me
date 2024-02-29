// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("node:fs");
const path = require("node:path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const globalState = context.globalState;

  // Check if the key is already stored in global state
  const googleApiKey = globalState.get("ai-assist-me.googleApiKey");

  if (googleApiKey) {
    fs.writeFileSync(
      vscode.Uri.joinPath(context.extensionUri, "web-view", "config.js").fsPath,
      `export const GOOGLE_API_KEY = '${googleApiKey}';`,
      "utf-8"
    );
  }

  let disposable = vscode.commands.registerCommand(
    "ai-assist-me.start",
    async function () {
      // check for google api key
      if (!googleApiKey) {
        // Prompt the user for their key google api key
        let key = await vscode.window.showInputBox({
          prompt: `If you have already entered the google Api key, please restart your vscode. Otherwise
             Please enter you google api key. Get your key from: https://aistudio.google.com/`,
          placeHolder: "Please enter your google API key",
        });

        if (!key) {
          vscode.window.showErrorMessage(
            "Invalid activation key. Please try again."
          );
          return;
        }
        // then save the google key to the global state so it is easy for user to always comeback to your app

        // send a prompt to validate the google Api key
        const genAI = new GoogleGenerativeAI(key.trim());

        try {
          // this prompt is run with hello just to validate the google api key provided

          // For text-only input, use the gemini-pro model
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent("Hello");
          const response = await result.response;
          const text = response.text();

          if (text) {
            globalState.update("ai-assist-me.googleApiKey", key.trim());
            fs.writeFileSync(
              vscode.Uri.joinPath(context.extensionUri, "web-view", "config.js")
                .fsPath,
              `export const GOOGLE_API_KEY = '${key.trim()}';`,
              "utf-8"
            );
            vscode.window.showInformationMessage("Activated successfully");
          }
        } catch (error) {
          console.log(error);
          vscode.window.showErrorMessage(
            "API key not valid. Please pass a valid API key. Please try again."
          );
          return;
        }
      }

      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        "ai-assist-me", // Identifies the type of the webview. Used internally
        "AI assist me", // Title of the panel displayed to the user
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        {
          enableScripts: true, // Enable scripts in the webview
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "web-view")),
          ],
        }
      );

      // And set its HTML content
      panel.webview.html = getWebviewContent(panel, context);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

// for displaying the webview
function getWebviewContent(panel, context) {
  const { webview } = panel;
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "/web-view", "output.css")
  );

  const imageUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "/web-view", "bmc-button.svg")
  );
  const nonce = getNonce();

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "/web-view/src", "app.js")
  );

  return `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />	
    <title>Document</title>
    <link rel="stylesheet" href=${styleUri}/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
    <script type="importmap" crossorigin='anonymous' nonce="${nonce}">
    {
      "imports": {
        "@google/generative-ai": "https://esm.run/@google/generative-ai"
      }
    }
    </script>
  </head>
  <body>
 <section class="content">
 <header>
  <h1>Welcome to "AI assist me"</h1>
  <p>Easily run your prompts inside vscode. Powered by Google Gemini AI</p>
  <p>If you find the extension useful and would like to support me, you can </p>
 <div id="bmc__image__container">
  <a id="buy__me__coffee_link" href="https://www.buymeacoffee.com/momoh">
  <img id="bmc__icon" src=${imageUri} alt="bmc-icon" />
  </a></div>
</header>
    <main>
      <section id="response__container__main">
    </section>  
      <section id="loader__container">
    <div id="loader">
  <div class="loader__circle">
    <div class="dot"></div>
    <div class="outline"></div>
  </div>
  <div class="loader__circle">
    <div class="dot"></div>
    <div class="outline"></div>
  </div>
  <div class="loader__circle">
    <div class="dot"></div>
    <div class="outline"></div>
  </div>
  <div class="loader__circle">
    <div class="dot"></div>
    <div class="outline"></div>
  </div>
</div>
</div>
      </section>

  <footer>  
    <div class="InputContainer">
        <textarea row="3" placeholder="Type here...." id="question__input__field" class="input" name="text" type="text" autofocus spellcheck="true"></textarea>
    </div>
          <button
           id="value__btn"
          class="cssbuttons__io__button">
             Start
          <div class="icon">
         <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none"></path>
              <path
                d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          </button>
    </footer>
    </main>
    </section>
    <script src=${scriptUri} nonce="${nonce}" type="module"></script>
  </body>
</html>`;
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

{
  /*  */
}

// <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src 'self'">
