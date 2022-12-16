const CliAccessory = require('./CliAccessory');

module.exports = function(homebridge) {
  homebridge.registerAccessory('homebridge-cli-switch', 'CLI-Switch', CliAccessory);
}
