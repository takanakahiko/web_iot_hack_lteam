var GROVECOLOR = function(i2cPort,slaveAddress){
  console.log("new");
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
  this.ledStatus = 1;
};
GROVECOLOR.prototype = {
  init: function(){
    console.log("init");
    let self = this;
    return new Promise(function(resolve, reject){

      spawn(function(){
        yield sleep(1000);
        const i2cSlave = yield self.i2cPort.open(self.slaveAddress);

        //set timing reg
        yield i2cSlave.write8(0x81,0x00);
        yield sleep(10);
        //set interrupt source reg
        yield i2cSlave.write8(0x83,0x03);
        yield sleep(14);
        //set interrupt control reg
        yield i2cSlave.write8(0x82,0x10);
        yield sleep(10);
        //set gain
        yield i2cSlave.write8(0x87,0x00);
        yield sleep(10);
        //set enable adc
        yield i2cSlave.write8(0x80,0x03);
        yield sleep(10);

        resolve();

      });
    });
  },
  clearInterrupt: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      spawn(function(){
        const i2cSlave = yield self.i2cPort.open(self.slaveAddress);

        yield i2cSlave.write8(0xe0,0x00);
        yield sleep(10);

        resolve();
      });
    });
  },
  calcColor: function(r,g,b){
    var self = this;
    var maxColor,tmp;
    if(self.ledStatus == 1){
      r = r * 1.70;
      b = b * 1.35;
      maxColor = Math.max(r,g);
      maxColor = Math.max(maxColor,b);

      if(maxColor > 255){
        tmp = 250.0/maxColor;
        g *= tmp;
        r *= tmp;
        b *= tmp;
      }
    }
    if(self.ledStatus == 0){
      maxColor = Math.max(r,g);
      maxColor = Math.mac(maxColor,b);

      tmp = 250.0/maxColor;
      g *= tmp;
      r *= tmp;
      b *= tmp;
    }

    var minColor = Math.min(r,g);
    minColor = Math.min(maxColor,b);
    maxColor = Math.max(r,g);
    maxColor = Math.max(maxColor,b);

    var gtmp=g;
    var rtmp=r;
    var btmp=b;

    if(r < 0.8*maxColor && r >= 0.6*maxColor){
      r *= 0.4;
    }else if(r < 0.6*maxColor){
      r *= 0.2;
    }

    if(g < 0.8*maxColor && g >= 0.6*maxColor){
      g *= 0.4;
    }else if(r < 0.6*maxColor){
      if(maxColor == rtmp && gtmp >= 2*btmp && gtmp >= 0.2*rtmp){
        g *= 5;
      }
      g *= 0.2;
    }

    if(b < 0.8*maxColor && b >= 0.6*maxColor){
      b *= 0.4;
    }else if(b < 0.6*maxColor){
      if(maxColor == rtmp && gtmp >= 2*btmp && gtmp >= 0.2*rtmp){
        g *= 0.5;
      }
      if(maxColor == rtmp && gtmp <= btmp && btmp >= 0.2*rtmp){
        b *= 5;
      }
      b *= 0.2;
    }

    minColor = Math.min(r,g);
    minColor = Math.min(maxColor,b);
    if(maxColor == g && r >= 0.85*maxColor && minColor == b){
      r = maxColor;
      b *= 0.4;
    }

    return {"r":r,"g":g,"b":b};
  },
  read: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      spawn(function(){
        const i2cSlave = yield self.i2cPort.open(self.slaveAddress);

        yield i2cSlave.write8(0xd0,0x00);
        yield sleep(10);

        const g0 = yield i2cSlave.read8(0xd0,true);
        const g1 = yield i2cSlave.read8(0xd1,true);
        const r0 = yield i2cSlave.read8(0xd2,true);
        const r1 = yield i2cSlave.read8(0xd3,true);
        const b0 = yield i2cSlave.read8(0xd4,true);
        const b1 = yield i2cSlave.read8(0xd5,true);
        const c0 = yield i2cSlave.read8(0xd6,true);
        const c1 = yield i2cSlave.read8(0xd7,true);


        const g = g1*256 + g0;
        const r = r1*256 + r0;
        const b = b1*256 + b0;
        const c = c1*256 + c0;

        resolve(self.calcColor(r,g,b));
      });
    });
  }
};
