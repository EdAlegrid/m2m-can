/*!
 * can.js
 * Copyright(c) 2019 Ed Alegrid  <ealegrid@gmail.com>
 * 
 * MIT Licensed
 */

'use strict';

const { exec } = require('child_process');
const can = require('bindings')('can_addon');

// duplicate can Id container
var watchSend = [], watchRead = [], read_all_singleton = false;
var watchReadAll = {setInterval_timeout:null, read_process:null, interval:null};

/* istanbul ignore next */
function intToHex(value) {
  let number = (+value).toString(16).toUpperCase()
  if( (number.length % 2) > 0 ) { number= "0" + number }
  return number
}

/* 
 * bring can interface down
 */
/* istanbul ignore next */
var can_if_down = exports.can_if_down = function(can_interface, cb){
  if(!can_interface){
    throw new Error('invalid can interface argument');
  }
  exec('sudo ifconfig ' + can_interface + ' down', (error, stdout, stderr) => {
    if (error) {
      if(cb){
        return cb(error, null);
      }
      console.error(`ifconfig down error: ${error}`);
      return;
    }
    if(stdout || stderr){
      console.log(`ifconfig down stdout: ${stdout}`);
      if(cb){
        return cb(stderr, null);
      }
      console.error(`ifconfig down stderr: ${stderr}`);
      return;  
    }
    //console.log('bringing '+can_interface+' down', stdout);
    if(cb){
      process.nextTick(function (){
        cb(null, true);
      });
    }
  });
};

/*
 * bring can interface up
 */
/* istanbul ignore next */
var can_if_up = exports.can_if_up = function(can_interface, cb){
  if(!can_interface){
    throw new Error('invalid can interface argument');
  }
  exec('sudo ifconfig ' + can_interface + ' up', (error, stdout, stderr) => {
    if (error) {
      if(cb){
        return cb(error, null);
      }
      console.error(`ifconfig up error: ${error}`);
      return;
    }
    if(stdout || stderr){
      console.log(`ifconfig up stdout: ${stdout}`);
      if(cb){
        return cb(stderr, null);
      }
      console.error(`ifconfig up stderr: ${stderr}`);
      return;  
    }
    // console.log('bringing '+can_interface+' up', stdout);
    if(cb){
      process.nextTick(function (){
        cb(null, true);
      });
    }
  });
};

/*
 * set can interface bitrate, qlen and rs (restart-ms)
 */
/* istanbul ignore next */
var set_can_if = exports.set_can_if = function(can_interface, bitrate, qlen, rs, cb){
  if(!can_interface || !bitrate || !qlen ||!rs){
    can_interface = 'can0';
    bitrate = '500000';
    qlen = '1000';
    rs = '100';
  }
  if(bitrate && typeof bitrate === 'number'){
    bitrate = bitrate.toString();
  }
  if(qlen && typeof qlen === 'number'){
    qlen = qlen.toString();
  }
  if(rs && typeof rs === 'number'){
    rs = rs.toString();
  }
  exec('sudo ip link set '+can_interface+' qlen '+qlen+' type can bitrate ' + bitrate + ' restart-ms ' + rs, (error, stdout, stderr) => {
  //exec('sudo ip link set '+can_interface+' qlen '+qlen+' type can bitrate ' + bitrate + ' restart-ms ' + rs, { shell: true, stdio: 'inherit' }, (error, stdout, stderr) => {
    /* istanbul ignore next */
    if (error) {
      if(cb){
        return cb(error, null);
      }
      console.error(`set_can_if() error: ${error}`);
      //console.log('can_interface '+can_interface+' or resource is busy');
      return;
    }
    /* istanbul ignore next */
    if(stdout || stderr){
      console.log(`set_can_if() stdout: ${stdout}`);
      if(cb){
        return cb(stderr, null);
      }
      console.error(`set_can_if() stderr: ${stderr}`);
      return;  
    }
    console.log('ip link setup - '+ can_interface +' is up\nbitrate: '+ bitrate +', qlen: ' + qlen + ', restart-ms: ' + rs);
    if(cb){
      process.nextTick(function (){
        cb(null, true);
      });
    }
  });
};

/*
 * close can interface
 * 'ifconfig ' + can_interface + ' down'
 */
