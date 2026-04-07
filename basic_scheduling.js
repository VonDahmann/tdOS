/**
 * basic_scheduling.js
 * Implementation for FCFS, SJF, SRTF, PRIORITY_NP, and RR
 */

document.addEventListener('DOMContentLoaded', () => {
  const { Process, GanttChart } = window.AppUtils;

  // UI Elements
  const algoSelect = document.getElementById('algoSelect');
  const quantumGroup = document.getElementById('quantumGroup');
  const timeQuantum = document.getElementById('timeQuantum');
  const form = document.getElementById('addProcessForm');
  const processTableBody = document.querySelector('#processTable tbody');
  const metricsTableBody = document.querySelector('#metricsTable tbody');
  const btnRun = document.getElementById('btnRun');
  const btnClear = document.getElementById('btnClear');
  const btnStep = document.getElementById('btnStep');
  const timeDisplay = document.getElementById('currentTimeDisplay');

  let processesList = [];
  let nextId = 1;
  let chart = new GanttChart('ganttCanvas');
  
  // Animation/Simulation State
  let simLogs = [];
  let currentSimStep = 0;
  let simInterval = null;

  // Show/Hide Quantum input based on algorithm
  algoSelect.addEventListener('change', () => {
    if (algoSelect.value === 'RR') {
      quantumGroup.style.display = 'flex';
    } else {
      quantumGroup.style.display = 'none';
    }
  });

  // Add Process
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const at = document.getElementById('arrTime').value;
    const bt = document.getElementById('burstTime').value;
    const prio = document.getElementById('priority').value;

    const p = new Process(nextId++, at, bt, prio);
    processesList.push(p);
    renderProcessTable();
    form.reset();
  });

  function renderProcessTable() {
    processTableBody.innerHTML = '';
    processesList.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: ${p.color}; font-weight: bold;">${p.name}</td>
        <td>${p.arrivalTime}</td>
        <td>${p.burstTime}</td>
        <td>${p.priority}</td>
        <td><button class="btn-remove" data-index="${idx}">X</button></td>
      `;
      processTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        processesList.splice(index, 1);
        renderProcessTable();
      });
    });
  }

  btnClear.addEventListener('click', () => {
    processesList = [];
    nextId = 1;
    renderProcessTable();
    clearResults();
  });

  function clearResults() {
    chart.clear();
    metricsTableBody.innerHTML = '';
    document.getElementById('avgTat').innerText = '0.00';
    document.getElementById('avgWt').innerText = '0.00';
    document.getElementById('avgRt').innerText = '0.00';
    timeDisplay.innerText = 'Time: 0';
    simLogs = [];
    if (simInterval) clearInterval(simInterval);
  }

  // --- SCHEDULING LOGIC ---

  function cloneProcesses() {
    return processesList.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority, p.color));
  }

  btnRun.addEventListener('click', () => {
    if (processesList.length === 0) return alert("Please add at least one process.");
    runSimulation(false); // fast forward
  });

  btnStep.addEventListener('click', () => {
    if (processesList.length === 0) return alert("Please add at least one process.");
    runSimulation(true); // visual queue step
  });

  function runSimulation(stepMode) {
    clearResults();
    const algo = algoSelect.value;
    const q = parseInt(timeQuantum.value, 10);
    const pList = cloneProcesses();
    
    // Generate Simulation Steps
    simLogs = generateSimulationLog(algo, pList, q);

    if (stepMode) {
      // Step mode
      currentSimStep = 0;
      simInterval = setInterval(() => {
        if (currentSimStep >= simLogs.length) {
          clearInterval(simInterval);
          calculateAndRenderMetrics(pList, simLogs);
          return;
        }
        const block = simLogs[currentSimStep];
        chart.addBlock(block.processName, block.start, block.end, block.color);
        chart.draw();
        timeDisplay.innerText = `Time: ${block.end}`;
        currentSimStep++;
      }, 1000);
    } else {
      // Instant mode
      simLogs.forEach(block => {
        chart.addBlock(block.processName, block.start, block.end, block.color);
      });
      chart.draw();
      timeDisplay.innerText = `Time: ${simLogs.length > 0 ? simLogs[simLogs.length - 1].end : 0}`;
      calculateAndRenderMetrics(pList, simLogs);
    }
  }

  /**
   * Universal logic to generate execution logs
   * Returns array of {processName, start, end, color, id}
   */
  function generateSimulationLog(algo, processes, quantum) {
    let logs = [];
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    
    // Sort by arrival initially
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    if (algo === 'FCFS') {
      processes.forEach(p => {
        if (currentTime < p.arrivalTime) currentTime = p.arrivalTime;
        const start = currentTime;
        currentTime += p.burstTime;
        logs.push({ processName: p.name, start, end: currentTime, color: p.color, id: p.id, burstCount: p.burstTime });
      });
    } 
    else if (algo === 'SJF') { // Non-Preemptive
      let isCompleted = new Array(n).fill(false);
      let count = 0;
      
      while (count < n) {
        let minIndex = -1;
        let minBurst = Infinity;
        
        for (let i = 0; i < n; i++) {
          if (processes[i].arrivalTime <= currentTime && !isCompleted[i]) {
            if (processes[i].burstTime < minBurst) {
              minBurst = processes[i].burstTime;
              minIndex = i;
            }
          }
        }
        
        if (minIndex === -1) {
          currentTime++;
        } else {
          const p = processes[minIndex];
          const start = currentTime;
          currentTime += p.burstTime;
          logs.push({ processName: p.name, start, end: currentTime, color: p.color, id: p.id });
          isCompleted[minIndex] = true;
          count++;
        }
      }
    }
    else if (algo === 'SRTF') { // Preemptive SJF
      let count = 0;
      let lastProc = null;
      let blockStart = currentTime;

      while (count < n) {
        let minIndex = -1;
        let minRem = Infinity;
        
        for (let i = 0; i < n; i++) {
          if (processes[i].arrivalTime <= currentTime && processes[i].remainingTime > 0) {
            if (processes[i].remainingTime < minRem) {
              minRem = processes[i].remainingTime;
              minIndex = i;
            }
          }
        }
        
        if (minIndex === -1) {
          currentTime++;
          if (lastProc !== null) {
            logs.push({ processName: lastProc.name, start: blockStart, end: currentTime-1, color: lastProc.color, id: lastProc.id });
            lastProc = null;
          }
        } else {
          const p = processes[minIndex];
          
          if (lastProc !== p) {
            if (lastProc !== null) {
              logs.push({ processName: lastProc.name, start: blockStart, end: currentTime, color: lastProc.color, id: lastProc.id });
            }
            blockStart = currentTime;
            lastProc = p;
          }

          p.remainingTime--;
          currentTime++;

          if (p.remainingTime === 0) {
            count++;
            logs.push({ processName: p.name, start: blockStart, end: currentTime, color: p.color, id: p.id });
            lastProc = null; // force new block
          }
        }
      }
    }
    else if (algo === 'PRIORITY_NP') {
      let isCompleted = new Array(n).fill(false);
      let count = 0;
      
      while (count < n) {
        let minIndex = -1;
        let minPrio = Infinity; // Lower number means higher priority in OS usually!
        
        for (let i = 0; i < n; i++) {
          if (processes[i].arrivalTime <= currentTime && !isCompleted[i]) {
            if (processes[i].priority < minPrio) {
              minPrio = processes[i].priority;
              minIndex = i;
            } else if (processes[i].priority === minPrio) {
               // FCFS tie breaker
               if (minIndex === -1 || processes[i].arrivalTime < processes[minIndex].arrivalTime) {
                 minIndex = i;
               }
            }
          }
        }
        
        if (minIndex === -1) {
          currentTime++;
        } else {
          const p = processes[minIndex];
          const start = currentTime;
          currentTime += p.burstTime;
          logs.push({ processName: p.name, start, end: currentTime, color: p.color, id: p.id });
          isCompleted[minIndex] = true;
          count++;
        }
      }
    }
    else if (algo === 'RR') {
      let queue = [];
      let currentIdx = 0;
      let count = 0;
      let addedToQueue = new Array(n).fill(false);

      // Function to add arriving processes to queue
      const checkAndAdd = (t) => {
        for(let i=0; i<n; i++) {
          if(!addedToQueue[i] && processes[i].arrivalTime <= t) {
            queue.push(processes[i]);
            addedToQueue[i] = true;
          }
        }
      };

      checkAndAdd(currentTime);

      while (count < n) {
        if (queue.length === 0) {
          currentTime++;
          checkAndAdd(currentTime);
        } else {
          let p = queue.shift();
          const start = currentTime;
          let executionTime = Math.min(p.remainingTime, quantum);
          
          p.remainingTime -= executionTime;
          currentTime += executionTime;
          
          checkAndAdd(currentTime); // Add newly arrived while p was executing
          
          logs.push({ processName: p.name, start, end: currentTime, color: p.color, id: p.id });
          
          if (p.remainingTime > 0) {
            queue.push(p);
          } else {
            count++;
          }
        }
      }
    }

    return consolidateLogs(logs);
  }

  // Helper to merge consecutive blocks of the same process if algorithms like SJF preemption don't actually preempt
  function consolidateLogs(logs) {
    if (logs.length === 0) return [];
    let merged = [logs[0]];
    for(let i=1; i<logs.length; i++) {
      let last = merged[merged.length-1];
      let curr = logs[i];
      if(last.id === curr.id && last.end === curr.start) {
        last.end = curr.end;
      } else {
        merged.push(curr);
      }
    }
    return merged;
  }

  function calculateAndRenderMetrics(processes, logs) {
    let totalTat = 0, totalWt = 0, totalRt = 0;

    processes.forEach(p => {
      // Find First start (for Response Time)
      const firstEntry = logs.find(l => l.id === p.id);
      if (!firstEntry) return; // safety against empty logs
      
      const firstStart = firstEntry.start;
      // Find Completion Time
      const lastBlock = logs.slice().reverse().find(l => l.id === p.id);
      const ct = lastBlock ? lastBlock.end : 0;

      p.responseTime = firstStart - p.arrivalTime;
      p.completionTime = ct;
      p.turnaroundTime = ct - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;

      totalTat += p.turnaroundTime;
      totalWt += p.waitingTime;
      totalRt += p.responseTime;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: ${p.color}; font-weight: bold;">${p.name}</td>
        <td>${p.completionTime}</td>
        <td>${p.turnaroundTime}</td>
        <td>${p.waitingTime}</td>
        <td>${p.responseTime}</td>
      `;
      metricsTableBody.appendChild(tr);
    });

    const n = processes.length;
    document.getElementById('avgTat').innerText = (totalTat / n).toFixed(2);
    document.getElementById('avgWt').innerText = (totalWt / n).toFixed(2);
    document.getElementById('avgRt').innerText = (totalRt / n).toFixed(2);
  }

});
