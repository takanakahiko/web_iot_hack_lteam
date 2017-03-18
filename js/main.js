'use strict';

document.addEventListener("DOMContentLoaded", () => {
  spawn(function() {
    const accessor = yield navigator.requestI2CAccess();
    const port = accessor.ports.get(0);
    const ads1015 = new ADS1015(port, 0x48);
    const groveColor = new GROVECOLOR(port,0x39);
    yield ads1015.init();
    yield groveColor.init();
    setInterval(()=>{
      spawn(function(){
        const twist = yield ads1015.read(0);
        const color = yield groveColor.read();
        console.log(twist);
        console.log(color);
        document.querySelector("#accelerometer").textContent = twist;
        band_play(twist / 2000.0);
      });
    }, 4200 - 200);
  });
});
