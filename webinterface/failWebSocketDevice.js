class failWebSocketDevice {
  constructor(name, ip, port, channels, handlers) {
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.channels = channels;
    this.handlers = handlers;
    this.msg = "";
    this.values = new Array(this.channels).fill(0);
    this.state = "OFFLINE";

    //TODO: Automatisierte Info-Abfrage

    this.open();

    console.log(this.name+', '+this.ip+': DEVICE ADDED');
  }

  updateState(state) {
    this.state = state;
  }

  updateValues() {
    let jsonMessage = "{\"values\":"+JSON.stringify(this.values)+"}";
    this.send(jsonMessage);
  }

  updateDOM() {
    let device = document.getElementById(this.name); //WIP...
    if (device) {
      //CONSTRUCT DOM
      device.innerHTML = this.ip+', '+this.name+': dom<br/>' + this.values;
    }
    else {
      //UPDATE DOM
      device.innerHTML = "nah";
    }
  }

  async send(payload) {
    if (this.connection.readyState==this.connection.OPEN) {
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
    });

    this.connection.addEventListener("close", () => {
      console.log("[[[[[[[[[[[closedEvent]]]]]]]]]")
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": CLOSED";
    });

    this.connection.addEventListener("error", (e) => {
      console.log(this.name+", "+this.ip+": ERROR "+e);
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": ERROR "+e;
    });

    this.connection.addEventListener("message", (message) => {
      //console.log(this.name+", "+this.ip+": RX " + message.data);
      document.getElementById("debug").innerHTML = this.name+", "+this.ip+": RX " + message.data;

      try {
         this.msg = JSON.parse(message.data);
      }
      catch(error) {
        console.log("JSON PARSE ERROR " + this.ip + " - " + message.data);
      }

      var sliders = document.getElementsByClassName("slider");

      if(this.msg.values) {
        for (var i=0; i<this.msg.values.length; i++) {
          sliders[i].value =this.msg.values[i];
          this.values[i] = this.msg.values[i];
        }
        this.handlers.updateValues(this.values);
      }

    });
  }

  async close() {
    this.connection.close();
    //updateState("OFFLINE");
    console.log(this.name+', '+this.ip+': connection closed');
  }
}
