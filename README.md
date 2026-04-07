# 🖥️ OS Scheduling — Interactive Learning

![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow?style=for-the-badge&logo=javascript)
![HTML5](https://img.shields.io/badge/HTML-5-orange?style=for-the-badge&logo=html5)
![CSS3](https://img.shields.io/badge/CSS-3-blue?style=for-the-badge&logo=css3)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

*An interactive, visually stunning educational web app exploring CPU Scheduling algorithms — FCFS, SJF, Round Robin, Priority & Multi-Level Queues. Built with vanilla HTML, CSS & JS.*

## 📖 About

**OS Scheduling — Interactive Learning** is a comprehensive educational platform designed to help Computer Science students master Operating System process management. It removes the abstraction of standard textbook learning by providing dynamic, visual simulations of the most common CPU scheduling algorithms. 

Designed with a sleek, dark glassmorphic UI, it focuses on clarity, real-time interactivity, and visual performance metrics without relying on complex build tools or frameworks.

## ✨ Features

- 📊 **Interactive Gantt Chart Simulator**: Step-by-step or instant rendering on HTML5 Canvas.
- ⏱️ **Live Performance Metrics**: Auto-calculates Average Turnaround Time (ATT), Average Waiting Time (AWT), and Average Response Time (ART).
- 🔄 **Advanced Queue Visualization**: Animated Ready Queues, Blocked/Wait IO Queues, and active CPU dispatching.
- 🎛️ **Comprehensive Algorithms**:
  - First Come First Serve (FCFS)
  - Shortest Job First (SJF / SRTF)
  - Round Robin (RR)
  - Priority Scheduling (Preemptive & Non-Preemptive)
  - Multi-Level Queues (MLQ)
  - Multi-Level Feedback Queues (MLFQ)
- 📝 **Built-in Quiz**: A 10-question dynamic knowledge check with instant feedback.
- 🎨 **No Build Tools**: 100% pure Vanilla JS, CSS, and HTML for instantaneous local execution.

## 🏗️ Architecture

The project adheres to a strict vanilla web architecture for maximum accessibility:
- `global.css`: Centralized design system (CSS variables, glassmorphism, responsive utilities).
- `shared.js`: Global utilities (Process model, SVG Icons, HTML5 Canvas Gantt Drawer).
- **Modular Pages**: Every topic has an isolated `[module].html`, `[module].css`, and `[module].js` file.

## 🚀 Getting Started

Since the project uses zero frameworks or npm dependencies, running it locally is incredibly simple.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/os_scheduling.git
   ```
2. **Navigate into the directory:**
   ```bash
   cd os_scheduling
   ```
3. **Open directly in your browser!**
   Simply double-click `index.html` or run:
   - On Mac: `open index.html`
   - On Windows: `start index.html`
   - On Linux: `xdg-open index.html`

*Note: You can also use tools like `Live Server` in VS Code for hot-reloading during development.*

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 🎓 Academic Credit

This project and its simulations reflect the curriculum standards established in the **SE1 Operating Systems course** by **Prof. Belhadef Hacene** and **Prof. Belala Nabil**, NTIC Faculty, University of Constantine 2 (Academic Year 2025–2026).