var close = exports.close = function(can_interface, cb){
  if(!can_interface){
    can_interface = 'can0';
  }
  can_if_down(can_interface);
  /*if(watchSend.length > 0){
    for (let x = 0; x < watchSend.length; x++) {
      clearInterval((watchSend[x].watch_timeout);
    }
  }
  if(watchRead.length > 0){
    for (let i = 0; i < watchRead.length; i++) {
      clearInterval((watchRead[i].setInterval_timeout);
    }
  }
  clearInterval(watchReadAll.setInterval_timeout);
  */
};

/*
 * bring can interface up - ifconfig down => ifconfig up => set bitrate, qlen & rs
 * open(can_interface, bitrate, qlen, cb)
 * open(can_interface, {bitrate:bitrate, qlen:qlen, rs:rs}, cb)
 */
var open = exports.open = function(){
  let args_len = arguments.length, options = {};
  let can_interface = null, bitrate = null, qlen = null, rs = null, cb = null;
  
  if(args_len < 3){
    throw new Error('invalid arguments');
  }

  if(typeof arguments[args_len - 1] !== 'function'){
    throw new Error('invalid callback argument');
  }
  
  if(arguments[0]){
    can_interface = arguments[0];
  }

  if(arguments[1]){
    options = arguments[1];
    bitrate = arguments[1];
  }

  if(arguments[2] && typeof arguments[2] !== 'function' ){
    qlen = arguments[2];
  }

  if(arguments[3] && typeof arguments[3] !== 'function' ){
    rs = arguments[3];
  }
  
  if(options.bitrate){
    bitrate = options.bitrate;
  }

  if(options.qlen){
    qlen = options.qlen;
  }

  if(options.rs){
    rs = options.rs;
  }
  
  if(typeof arguments[args_len - 1] === 'function'){
    cb = arguments[args_len - 1];
  }
  
  if(typeof can_interface !== 'string'){
    throw new Error('invalid can_interface argument');
  }

  if(args_len > 3 && bitrate && !Number.isInteger(bitrate)){
    throw new Error('invalid bitrate argument');
  }

  if(args_len > 3 && qlen && !Number.isInteger(qlen)){
    throw new Error('invalid qlen argument')
  }

  if(args_len > 3 && rs && !Number.isInteger(rs)){
    throw new Error('invalid rs argument')
  }

  if(!cb){
    return console.error(new Error('missing callback argument'));
  }

  if(bitrate){
    bitrate = bitrate.toString();
  }

  if(qlen){
    qlen = qlen.toString();
  }

  if(rs){
    rs = rs.toString();
  }

  if(!can_interface || !bitrate || !qlen || !rs){
    can_interface = 'can0';
    bitrate = '500000';
    qlen = '1000';
    rs = '100';
  }

  // can interface down
  can_if_down(can_interface, function(err, result){
    if(err) {
      console.error('can_if_down error', err);
      if(err.code == 255){
        console.error('\nTry running running your app w/ sudo\n'); 
      }
      process.exit();
    }
    if(result){
      // set can bitrate, qlen and rs
      set_can_if(can_interface, bitrate, qlen, rs, function(err, result){
        if(err) return console.error('set_can_if error', err);
        if(result){
          // bring can interface up
          can_if_up(can_interface, function(err, result){
            if(err) return console.error('can_if_down error', err);
            if(result){
              if(cb){
                process.nextTick(function (){
                  cb(null, true);
                });
              }
            }
          });
        }
      });
     }
  });
};

/************************************

      send frame base function

 ************************************/
var send_can = function(can_interface, data, cb){
  if(!can_interface){
     throw new Error('invalid can interface');
  }
  if(!data){
    throw new Error('invalid can data');
  }
  let rv = can.sc_send(Buffer.from(can_interface + '\0'), Buffer.from(data + '\0'));
  // console.log('send success', rv);
  /* istanbul ignore next */
  if(cb){
    process.nextTick(() => {
      if(rv){
         return cb(rv, null);
      }
      cb(null, rv); 
    });
  }
};

/* 
 * send a normalized frame data (separate frame id and frame payload), one-time function call
 * send(can_interface, id, data, cb)
 */
var send = exports.send = function(can_interface, id, pl, cb){
  if(typeof can_interface !== 'string'){
    throw new Error('invalid can interface argument')
  }

  if(typeof id !== 'string'){
    new Error('invalid can id argument')	
  }

  let data = id + '#' + pl; 
  send_can(can_interface, data, cb);
};

/*
 * send a classic frame data (id and data integrated as one frame argument), one-time function call
 * sendC(can_interface, 'id#data', cb)
 */
