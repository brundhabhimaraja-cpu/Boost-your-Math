const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chips = document.querySelectorAll('.chip');

const PROXY_URL = 'https://vibe-proxy-gqv4.onrender.com/v1/chat/completions';
const PROXY_AUTH = 'Bearer sk-vibe-summer-2026';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addMessage(text, sender = 'bot') {
  const message = document.createElement('div');
  message.className = `message ${sender}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const label = sender === 'bot' ? '✨ Coach Mia' : '🧑‍🏫 You';
  bubble.innerHTML = `<div style="font-weight:700; margin-bottom:6px;">${escapeHtml(label)}</div><div>${escapeHtml(text)}</div>`;

  message.appendChild(bubble);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'message bot';
  typing.innerHTML = `
    <div class="typing" aria-label="Typing indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  typing.id = 'typingIndicator';
  chatWindow.appendChild(typing);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typingIndicator');
  if (typing) {
    typing.remove();
  }
}

async function getBotReply(message) {
  try {
    // Build a standard POST request with fetch().
    // The browser sends the user's message to the classroom proxy and waits for a reply.
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: PROXY_AUTH
      },
      body: JSON.stringify({
        model: 'class-chat-model',
        messages: [{ role: 'user', content: message }]
      })
    });

    // If the server does not respond successfully, stop and show an error.
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Parse the JSON response and pull the assistant text from the expected path:
    // data.choices[0].message.content
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'I could not find an answer in the response.';

    return reply;
  } catch (error) {
    console.error('Proxy request failed:', error);
    return 'I hit a tiny snag while talking to the classroom proxy. Please try again.';
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const message = userInput.value.trim();
  if (!message) {
    return;
  }

  addMessage(message, 'user');
  userInput.value = '';
  showTyping();

  const reply = await getBotReply(message);
  removeTyping();
  addMessage(reply, 'bot');
}

chatForm.addEventListener('submit', handleSubmit);

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    userInput.value = chip.dataset.message;
    chatForm.requestSubmit();
  });
});

addMessage("Hi! I’m Coach Mia 🧮 I’m your cheerful algebra coach. Ask me anything from simple equations to grade 12 algebra.", 'bot');
