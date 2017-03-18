'use strict';

document.addEventListener("DOMContentLoaded", () => {
  spawn(function() {
    const accessor = yield navigator.requestI2CAccess();
    const port = accessor.ports.get(0);
    yield ads1015Init(port, 0x48, 0);
    setInterval(()=>{
      spawn(function(){
        const twist = yield getTwist(port, 0x48, 0);
        document.querySelector("#accelerometer").textContent = twist;
      });
    }, 6000);
  });
});


function ads1015Init(port, addr, channel) {
  return new Promise(function(resolve, reject){
    spawn(function() {
      const slave = yield port.open(addr);
      if ((channel > 4) || (channel < 0)) {
        console.log("ADS1015.read: channel error" + channel);
        err.code = 5;
        reject(err.message);
      }
      var config = 0x4000 + (channel * 0x1000);
      config |= 0x8000; // Set 'start single-conversion' bit
      config |= 0x0003; // Disable the comparator (default val)
      config |= 0x0080; // 1600 samples per second (default)
      config |= 0x0100; // Power-down single-shot mode (default)
      config |= 0x0200; // +/-4.096V range = Gain 1    })
      var confL = config >> 8;
      var confH = config & 0x00ff;
      var data = confH | confL;
      yield slave.write16(0x01, data);
      yield sleep(10);
      console.log('ads1050 init');
      resolve();
    });
  })
}

function getTwist(port, addr, channel) {
  console.log("value");
  return new Promise(function(resolve, reject){
    spawn(function() {
      const slave = yield port.open(addr);
      var loadBit = yield slave.read16(0, true);
      var vH = (loadBit & 0x00ff) << 8;
      var vL = (loadBit >> 8) & 0x00ffff;
      var value = (vH | vL) >> 4;
      console.log(value);
      resolve(value);
    });
  });
}
