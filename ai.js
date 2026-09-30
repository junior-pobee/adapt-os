// ==========================================
// 1. PASSWORD & SECURITY SETUP
// ==========================================

// Your real AQ. API key is hidden securely right here


// Your password
const SECRET_PASSWORD = 'Adapt';

// We start with terminal LOCKED (false)
let isAuthenticated = false;
let API_KEY = "";//user must paste their own key, don't hardcode
// later when user types key, save it only in memory

const commandInput = document.getElementById('commandInput');
const output = document.getElementById('output');

// Clear any old text and print the initial security message immediately
output.innerHTML = '';
printLine('Welcome to ADAPT AI v1.0', 'highlight');
printLine('[SECURITY] Please enter password to unlock terminal:');

// ==========================================
// 2. YOUR TERMINAL LOGIC
// ==========================================

commandInput.addEventListener('keydown', async function(event) {
 if (event.key === 'Enter') {
  const command = commandInput.value.trim();
  if (command === '') return;
  
  // Display user input in the terminal (hide password text for safety if not logged in)
  if (!isAuthenticated) {
   printLine(`> *******`, 'highlight');
  } else {
   printLine(`> ${command}`, 'highlight');
  }
  
  commandInput.value = '';
  
  // Handle password check first if they aren't authenticated yet
  if (!isAuthenticated) {
   if (command === SECRET_PASSWORD) {
    isAuthenticated = true;
    API_KEY = REAL_API_KEY;
    printLine('Access Granted! ADAPT AI Unlocked.', 'highlight');
    printLine('Type help to see available commands.');
   } else {
    printLine('Incorrect password. Access Denied. Try again:');
   }
   return; // Stop here until they get the password right
  }
  
  // Standard commands once unlocked
  if (command.toLowerCase() === 'help') {
   printLine('Available commands: help, clear, or type anything to chat.');
  } else if (command.toLowerCase() === 'clear') {
   output.innerHTML = '';
  } else {
   printLine('Thinking...');
   await fetchGeminiResponse(command);
  }
 }
});

function printLine(text, className = '') {
 const line = document.createElement('div');
 line.className = 'line ' + className;
 line.textContent = text;
 output.appendChild(line);
 output.scrollTop = output.scrollHeight;
}

async function fetchGeminiResponse(message) {
 const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
 
 try {
  const response = await fetch(url, {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': API_KEY
   },
   body: JSON.stringify({
    contents: [{
     parts: [{ text: message }]
    }]
   })
  });
  
  const data = await response.json();
  
  if (data.error) {
   printLine(`Google Error: ${data.error.message}`);
   return;
  }
  
  if (data.candidates && data.candidates[0].content.parts[0].text) {
   const reply = data.candidates[0].content.parts[0].text;
   printLine(reply);
  } else {
   printLine('Error: Unexpected response structure.');
   console.log(data);
  }
 } catch (error) {
  printLine('Error: Connection failed. Check Console.');
  console.error(error);
 }
}