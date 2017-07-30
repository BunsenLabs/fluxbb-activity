const [ ANCHOR, URL ] = [ 0, 1 ];
const API_VERSION = 0;
const DATA_SPEC = [
  [ "#posts-per-hour",                    `api/${API_VERSION}/posts/per-hour` ],
  [ "#posts-per-month-year",              `api/${API_VERSION}/posts/per-month-year` ],
  [ "#registrations-per-hour",            `api/${API_VERSION}/registrations/per-hour` ],
  [ "#registrations-per-month-year",      `api/${API_VERSION}/registrations/per-month-year` ],
  [ "#bans-by-creator",                   `api/${API_VERSION}/bans/by-creator` ],
  [ "#top-posters",                       `api/${API_VERSION}/posts/by-user` ],
  [ "#pms-per-month-year",                `api/${API_VERSION}/pms/per-month-year`],
  [ "#posts-per-day-month-year",          `api/${API_VERSION}/posts/recent`],
  [ "#topics-per-day-month-year",         `api/${API_VERSION}/topics/recent`],
  [ "#posts-per-week",                    `api/${API_VERSION}/posts/by-week`],
  [ "#topics-per-week",                   `api/${API_VERSION}/topics/by-week`],
  [ "counts",                             `api/${API_VERSION}/counts/all` ],
  [ "#users-by-timezone",                 `api/${API_VERSION}/users/by-timezone` ],
  [ "#table-topics",                      `api/${API_VERSION}/topics/top-views` ],
  [ "#table-topics-replies",              `api/${API_VERSION}/topics/top-replies` ]
];
const TABLE_HEADERS = {
  "#table-topics":          [ "Topic", "Views", "%" ],
  "#table-topics-replies":  [ "Topic", "Replies", "%" ]
};
const TSCALE_OPTIONS = {
  legend: { display: false },
  scales: {
    yAxes: [{ ticks: { beginAtZero: true } }],
  },
  elements: { point: { radius: 3 } }
};
const DSCALE_OPTIONS = {
  legend: { display: false },
  scales: {
    yAxes: [{ ticks: { beginAtZero: true } }],
  }
};

var COUNTER_CHART= null;
var COUNTER_CHART_COUNTER = null;
var COUNTER_CHART_DATA = null;

function counter_chart_init_buttons () {
  document.querySelectorAll(".bl-counter").forEach((elem) => {
    $(elem).click((e) => {
      counter_chart_show(elem.getAttribute("id"));
    });
  });
};

function counter_chart_show(key) {
  COUNTER_CHART_COUNTER = key || COUNTER_CHART_COUNTER;
  if(!COUNTER_CHART_DATA) {
    fetch(`api/${API_VERSION}/history/counts/all`).then((resp) => {
      if(resp.status==200) {
        resp.json().then((payload) => {
          COUNTER_CHART_DATA = payload;
          counter_chart_show_key(key);
        });
      }
    });
    return;
  }
  counter_chart_show_key(key);
};

function counter_chart_flatten_ts(ts, delta) {
  let day = [];
  let prev = null;
  let ts2 = [];

  let same = (x, y) => {
    let xx = x.date;
    let yy = y.date;

    if(xx.getFullYear() != yy.getFullYear() ||
       xx.getMonth() != yy.getMonth() ||
       xx.getDay() != yy.getDay())
      return false;

    return true;
  };

  let label = (date) => {
    let m = date.getMonth();
    let d = date.getDay();
    if (m<10) m = '0' + m;
    if (d<10) d = '0' + d;
    return `${date.getFullYear()}${m}${d}`;
  };

  let parse = (tsv) => {
    return {
      date: new Date(tsv[0]),
      value: tsv[1]
    };
  };

  ts.forEach((_) => {
    let tsv = parse(_);

    if(!prev || same(tsv, prev)) {
      day.push(tsv.value);
      prev = tsv;
      return;
    }

    let daymax = day.reduce((u, v) => {
      return Math.max(u, v);
    });

    ts2.push([ label(prev.date), daymax ]);

    day = [];
    prev = tsv;
  });

  return ts2;
};

/* Transform keyed time series into a delta series */
function counter_chart_todelta(ts) {
  let ts2 = [];
  let old = 0;
  for(let i = 0; i < ts.length; i++) {
    let k = ts[i][0];
    let v = ts[i][1];
    switch(i) {
      case 0:   ts2[i] = [ k, 0 ]; old = v; break;
      default:  ts2[i] = [ k, v - old ]; old = v;
    }
  }
  return ts2;
};

/* Creates a timeseries for $key */
function counter_chart_ts(key) {
  if(!COUNTER_CHART_DATA) return null;
  let ts = [];
  COUNTER_CHART_DATA.v.forEach((record) => {
    ts.push([record[0], record[1].filter((e) => {
      return e[0] == key;
    }).pop()[1]]);
  });
  return ts;
};

