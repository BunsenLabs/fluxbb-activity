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
    let anchor = document.querySelector(`td#${vec[0]}`);
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
    row.slice(1).forEach((col) => {
      let td = document.createElement("td");
      let a = document.createElement("a");
      a.setAttribute("href", `https://forums.bunsenlabs.org/viewtopic.php?id=${id}`);
      a.textContent = col;
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

$("button#last-update").click(trigger);
trigger();
