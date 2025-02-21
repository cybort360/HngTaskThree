const outputContainer = document.getElementById("output-container");
const inputText = document.getElementById("input-text");
const sendBtn = document.getElementById("send-btn");

const isChromeAISupported = () => {
  return (
    chrome &&
    chrome.experimental &&
    chrome.experimental.languageDetector &&
    chrome.experimental.translate &&
    chrome.experimental.summarize
  );
};

function showError(message, duration = 5000) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    ${!isChromeAISupported() ? '<div class="warning">Chrome AI features not supported</div>' : ""}
  `;
  outputContainer.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), duration);
}

async function detectLanguage(text) {
  if (!isChromeAISupported()) {
    showError("Language detection requires Chrome AI support");
    return null;
  }

  try {
    const result = await chrome.experimental.languageDetector.detect({ text });
    return result.languageCode || "unknown";
  } catch (error) {
    showError(`Language detection failed: ${error.message}`);
    return null;
  }
}

async function summarizeText(text) {
  if (!isChromeAISupported()) {
    showError("Summarization requires Chrome AI support");
    return null;
  }

  try {
    const result = await chrome.experimental.summarize({
      text,
      config: {
        format: "bullets",
        length: "brief",
      },
    });
    return result.summary || "No summary available";
  } catch (error) {
    showError(`Summarization failed: ${error.message}`);
    return null;
  }
}

async function translateText(text, targetLang) {
  if (!isChromeAISupported()) {
    showError("Translation requires Chrome AI support");
    return null;
  }

  try {
    const result = await chrome.experimental.translate({
      text,
      targetLang,
      options: {
        preserveFormatting: true,
      },
    });
    return result.translatedText || text;
  } catch (error) {
    showError(`Translation failed: ${error.message}`);
    return null;
  }
}

function createMessageElement(text, type = "user") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = `
    <div class="content">${text}</div>
    <div class="timestamp">${new Date().toLocaleTimeString()}</div>
  `;
  return messageDiv;
}

async function handleUserInput() {
  if (!isChromeAISupported()) {
    showError("This browser doesn't support Chrome AI features");
    return;
  }

  const text = inputText.value.trim();
  if (!text) {
    showError("Please enter some text");
    return;
  }

  try {
    inputText.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<div class="loader"></div>`;

    const messageElement = createMessageElement(text, "user-message");
    outputContainer.appendChild(messageElement);
    inputText.value = "";

    const processingIndicator = createMessageElement("Processing...", "system-message");
    outputContainer.appendChild(processingIndicator);

    const detectedLang = await detectLanguage(text);
    if (detectedLang) {
      messageElement.innerHTML += `
        <div class="language-tag">
          Detected language: ${detectedLang.toUpperCase()}
        </div>
      `;
    }

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "actions";

    if (text.length > 50) {
      const summarizeBtn = document.createElement("button");
      summarizeBtn.className = "ai-action";
      summarizeBtn.innerHTML = `
        <span>Summarize</span>
        <div class="loader" hidden></div>
      `;
      summarizeBtn.onclick = async () => {
        try {
          summarizeBtn.disabled = true;
          summarizeBtn.querySelector(".loader").hidden = false;

          const summary = await summarizeText(text);
          if (summary) {
            const summaryElement = createMessageElement(
              `
              <strong>Summary:</strong><br>${summary}
            `,
              "summary-message"
            );
            outputContainer.appendChild(summaryElement);
          }
        } finally {
          summarizeBtn.disabled = false;
          summarizeBtn.querySelector(".loader").hidden = true;
        }
      };
      actionsDiv.appendChild(summarizeBtn);
    }

    const translateSelect = document.createElement("select");
    translateSelect.innerHTML = `
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
      <option value="de">German</option>
      <option value="zh">Chinese</option>
    `;

    const translateBtn = document.createElement("button");
    translateBtn.className = "ai-action";
    translateBtn.innerHTML = `
      <span>Translate</span>
      <div class="loader" hidden></div>
    `;
    translateBtn.onclick = async () => {
      try {
        translateBtn.disabled = true;
        translateBtn.querySelector(".loader").hidden = false;

        const translation = await translateText(text, translateSelect.value);
        if (translation) {
          const translationElement = createMessageElement(
            `
            <strong>${translateSelect.selectedOptions[0].text} Translation:</strong><br>${translation}
          `,
            "translation-message"
          );
          outputContainer.appendChild(translationElement);
        }
      } finally {
        translateBtn.disabled = false;
        translateBtn.querySelector(".loader").hidden = true;
      }
    };

    actionsDiv.appendChild(translateSelect);
    actionsDiv.appendChild(translateBtn);
    messageElement.appendChild(actionsDiv);

    processingIndicator.remove();
  } catch (error) {
    showError(`Operation failed: ${error.message}`);
  } finally {
    inputText.disabled = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    `;
    outputContainer.scrollTop = outputContainer.scrollHeight;
  }
}

sendBtn.addEventListener("click", handleUserInput);
inputText.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});

if (!isChromeAISupported()) {
  showError("This application requires Chrome browser with AI features enabled", 0);
}
