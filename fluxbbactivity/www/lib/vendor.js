var CHARTS = {}; /* { anchor: Chart() } */
const [ ANCHOR, URL ] = [ 0, 1 ];
const DATA_SPEC = [
  [ "#posts-per-hour",                    "api/posts/per-hour" ],
  [ "#posts-per-month-year",              "api/posts/per-month-year" ],
  [ "#registrations-per-hour",            "api/registrations/per-hour" ],
  [ "#registrations-per-month-year",      "api/registrations/per-month-year" ],
  [ "#bans-by-creator",                   "api/bans/by-creator" ],
  [ "#top-posters",                       "api/posts/by-user" ],
  [ "#pms-per-month-year",                "api/pms/per-month-year"]
];
const TSCALE_OPTIONS = {
  legend: { display: false },
  scales: {
    yAxes: [{ ticks: { beginAtZero: true } }],
  }
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
      values: () => {
        return data.map((v) => {
          return v[1];
        });
      },
      labels: () => {
        return data.map((v) => {
          return v[0];
        });
      },
      options:DSCALE_OPTIONS
    },
    "bans-by-creator": {
      type:"bar",
      values: () => {
        return data.map((v) => {
          return v[1];
        });
      },
      labels: () => {
        return data.map((v) => {
          return v[0];
        });
      },
      options:DSCALE_OPTIONS
    },
    "per-hour": {
      type:"bar",
      values: () => {
        return data.map((v) => {
          return v[1];
        });
      },
      labels: () => {
        return data.map((v) => {
          let n = v[0];
          if(n<10)
            return `0${n}:00`;
          else
            return `${n}:00`;
        });
      },
      options: DSCALE_OPTIONS
    },
    "per-month-year": {
      type: "bar",
      options: TSCALE_OPTIONS,
      values: () => {
        return data.map((v) => {
          return v[2];
        });
      },
      labels: () => {
        return data.map((v) => {
          if(v[0]<10)
            return `${v[1]}-0${v[0]}`;
          else
            return `${v[1]}-${v[0]}`;
        });
      }
    }
  };
  for(let key in munge_spec) {
    if(anchor.endsWith(key)) {
      let ref = munge_spec[key];
      return {
        type: ref.type,
        options: ref.options || {},
        data: { labels: ref.labels(), datasets: [ { backgroundColor: "#999", data: ref.values(), label:"Primary" } ] }
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
        if(spec) {
          console.log(anchor, spec.options, spec.data);
          if(anchor in CHARTS) {
            let chart = CHARTS[anchor];
            chart.data = spec.data;
            chart.update();
          } else {
            CHARTS[anchor] = new Chart(document.querySelector(anchor), spec);
          }
        }
      });
    });
  });
};

update();
