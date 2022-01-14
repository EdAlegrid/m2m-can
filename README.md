# m2m-can
A simple can-bus library based on SocketCAN.

## Can-bus setup (using MCP2515 CAN module)

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
## Slave2 application


<br>
Links

can-utils https://github.com/linux-can/can-utils
