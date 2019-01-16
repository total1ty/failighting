var keepAliveInterval = 5;
var devices = [];

window.onload = setup;

function setup() {
  //TODO: put this shit in a config file
  var config = {
    "devices": ["192.168.0.191", "192.168.0.192", "192.168.0.193", "192.168.0.194", "192.168.0.195"],
  };

  //INITIALIZE failWebSocketDevices
  if (config.devices) {
    for (var i=0; i<config.devices.length; i++) {
      let deviceIP = config.devices[i];

      //temporary fucked-up init. future failWebSocketDevices shall be initialized by IP only, with all other info being pulled from the ESP itself via JSON
      devices[i] = new failWebSocketDevice("ESP8266-"+deviceIP.substr(deviceIP.length - 3), deviceIP, 1337, 9, {
        //update slider values
        updateValuesHandler: (device) => {
          for (var i=0; i<device.values.length; i++) {
            var slider = document.getElementById(device.name+"_"+i);
            if (slider.value != device.values[i]) {
              slider.value = device.values[i];
            }
          };
        },
        //update device state display
        updateStateHandler: (name, state) => {
          var device = document.querySelector("#devices > #"+name+" > .statusLight");
          if (device) {
            if (state == "online" && device.id == "rx") {
              window.clearTimeout();
              window.setTimeout(function(name) {
                device.id = "online";
              }, 200);
            }
            else {
              device.id = state;
            }
          }
        }
      });
      addDevicetoDOM(devices[i]);
      devices[i].open();
    };
  }
}

function addDevicetoDOM(device) {
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
      slider.setAttribute("value", 0);
      slider.setAttribute("step", 1);
      slider.setAttribute("orient", "vertical");

      slider.addEventListener("input", () => {
         device.values[i] = Number(slider.value);
         device.sendValues();
      });
    };

}
