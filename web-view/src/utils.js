// Function to wrap code blocks with a custom HTML tag for styling
export function highlightCodeBlocks(text) {
  // Regular expression to match code blocks enclosed within triple backticks
  const codeBlockRegex = /```[^`]+?```/g;

  return text.replace(codeBlockRegex, (match) => {
    const cardTitle = match.split(`\n`);
    return `
    <div class="card">
    <div class="top">
      <div class="circle__container">
        <span class="red circle"></span>
        <span class="yellow circle"></span>
        <span class="green circle"></span>
      </div>
  
        <h2 id="code__language">${cardTitle[0].replace("```", "")}</h2>
    </div>
      <textarea readonly="" id='code'>
      ${match}</textarea>
  </div>`;
  });
}

export function promptInstruction(prompt) {
  return `You're going to be used mostly in a development environment like vscode, if a question is asked and the answer involves you returning a code example as part of your answer. wrap only the code example in-between the <pre><code></code></pre> html element. otherwise if the question is not code related, you can just format them with proper html tags so that it is easy to display the answer on the web.Here is the question: ${prompt}
 `;
}