var sendC = exports.sendC = function(can_interface, data, cb){
  if(typeof can_interface !== 'string'){
    let em = 'invalid can interface argument';
    if(cb){
      return cb(new Error(em), null);
    }
    throw new Error(em); 
  }
  if(typeof data !== 'string'){
    let em = 'invalid data argument'; 
    if(cb){
      return cb(new Error(em), null);
    }
    throw new Error(em);
  }
  send_can(can_interface, data, cb);
};

/*
 * watch helper method for can send
 * watch data for changes before sending it to can bus  
 * watch(can_interface, id, interval, cb) 
 */
var watch = exports.watch = function(){
  let args_len = arguments.length, options = {}, watch_process = null, intSend = null;
  let can_interface = null, id = null, option = null, cyclic = null, interval = null, cb = null;

  let value = null, current_value = null;
  let watch_timeout = {};
  let data = {id:null, payload:null}; 

  if(args_len < 2){
    throw new Error('invalid arguments');
  }
  if(typeof arguments[args_len - 1] !== 'function'){
    throw new Error('invalid callback argument');
  }
  
  if(arguments[0]){
    can_interface = arguments[0];
  }

  if(arguments[1]){
    options = arguments[1];
    data.id = arguments[1];
    id = arguments[1];
  }
  
  if(options.id){
    id = options.id;
    data.id = options.id;
  }

  if(options.payload){
    data.payload = options.payload;
  }

  if(options.option){
    option = options.option;
  }

  if(options.cyclic == false || options.cyclic == true){
    cyclic = options.cyclic;
  }

  if(options.interval){
    interval = options.interval;
  }

  if(options.intSend){
    intSend = options.intSend;
  }

  if(options.internal){
    intSend = options.internal;
  }
  
  if(typeof arguments[args_len - 1] === 'function'){
    cb = arguments[args_len - 1];
  }
  
  if(typeof can_interface !== 'string'){
    throw new Error('invalid can can_interface argument');
  }
  if(args_len > 2 && id && !Array.isArray(id) && typeof id !== 'string'){
    //throw new Error('invalid can id argument');
  }
  if(args_len > 2 && id && Array.isArray(id) && typeof id[0] !== 'string'){
    for (let x = 0; x < id.length; x++) {
      if(typeof id[x] !== 'string'){
        //throw new Error('invalid can id argument');
      }
    }
  }

  if(args_len > 2 && option && typeof option !== 'string'){
    throw new Error('invalid option argument');
  }
   
  if((args_len > 2 && interval && typeof interval !== 'number') || args_len === 6 && Number.isInteger(interval) !== true){
    throw new Error('invalid interval argument');
  }
 
  if(!id||typeof id === 'function'){
    id = null;
  }

  if(!option||typeof option === 'function'){
    option = '-e';
  }

  if(cyclic === null||typeof cyclic === 'function'){
     cyclic = true;
  }  

  if(!interval||typeof interval === 'function'){
    interval = 100; // default watch interval in ms
  }

  if(!cb){
    return console.error(new Error('missing callback argument'));
  }

  for (let x = 0; x < watchSend.length; x++) {
    if(watchSend[x].id === id){
      return;
    }
  }

  watchSend.push({id:id, watch_timeout:watch_timeout});

  // initialize value for internal send, send immediately on the first iteration
  value = 10;
  
  watch_process = function(){
    if(data.payload){
      value = data.payload;
    }

    if(current_value !== value){
      /* option to send data internally */
      if(intSend){ 	
        send('can0', data.id, value, (err) => {
          if(err) return console.error('internal send error', err);
          cb(null, data);
        });
      }
      data.change = true;
      current_value = value;
    }
    else{
      data.sent = false;
      data.change = false;
    }
    cb(null, data);
  };

  watch_timeout = setInterval(watch_process, interval);
      
};


/************************************

      read frame base function

 ************************************/
