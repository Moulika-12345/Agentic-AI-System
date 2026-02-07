# Nexus Agentic System: Core Concepts & Features

This document explains all the smart parts of the Nexus AI Team. Use this for project reviews or system design discussions.

## 1. The AI Team (Multi-Agent System)
*   **Leader (Orchestrator):** Manages the whole team and moves messages between agents.
*   **Goal Setter (Planner):** Breaks a big problem into easy-to-follow steps.
*   **Smart Thinker (Reasoning):** Uses logic to decide what the best answer is.
*   **Worker (Tool Executor):** Uses real web tools and computer commands to do the work.
*   **Storage (Memory):** Keeps all information organized and ready to use.
*   **Fact Checker (Critic):** Double-checks every step to make sure there are no mistakes.

## 2. Smart Memory Types
*   **Fast Notes (Short-term):** Remembers what just happened in the current conversation.
*   **Smart Search (Long-term / RAG):** Searches through a library of "best patterns" to find helpful tips.
*   **History (Episodic):** Remembers old successes and failures to get smarter over time.

## 3. Advanced Capabilities
*   **Self-Fixing (Autonomous Recovery):** If a tool or a plan fails, the AI automatically comes up with a new way to finish the job.
*   **Smart Decision Making:** The team only finishes when the Fact Checker is at least 80% sure the work is correct.
*   **Thought Stream:** A live list of every "thought" and "action" the AI takes, so humans can see how it thinks.
*   **Real-Time Data:** Uses current maps and live computer logs to make real-world decisions.

## 4. Technical Build
*   **Frontend:** Built with React 19 for a fast and smooth user experience.
*   **AI Engine:** Uses the Gemini-3-Pro-Preview model for high-level logic.
*   **Safety:** Built-in loops ensure the AI doesn't get stuck or hallucinate (make things up).
