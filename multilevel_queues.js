/**
 * multilevel_queues.js
 */

document.addEventListener('DOMContentLoaded', () => {
  const { Process, GanttChart } = window.AppUtils;

  // Enhance process for queue awareness
  class MLQProcess extends Process {
    constructor(id, at, bt, qKey) {
      super(id, at, bt, 0);
      this.qKey = qKey;
    }
  }

  const form = document.getElementById('addProcessForm');
  const btnRun = document.getElementById('btnRun');
  const btnClear = document.getElementById('btnClear');
  const modeSelect = document.getElementById('modeSelect');
  const targetQueue = document.getElementById('targetQueue');
  const q3Opt = document.getElementById('q3Opt');
  const timeDisplay = document.getElementById('currentTimeDisplay');
  
  const qContainers = {
    1: document.querySelector('#q1Container .q-lanes'),
    2: document.querySelector('#q2Container .q-lanes'),
    3: document.querySelector('#q3Container .q-lanes')
  };

  let processes = [];
  let nextId = 1;
  let chart = new GanttChart('ganttCanvas');
  let simInterval = null;

  modeSelect.addEventListener('change', () => {
    if (modeSelect.value === '3') {
      q3Opt.style.display = 'block';
      document.getElementById('q3Container').style.display = 'flex';
      document.querySelector('#q1Container h4').innerText = 'Q1: System (RR q=2)';
      document.querySelector('#q2Container h4').innerText = 'Q2: Foreground (RR q=4)';
    } else {
      q3Opt.style.display = 'none';
      if (targetQueue.value === '3') targetQueue.value = '2';
      document.getElementById('q3Container').style.display = 'none';
      document.querySelector('#q1Container h4').innerText = 'Q1: Foreground (RR q=4)';
      document.querySelector('#q2Container h4').innerText = 'Q2: Background (FCFS)';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const at = parseInt(document.getElementById('arrTime').value);
    const bt = parseInt(document.getElementById('burstTime').value);
    const qKey = parseInt(targetQueue.value);

    const p = new MLQProcess(nextId++, at, bt, qKey);
    processes.push(p);

    // Give visual feedback
    const dummy = `<div class="process-token" style="background:${p.color}">${p.name}</div>`;
    qContainers[qKey].innerHTML += dummy;

    form.reset();
  });

  btnClear.addEventListener('click', () => {
    processes = [];
    nextId = 1;
    if(simInterval) clearInterval(simInterval);
    [1,2,3].forEach(k => qContainers[k].innerHTML = '');
    chart.clear();
    timeDisplay.style.display = 'none';
  });

  btnRun.addEventListener('click', () => {
    if(!processes.length) return alert('Add processes');
    if(simInterval) clearInterval(simInterval);

    timeDisplay.style.display = 'block';
    
    // Config: mode 2 vs mode 3
    let queuesConfig = {};
    if (modeSelect.value === '2') {
      queuesConfig = { 1: { algo: 'RR', q: 4 }, 2: { algo: 'FCFS' } };
    } else {
      queuesConfig = { 1: { algo: 'RR', q: 2 }, 2: { algo: 'RR', q: 4 }, 3: { algo: 'FCFS' } };
    }

    const { logs, history } = simulateMLQ(processes, queuesConfig);

    // Animate
    let step = 0;
    chart.clear();
    
    simInterval = setInterval(() => {
      if (step >= history.length) {
        clearInterval(simInterval);
        return;
      }

      const h = history[step];
      Object.keys(qContainers).forEach(k => qContainers[k].innerHTML = '');

      // Draw waiting in queue
      h.qs[1].forEach(p => qContainers[1].innerHTML += drawToken(p));
      h.qs[2].forEach(p => qContainers[2].innerHTML += drawToken(p));
      h.qs[3].forEach(p => qContainers[3].innerHTML += drawToken(p));

      // Draw cpu executing with highlight
      if (h.cpu) {
        let hl = drawToken(h.cpu, true); // glow
        qContainers[h.cpu.q].innerHTML += hl;
      }

      timeDisplay.innerText = `Time: ${h.t}`;
      
      chart.clear();
      h.gantt.forEach(b => chart.addBlock(b.name, b.start, b.end, b.color));
      chart.draw();

      step++;
    }, 500);

  });

  function drawToken(p, glow=false) {
    let bs = glow ? `box-shadow: 0 0 15px ${p.color}; border: 2px solid #fff;` : '';
    return `<div class="process-token" style="background:${p.color}; ${bs}">${p.name}</div>`;
  }

  function simulateMLQ(procs, config) {
    let t = 0;
    let n = procs.length;
    let completed = 0;
    let logs = [];
    let history = []; // array of system state
    let ganttTokens = [];

    // Clone
    let pList = procs.map(p => ({...p}));

    let qs = { 1: [], 2: [], 3: [] };
    let cpuProc = null;
    let cpuExecTime = 0;

    while (completed < n) {
      // 1. Check arrivals
      pList.forEach(p => {
        if(p.arrivalTime === t) {
          qs[p.qKey].push(p);
        }
      });

      // 2. Preemption & Execution logic
      // Determine highest priority active queue
      let activeQ = 1;
      while(activeQ <= 3 && qs[activeQ].length === 0) activeQ++;

      if (cpuProc) {
        // Preempt if higher priority arrived
        if (activeQ < cpuProc.qKey) {
          // Put back slightly ahead of others arrived at same time
          qs[cpuProc.qKey].unshift(cpuProc);
          cpuProc = null;
          cpuExecTime = 0;
        } else {
          cpuProc.remainingTime--;
          cpuExecTime++;

          // Log gantt
          let lastB = ganttTokens[ganttTokens.length-1];
          if(!lastB || lastB.name !== cpuProc.name) {
            ganttTokens.push({name: cpuProc.name, start: t-1, end: t, color: cpuProc.color});
          } else {
            lastB.end = t;
          }

          if (cpuProc.remainingTime === 0) {
            completed++;
            cpuProc = null;
            cpuExecTime = 0;
          } else {
            let algoDef = config[cpuProc.qKey];
            if (algoDef && algoDef.algo === 'RR' && cpuExecTime === algoDef.q) {
              qs[cpuProc.qKey].push(cpuProc);
              cpuProc = null;
              cpuExecTime = 0;
            }
          }
        }
      }

      if (!cpuProc && activeQ <= 3) {
        if (qs[activeQ].length > 0) {
          cpuProc = qs[activeQ].shift();
          cpuExecTime = 0;
        }
      }

      history.push({
        t: t,
        cpu: cpuProc ? { name: cpuProc.name, color: cpuProc.color, q: cpuProc.qKey } : null,
        qs: {
          1: qs[1].map(p=>({name:p.name, color:p.color})),
          2: qs[2].map(p=>({name:p.name, color:p.color})),
          3: qs[3].map(p=>({name:p.name, color:p.color}))
        },
        gantt: JSON.parse(JSON.stringify(ganttTokens))
      });

      if(completed===n) break;
      t++;
    }

    history.push({
      t: t, cpu: null,
      qs: {1:[], 2:[], 3:[]},
      gantt: JSON.parse(JSON.stringify(ganttTokens))
    });

    return { logs: ganttTokens, history };
  }
});