function counter_chart_show_key(key) {
  let row = document.querySelector("#counter-chart-row");
  row.style.display = 'initial';
  let canvas = document.querySelector("#counter-chart");
  let ts = counter_chart_ts(key);
  ts = counter_chart_flatten_ts(ts);
  ts_delta = counter_chart_todelta(ts);
  let spec = {
    type: "line",
    options: {
      scales: {
        yAxes: [
          { id: 'abs', type: 'linear', position: 'left' },
          { id: 'delta', type: 'linear', position: 'right' }
        ]
      }
    },
    data: {
      labels: ts.map((v)=>{ return v[0]; }),
      datasets:[
        {
          label: key,
          yAxisID: 'abs',
          data: ts.map((v)=>{ return v[1]; })
        },
        {
          label: `delta_${key}`,
          yAxisID: 'delta',
          borderColor: '#aa0000',
          data: ts_delta.map((v) => { return v[1]; })
        }
      ]
    }
  };
  if(COUNTER_CHART)  COUNTER_CHART.destroy();
  COUNTER_CHART = null;
  COUNTER_CHART = new Chart(canvas, spec);
};
 
function fetch_data() {
  let req = DATA_SPEC.map((spec) => {
      return fetch(spec[URL]).then((resp) => {
        return new Promise((resolve, reject) => {
            if(resp.status == 200)
              resolve({ data:resp.json(), anchor:spec[ANCHOR] });
            else
              reject(spec[0]);
          });
      });
  });
  return Promise.all(req);
};

function munge_data(anchor, data) {
  let munge_spec = {
    "top-posters": {
      type:"bar",
      values: () => { return data.map((v) => { return v[1]; }); },
      labels: () => { return data.map((v) => { return v[0]; }); },
      options:DSCALE_OPTIONS
    },
    "users-by-timezone": {
      type:"line",
      values: () => { return data.map((v) => { return v[1]; }); },
      labels: () => { return data.map((v) => { return v[0]; }); },
      options:DSCALE_OPTIONS
    },
    "bans-by-creator": {
      type:"bar",
      values: () => { return data.map((v) => { return v[1]; });
      }, labels: () => { return data.map((v) => { return v[0]; }); },
      options:DSCALE_OPTIONS
    },
    "per-hour": {
      type:"line",
      values: () => { return data.map((v) => { return v[1]; }); },
      labels: () => { return data.map((v) => { let n = v[0]; return n<10 ? `0${n}:00` : `${n}:00`; }); },
      options: DSCALE_OPTIONS
    },
    "per-month-year": {
      type: "line",
      options: TSCALE_OPTIONS,
      values: () => { return data.map((v) => { return v[2]; }); },
      labels: () => { return data.map((v) => { return v[0]<10 ? `${v[1]}-0${v[0]}` : `${v[1]}-${v[0]}`; }); }
    },
    "per-day-month-year": {
      type:"line",
      options:TSCALE_OPTIONS,
      values:()=>{ return data.map((v) => { return v[3]; }); },
      labels:()=>{ return data.map((v) => { return `${v[0]}-${v[1]}-${v[2]}`; }); }
    },
    "per-week": {
      type:"line",
      options:DSCALE_OPTIONS,
      values:()=>{ return data.slice(-52).map((v) => { return v[1]; }); },
      labels:()=>{ return data.slice(-52).map((v) => { return v[0]; }); }
    }
  };
  for(let key in munge_spec) {
    if(anchor.endsWith(key)) {
      let ref = munge_spec[key];
      return {
        type: ref.type,
        options: ref.options || {},
        data: { labels: ref.labels(), datasets: [ { backgroundColor: "#DDDDFF", borderColor: "#0000CC", data: ref.values(), label:"Primary" } ] }
      }
    }
  }
};

function update_stats_table(data) {
  data.forEach((vec) => {
    let anchor = document.querySelector(`#${vec[0]}`);
    if(anchor)
      anchor.textContent = vec[1].toLocaleString();
  });
}

function make_table(anchor, data) {
  let header = TABLE_HEADERS[anchor];
  let body = data;
  let table = document.querySelector(anchor);

  while(table.firstChild)
    table.removeChild(table.firstChild);

  let thead= document.createElement("thead");
  let tr = document.createElement("tr");
  header.forEach((col) => {
    let th = document.createElement("th");
    th.textContent = col;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  body.forEach((row) => {
    let tr = document.createElement("tr");
    let id = row[0];
    let colidx = 0;
    row.slice(1).forEach((col) => {
      let td = document.createElement("td");
      let a = document.createElement("a");
      a.setAttribute("href", `https://forums.bunsenlabs.org/viewtopic.php?id=${id}`);
      a.textContent = ++colidx>1 ? parseFloat(col).toLocaleString() : col;
      td.appendChild(a);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
};

function update() {
  fetch_data().then((v) => {
    v.forEach((key) => {
      key.data.then((d) => {
        let anchor = key.anchor;
        let rawdata = d.v;
        if(anchor === "counts") {
          update_stats_table(rawdata);
        } else if(anchor.startsWith("#table-")) {
          make_table(anchor, rawdata);
        } else {
          let spec = munge_data(anchor, rawdata);
          new Chart(document.querySelector(anchor), spec);
        }
      });
    });
  });
};

function trigger() {
  update();
  fetch("api/0/last-update").then((resp) => {
    if(resp.status===200) {
      resp.json().then((d) => {
        let lu = parseInt(d.v.last_update, 0xA)*1000;/*[s]*/
        setTimeout(trigger, 300000);
        document.querySelector("button#last-update").innerHTML = `Last update: ${new Date(lu)} [+${parseInt(d.v.update_interval).toLocaleString()}s]`;
      });
    }
  });
};

counter_chart_init_buttons();
$("button#last-update").click(trigger);
trigger();