// read frame data from can bus
var read_can = function(can_interface, option, cb){
  let arrFrame, data = [], on = false, timeout = 100, watch_timeout = {};
  let buf = null, buffer_check = null, canID = null, id_string = null, frame = null, value = null, current_value = null; 

  arrFrame = can.sc_read(Buffer.from(can_interface + '\0'), Buffer.from(option + '\0'), timeout);

  // copy the contents of arrFrame to buf
  buf = Buffer.from(arrFrame);

  buffer_check = Buffer.isBuffer(buf);

  if(buf[0] === 0){
    return  buf[0];
  }
 
  /* istanbul ignore next */
  if(buffer_check && buf[0] === '101'){
    if(cb){
      process.nextTick(() => {
        return cb(new Error('frame error'));
      });
    }
    throw new Error(buf[0]);
  }
  /* istanbul ignore next */
  else if(buffer_check && buf[0] === '111'){
    if(cb){
      process.nextTick(() => {
        return cb(new Error('option error'));
      });
    }
    throw new Error(buf[0]);
  }
  // outputs valid frame
  else if(buffer_check && buf[0] !== '101' && buffer_check && buf[0] !== '111'){
    // data frame length
    let dataLen = buf[4];
    // console.log('data length', dataLen);
    if(dataLen !== 0 && dataLen < 65){
      // frame data starts at buf[5] 
      for (let x = 0; x < dataLen; x++) {
        // w/ string conversion 
        if(buf[x + 5].toString(16)){
          data[x] = parseInt(buf[x + 5].toString(16), 10); 
        }
      }
    }  

    canID = buf[3] + buf[2] + buf[1] + buf[0]; 
    //console.log('canID', canID);

    // extended can 2.0B => 29 bit or 536870911 dec or 1FFFFFFF hex maximum
    if(canID > 65535 && canID <= 16777215){
      id_string = buf[3].toString(16).toUpperCase() + buf[2].toString(16).toUpperCase()
      + buf[1].toString(16).toUpperCase() + buf[0].toString(16).toUpperCase();
    }
    else if(canID > 4095 && canID <= 65535){
      id_string = buf[2].toString(16).toUpperCase() + buf[1].toString(16).toUpperCase() + buf[0].toString(16).toUpperCase();
    }
    // standard can 2.0A => 11 bit or 2047 dec or 7FF hex maximum
    // always outputs 3 hex chars e.g. 015, 00F, 025
    else {
      id_string = buf[1].toString(16).toUpperCase() + buf[0].toString(16).toUpperCase();
    }
    
    // provide an option for user to get frame data either as an array data or as an object
    frame = {id: id_string, len: buf[4], data: data };
    if(cb){
      process.nextTick(() => {   
        cb(null, frame); 
      });
    }
  }
};

/* 
 * read frame data from a specific can id, one-time function call
 * w/ option as argument
 */
/* istanbul ignore next */
var readSO = exports.readSO = function(can_interface, option , id, cb){
  if(typeof can_interface !== 'string'){
    throw new Error('invalid can_interface argument');
  }

  if(!option){
    option = '-e';
  }
 
  if(typeof id !== 'string'){
    throw new Error('invalid can id argument');
  } 

  if(!cb){
    throw new Error('callback is required');
  }

  read_can(can_interface, option, cb);
};

/*
 * read frame data from a specific can id continously using an integrated setInterval function
 * w/ option as argument
 */
/* istanbul ignore next */
var readSOL = exports.readSOL = function(can_interface, option , id, cb, interval){
  if(typeof can_interface !== 'string'){
    throw new Error('invalid can_interface argument');
  }

  if(!option){
    option = '-e';
  }
 
  if(typeof id !== 'string'){
    throw new Error('invalid can id argument');
  } 

  if(!interval){
    interval = 10;
  }

  if(!cb){
    throw new Error('callback is required');
  }

  for (let x = 0; x < watchRead.length; x++) {
    if(watchRead[x] === id){
      return;
    }
  }

  watchRead.push(id);
      
  let setInterval_timeout = setInterval(function(){
    read_can(can_interface, option, id, function(err, frame){
      if(err){return cb(err, null);}
      if(frame.id === id){ 
        cb(null, frame.data);
      }
    });
  }, interval);
 
};


/*
 * read frame data from can bus w/ options
 * options {id:id, option:option, cyclic:true||false}
 */
