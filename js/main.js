'use strict';

document.addEventListener("DOMContentLoaded", () => {
  spawn(function() {
    const accessor = yield navigator.requestI2CAccess();
    const port = accessor.ports.get(0);
    const ads1015 = new ADS1015(port, 0x48);
    const groveColor = new GROVECOLOR(port, 0x39);
    yield ads1015.init();
    yield groveColor.init();
    yield groveAccelerometerInit(port,0x53);
    setInterval(()=>{
      spawn(function(){
        const twist = yield ads1015.read(0);
        const water = yield ads1015.read(1);
        const color = yield groveColor.read();
        const accelerometer = yield getAccelerometer(port, 0x53);
        const distance = yield getDistance(port, 0x70);
        console.log(twist);
        console.log(water);
        console.log(color);
        console.log(accelerometer);
        console.log(distance);
        var paramValue = (twist + water + color.r + color.g + color.b + accelerometer.x + accelerometer.y + accelerometer.z + distance) % 100;
        $(".wave").css({opacity: '0.' + Math.round(paramValue)});
        console.log(paramValue);
        band_play(paramValue);
      });
    }, 4200 - 200);
  });
});

function groveAccelerometerInit(port,addr){
  return new Promise(function(resolve,reject){
    spawn(function(){
      const slave = yield port.open(addr);

      yield slave.write8(0x2d,0x00);
      yield sleep(10);
      yield slave.write8(0x2d,0x16);
      yield sleep(10);
      yield slave.write8(0x2d,0x08);
      yield sleep(10);

      resolve();

    });
  });
}


function getAccelerometer(port,addr){
  return new Promise(function(resolve,reject){
    spawn(function(){
      const slave = yield port.open(addr);

      yield slave.write8(0x80,0x03);
      yield sleep(14);

      const xL = yield slave.read8(0x32,true);
      const xH = yield slave.read8(0x33,true);
      const yL = yield slave.read8(0x34,true);
      const yH = yield slave.read8(0x35,true);
      const zL = yield slave.read8(0x36,true);
      const zH = yield slave.read8(0x37,true);

      let x = xL + (xH << 8);
      if(x & (1 << 16 - 1)){x = x - (1<<16);}
      let y = yL + (yH << 8);
      if(y & (1 << 16 - 1)){y = y - (1<<16);}
      let z = zL + (zH << 8);
      if(z & (1 << 16 - 1)){z = z - (1<<16);}

      //console.log(x);

      const EARTH_GRAVITY_MS2=9.80665;
      const SCALE_MULTIPLIER=0.004;

      x = x*SCALE_MULTIPLIER;
      y = y*SCALE_MULTIPLIER;
      z = z*SCALE_MULTIPLIER;

      x = x*EARTH_GRAVITY_MS2;
      y = y*EARTH_GRAVITY_MS2;
      z = z*EARTH_GRAVITY_MS2;

      x=Math.round(x*10000)/10000;
      y=Math.round(y*10000)/10000;
      z=Math.round(z*10000)/10000;

      x=Math.round(x);
      y=Math.round(y);
      z=Math.round(z);

      const accelerometer = {"x": x, "y": y, "z": z};
      //console.log(accelerometer.x);

      resolve(accelerometer);

    });
  });

}

function getDistance(port,addr){
  return new Promise(function(resolve,reject){
    spawn(function(){
      const slave = yield port.open(addr);

      yield slave.write8(0x00, 0x00);
      yield sleep(1);
      yield slave.write8(0x00, 0x51);
      yield sleep(70);
      const highBit = yield slave.read8(0x02, true);
      const lowBit = yield slave.read8(0x03, true);

      const distance = (highBit << 8) + lowBit;
      resolve(distance);

    });
  });
}
