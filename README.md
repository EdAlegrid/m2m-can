# m2m-can
A simple can-bus library based on SocketCAN.

links
https://github.com/linux-can/can-utils

## Can-bus setup

1. Access pi config.txt.
~~~
$ sudo leafpad /boot/config.txt
~~~
or
~~~
$ sudo mousepad /boot/config.txt
~~~

2. Uncomment to enable spi
dtparam=spi=on

3. Add the following as additional SPI setup.

  `dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25`

 Comment this section. This is not needed.

 `# dtoverlay=spi0-hw-cs`


4. Save the config.txt file.
5. Reboot the Raspberry pi.

6. Verify if the SPI was setup was successful and the CAN module was initialized.
~~~
$ dmesg | grep -i spi
~~~
The result will look like as shown below.
~~~
[    8.544607] mcp251x spi0.0 can0: MCP2515 successfully initialized.
~~~
By the same command you can check the CAN module if it was started by default:
~~~
$ dmesg | grep -i can
~~~
The result will look like as shown below.
~~~
[    9.793497] CAN device driver interface
[    9.819174] mcp251x spi0.0 can0: MCP2515 successfully initialized.
[  271.563711] IPv6: ADDRCONF(NETDEV_CHANGE): can0: link becomes ready
[  271.695497] can: controller area network core
[  271.711043] can: raw protocol
~~~

If for any reason this is not the case, you can add CAN module at system start:
~~~
$ sudo nano /etc/modules
~~~
Add "can" in a new line, save the file and reboot.

### Optional additional setup.
7. Install can utility
~~~
$ sudo apt-get install can-utils
~~~
8. Set clock speed.
~~~
$ sudo ip link set can0 up type can bitrate 500000
~~~
if the result is
~~~
 $ RTNETLINK answers: Device or resource busy
~~~
try
~~~
$ sudo ifconfig can0 down
~~~
then
~~~
$ sudo ifconfig can0 up
~~~
9. Listen for any byte in the bus
~~~
$ candump any
~~~
10. Write some data to the canbus.
~~~
$ cansend can0 111#FF
~~~
11. Below are some examples.

Wrong CAN-frame format! Try:
~~~
<can_id>#{R|data}          for CAN 2.0 frames
<can_id>##<flags>{data}    for CAN FD frames
~~~
~~~
<can_id> can have 3 (SFF) or 8 (EFF) hex chars
{data} has 0..8 (0..64 CAN FD) ASCII hex-values (optionally separated by '.')
<flags> a single ASCII Hex value (0 .. F) which defines canfd_frame.flags

e.g. 5A1#11.2233.44556677.88 / 123#DEADBEEF / 5AA# / 123##1 / 213##311
     1F334455#1122334455667788 / 123#R for remote transmission request.
~~~


## Master application

```js
'use strict';

const can = require('m2m-can');

let temp = null, random = null;

/* temperature can-bus device frame id */
const temp_id = '025';

/* random can-bus device frame id */
const random_id = '035';

/* master can-bus device frame id or can node id */
const device_id = '00C';

/* open can0 interface, set bitrate to 500000 and txqueuelen to 1000 */
can.open('can0', 500000, 1000, function(err, result){
  if(err) return console.error('can error', err);
  // outputs ip link set can0 up with txqueuelen 1000 and bitrate 500000 - success

  console.log('can.open result', result); // true if successful

  // 10 00 00 00
  // 10  0 80 19 => 10 00 80 19

  // 10 00 00 00
  // 10  0  8 19 => 10 00 08 19

  // can-bus random_id read frame data
  can.read('can0', {id:random_id, interval:100}, function(err, fdata){
    if(err) return console.log('read error', err);

    console.log('can-random frame data', fdata);
    // { id: '035', len: 3, data: [ 50, 0, 52 ], filter: '035', change: true }   
    // fdata[0] - integer value
    // fdata[1] - fractional value    
    // random = fdata[0] + '.' + fdata[1];
    random = fdata;
  });

  // can-bus temp_id read frame data 	
  can.read('can0', {id:temp_id, interval:200} , function(err, fdata){
    if(err) return console.log('read error', err);

    console.log('can-temp frame data', fdata);
	// { id: '025', len: 2, data: [ 18, 94 ], filter: '025', change: true }
    // fdata[0] - integer value
    // fdata[1] - fractional value    
    // temp = fdata[0] + '.' + fdata[1];
    temp = fdata;
  });
});
```