var read = exports.read = function(){
  let args_len = arguments.length, options = {};
  let read_process = null, setInterval_timeout = null;
  let can_interface = null, id = null, option = null, cyclic = null;
  let interval = null, cb = null, change = null, current_value = null, value = null;

  if(args_len < 2){
    throw new Error('invalid arguments');
  }

  if(typeof arguments[args_len - 1] !== 'function'){
    throw new Error('invalid arguments');
  }
  
  if(arguments[0]){
    can_interface = arguments[0];
  }

  if(arguments[1]){
    options = arguments[1];
  }
  
  if(options.id){
    id = options.id;
  }

  if(options.option){
    option = options.option;
  }

  if(options.cyclic == false || options.cyclic == true){
    cyclic = options.cyclic;
  }

  if(options.interval){
    interval = options.interval;
  }

  if(typeof arguments[args_len - 1] === 'function'){
    cb = arguments[args_len - 1];
  }
  
  if(typeof can_interface !== 'string'){
    throw new Error('invalid can interface argument');
  }

  if(args_len > 2 && id && !Array.isArray(id) && typeof id !== 'string'){
    throw new Error('invalid can id argument');
  }

  if(args_len > 2 && id && Array.isArray(id) && typeof id[0] !== 'string'){
    for (let x = 0; x < id.length; x++) {
      if(typeof id[x] !== 'string'){
        throw new Error('invalid can id argument');
      }
    }
  }

  if(args_len > 2 && option && typeof option !== 'string'){
    throw new Error('invalid option argument');
  }
  
  /*if(args_len > 2 && (cyclic == null || cyclic === false || cyclic === true)){
    //console.log('cyclic is valid'); 
  }
  else{
    throw new Error('invalid cyclic argument');
  }*/
  
  if((args_len > 2 && interval && typeof interval !== 'number') || args_len === 6 && Number.isInteger(interval) !== true){
    throw new Error('invalid interval argument');
  }
 
  if(!id||typeof id === 'function'){
    id = null;
  }

  if(!option||typeof option === 'function'){
    option = '-e';
  }

  if(cyclic === null||typeof cyclic === 'function'){
     cyclic = true;
  }  

  if(!interval||typeof interval === 'function'){
    interval = 10; // default read interval in ms
  }

  if(!cb){
    throw new Error('missing callback argument'); 
  }
   
  let arid = '' + id;
  if(typeof id === 'string' || Array.isArray(id)){
    for (let x = 0; x < watchRead.length; x++) {
      if(typeof id === 'string'){
        if(watchRead[x].id === id){
          return;
        }
      }
      else if(id && Array.isArray(id)){
        if(watchRead[x].id === arid){
          return;
        }
      }
    }
    if(typeof id === 'string'){
      watchRead.push({id:id, setInterval_timeout:setInterval_timeout});
    }
    else{
      watchRead.push({id:arid, setInterval_timeout:setInterval_timeout});
    }
  }
  else{
    if(read_all_singleton){
      return;	
    }
  }

  read_process = function(){
    read_can(can_interface, option, function(err, frame){
      if(err){return cb(err, null);}
      if(frame){
        let can_frame = {id:frame.id, len:frame.len, data:frame.data, filter:'off'};
       
        // read only from a specific can id
        if(typeof id === 'string' && frame.id === id){
          value = ''+frame.data;

          if(current_value !== value){
            change = true;
            current_value = value;
          }
          else{
            change = false;
          }  

          can_frame = {id:frame.id, len:frame.len, data:frame.data, filter:id, change:change};
          return cb(null, can_frame);
        }
        // read from a group of can id's
        else if(id && Array.isArray(id)){
          for (let i = 0; i < id.length; i++) {
            if(id[i] === frame.id){
              /*value = ''+frame.data;
              if(current_value !== value){
                change = true;
                current_value = value;
              }
              else{
                change = false;
              }
              can_frame = {id:frame.id, len:frame.len, data:frame.data, filter:id, change:change};*/
              can_frame = {id:frame.id, len:frame.len, data:frame.data, filter:id};
              return cb(null, can_frame);
            }
          }		
        }
        // set singleton control for read all can id's 
        else if(!id){
          read_all_singleton = true;
          cb(null, can_frame);
        }
      }
    });
  };
  
  if(cyclic === true){    
    setInterval_timeout = setInterval(read_process, interval);
  }
  else{
    return read_process();
  }

  if(typeof id === 'string' || Array.isArray(id)){
    function setMonReadData(x){
      watchRead[x].setInterval_timeout = setInterval_timeout;
      watchRead[x].read_process = read_process;
      watchRead[x].interval = interval;
    }

    for (let x = 0; x < watchRead.length; x++) {
      if(typeof id === 'string'){
        if(watchRead[x].id === id){
          return setMonReadData(x);
        }
      }
      else if(id && Array.isArray(id)){
        if(watchRead[x].id === arid){
          return setMonReadData(x);
        }
      }
    }
  }
  else if(!id){
    read_all_singleton = true;
    watchReadAll.setInterval_timeout = setInterval_timeout;
    watchReadAll.read_process = read_process;
    watchReadAll.interval = interval;
  }
};

