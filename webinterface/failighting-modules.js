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

        if(this.msg.info) {
          //this.name = this.msg.info.name;
          //this.handlers.addtoDOMHandler(this);
        }

        this.updateState("online");
      });
      return 1;
    }
    else {
      //console.log("OPEN CALLED BUT STATE NOT OFFLINE");
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
    this.devicevalues = scenedata.devices;
    //console.log("scene "+this.name);
    //console.log(this.devicevalues[0].values);

    //gather involved devices
    this.devices = {};
    for (let i=0; i<this.devicevalues.length; i++) {
        for (let j=0; j<devices.length; j++) {
          if (this.devicevalues[i].name == devices[j].name) {
            this.devices[i] = devices[j];
          }
        }
    }
  };

  trigger() {
    for (let i=0; i<this.devicevalues.length; i++) {
      if(this.devices[i].values.length == this.devicevalues[i].values.length) {
        this.devices[i].values = this.devicevalues[i].values;
        this.devices[i].sendValues();
      }
      else {
        console.log("SCENE: "+this.name+" - DEVICE: "+this.devices[i].name+" - ERROR: tried to set keyframe with non-matching value count. ignoring device. you can ignore this too if you dont care.")
      }
    }
    //console.log("triggered: "+this.name);
  };
};
