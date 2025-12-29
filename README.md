# ⚡ Insight Watt – AI-Powered Energy Intelligence Platform

**Insight Watt** is an AI-driven smart energy analytics platform that helps users **predict, analyze, and optimize electricity consumption** using machine learning and agentic AI.

🏆 **Awarded 2nd Prize at a Hackathon** for innovation, technical implementation, and real-world impact.

---

## 🌍 Problem Statement

Electricity consumers typically receive feedback **after** usage in the form of bills, leaving no room for proactive decision-making.

**Insight Watt** addresses this gap by providing:
- Future energy forecasts
- Risk alerts for overconsumption
- Actionable energy-saving plans
- Personalized AI-driven guidance

---

## 🚀 Key Features

- 🔮 **7-Day Energy Consumption Forecasting**
- ⚠️ **High-Risk Usage Detection**
- 📊 **Interactive Analytics Dashboard**
- 📁 **CSV-Based Data Upload & Validation**
- 🧠 **AI Coach for Personalized Advice**
- 🏠 Scalable design for homes, buildings, and smart grids

---

## 🧱 Repository Structure

This repository contains **two independent applications**:

Insight-Watt/
│
├── Insight-Watt-Frontend/ # Frontend Dashboard (UI)
├── Insight-Watt-Backend/ # Backend API, ML & AI Agents
└── README.md


> ⚠️ **Important Setup Note**  
> Please open **Frontend** and **Backend** folders **separately** in your code editor (VS Code / IDE) to correctly follow tutorials and avoid dependency conflicts.

---

## 🏗️ System Architecture Overview

CSV Upload (User)
↓
Frontend Dashboard (React / Next.js)
↓
FastAPI Backend
↓
Data Validation & Preprocessing
↓
Feature Engineering
↓
ML Forecasting Models
↓
Risk Analysis Engine
↓
7-Day Energy Plan Generator
↓
Agentic AI Layer (LangChain / LangGraph)
↓
AI Coach Responses → Frontend


---

## 🖥️ Frontend Application

📂 **Folder:** `Insight-Watt-Frontend`

The frontend provides a modern, user-friendly interface for interacting with energy insights.

### Functionalities
- Upload CSV energy data
- View 7-day AI forecasts
- Analyze average vs predicted usage
- Explore energy risk indicators
- Interact with the AI Coach

### Tech Stack
- React / Next.js
- Tailwind CSS
- Charting Libraries (Recharts / Chart.js)
- REST API Integration

### Setup Instructions
```bash
Make .env and set VITE_GROQ_API_KEY
cd Insight-Watt-Frontend
npm install
npm run dev
```

## 🖥️ Backend Application

📂 **Folder:** `Insight-Watt-Frontend`

The backend handles all AI, ML, forecasting, and decision intelligence.

### Core Responsibilities

- CSV schema validation
- Data cleaning & normalization
- Feature engineering
- Energy usage forecasting
- Risk detection logic
- Agentic AI orchestration
- API communication with frontend

### Tech Stack

- Python
- FastAPI
- Pandas, NumPy
- Scikit-learn / ML Models
- LangChain & LangGraph (Agentic AI)

### Setup Instructions
```bash
cd Insight-Watt-Backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 📄 Swagger API Docs:
```
http://localhost:8000/docs
```

## 🎯 Recommended Demo Flow (4–5 Minutes)

1. Upload a sample CSV file containing energy consumption data  
2. View AI-generated forecast on the **Overview** tab  
3. Analyze high-risk consumption days in **Forecast & Risk**  
4. Explore AI-generated recommendations in the **7-Day Plan**  
5. Ask personalized questions using the **AI Coach**

---

## 🏆 Hackathon Achievement

🏅 **2nd Prize Winner – Hackathon Project**

Insight Watt was recognized for:

- Practical application of AI/ML  
- Clean and scalable system architecture  
- End-to-end data → AI → insight pipeline  
- Strong real-world problem relevance  

---

## 🧪 Evaluation & Academic Notes

- Modular and scalable architecture  
- Clear separation of concerns between **Frontend** and **Backend**  
- Handles real-world energy consumption datasets  

**Suitable for:**
- University-level projects  
- AI / Machine Learning demonstrations  
- Smart energy and sustainability research  

---

## 🔮 Future Enhancements

- Live IoT / smart meter data integration  
- Cost-based energy optimization  
- Carbon footprint and sustainability analytics  
- Multi-household and comparative analysis  
- Cloud deployment (AWS / Azure)  

---

## 👥 Team & Credits

Developed as a collaborative project with focus on:

- Artificial Intelligence  
- Machine Learning Systems  
- Full-Stack Engineering  
- Sustainable Technology  