var stopRead = exports.stopRead = function(id){
  if(id){
    // set specific can id
    if(typeof id === 'string'){ 
      //console.log('valid single can id');
    }
    // set group filter can id
    else if(id && Array.isArray(id)){ 
      id = '' + id;
    }		
 
    for (let x = 0; x < watchRead.length; x++) {
      //console.log(id, watchRead[x].id);
      if(watchRead[x].id === id){
        //console.log('watchRead[x].setInterval_timeout', watchRead[x].setInterval_timeout);
        clearInterval(watchRead[x].setInterval_timeout);
        console.log('can filter read stopped ...');
        return;
      }
    }
    console.log('stop can filter read fail, no read process found ...');
    return;
  }
  else{
    //console.log('watchReadAll.setInterval_timeout', watchReadAll.setInterval_timeout);
    if(watchReadAll.setInterval_timeout){
      //console.log('can read all setInterval_timeout', watchReadAll.setInterval_timeout);
      clearInterval(watchReadAll.setInterval_timeout);
      console.log('can read all stopped ...');
      return;
    }
    else{
      console.log('stop can read all fail, no read process found ...');
    }
  }
};

var restartRead = exports.restartRead = function(id){
  if(id){
    for (let x = 0; x < watchRead.length; x++) {
      if(watchRead[x].id === id){
        clearInterval(watchRead[x].setInterval_timeout);
        let setInterval_timeout = setInterval(watchRead[x].read_process, watchRead[x].interval);
        watchRead[x].setInterval_timeout = setInterval_timeout;
        console.log('can filter read restarted ...');
        return; 
      }
    }
    console.log('restart can filter read fail, no read process found ...');
    return;
  }
  else{
    if(watchReadAll.read_process && watchReadAll.interval){
      clearInterval(watchReadAll.setInterval_timeout);
      watchReadAll.setInterval_timeout = setInterval(watchReadAll.read_process, watchReadAll.interval);
      console.log('can read all restarted ...');
    }
    else{
      console.log('restart can read all fail, no read process found ...');
    }
  }
};


/*
Options: -t <type>   (timestamp: (a)bsolute/(d)elta/(z)ero/(A)bsolute w date)
         -H          (read hardware timestamps instead of system timestamps)
         -c          (increment color mode level)
         -i          (binary output - may exceed 80 chars/line)
         -a          (enable additional ASCII output)
         -S          (swap byte order in printed CAN data[] - marked with '`' )
         -s <level>  (silent mode - 0: off (default) 1: animation 2: silent)
         -b <can>    (bridge mode - send received frames to <can>)
         -B <can>    (bridge mode - like '-b' with disabled loopback)
         -u <usecs>  (delay bridge forwarding by <usecs> microseconds)
         -l          (log CAN-frames into file. Sets '-s 2' by default)
         -L          (use log file format on stdout)
         -n <count>  (terminate after receiption of <count> CAN frames)
         -r <size>   (set socket receive buffer to <size>)
         -D          (Don't exit if a "detected" can device goes down.
         -d          (monitor dropped CAN frames)
         -e          (dump CAN g frames in human-readable format)
         -x          (print extra message infos, rx/tx brs esi)
         -T <msecs>  (terminate after <msecs> without any reception)

Up to 16 CAN interfaces with optional filter sets can be specified
on the commandline in the form: <ifname>[,filter]*

Comma separated filters can be specified for each given CAN interface:
 <can_id>:<can_mask> (matches when <received_can_id> & mask == can_id & mask)
 <can_id>~<can_mask> (matches when <received_can_id> & mask != can_id & mask)
 #<error_mask>       (set error frame filter, see include/linux/can/error.h)
 [j|J]               (join the given CAN filters - logical AND semantic)

CAN IDs, masks and data content are given and expected in hexadecimal values.
When the can_id is 8 digits long the CAN_EFF_FLAG is set for 29 bit EFF format.
Without any given filter all data frames are received ('0:0' default filter).

Use interface name 'any' to receive from all CAN interfaces.

Examples:
canread -c -c -ta can0,123:7FF,400:700,#000000FF can2,400~7F0 can3 can8
canread -l any,0~0,#FFFFFFFF    (log only error frames but no(!) data frames)
canread -l any,0:0,#FFFFFFFF    (log error frames and also all data frames)
canread vcan2,12345678:DFFFFFFF (match only for extended CAN ID 12345678)
canread vcan2,123:7FF (matches CAN ID 123 - including EFF and RTR frames)
canread vcan2,123:C00007FF (matches CAN ID 123 - only SFF and non-RTR frames)
*/



