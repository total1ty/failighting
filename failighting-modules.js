class failDevice {
  constructor(ip, name, channels) {
    this.displayname = name;
    this.ip = ip;
    this.port = config.port;
    this.channels = channels;
    this.state = "offline"; //states: offline, opening, online, tx, rx
  }

  async init() {
    await this.open();
    this.name = this.displayname;
    this.values = new Array(this.channels).fill(0);
  }

  updateState(state) {
    this.state = state;
    this.handlers.updateStateHandler(this.name, this.state);
  }

  async sendValues() {
    let jsonMessage = "{\"values\":"+JSON.stringify(this.values)+"}";
    this.send(jsonMessage);
  }

  async send(payload) {
    if (this.state=="online") {
      if (this.connection.readyState==this.connection.OPEN) {
        this.updateState("tx");

        try {
          this.connection.send(payload);
        }
        catch (error) {
          console.log("SEND ERROR: "+error);
        }
      }
    	else {
    	 console.log(this.name+', '+this.ip+': stick not ready to splurt');
       await this.close();
       await this.open();
     }
    }
    else {
      await this.open();
    }
  }

  async open() {
    if (this.state=="offline") {
      this.updateState("opening");
      this.connection = new WebSocket("ws://"+this.ip+":"+this.port+"/");

      this.connection.addEventListener("open", () => {
        console.log(this.name+", "+this.ip+": CONNECTION OPENED");
        this.updateState("online");
        this.send("{\"info\":\"\"}");
      });

      this.connection.addEventListener("close", () => {
        this.updateState("offline");
        this.values.fill(0);
        this.handlers.updateValuesHandler(this);
      });

      this.connection.addEventListener("error", (e) => {
        console.log(this.name+", "+this.ip+": ERROR");
        this.updateState("offline");
      });

      this.connection.addEventListener("message", (message) => {
        this.updateState("rx");
        try {
           this.msg = JSON.parse(message.data);
        }
        catch(error) {
          console.log("JSON PARSE ERROR " + this.ip + " - " + message.data);
        }
        if(this.msg.values) {
          for (var i=0; i<this.values.length; i++) {
              this.values[i] = this.msg.values[i];
          }
          this.handlers.updateValuesHandler(this);
        }
        this.updateState("online");
      });
      return 1;
    }
    else {
      return 0;
    }
  }

  async close() {
    this.connection.close();
    this.updateState("offline");
    console.log(this.name+', '+this.ip+': connection closed');
  }
}

class failScene {
  constructor(scenedata) {
    this.name = scenedata.name;
    this.group = scenedata.group;
    this.scenedevices = scenedata.devices;

    if (typeof(scenedata.fade) !== 'undefined') {
      this.fadeduration = scenedata.fade;
    }
    else {
      this.fadeduration = config.fade_default;
    }
    //gather involved devices
    this.realdevices = {};
    for (let i=0; i<this.scenedevices.length; i++) {
        for (let j=0; j<devices.length; j++) {
          if (this.scenedevices[i].name == devices[j].name) {
            this.realdevices[i] = devices[j];
          }
        }
    }
  };

  async trigger() {
    //call fade per device
    for (let i=0; i<this.scenedevices.length; i++) {
      if(this.realdevices[i].values.length == this.scenedevices[i].values.length) {
        this.fade(this.realdevices[i], this.scenedevices[i], this.fadeduration);
      }
      else {
        console.log("SCENE: "+this.name+" - DEVICE: "+this.realdevices[i].name+" - ERROR: tried to set keyframe with non-matching value count. ignoring device. you can ignore this too if you dont care.")
      }
    }
  };

  async fade(device, scene, duration) {
    //calculate frame count
    let frames = Math.floor(duration * config.max_fps/1000);
    //instantly set new value if values are identical or fade length <= 1 frame
    //TODO: The first condition always returns false, no idea why. This has worked at some point in the past, but broke somehow.
    if ((device.values.concat() == scene.values.concat()) || (frames<=1)) {
      device.values = scene.values.concat();
      device.sendValues();
    }
    //fade!
    else {
      let startvalues = device.values.concat();
      for (let i=0; i<frames; i++) {
        for (let j=0; j<device.values.length; j++) {
          if (scene.values[j] != -1) {
            device.values[j] = einterp(startvalues[j], scene.values[j], (i+1)/frames)
          };
        };
        device.sendValues();
        await sleep(1000/config.max_fps);
      }
    }
  };
};
