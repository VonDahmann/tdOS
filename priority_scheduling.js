/**
 * priority_scheduling.js
 */

document.addEventListener('DOMContentLoaded', () => {
  const { Process, GanttChart } = window.AppUtils;

  const form = document.getElementById('addProcessForm');
  const btnRun = document.getElementById('btnRun');
  const btnClear = document.getElementById('btnClear');
  const tbody = document.querySelector('#processTable tbody');
  
  let processes = [];
  let nextId = 1;

  let chartNP = new GanttChart('ganttNP');
  let chartP = new GanttChart('ganttP');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const at = parseInt(document.getElementById('arrTime').value);
    const bt = parseInt(document.getElementById('burstTime').value);
    const prio = parseInt(document.getElementById('priority').value);
    processes.push(new Process(nextId++, at, bt, prio));
    renderTable();
    form.reset();
  });

  function renderTable() {
    tbody.innerHTML = '';
    processes.forEach(p => {
      tbody.innerHTML += `<tr>
        <td style="color:${p.color};font-weight:bold">${p.name}</td>
        <td>${p.arrivalTime}</td>
        <td>${p.burstTime}</td>
        <td>${p.priority}</td>
      </tr>`;
    });
  }

  btnClear.addEventListener('click', () => {
    processes = [];
    nextId = 1;
    renderTable();
    chartNP.clear();
    chartP.clear();
    document.querySelectorAll('.metric-val').forEach(el => el.innerText = '0.0');
  });

  btnRun.addEventListener('click', () => {
    if (processes.length === 0) return alert("Add processes!");
    
    // Sort initially by AT
    let dataNP = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority, p.color)).sort((a,b)=>a.arrivalTime-b.arrivalTime);
    let dataP = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority, p.color)).sort((a,b)=>a.arrivalTime-b.arrivalTime);

    const logNP = simulateNP(dataNP);
    const logP = simulatePreemptive(dataP);

    drawChart(chartNP, logNP);
    drawChart(chartP, logP);

    calcMetrics(dataNP, logNP, 'metricsNP');
    calcMetrics(dataP, logP, 'metricsP');
  });

  function drawChart(chart, logs) {
    chart.clear();
    logs.forEach(l => {
      chart.addBlock(l.name, l.start, l.end, l.color);
    });
    chart.draw();
  }

  function consolidate(logs) {
    if (!logs.length) return [];
    let merged = [logs[0]];
    for(let i=1; i<logs.length; i++) {
      let last = merged[merged.length-1];
      let cur = logs[i];
      if (last.id === cur.id && last.end === cur.start) {
        last.end = cur.end;
      } else {
        merged.push(cur);
      }
    }
    return merged;
  }

  function simulateNP(procs) {
    let t = 0;
    let completed = 0;
    let n = procs.length;
    let isDone = new Array(n).fill(false);
    let logs = [];

    while (completed < n) {
      let idx = -1;
      let minPrio = Infinity;
      
      for(let i=0; i<n; i++) {
        if(procs[i].arrivalTime <= t && !isDone[i]) {
          if(procs[i].priority < minPrio) {
            minPrio = procs[i].priority;
            idx = i;
          } else if (procs[i].priority === minPrio) {
            if (procs[i].arrivalTime < procs[idx].arrivalTime) idx = i;
          }
        }
      }

      if (idx === -1) {
        t++;
      } else {
        const p = procs[idx];
        logs.push({id: p.id, name: p.name, start: t, end: t + p.burstTime, color: p.color});
        t += p.burstTime;
        isDone[idx] = true;
        completed++;
      }
    }
    return logs;
  }

  function simulatePreemptive(procs) {
    let t = 0;
    let completed = 0;
    let n = procs.length;
    let logs = [];
    let lastProc = null;
    let blockStart = 0;

    while (completed < n) {
      let idx = -1;
      let minPrio = Infinity;
      
      for(let i=0; i<n; i++) {
        if(procs[i].arrivalTime <= t && procs[i].remainingTime > 0) {
          if(procs[i].priority < minPrio) {
            minPrio = procs[i].priority;
            idx = i;
          } else if (procs[i].priority === minPrio) {
            if (idx === -1 || procs[i].arrivalTime < procs[idx].arrivalTime) idx = i;
          }
        }
      }

      if (idx === -1) {
        t++;
        if (lastProc) {
          logs.push({id: lastProc.id, name: lastProc.name, start: blockStart, end: t-1, color: lastProc.color});
          lastProc = null;
        }
      } else {
        const p = procs[idx];

        if (lastProc !== p) {
          if (lastProc) {
            logs.push({id: lastProc.id, name: lastProc.name, start: blockStart, end: t, color: lastProc.color});
          }
          blockStart = t;
          lastProc = p;
        }

        p.remainingTime--;
        t++;

        if (p.remainingTime === 0) {
          logs.push({id: p.id, name: p.name, start: blockStart, end: t, color: p.color});
          lastProc = null;
          completed++;
        }
      }
    }
    return consolidate(logs);
  }

  function calcMetrics(procs, logs, containerId) {
    let totTat=0, totWt=0;
    procs.forEach(p => {
      const last = logs.slice().reverse().find(l => l.id === p.id);
      const ct = last.end;
      const tat = ct - p.arrivalTime;
      const wt = tat - p.burstTime;
      totTat += tat;
      totWt += wt;
    });
    
    const container = document.getElementById(containerId);
    if(container) {
      const vals = container.querySelectorAll('.metric-val');
      vals[0].innerText = (totTat / procs.length).toFixed(2);
      vals[1].innerText = (totWt / procs.length).toFixed(2);
    }
  }

});
