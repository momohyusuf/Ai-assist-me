import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_API_KEY } from '../config.js';
import { highlightCodeBlocks, promptInstruction } from './utils.js';

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const QUESTION_INPUT_FIELD = document.getElementById('question__input__field');
const LOADER = document.getElementById('loader');
const VALUE_BTN = document.getElementById('value__btn');
const RESPONSE_CONTAINER = document.getElementById('response__container__main');

VALUE_BTN.addEventListener('click', async () => {
  if (!QUESTION_INPUT_FIELD.value.trim()) {
    return;
  }
  loaderToggler();
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const promptInstructions = promptInstruction(
      QUESTION_INPUT_FIELD.value.trim()
    );
    const prompt = promptInstructions;

    // Use streaming with text-only input
    const result = await model.generateContentStream(prompt);

    let text = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      console.log(chunkText);
      text += chunkText;
      RESPONSE_CONTAINER.innerHTML = `<pre id="response__container">${formatResponse(
        text
      )}</pre>`;
    }

    if (!text) {
      RESPONSE_CONTAINER.innerHTML = `<div id="response__container">An error occured try again</div>`;
      loaderToggler();
      return;
    }

    loaderToggler();
    QUESTION_INPUT_FIELD.value = '';
  } catch (error) {
    console.log(error);
    RESPONSE_CONTAINER.innerHTML = `<div id="response__container">${
      `${error.message}. Please try again` || 'An error occurred try again'
    }</div>`;
    loaderToggler();
  }
});

//
function handleBoldHTMLTagsInResponse(params) {
  const boldTextRegex = /\*\*(.*?)\*\*/g;
  const updatedText = params.replace(boldTextRegex, '<strong>$1</strong>');
  return updatedText;
}

//
function handleHTMLTagsInResponse(params) {
  const tagRegex = /`<(.*?)>`/g;
  const updatedText = params.replace(tagRegex, '&lt;$1&gt;');
  return updatedText;
}

function formatResponse(text) {
  // check for strong text in response
  const checkBoldText = handleBoldHTMLTagsInResponse(text);

  // check for html input tags in response after you've check for bold texts
  const checkForHTMLTagsInResponse = handleHTMLTagsInResponse(checkBoldText);

  // lastly check for code blocks in the response
  return highlightCodeBlocks(checkForHTMLTagsInResponse);
}

// for toggling the loader
function loaderToggler() {
  // Check if the class is already present
  if (LOADER.classList.contains('loader')) {
    // If yes, remove it
    LOADER.classList.remove('loader');
  } else {
    // If no, add it
    LOADER.classList.add('loader');
  }
}
