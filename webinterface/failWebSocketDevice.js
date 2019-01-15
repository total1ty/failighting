class failWebSocketDevice {
  constructor(name, ip, port, channels, handlers) {
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.channels = channels;
    this.handlers = handlers;
    this.msg = "";
    this.values = new Array(this.channels).fill(0);
    this.state = "offline"; //states: offline, connecting, online, tx, rx

    //TODO: automated gathering of device info by json request

    this.open();

    console.log(this.name+', '+this.ip+': DEVICE ADDED');
  }

  updateState(state) {
    this.state = state;
    this.handlers.updateStateHandler(this.name, this.state);
  }

  async updateValues() {
    let jsonMessage = "{\"values\":"+JSON.stringify(this.values)+"}";
    this.send(jsonMessage);
  }

  async send(payload) {
    if (this.connection.readyState==this.connection.OPEN) {
      this.updateState("tx");

      try {
        this.connection.send(payload);
        //console.log(this.name+", "+this.ip+": TX "+payload);
        document.getElementById("debug").innerHTML = this.name+", "+this.ip+": TX: "+payload;
      }
      catch (error) {
        console.log("SEND ERROR: "+error);
        document.getElementById("debug").innerHTML = "SEND ERROR  - "+error;
      }
    }
  	else {
  	 console.log(this.name+', '+this.ip+': stick not ready to splurt');
     //alert(this.name+', '+this.ip+': stick not ready to splurt');
     //clearInterval(this.interval);
     await this.close();
     await this.open();
     //setTimeout(function(){ alert("Hello"); }, 3000);
   }
  }

  async open() {
    this.connection = new WebSocket("ws://"+this.ip+":"+this.port+"/");

    this.connection.addEventListener("open", () => {
      console.log("connection opened " + this.ip);
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": OPEN";
      this.updateState("online");
    });

    this.connection.addEventListener("close", () => {
      console.log("[[[[[[[[[[[closedEvent]]]]]]]]]")
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": CLOSED";
      this.updateState("offline");
    });

    this.connection.addEventListener("error", (e) => {
      console.log(this.name+", "+this.ip+": ERROR "+e);
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": ERROR "+e;
      this.updateState("offline");
    });

    this.connection.addEventListener("message", (message) => {
      //console.log(this.name+", "+this.ip+": RX " + message.data);
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": RX " + message.data;
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
        this.handlers.updateValuesHandler(this.name, this.values);
        //this.updateState("online");
      }

    });
  }

  async close() {
    this.connection.close();
    this.updateState("offline");
    console.log(this.name+', '+this.ip+': connection closed');
  }
}
