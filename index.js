var Service;
var Characteristic;

var assign = require('object-assign');
var exec = require('child_process').exec;

const DEFAULT_TIMEOUT = 5000;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-cli', 'CLI', CliAccessory);
}

function CliAccessory(log, config) {
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
}

function execCommand(command, timeout) {
  if (Number.isNaN(timeout)) {
    timeout = DEFAULT_TIMEOUT
  }

  return new Promise((resolve, reject) => {
    exec(command, {
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

CliAccessory.prototype.matchesString = function(match) {
  if (this.exactMatch) {
    return (match === this.onValue);
  } else {
    return (match.indexOf(this.onValue) > -1);
  }
}

CliAccessory.prototype.setState = function(powerOn, callback) {
  var accessory = this;
  var state = powerOn ? 'on' : 'off';
  var prop = state + 'Command';
  var command = accessory[prop];

  execCommand(command, this.execTimeout)
    .then(() => {
      accessory.log('Set ' + accessory.name + ' to ' + state);
      callback(null);
    })
    .catch(error => {
      accessory.log('Error: ' + error);
      callback(error || new Error('Error setting ' + accessory.name + ' to ' + state));
    });
}

CliAccessory.prototype.getState = function(callback) {
  var accessory = this;
  var command = accessory['stateCommand'];

  execCommand(command, this.execTimeout)
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

CliAccessory.prototype.getServices = function() {
  var informationService = new Service.AccessoryInformation();
  var switchService = new Service.Switch(this.name);

  informationService
    .setCharacteristic(Characteristic.Manufacturer, 'CLI Manufacturer')
    .setCharacteristic(Characteristic.Model, 'CLI Model')
    .setCharacteristic(Characteristic.SerialNumber, 'CLI Serial Number');

  var characteristic = switchService.getCharacteristic(Characteristic.On)
    .on('set', this.setState.bind(this));

  if (this.stateCommand) {
    characteristic.on('get', this.getState.bind(this))
  };

  return [switchService];
}
