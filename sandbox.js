const outputContainer = document.getElementById("output-container");
const inputText = document.getElementById("input-text");
const sendBtn = document.getElementById("send-btn");

async function detectLanguage(text) {
  try {
    const result = await chrome.experimental.languageDetector.detect({ text });
    return result.languageCode;
  } catch (error) {
    showError("Language detection failed");
    return null;
  }
}

async function summarizeText(text) {
  try {
    const result = await chrome.experimental.summarize({ text });
    return result.summary;
  } catch (error) {
    showError("Summarization failed");
    return null;
  }
}

async function translateText(text, targetLang) {
  try {
    const result = await chrome.experimental.translate({
      text,
      targetLang,
    });
    return result.translatedText;
  } catch (error) {
    showError("Translation failed");
    return null;
  }
}

function createMessageElement(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message";
  messageDiv.textContent = text;
  return messageDiv;
}

async function handleUserInput() {
  const text = inputText.value.trim();
  if (!text) {
    showError("Please enter some text");
    return;
  }

  inputText.value = "";
  const messageElement = createMessageElement(text);
  outputContainer.appendChild(messageElement);

  // Detect language
  const detectedLang = await detectLanguage(text);
  if (detectedLang) {
    const langElement = document.createElement("div");
    langElement.textContent = `Detected language: ${detectedLang}`;
    langElement.style.fontSize = "0.9em";
    langElement.style.color = "#666";
    messageElement.appendChild(langElement);
  }

  // Create action buttons
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "actions";

  // Summarize button
  if (text.length > 150 && detectedLang === "en") {
    const summarizeBtn = document.createElement("button");
    summarizeBtn.textContent = "Summarize";
    summarizeBtn.onclick = async () => {
      summarizeBtn.disabled = true;
      const summary = await summarizeText(text);
      if (summary) {
        const summaryElement = createMessageElement(`Summary: ${summary}`);
        summaryElement.style.marginLeft = "30px";
        outputContainer.appendChild(summaryElement);
      }
      summarizeBtn.disabled = false;
    };
    actionsDiv.appendChild(summarizeBtn);
  }

  // Translate controls
  const translateSelect = document.createElement("select");
  const languages = ["en", "pt", "es", "ru", "tr", "fr"];
  translateSelect.innerHTML = languages
    .map((lang) => `<option value="${lang}">${lang.toUpperCase()}</option>`)
    .join("");

  const translateBtn = document.createElement("button");
  translateBtn.textContent = "Translate";
  translateBtn.onclick = async () => {
    translateBtn.disabled = true;
    const translation = await translateText(text, translateSelect.value);
    if (translation) {
      const translationElement = createMessageElement(`Translation: ${translation}`);
      translationElement.style.marginLeft = "30px";
      outputContainer.appendChild(translationElement);
    }
    translateBtn.disabled = false;
  };

  actionsDiv.appendChild(translateSelect);
  actionsDiv.appendChild(translateBtn);
  messageElement.appendChild(actionsDiv);

  outputContainer.scrollTop = outputContainer.scrollHeight;
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;
  outputContainer.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Event listeners
sendBtn.addEventListener("click", handleUserInput);
inputText.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});
