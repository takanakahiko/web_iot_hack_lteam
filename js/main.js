
// document 内のリソースが読み終わるのを待つ
document.addEventListener("DOMContentLoaded", () => {

  // task.js の spawn 関数内では Promise が同期的に記述できる
  spawn(function() {

    // I2C へのアクセサを取得
    const accessor = yield navigator.requestI2CAccess();
    // I2C 0 ポートを使うので、0 を指定してポートを取得
    const port = accessor.ports.get(0);

    //yield groveLightInit(port,0x29);
    yield groveAccelerometerInit(port,0x53);

    //let ads1015 = new ADS1015(port,0x48);
    //yield ads1015.init();

    let angle = 0
    let direction= 1;

    setInterval( ()=>{
      spawn(function(){

        //const temp = yield getTemp(port,0x48);
        //const distance = yield getDistance(port,0x70);
        //const lux = yield getLight(port,0x29);
        const accelerometer = yield getAccelerometer(port,0x53);

        // HTML 画面に距離を表示
        //document.querySelector("#temp").textContent = "temp: " + temp;
        //document.querySelector("#distance").textContent = "distance: "+distance;
        //document.querySelector("#lux").textContent = "lux: "+lux;
        document.querySelector("#accelerometer").textContent = "acceleromter: " + accelerometer.x + ","+ accelerometer.y + ","+ accelerometer.z;

        // ジャイロセンサ可視化処理
        $('#accelerometerX').animate({'width': (accelerometer.x + 16) * 1 + "%" });
        $('#accelerometerY').animate({'width': (accelerometer.y + 16) * 1 + "%" });
        $('#accelerometerZ').animate({'width': (accelerometer.z + 16) * 1 + "%" });

        // エフェクタ数値変更処理
        $('#freq').val((accelerometer.x + 16) / 32);
        FilterSample.changeFrequency(document.querySelector('#freq'));

        //const moist = ads1015.read(0);
        //document.querySelector("#moisture").textContent = "moisture: " + moist;

      });

    },500);

  });

});

function getTemp(port,addr){
  return new Promise(function(resolve,reject){
    spawn(function(){
      const slave = yield port.open(addr);

      const highBit = yield slave.read8(0x00, true);
      const lowBit = yield slave.read8(0x01, true);

      const temp = ((highBit << 8) + lowBit)/128.0;
      resolve(temp);

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


function groveLightInit(port,addr){
  return new Promise(function(resolve,reject){
    spawn(function(){
      const slave = yield port.open(addr);

      yield slave.write8(0x80,0x03);
      yield sleep(10);
      yield slave.write8(0x81,0x00);
      yield sleep(14);
      yield slave.write8(0x86,0x00);
      yield sleep(10);
      yield slave.write8(0x80,0x00);
      yield sleep(10);

      resolve();

    });
  });
}

function getLight(port,addr){
  return new Promise(function(resolve,reject){
    spawn(function(){
      const slave = yield port.open(addr);

      yield slave.write8(0x80,0x03);
      yield sleep(14);


      const ch0H = yield slave.read8(0x8d,true);
      const ch0L = yield slave.read8(0x8c,true);
      const ch1H = yield slave.read8(0x8f,true);
      const ch1L = yield slave.read8(0x8e,true);

      const ch0 = ((ch0H << 8) | ch0L);
      const ch1 = ((ch1H << 8) | ch1L);

      const lux = calculateLux(ch0,ch1,0,0,0);

      resolve(lux);

    });
  });

}

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

function calculateLux(ch0,ch1,iGain,tInt,iType){
    var chScale = 0x7517 << 4;
    var LUX_SCALE = 14;
    var CH_SCALE = 10;
    var RATIO_SCALE = 9;

    var K1T = 0x0040;   // 0.125 * 2^RATIO_SCALE
    var B1T = 0x01f2;   // 0.0304 * 2^LUX_SCALE
    var M1T = 0x01be;   // 0.0272 * 2^LUX_SCALE
    var K2T = 0x0080;   // 0.250 * 2^RATIO_SCA
    var B2T = 0x0214;   // 0.0325 * 2^LUX_SCALE
    var M2T = 0x02d1;   // 0.0440 * 2^LUX_SCALE
    var K3T = 0x00c0;   // 0.375 * 2^RATIO_SCALE
    var B3T = 0x023f;   // 0.0351 * 2^LUX_SCALE
    var M3T = 0x037b;   // 0.0544 * 2^LUX_SCALE
    var K4T = 0x0100;   // 0.50 * 2^RATIO_SCALE
    var B4T = 0x0270;   // 0.0381 * 2^LUX_SCALE
    var M4T = 0x03fe;   // 0.0624 * 2^LUX_SCALE
    var K5T = 0x0138;   // 0.61 * 2^RATIO_SCALE
    var B5T = 0x016f;   // 0.0224 * 2^LUX_SCALE
    var M5T = 0x01fc;   // 0.0310 * 2^LUX_SCALE
    var K6T = 0x019a;   // 0.80 * 2^RATIO_SCALE
    var B6T = 0x00d2;   // 0.0128 * 2^LUX_SCALE
    var M6T = 0x00fb;   // 0.0153 * 2^LUX_SCALE
    var K7T = 0x029a;   // 1.3 * 2^RATIO_SCALE
    var B7T = 0x0018;   // 0.00146 * 2^LUX_SCALE
    var M7T = 0x0012;   // 0.00112 * 2^LUX_SCALE
    var K8T = 0x029a;   // 1.3 * 2^RATIO_SCALE
    var B8T = 0x0000;   // 0.000 * 2^LUX_SCALE
    var M8T = 0x0000;   // 0.000 * 2^LUX_SCALE

    var channel0 = (ch0 * chScale) >> CH_SCALE;
    var channel1 = (ch1 * chScale) >> CH_SCALE;

    var ratio1 = 0;
    if (channel0!= 0) ratio1 = (channel1 << (RATIO_SCALE+1))/channel0;
    var ratio = (ratio1 + 1) >> 1;

    if ((ratio >= 0) && (ratio <= K1T)){b=B1T; m=M1T;
    }else if (ratio <= K2T){b=B2T; m=M2T;
    }else if (ratio <= K3T){b=B3T; m=M3T;
    }else if (ratio <= K4T){b=B4T; m=M4T;
    }else if (ratio <= K5T){b=B5T; m=M5T;
    }else if (ratio <= K6T){b=B6T; m=M6T;
    }else if (ratio <= K7T){b=B7T; m=M7T;
    }else if (ratio > K8T){b=B8T; m=M8T;}

    var temp=((channel0*b)-(channel1*m));
    if(temp<0) temp=0;
    temp+=(1<<(LUX_SCALE-1));
    var lux=temp>>LUX_SCALE;
    return lux;

}
