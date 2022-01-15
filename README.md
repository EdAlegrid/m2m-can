# m2m-can
A simple can-bus library based on SocketCAN.

[Setup can-bus (using MCP2515 CAN module) on Raspberry Pi](#can-bus-setup)
<!--## Can-bus setup (using MCP2515 CAN module)-->
## Master application

```js
'use strict';

const can = require('m2m-can');

let temp = null, random = null;

/* temperature can-bus device frame id */
const temp_id = '025';

/* random can-bus device frame id */
const random_id = '035';

/* master can-bus frame id or can node id */
const device_id = '00C';

/* open can0 interface, set bitrate to 500000 */
can.open('can0', 500000, function(err, result){ // defaults to txqueuelen = 1000, rs = 100
  if(err) return console.error('can0 interface open error', err.message);
  // You'll see an output - ip link set can0 up with txqueuelen 1000 and bitrate 500000 - success

  console.log('can.open result', result); // true if successful

  // read random frame data from CAN bus using the random_id
  can.read('can0', {id:random_id}, function(err, fdata){
    if(err) return console.log('read error', err);

    console.log('can-random frame data', fdata); // { id: '035', len: 3, data: [ 50, 52 ], filter: '035', change: true }   
    // fdata[0] - integer value
    // fdata[1] - fractional value    
    random = fdata[0] + '.' + fdata[1];
    // random = fdata;
    console.log('random', random);
  });

  // read temperature frame data from CAN bus using the temp_id
  can.read('can0', {id:temp_id} , function(err, fdata){
    if(err) return console.log('read error', err);

    console.log('can-temp frame data', fdata); // { id: '025', len: 2, data: [ 18, 94 ], filter: '025', change: true }
    // fdata[0] - integer value
    // fdata[1] - fractional value    
    temp = fdata[0] + '.' + fdata[1];
    console.log('temperature', temp);
  });
});
```

## Slave1 application
```js
'use strict';

const can = require('m2m-can');
const r = require('array-gpio');

/* using built-in i2c library for capturing temperature data using the MCP9808 chip */
let i2c =  require('./node_modules/array-gpio/examples/i2c9808.js');

/* setup can bus device led status indicator using array-gpio*/
let led1 = r.out(33); // can device status
let led2 = r.out(35); // data change status

/* can-bus temperature device id */
let temp_id = '025';

can.open('can0', 500000, function(err, result){ // defaults to txqueuelen = 1000, rs = 100
  if(err) return console.error('can0 interface open error', err);

  console.log('result', result); // true if successful

  led1.on();
  led2.off();

  // watch data changes in a cyclic mode
  // built-in within the watch method
  can.watch('can0', {id:temp_id}, (err, data) => { // watch interval defaults to 100 ms
    if(err) return console.error('can watch error', err.message);

    data.payload = i2c.getTemp();

    // if data value has changed, send data to CAN bus
    if(data.change === true){
      console.log('send temp data ...', data.payload);
      led2.pulse(200);
      can.send('can0', data.id, data.payload);
    }
    else{
      console.log('*no temp data change...');
    }
  });
});

```
## Slave2 application
```js
'use strict';

const can = require('m2m-can');
const r = require('array-gpio');

/* setup can bus device led status indicator using array-gpio*/
let led1 = r.out(33); // can device status
let led2 = r.out(35); // data change status

// can-bus device random id
const device_id = '035';

// Initialize can bus by setting the bitrate
can.open('can0', 500000, function(err, result){
  if(err) return console.error('can0 interface open error', err.message);

    led1.on();
    led2.off();

    can.watch('can0', {id:device_id}, (err, data) => {
       if(err){ return console.error('err', err); }

       data.payload = 10 + Math.floor(( Math.random() * 200) + 100);
       if(data.change){
         console.log('sending random data', data.payload);
         can.send('can0', device_id, data.payload);
         led2.pulse(300);
       }
       else{
	       //console.log('no data change');
       }
    });
});
```
<br>
## Can-bus setup

1. Open the Raspberry Pi config.txt file using an editor.
~~~
$ sudo mousepad /boot/config.txt
~~~

&ensp;&ensp;or

~~~
$ sudo leafpad /boot/config.txt
~~~

2. Uncomment the following section to enable SPI.

~~~
dtparam=spi=on
~~~

3. Add the following as additional SPI setup.
~~~
dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25
~~~

4. Comment the following section. This is not needed.
~~~
# dtoverlay=spi0-hw-cs
~~~

5. Save the config.txt file. Reboot the Raspberry Pi.


6. Verify the SPI configuration. The CAN module should be initialized.
~~~
$ dmesg | grep -i spi
~~~
&ensp;&ensp;The result will look like as shown below.
~~~
[    8.544607] mcp251x spi0.0 can0: MCP2515 successfully initialized.
~~~
&ensp;&ensp;By the same command you can check the CAN module if it was started by default:
~~~
$ dmesg | grep -i can
~~~
&ensp;&ensp;The result will look like as shown below.
~~~
[    9.793497] CAN device driver interface
[    9.819174] mcp251x spi0.0 can0: MCP2515 successfully initialized.
[  271.563711] IPv6: ADDRCONF(NETDEV_CHANGE): can0: link becomes ready
[  271.695497] can: controller area network core
[  271.711043] can: raw protocol
~~~

&ensp;&ensp;If for any reason this is not the case, you can add the CAN module at system start:
~~~
$ sudo nano /etc/modules
~~~
&ensp;&ensp;Add "can" in a new line, save the file and reboot.

<br>

### Optional additional CAN utilities.
1. Install Linux can utility for SocketCAN (https://github.com/linux-can/can-utils).
~~~
$ sudo apt-get install can-utils
~~~

2. Set clock the speed.
~~~
$ sudo ip link set can0 up type can bitrate 500000
~~~

&ensp;&ensp;If the device is busy as shown below:
~~~
 $ RTNETLINK answers: Device or resource busy
~~~

&ensp;&ensp;Shutdown the CAN interface as shown below:
~~~
$ sudo ifconfig can0 down
~~~

&ensp;&ensp;And then restart it as shown below:
~~~
$ sudo ifconfig can0 up
~~~

3. Listen/Receive for any data in the CAN bus.
~~~
$ candump any
~~~

4. Send/Write some data to the CAN bus.
~~~
$ cansend can0 111#FF
~~~

5. Below are some examples.

&ensp;&ensp;Wrong CAN-frame format! Try:
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

<br>
Links

can-utils https://github.com/linux-can/can-utils
