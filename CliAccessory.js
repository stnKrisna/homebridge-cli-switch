const DEFAULT_TIMEOUT = 5000;

let Service;
let Characteristic;

class CliAccessory {
  constructor(log, config, homebridge, execFunc = null) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    this.log = log;
    this.service = 'Switch';

    this.name = config['name'];
    this.onCommand = config['on'];
    this.offCommand = config['off'];
    this.stateCommand = config['state'];
    this.onValue = config['on_value'] || "playing";
    this.onValue = this.onValue.trim().toLowerCase();
    this.exactMatch = config['exact_match'] || true;
    this.execTimeout = config['exec_timeout'] || DEFAULT_TIMEOUT;

    this.accInfo = {
      manufacturer: config['manufacturer'] || 'CLI Manufacturer',
      model: config['model'] || 'CLI Model',
      serial_number: config['serial_number'] || 'CLI Serial Number',
    };

    this.exec = execFunc === null ?
      require('child_process').exec :
      execFunc;
  }

  execCommand(command, timeout) {
    if (Number.isNaN(timeout)) {
      timeout = DEFAULT_TIMEOUT
    }

    return new Promise((resolve, reject) => {
      this.exec(command, {
        timeout
      }, (error, stdout, stderr) => {
        if (error) {
          reject({
            error,
            stderr
          });
          return;
        }

        resolve(stdout);
      });
    })
  }

  matchesString(match) {
    if (this.exactMatch) {
      return (match === this.onValue);
    } else {
      return (match.indexOf(this.onValue) > -1);
    }
  }

  setState(powerOn, callback) {
    var accessory = this;
    var state = powerOn ? 'on' : 'off';
    var prop = state + 'Command';
    var command = accessory[prop];

    this.execCommand(command, this.execTimeout)
      .then(() => {
        accessory.log('Set ' + accessory.name + ' to ' + state);
        callback(null);
      })
      .catch(error => {
        accessory.log('Error: ' + error);
        callback(error || new Error('Error setting ' + accessory.name + ' to ' + state));
      });
  }

  getState(callback) {
    var accessory = this;
    var command = accessory['stateCommand'];

    this.execCommand(command, this.execTimeout)
      .then((stdout) => {
        var state = stdout.toString('utf-8').trim().toLowerCase();
        accessory.log('State of ' + accessory.name + ' is: ' + state);
        callback(null, accessory.matchesString(state));
      })
      .catch(error => {
        accessory.log('Error: ' + error);
        callback(error || new Error('Error getting state of ' + accessory.name));
      });
  }

  getAccessoryInfo () {
    const configurable = {
      manufacturer: Characteristic.Manufacturer,
      model: Characteristic.Model,
      serial_number: Characteristic.SerialNumber,
    };

    if (this.informationService === undefined) {
      this.informationService = new Service.AccessoryInformation();

      Object.keys(configurable).forEach(key => {
        this.informationService.setCharacteristic(configurable[key], this.accInfo[key])
      })
    }

    return this.informationService;
  }

  getAccessoryType () {
    const characteristics = {
      set: this.setState.bind(this),
      get: this.stateCommand ? this.getState.bind(this) : undefined
    };

    if (this.switchService === undefined) {
      this.switchService = new Service.Switch(this.name);
      let characteristic = this.switchService.getCharacteristic(Characteristic.On);

      Object.keys(characteristics).forEach((key) => {
        if (characteristics[key] !== undefined) {
          characteristic.on(key, characteristics[key]);
        }
      });
    }

    return this.switchService;
  }

  getServices() {
    return [this.getAccessoryInfo(), this.getAccessoryType()];
  }
};

module.exports = CliAccessory
