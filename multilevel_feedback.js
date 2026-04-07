/**
 * multilevel_feedback.js
 */

document.addEventListener('DOMContentLoaded', () => {
  const { Process, GanttChart } = window.AppUtils;

  const form = document.getElementById('addProcessForm');
  const btnRun = document.getElementById('btnRun');
  const btnClear = document.getElementById('btnClear');
  const timeDisplay = document.getElementById('currentTimeDisplay');
  
  const lanes = {
    1: document.getElementById('q1Lanes'),
    2: document.getElementById('q2Lanes'),
    3: document.getElementById('q3Lanes')
  };

  let processes = [];
  let nextId = 1;
  let chart = new GanttChart('ganttCanvas');
  let simInterval = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bt = parseInt(document.getElementById('burstTime').value);
    
    // Arrival 0 since we're just demoing the feedback mechanism dynamically
    // To make it interesting, we'll scatter arrivals if user adds multiple?
    // Actually, MLFQ is easiest to understand if they arrive at t=0 and process together.
    const p = new Process(nextId++, 0, bt, 0);
    p.qKey = 1; // Start in Q1
    processes.push(p);

    lanes[1].innerHTML += `<div class="process-token" style="background:${p.color}">${p.name}</div>`;
    form.reset();
  });

  btnClear.addEventListener('click', () => {
    processes = [];
    nextId = 1;
    if(simInterval) clearInterval(simInterval);
    [1,2,3].forEach(k => lanes[k].innerHTML = '');
    chart.clear();
    timeDisplay.style.display = 'none';
  });

  btnRun.addEventListener('click', () => {
    if(!processes.length) return alert('Add processes');
    if(simInterval) clearInterval(simInterval);

    timeDisplay.style.display = 'block';
    
    // Reset process states for rerun
    let pList = processes.map(p => {
      let copy = new Process(p.id, p.arrivalTime, p.burstTime, 0, p.color);
      copy.qKey = 1;
      return copy;
    });

    const { logs, history } = simulateMLFQ(pList);

    // Animate
    let step = 0;
    chart.clear();
    
    simInterval = setInterval(() => {
      if (step >= history.length) {
        clearInterval(simInterval);
        return;
      }

      const h = history[step];
      [1,2,3].forEach(k => lanes[k].innerHTML = '');

      h.qs[1].forEach(p => lanes[1].innerHTML += drawToken(p));
      h.qs[2].forEach(p => lanes[2].innerHTML += drawToken(p));
      h.qs[3].forEach(p => lanes[3].innerHTML += drawToken(p));

      timeDisplay.innerText = `Time: ${h.t}`;
      
      chart.clear();
      h.gantt.forEach(b => chart.addBlock(b.name, b.start, b.end, b.color));
      chart.draw();

      step++;
    }, 200);

  });

  function drawToken(p) {
    let bs = p.active ? `box-shadow: 0 0 15px #fff; border: 2px solid #fff; transform: scale(1.1); z-index:10;` : '';
    return `<div class="process-token" style="background:${p.color}; ${bs}">${p.name}</div>`;
  }

  function simulateMLFQ(procs) {
    let t = 0;
    let n = procs.length;
    let completed = 0;
    let logs = [];
    let history = []; 

    let qs = { 1: [], 2: [], 3: [] };
    // Load initial
    procs.forEach(p => qs[1].push(p));

    let cpuProc = null;
    let cpuExecTime = 0;

    const QUANTUM = { 1: 8, 2: 16 };

    while (completed < n) {
      history.push({
        t: t,
        qs: {
          1: qs[1].map(p=>({name:p.name, color:p.color, active: false})),
          2: qs[2].map(p=>({name:p.name, color:p.color, active: false})),
          3: qs[3].map(p=>({name:p.name, color:p.color, active: false}))
        },
        gantt: JSON.parse(JSON.stringify(logs))
      });

      if (cpuProc) {
        // Tag active in history
        history[history.length-1].qs[cpuProc.qKey].push({name:cpuProc.name, color:cpuProc.color, active:true});

        cpuProc.remainingTime--;
        cpuExecTime++;

        let lastB = logs[logs.length-1];
        if(!lastB || lastB.name !== cpuProc.name) {
          logs.push({name: cpuProc.name, start: t, end: t+1, color: cpuProc.color});
        } else {
          lastB.end = t+1;
        }

        if (cpuProc.remainingTime === 0) {
          completed++;
          cpuProc = null;
        } else {
          // Demotion check
          if (cpuProc.qKey === 1 && cpuExecTime === QUANTUM[1]) {
            cpuProc.qKey = 2;
            qs[2].push(cpuProc);
            cpuProc = null;
          } else if (cpuProc.qKey === 2 && cpuExecTime === QUANTUM[2]) {
            cpuProc.qKey = 3;
            qs[3].push(cpuProc);
            cpuProc = null;
          }
        }
      }

      t++;

      // Dispatch
      if (!cpuProc) {
        if (qs[1].length > 0) {
          cpuProc = qs[1].shift();
          cpuExecTime = 0;
        } else if (qs[2].length > 0) {
          cpuProc = qs[2].shift();
          cpuExecTime = 0;
        } else if (qs[3].length > 0) {
          cpuProc = qs[3].shift();
          cpuExecTime = 0;
        }
      } else {
        // Preemption check for MLFQ? Usually higher Q preempts lower Q.
        // But here all arrive at t=0, so preemption only happens if they were sleeping, 
        // which we aren't modeling. So we can ignore preemption here.
      }
    }

    history.push({
      t: t,
      qs: {1:[], 2:[], 3:[]},
      gantt: JSON.parse(JSON.stringify(logs))
    });

    return { logs, history };
  }
});
