homebridge-cli-switch
=====================

A fork of [homebridge-ssh](https://github.com/zb0th/homebridge-ssh).

Supports triggering CLI commands on the HomeBridge platform.

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-cli-switch`
3. Update your configuration file. See `sample-config.json` in this repository for a sample.

## Configuration

Configuration sample:

```
"accessories": [
	{
		"accessory": "CLI",
		"name": "Bedroom TV",
		"on": "caffeinate -u -t 5",
		"off": "pmset displaysleepnow",
		"state": "ioreg -n IODisplayWrangler | grep -i IOPowerManagement | perl -pe 's/^.*DevicePowerState\"=([0-9]+).*$/\\1/'",
		"on_value": "4",
		"exact_match": true,
		"exec_timeout": 5000
	}
]
```
