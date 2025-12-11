# 🤖 AI Chatbot (HTML, CSS, JavaScript, Flask & Google Gemini API)

A fully functional AI-powered chatbot built using **HTML, CSS, JavaScript**, with a backend powered by **Python Flask** and **Google Gemini API**.  
This chatbot supports real-time interaction, typing animation, chat history, and a clean modern UI.

---
## 🖼️ Screenshots
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/962e0d89-e4bc-4abf-8927-c6098627d48c" />


## 🚀 Features

- Fully responsive and modern UI  
- Real-time chat with typing animation  
- Uses Google **Gemini 2.5 Flash API**  
- Backend built with **Flask**  
- Exponential retry logic for stable API calls  
- Chat history preserved in conversation  
- Markdown-style response rendering  
- Clean, animated chat bubbles  

---

## 🛠️ Tech Stack

### **Frontend**
- HTML5  
- CSS3  
- JavaScript (ES6+)  
- Google Fonts (Inter)

### **Backend**
- Python (Flask)
- Flask-CORS  
- Requests library

### **AI / Cloud**
- Google Gemini API  
- Model: `gemini-2.5-flash-preview-09-2025`

---

## 📁 Project Structure

├── index.html
├── style.css
├── script.js
└── app.py


---

## ⚙️ Setup & Installation

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

---

## ⚙️ Setup & Installation

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

Replace your API key inside app.py:
GEMINI_API_KEY = "YOUR_API_KEY"

Or set it as an environment variable:
export GEMINI_API_KEY="your_key_here"

python app.py
http://127.0.0.1:5000/chat

