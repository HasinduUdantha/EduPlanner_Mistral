<!DOCTYPE html>
<html lang="en">
<body>

<h1>EduPlanner: Personalized Study Planning with GenAI</h1>

<p class="blockquote">
EduPlanner is a <span class="highlight">privacy-first, AI-powered</span> mobile app that helps students generate personalized, day-wise study plans. Leveraging a fine-tuned Large Language Model (LLM), EduPlanner adapts to each learner’s goals, pace, and motivation—ensuring a smarter, more engaging learning journey.
</p>

<img width="353" height="736" alt="Login" src="https://github.com/user-attachments/assets/4c10b0b7-eec4-4b66-b1d3-9b198508b574" />

<img width="353" height="736" alt="Signup" src="https://github.com/user-attachments/assets/45475f51-7e4c-4fb4-96c7-07024b7c088c" />

<img width="353" height="736" alt="HOME" src="https://github.com/user-attachments/assets/bffef0dc-1b23-423a-878a-538a501f45ce" />

<img width="353" height="736" alt="Plans" src="https://github.com/user-attachments/assets/2cf363e5-3b54-4339-9628-524edbae92ed" />

<img width="353" height="736" alt="Plans progress" src="https://github.com/user-attachments/assets/aea9e6fc-41a5-4e9b-8f7d-468c865f18cf" />

<img width="350" height="722" alt="plan" src="https://github.com/user-attachments/assets/fa52dedf-f5a0-4443-8bb8-984cdc56d3a2" />

<img width="353" height="736" alt="progress2" src="https://github.com/user-attachments/assets/a583edc9-c147-4145-a308-95d33a0dd9c0" />

<img width="353" height="736" alt="progress" src="https://github.com/user-attachments/assets/36d40d58-3c6d-46ae-87fa-cf7e51ab0435" />

<h2>✨ Features</h2>
<div class="features">
<ul>
  <li><span class="bold">Personalized Plans:</span> Structured multi-day study schedules in JSON format—tailored to your subject, level, and daily availability.</li>
  <li><span class="bold">Motivational Support:</span> Get motivational quotes, reminders, and in-app feedback to keep your learning on track!</li>
  <li><span class="bold">Privacy-Preserving AI:</span> All LLM inference runs locally via <span class="highlight">Ollama</span>—your data never leaves your device.</li>
  <li><span class="bold">Easy-to-Use UI:</span> Built in <span class="highlight">React Native (Expo)</span> for cross-platform (iOS & Android) use.</li>
</ul>
</div>

<h2>🔧 System Architecture</h2>
<ul>
  <li><span class="bold">Presentation Layer:</span> <span>Mobile UI (React Native)</span></li>
  <li><span class="bold">Application Layer:</span> <span>Node.js & Express.js backend API</span></li>
  <li><span class="bold">Data Layer:</span> <span>MongoDB Atlas for user profiles and study plans</span></li>
  <li><span class="bold">Model Layer:</span> <span>Fine-tuned Llama-3.2-3B model, deployed locally using Ollama</span></li>
</ul>

<h2>📚 Dataset</h2>
<ul>
  <li><span class="bold">Custom educational dataset</span> in <code>EduPlanner_Dataset.xlsx</code>, organized by subject, level, and daily time.</li>
  <li>Covers CS, Data Science, AI, Web, Cybersecurity, and more!</li>
</ul>

<h2>🛠️ Technology Stack</h2>
<table>
  <tr><th>Layer</th><th>Technology</th></tr>
  <tr><td>Frontend</td><td>React Native, Expo</td></tr>
  <tr><td>Backend</td><td>Node.js, Express.js</td></tr>
  <tr><td>Database</td><td>MongoDB Atlas</td></tr>
  <tr><td>AI/ML</td><td>Llama-3.2-3B (Unsloth), Ollama local engine</td></tr>
  <tr><td>DevOps</td><td>Google Colab, VS Code, GitHub Actions</td></tr>
</table>

<h2>🚀 Model Training & Evaluation</h2>
<ul>
  <li>Loss improved from <span class="bold">0.8758</span> to <span class="bold">0.0153</span> over 200 steps (Unsloth fine-tuning)</li>
  <li>Generates valid JSON plans in &lt;20 seconds</li>
  <li>Beats Mistral-7B and Phi-3.5-mini models for plan quality, relevance, and format</li>
  <li><span class="bold">JSON output is 100% valid</span>—ready for app use</li>
</ul>

<h2>🌍 Contributions</h2>
<ul>
  <li><span class="bold">Innovation:</span> First open educational planner with locally fine-tuned, domain-specific LLM</li>
  <li><span class="bold">Research:</span> Fills the gap in AI-driven, personalized study scheduling</li>
  <li><span class="bold">Extensible:</span> Easy to extend to new subjects, learning styles, or languages</li>
</ul>

<h2>⚡ Getting Started</h2>
<ol>
  <li>Clone the repository:<br>
    <code>git clone https://github.com/HasinduUdantha/EduPlanner.git</code><br>
    <code>cd eduplanner-genai</code></li>
  <li>Mobile App:<br>
    <code>cd EduPlannerMobile</code><br>
    <code>npm install</code><br>
    <code>expo start</code></li>
  <li>Backend API server:<br>
    <code>cd eduplanner-backend</code><br>
    <code>npm install</code><br>
    <code>npm start</code></li>
  <li>Run the model with Ollama:<br>
    Download Ollama and import your fine-tuned <code>https://huggingface.co/Hasindu21/llama_3.2_gguf_model</code> model.<br>
    Update backend <code>.env</code> to point to the local AI server.
  </li>
</ol>

<h2>📜 License</h2>
<p>
<span class="highlight">Academic, educational, and research use only.</span>
Contact the author for commercial usage.
</p>

<hr>
<p><strong>EduPlanner:</strong><br>
Bringing truly personalized, private, and engaging study planning to every learner—powered by ethical AI you control.</p>

</body>
</html>
