const [ ANCHOR, URL ] = [ 0, 1 ];
const DATA_SPEC = [
  [ "#posts-per-hour",                    "api/posts/per-hour" ],
  [ "#posts-per-month-year",              "api/posts/per-month-year" ],
  [ "#registrations-per-hour",            "api/registrations/per-hour" ],
  [ "#registrations-per-month-year",      "api/registrations/per-month-year" ],
  [ "#bans-by-creator",                   "api/bans/by-creator" ],
  [ "#top-posters",                       "api/posts/by-user" ],
  [ "#pms-per-month-year",                "api/pms/per-month-year"],
  [ "#posts-per-day-month-year",          "api/posts/recent"],
  [ "#posts-per-week",                    "api/posts/by-week"]
];
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
      values:()=>{ return data.map((v) => { return v[1]; }); },
      labels:()=>{ return data.map((v) => { return v[0]; }); }
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

function update() {
  fetch_data().then((v) => {
    v.forEach((key) => {
      key.data.then((d) => {
        let anchor = key.anchor;
        let rawdata = d.v;
        let spec = munge_data(anchor, rawdata);
        new Chart(document.querySelector(anchor), spec);
      });
    });
  });
};

function trigger() {
  update();
  fetch("api/last-update").then((resp) => {
    if(resp.status===200) {
      resp.json().then((d) => {
        let lu = parseInt(d.v, 0xA);
        let ct = (new Date).getTime();
        setTimeout(trigger, 1000 * 930 - (ct - lu));
        document.querySelector("button#last-update").innerHTML = `Last update: ${new Date(lu * 1000)}`;
      });
    }
  });
};

$("button#last-update").click(trigger);
trigger();
