class failWebSocketDevice {
  constructor(name, ip, port, channels, handlers) {
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.channels = channels;
    this.handlers = handlers;
    this.values = new Array(this.channels).fill(0);
    this.state = "offline"; //states: offline, opening, online, tx, rx
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
          for (var i=0; i<this.msg.values.length; i++) {
            this.values[i] = this.msg.values[i];
          }
          this.handlers.updateValuesHandler(this);
          this.updateState("online");
        }

      });
    }
    else {
      //console.log("OPEN CALLED BUT STATE NOT OFFLINE");
    }
  }

  async close() {
    this.connection.close();
    this.updateState("offline");
    console.log(this.name+', '+this.ip+': connection closed');
  }
}
