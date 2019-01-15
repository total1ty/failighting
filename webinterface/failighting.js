var keepAliveInterval = 5;

var heartbeat = 0;

var devices = [];

//TODO: read config.json and create failWebSocketDevices accordingly

//devices.push(new failWebSocketDevice("ESP8266-01", "192.168.0.191", 81, 9));
//devices.push(new failWebSocketDevice("ESP8266-02", "192.168.0.192", 1337, 9));

/*devices.push(new failWebSocketDevice("ESP8266-01", "192.168.0.191", 81, 9, {
  updateValues: (values) => {
    //console.log("UPDATE!!!!! " + values);
  }
}));
*/

devices.push(new failWebSocketDevice("ESP8266-02", "192.168.0.192", 1337, 9, {
  updateValuesHandler: (name, values) => {
    var device = document.querySelector("#devices > #"+name+" > .sliders");
    if (device) {
      //TODO
    }
    //console.log("UPDATE!!!!! " + values);
  },
  updateStateHandler: (name, state) => {
    var device = document.querySelector("#devices > #"+name+" > .statusLight");
    if (device) {
      device.id = state;
      if (state == "rx") {
        window.setTimeout(function() {device.id = "online"}, 100);
      }
    }
  }
}));

/*devices.push(new failWebSocketDevice("ESP8266-03", "192.168.0.193", 1337, 9, {
  updateValuesHandler: (values) => {
    //TODO
    //console.log("UPDATE!!!!! " + values);
  }
}));*/

function addtoDOM() {
  devices.forEach((device) => {
    let container = document.getElementById("devices");
    let devicediv = container.appendChild(document.createElement("div"));

    devicediv.id = device.name;
    devicediv.classList.add("device");

    let heading = devicediv.appendChild(document.createElement("h3"));
    heading.textContent = device.ip;
    heading.classList.add("statusLight");
    heading.id = "offline";

    devicediv.appendChild(document.createTextNode(device.name));

    let sliders = devicediv.appendChild(document.createElement("div"));
    sliders.classList.add("sliders");

    for (let i=0; i<device.channels; i++) {
      let slider = sliders.appendChild(document.createElement("input"));
      let value = device.values[i];
      slider.classList.add("slider");
      slider.id = device.name + "_" + i;
      slider.setAttribute("type", "range");
      slider.setAttribute("min", 0);
      slider.setAttribute("max", 1023);
      slider.setAttribute("value", value);
      slider.setAttribute("step", 1);
      slider.setAttribute("orient", "vertical");
      //slider.addEventListener("input", setLED(i, slider.value));
      slider.addEventListener("input", () => {
         device.values[i] = Number(slider.value);
         device.updateValues();
      });
    };
  });
}

function wsSend(toSend) {
  devices[0].send(toSend);
  //device01.send(toSend);

};

function gschichtn() {
  wsSend("{\"info\":}");
};

function setLED(port, value) {
	wsSend("p"+port+"v"+value);
};
