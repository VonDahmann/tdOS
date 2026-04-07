/**
 * io_scheduling.js
 * Visualizing Ready Queue, I/O Wait Queue, and CPU Execution.
 */

document.addEventListener('DOMContentLoaded', () => {
  const { Process, GanttChart } = window.AppUtils;

  // Enhance Process class locally for I/O bounds
  class IOProcess extends Process {
    constructor(id, arrivalTime, b1, io, b2) {
      super(id, arrivalTime, null, 0);
      this.b1 = parseInt(b1);
      this.io = parseInt(io);
      this.b2 = parseInt(b2);
      
      this.remB1 = this.b1;
      this.remIO = this.io;
      this.remB2 = this.b2;

      this.currentPhase = 'B1'; // B1 -> IO -> B2 -> DONE
    }
  }

  const form = document.getElementById('addProcessForm');
  const btnRun = document.getElementById('btnRun');
  const btnClear = document.getElementById('btnClear');
  const algoSelect = document.getElementById('algoSelect');
  const quantumGroup = document.getElementById('quantumGroup');
  const ioModelSelect = document.getElementById('ioModelSelect');
  const timeDisplay = document.getElementById('currentTimeDisplay');

  const readyQDiv = document.getElementById('readyQueueContainer');
  const waitQDiv = document.getElementById('waitQueueContainer');
  const cpuBox = document.getElementById('cpuBox');
  const ioDeviceBox = document.getElementById('ioDeviceBox');

  let processList = [];
  let nextId = 1;
  let chart = new GanttChart('ganttCanvas');
  let playbackInterval = null;

  algoSelect.addEventListener('change', () => {
    quantumGroup.style.display = algoSelect.value === 'RR' ? 'flex' : 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const arr = document.getElementById('arrTime').value;
    const b1 = document.getElementById('burst1').value;
    const io = document.getElementById('ioBurst').value;
    const b2 = document.getElementById('burst2').value;

    const p = new IOProcess(nextId++, arr, b1, io, b2);
    processList.push(p);

    alert(`Added P${p.id} [AT:${arr}, B1:${b1}, IO:${io}, B2:${b2}]`);
    form.reset();
  });

  btnClear.addEventListener('click', () => {
    if (playbackInterval) clearInterval(playbackInterval);
    processList = [];
    nextId = 1;
    chart.clear();
    readyQDiv.innerHTML = '';
    waitQDiv.innerHTML = '';
    
    // Clear device children except text node
    Array.from(cpuBox.children).forEach(c => c.remove());
    Array.from(ioDeviceBox.children).forEach(c => c.remove());
    
    timeDisplay.style.display = 'none';
  });

  btnRun.addEventListener('click', () => {
    if (processList.length === 0) return alert('Add processes first.');
    if (playbackInterval) clearInterval(playbackInterval);

    timeDisplay.style.display = 'block';
    const algo = algoSelect.value;
    const q = parseInt(document.getElementById('timeQuantum').value);
    const sharedIO = ioModelSelect.value === 'SHARED';

    // Generate timeline
    const timeline = buildIOTimeline(algo, q, sharedIO, copyProcesses(processList));
    
    // Draw Gantt (Total view) but we will animate it by blocks
    chart.clear();

    // Playback logic
    let t = 0;
    const maxT = timeline.length > 0 ? timeline[timeline.length - 1].time : 0;
    
    // Quick clear UI
    readyQDiv.innerHTML = '';
    waitQDiv.innerHTML = '';
    Array.from(cpuBox.children).forEach(c => c.remove());
    Array.from(ioDeviceBox.children).forEach(c => c.remove());

    playbackInterval = setInterval(() => {
      if (t > maxT) {
        clearInterval(playbackInterval);
        return;
      }
      
      const state = timeline.find(state => state.time === t);
      if (state) {
        renderState(state);
      }
      
      timeDisplay.innerText = `Time: ${t}`;
      t++;
    }, 600); // UI update every 600ms
  });

  function copyProcesses(list) {
    return list.map(p => {
      let copy = new IOProcess(p.id, p.arrivalTime, p.b1, p.io, p.b2);
      copy.color = p.color;
      return copy;
    });
  }

  // Generates state of whole system every time unit
  function buildIOTimeline(algo, q, sharedIO, processData) {
    let t = 0;
    let states = []; // Array of { time, cpuProc, ioProcs[], readyQ[], waitQ[], ganttBlocks[] }
    let ganttBlocks = [];
    
    let n = processData.length;
    let completed = 0;
    
    let readyQ = [];
    let waitQ = []; // for shared IO
    let inIO = []; // for per-process IO

    let cpuProc = null;
    let ioProc = null; // Shared IO active process
    let cpuExecTime = 0;

    // Helper to fetch process color
    const getP = id => processData.find(p => p.id === id);

    while (completed < n) {
      // 1. Process Arrivals
      for (let p of processData) {
        if (p.arrivalTime === t && p.currentPhase === 'B1') {
          readyQ.push(p);
        }
      }

      // 2. IO Completions
      if (sharedIO) {
        if (ioProc) {
          ioProc.remIO--;
          if (ioProc.remIO === 0) {
            ioProc.currentPhase = 'B2';
            readyQ.push(ioProc);
            ioProc = null;
          }
        }
        if (!ioProc && waitQ.length > 0) {
          ioProc = waitQ.shift();
        }
      } else {
        // Per process independent IO
        for (let i = inIO.length - 1; i >= 0; i--) {
          let p = inIO[i];
          p.remIO--;
          if (p.remIO === 0) {
            p.currentPhase = 'B2';
            readyQ.push(p);
            inIO.splice(i, 1);
          }
        }
      }

      // 3. CPU Execution / Preemption
      if (cpuProc) {
        cpuProc[cpuProc.currentPhase === 'B1' ? 'remB1' : 'remB2']--;
        cpuExecTime++;

        let isDone = cpuProc.currentPhase === 'B1' ? cpuProc.remB1 === 0 : cpuProc.remB2 === 0;

        // Add to gantt
        let lastB = ganttBlocks[ganttBlocks.length - 1];
        if (!lastB || lastB.processName !== cpuProc.name) {
          ganttBlocks.push({ processName: cpuProc.name, start: t-1, end: t, color: cpuProc.color });
        } else {
          lastB.end = t;
        }

        if (isDone) {
          if (cpuProc.currentPhase === 'B1') {
            cpuProc.currentPhase = 'IO';
            if (sharedIO) waitQ.push(cpuProc);
            else inIO.push(cpuProc);
          } else {
            cpuProc.currentPhase = 'DONE';
            completed++;
          }
          cpuProc = null;
          cpuExecTime = 0;
        } 
        else if (algo === 'RR' && cpuExecTime === q) {
          readyQ.push(cpuProc);
          cpuProc = null;
          cpuExecTime = 0;
        }
      }

      // 4. Dispatch CPU
      if (!cpuProc && readyQ.length > 0) {
        cpuProc = readyQ.shift();
        cpuExecTime = 0;
      }

      // Record state for animation
      states.push({
        time: t,
        cpuProc: cpuProc ? { ...cpuProc } : null,
        ioProcs: sharedIO ? (ioProc ? [{...ioProc}] : []) : inIO.map(p => ({...p})),
        readyQ: readyQ.map(p => ({...p})),
        waitQ: sharedIO ? waitQ.map(p => ({...p})) : [],
        ganttState: JSON.parse(JSON.stringify(ganttBlocks)) 
      });

      if (completed === n && !cpuProc && ioProc === null && inIO.length === 0) {
         break;
      }

      t++;
    }

    // Push final state
    states.push({
      time: t, cpuProc: null, ioProcs: [], readyQ: [], waitQ: [], ganttState: JSON.parse(JSON.stringify(ganttBlocks))
    });

    return states;
  }

  function renderState(s) {
    // Render Ready Queue
    readyQDiv.innerHTML = s.readyQ.map(p => createTokenHTML(p)).join('');

    // Render Wait Queue (for Shared IO)
    waitQDiv.innerHTML = s.waitQ.map(p => createTokenHTML(p)).join('');

    // Render CPU
    Array.from(cpuBox.children).filter(c => c.className==='process-token').forEach(c => c.remove());
    if (s.cpuProc) cpuBox.innerHTML += createTokenHTML(s.cpuProc);

    // Render IO Device(s)
    Array.from(ioDeviceBox.children).filter(c => c.className==='process-token').forEach(c => c.remove());
    s.ioProcs.forEach((p, idx) => {
      // Offset slightly if multiple (for per-process IO view)
      let offset = idx * 10;
      ioDeviceBox.innerHTML += `<div class="process-token" style="background: ${p.color}; border-color: ${p.color}; transform: translate(calc(-50% + ${offset}px), calc(-50% + ${offset}px)); position:absolute; top:50%; left:50%;">${p.name}</div>`;
    });

    // Render Gantt Chart up to this time
    chart.clear();
    s.ganttState.forEach(b => chart.addBlock(b.processName, b.start, b.end, b.color));
    chart.draw();
  }

  function createTokenHTML(p) {
    return `<div class="process-token" style="background: ${p.color}; border-color: ${p.color}">${p.name}</div>`;
  }
});
