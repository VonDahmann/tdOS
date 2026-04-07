/**
 * index.js - Home page logic and animations
 */

class StateDiagram {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.states = {
      NEW: { x: 0.15, y: 0.2, label: 'NEW', color: '#10b981' },
      READY: { x: 0.3, y: 0.5, label: 'READY', color: '#3b82f6' },
      RUNNING: { x: 0.7, y: 0.5, label: 'RUNNING', color: '#f59e0b' },
      WAITING: { x: 0.5, y: 0.8, label: 'WAITING', color: '#8b5cf6' },
      TERMINATED: { x: 0.85, y: 0.2, label: 'TERMINATED', color: '#ef4444' }
    };
    
    this.transitions = [
      { from: 'NEW', to: 'READY', label: 'Admitted' },
      { from: 'READY', to: 'RUNNING', label: 'Scheduler Dispatch', curve: 'up' },
      { from: 'RUNNING', to: 'READY', label: 'Interrupt', curve: 'down' },
      { from: 'RUNNING', to: 'WAITING', label: 'I/O Wait' },
      { from: 'WAITING', to: 'READY', label: 'I/O Completion' },
      { from: 'RUNNING', to: 'TERMINATED', label: 'Exit' }
    ];

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.processA = { state: 'NEW', progress: 0, targetState: 'READY', x: 0, y: 0 };
    this.animating = false;
    this.animationPath = ['NEW', 'READY', 'RUNNING', 'WAITING', 'READY', 'RUNNING', 'TERMINATED'];
    this.pathIndex = 0;

    // Initial draw
    requestAnimationFrame(() => this.draw());
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.draw();
  }

  startAnimation() {
    if (this.animating) return;
    this.animating = true;
    this.pathIndex = 0;
    this.processA.state = this.animationPath[0];
    this.processA.targetState = this.animationPath[1];
    this.processA.progress = 0;
    this.animate();
  }

  animate() {
    if (!this.animating) return;

    this.processA.progress += 0.015; // Speed

    if (this.processA.progress >= 1) {
      this.processA.progress = 0;
      this.pathIndex++;
      
      if (this.pathIndex >= this.animationPath.length - 1) {
        this.animating = false; // Done
        setTimeout(() => this.draw(), 50);
        return;
      }
      
      this.processA.state = this.animationPath[this.pathIndex];
      this.processA.targetState = this.animationPath[this.pathIndex + 1];
    }

    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  getXY(stateKey) {
    const s = this.states[stateKey];
    return {
      x: s.x * this.canvas.width,
      y: s.y * this.canvas.height
    };
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw transitions
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '12px Inter';
    this.ctx.textAlign = 'center';

    this.transitions.forEach(t => {
      const from = this.getXY(t.from);
      const to = this.getXY(t.to);
      
      this.ctx.beginPath();
      
      if (t.curve === 'up') {
        this.ctx.moveTo(from.x, from.y - 10);
        this.ctx.quadraticCurveTo((from.x + to.x) / 2, from.y - 60, to.x, to.y - 10);
      } else if (t.curve === 'down') {
        this.ctx.moveTo(from.x, from.y + 10);
        this.ctx.quadraticCurveTo((from.x + to.x) / 2, from.y + 60, to.x, to.y + 10);
      } else {
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
      }
      this.ctx.stroke();

      // Label (rough midpoint)
      let mx = (from.x + to.x) / 2;
      let my = (from.y + to.y) / 2;
      if (t.curve === 'up') my -= 30;
      if (t.curve === 'down') my += 30;
      
      // text background
      this.ctx.fillStyle = 'var(--bg-color)';
      const textW = this.ctx.measureText(t.label).width;
      this.ctx.fillRect(mx - textW/2 - 4, my - 10, textW + 8, 20);
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.fillText(t.label, mx, my + 4);
    });

    // Draw States
    Object.keys(this.states).forEach(key => {
      const s = this.states[key];
      const pos = this.getXY(key);
      
      // Node bg
      this.ctx.fillStyle = 'var(--bg-color)';
      this.ctx.beginPath();
      this.ctx.roundRect(pos.x - 50, pos.y - 25, 100, 50, 8);
      this.ctx.fill();

      // Node border
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = s.color;
      this.ctx.stroke();

      // Node shadow/glow
      this.ctx.shadowColor = s.color;
      this.ctx.shadowBlur = 15;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;

      // Text
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 13px Inter';
      this.ctx.fillText(s.label, pos.x, pos.y + 4);
    });

    // Draw Animating Process
    if (this.animating) {
      const from = this.getXY(this.processA.state);
      const to = this.getXY(this.processA.targetState);
      const p = this.processA.progress;
      
      let px, py;
      const tDef = this.transitions.find(tr => tr.from === this.processA.state && tr.to === this.processA.targetState);
      
      if (tDef && tDef.curve === 'up') {
        const cx = (from.x + to.x) / 2;
        const cy = from.y - 60;
        px = Math.pow(1-p, 2)*from.x + 2*(1-p)*p*cx + Math.pow(p, 2)*to.x;
        py = Math.pow(1-p, 2)*(from.y-10) + 2*(1-p)*p*cy + Math.pow(p, 2)*(to.y-10);
      } else if (tDef && tDef.curve === 'down') {
        const cx = (from.x + to.x) / 2;
        const cy = from.y + 60;
        px = Math.pow(1-p, 2)*from.x + 2*(1-p)*p*cx + Math.pow(p, 2)*to.x;
        py = Math.pow(1-p, 2)*(from.y+10) + 2*(1-p)*p*cy + Math.pow(p, 2)*(to.y+10);
      } else {
        px = from.x + (to.x - from.x) * p;
        py = from.y + (to.y - from.y) * p;
      }

      this.ctx.beginPath();
      this.ctx.arc(px, py, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.shadowColor = '#fff';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const diagram = new StateDiagram('stateDiagram');
  
  const btn = document.getElementById('btnAnimate');
  if (btn) {
    btn.addEventListener('click', () => {
      diagram.startAnimation();
    });
  }
});
