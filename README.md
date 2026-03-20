# 🏠 Florida Real Estate Master Drill

A high-performance, responsive web application designed to help students master the Florida Real Estate Sales Associate Exam. Built with **Vanilla JavaScript**, **Tailwind CSS**, and an **Asynchronous JSON data structure**.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)

---

## 🚀 Features

* **Real-Time Exam Logic:** Shuffled questions and randomized answer choices to prevent "positional memorization."
* **Live Scoring & Timer:** Tracks performance and pace, mimicking the high-pressure environment of the Pearson VUE state exam.
* **Dynamic Category Tags:** Questions are tagged by topic (Math, Law, Agency, etc.) for targeted feedback.
* **Modern UI:** Clean, distraction-free interface built with Tailwind CSS and Font Awesome icons.
* **Scalable Data:** Questions are decoupled from the code in a dedicated `data.json` file for easy expansion.

---

## 🛠️ Installation & Setup

Because this project uses the **JavaScript Fetch API** to load the question bank, you cannot run it by simply opening the `index.html` file in your browser. You must use a local server.

### 1. Prerequisites
* [VS Code](https://code.visualstudio.com/)
* **Live Server Extension** (by Ritwick Dey) installed in VS Code.

### 2. Running the App
1.  Clone or download this repository to your local machine.
2.  Open the folder in VS Code.
3.  Right-click on `index.html` in the file explorer.
4.  Select **"Open with Live Server"**.
5.  The app will launch at `http://127.0.0.1:5500`.

---

## 📊 Project Structure

```text
├── assets/
│   ├── script.js      # Core quiz logic & timer
│   └── style.css       # Custom animations and overrides
├── data.json           # The "Question Bank" (50+ Real Estate questions)
├── index.html          # Main application structure
└── README.md           # Project documentation
```

---

## 📝 How to Add Questions

To expand the exam bank, simply open `data.json` and add a new object to the array following this format:

```json
{
  "cat": "Category Name",
  "q": "Your question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0
}
```
*Note: The `correct` value is the **index** of the right answer (0 for the first option, 1 for the second, etc.).*

---

## 💡 Exam Tips Included
The question bank covers critical Florida-specific topics:
* **The 0-1-3 Rule** (Escrow Deposits)
* **S-I-N Taxes** (Documentary Stamps & Intangible Tax)
* **Save Our Homes** (Homestead Assessment Caps)
* **F.S. 475** (Real Estate License Law)

---

## 📄 License
This project is open-source and available under the MIT License.
```

---

### 🖥️ New Question for `data.json`
Let's add one final "Law" question regarding **Brokerage Signage**—it's an easy point on the exam if you know the requirements:

```json
  {
    "cat": "Brokerage Operations",
    "q": "Which of the following MUST be included on a broker's entrance sign?",
    "options": [
      "The names of all sales associates",
      "The phone number of the brokerage",
      "The name of the brokerage and the name of at least one broker",
      "The broker's home address"
    ],
    "correct": 2
  }
```

### 💡 Exam Tip: Signage Requirements
Every brokerage must have an entrance sign that is easily visible. It must contain:
1.  The **Trade Name** (if used).
2.  The **Broker's Name**.
3.  The words "**Licensed Real Estate Broker**" or "Lic. Real Estate Broker."
