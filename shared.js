/**
 * Shared utility classes and functions for the OS Scheduling App
 */

// Simple SVG Icons Repository
const Icons = {
  Home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  Cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
  Play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
  Pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
  Step: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>',
  Reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
};

/**
 * Utility function to generate the Navigation Bar dynamically
 * This saves us from rewriting navigation HTML in every single page
 */
function renderNavigation() {
  const currentPath = window.location.pathname;
  const fileName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  const navLinks = [
    { name: 'Home', file: 'index.html' },
    { name: 'Basic', file: 'basic_scheduling.html' },
    { name: 'I/O', file: 'io_scheduling.html' },
    { name: 'Priority', file: 'priority_scheduling.html' },
    { name: 'MLQ', file: 'multilevel_queues.html' },
    { name: 'MLFQ', file: 'multilevel_feedback.html' },
    { name: 'Quiz', file: 'quiz.html' },
  ];

  const header = document.createElement('header');
  header.className = 'main-nav';

  const logoRef = document.createElement('a');
  logoRef.href = 'index.html';
  logoRef.className = 'logo-container';
  logoRef.innerHTML = `${Icons.Cpu} OS Scheduler`;

  const ul = document.createElement('ul');
  ul.className = 'nav-links';

  navLinks.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.file;
    a.innerText = link.name;
    if (fileName === link.file) {
      a.className = 'active';
    }
    li.appendChild(a);
    ul.appendChild(li);
  });

  header.appendChild(logoRef);
  header.appendChild(ul);
  
  // Insert at the top of body
  document.body.prepend(header);
}

/**
 * Process representation structure
 */
class Process {
  constructor(id, arrivalTime, burstTime, priority = 0, color) {
    this.id = id;
    this.name = `P${id}`;
    this.arrivalTime = Number(arrivalTime);
    this.burstTime = Number(burstTime);
    this.remainingTime = Number(burstTime);
    this.priority = Number(priority);
    this.color = color || Process.getRandomColor();
    
    // Metrics
    this.completionTime = 0;
    this.turnaroundTime = 0;
    this.waitingTime = 0;
    this.responseTime = -1; // -1 means not started yet
    
    // Simulation state
    this.state = 'NEW'; // NEW, READY, RUNNING, WAITING, TERMINATED
  }

  static getRandomColor() {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#ef4444', // red
      '#f59e0b', // yellow
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#f97316'  // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

/**
 * Gantt Chart Drawer using HTML5 Canvas
 */
class GanttChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.blocks = []; // Array of { processName, start, end, color }
    
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      // Set fixed resolution or responsive
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = 100;
    this.draw();
  }

  addBlock(processName, start, end, color) {
    this.blocks.push({ processName, start, end, color });
  }

  clear() {
    this.blocks = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  draw() {
    if (!this.ctx || this.blocks.length === 0) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const totalTime = this.blocks[this.blocks.length - 1].end;
    const padding = 20;
    const availableWidth = this.canvas.width - padding * 2;
    const unitWidth = availableWidth / (totalTime || 1); // Avoid div by 0
    
    const h = 50;
    const y = 20;

    // Background track
    this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
    this.ctx.fillRect(padding, y, availableWidth, h);

    this.blocks.forEach((block, index) => {
      const x = padding + block.start * unitWidth;
      const w = Math.max((block.end - block.start) * unitWidth, 2); // Minimum visible width

      // Draw block background with color
      this.ctx.fillStyle = block.color;
      this.ctx.globalAlpha = 0.8;
      
      // Top left, top right...
      this.ctx.beginPath();
      // Add slight border radius logic if desired, or simple rect
      this.ctx.rect(x + 1, y + 1, w - 2, h - 2);
      this.ctx.fill();

      // Border or glowing edge
      this.ctx.globalAlpha = 1;
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, w, h);

      // Draw Text (Process Name)
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      // Only draw text if block is wide enough
      if (w > 20) {
        this.ctx.fillText(block.processName, x + w / 2, y + h / 2);
      }

      // Time markers
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.font = '11px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      
      // Always draw start time
      if (index === 0 || this.blocks[index-1].end !== block.start) {
        this.ctx.fillText(block.start, x, y + h + 5);
      }
      
      // Always draw end time of last block, or if gap follows
      this.ctx.fillText(block.end, x + w, y + h + 5);
    });
  }
}

/**
 * Automatically insert navigation on DOM load
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavigation();
});

// Export tools
window.AppUtils = {
  Icons,
  Process,
  GanttChart
};
