var ADS1015 = function(i2cPort, slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
};

ADS1015.prototype = {
  init: function(){
    let self = this;
    return new Promise(function(resolve, reject) {
      spawn(function(){
        const i2cSlave = yield self.i2cPort.open(self.slaveAddress);
        console.log("ADS1015.init OK");
        resolve();
      });
    });
  },
  read: function(channel){
    let self = this;
    return new Promise(function(resolve, reject) {
      spawn(function() {
        if ((channel > 3) || (channel < 0)) {
          console.log("ADS1015.read: channel error" + channel);
          err.code = 5;
          reject(err.message);
        }
        const i2cSlave = yield self.i2cPort.open(self.slaveAddress);
        var config = 0x4000 + (channel * 0x1000); // ADC channel
        config |= 0x8000; // Set 'start single-conversion' bit
        config |= 0x0003; // Disable the comparator (default val)
        config |= 0x0080; // 1600 samples per second (default)
        config |= 0x0100; // Power-down single-shot mode (default)
        config |= 0x0200; // +/-4.096V range = Gain 1
        var confL = config >> 8;
        var confH = config & 0x00ff;
        var data = confH | confL;
        yield i2cSlave.write16(0x01, data);
        yield sleep(10);
        var v = yield i2cSlave.read16(0, true);
        var vH = (v & 0x00ff) << 8;
        var vL = (v >> 8) & 0x00ffff;
        var value = (vH | vL) >> 4;
        resolve(value);
      });
    });
  }
};
