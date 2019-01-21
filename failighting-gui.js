var keepAliveInterval = 5;
var devices = [];
var scenes = [];
var scenefading = false;

const setup = async() => {

  //READ CONFIG config.json
  await fetch('./config.json')
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
      }
      return response.json();
    })
    .then(function(json) {
      config = json;
    })
    .catch(function(error) {
      console.log('JSON Read Error: ' + error.message)
    });

  //INITIALIZE failDevices
  if (config.devices) {
    for (var i=0; i<config.devices.length; i++) {
      let device = config.devices[i];

      devices[i] = new failDevice(device.ip, device.name, device.channels);

      devices[i].handlers = {
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
      }
      await devices[i].init();
      await addDevicetoDOM(devices[i]);
    };
  };

  //INITIALIZE failScenes
  if (config.scenes) {
    for (var i=0; i<config.scenes.length; i++) {
      scenes[i] = new failScene(config.scenes[i]);
      addScenetoDOM(scenes[i]);
    };
  };
};


//DOM element adders

const addDevicetoDOM = (device) => {
    let container = document.getElementById("devices");
    let devicediv = container.appendChild(document.createElement("div"));

    devicediv.id = device.name;
    devicediv.classList.add("device");

    let heading = devicediv.appendChild(document.createElement("h2"));
    heading.textContent = device.ip;
    heading.classList.add("statusLight");
    heading.id = device.state;

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

const addScenetoDOM = (scenedata) => {
  if (document.querySelector("#scenes > #"+scenedata.group)) {
    //select existing group
    var groupdiv = document.querySelector("#scenes > #"+scenedata.group);
  }
  else {
    //create new group
    var groupdiv = document.getElementById("scenes").appendChild(document.createElement("div"));
    groupdiv.id = scenedata.group;
    groupdiv.classList.add("scene-group");

    let heading = groupdiv.appendChild(document.createElement("h2"));
    heading.textContent = scenedata.group;
  };

  //scene in die group reintun tun
  let scene = groupdiv.appendChild(document.createElement("div"));
  scene.id = scenedata.name;
  scene.classList.add("scene");

  let text = scene.appendChild(document.createElement("h3"));
  text.textContent = scenedata.name;

  scene.addEventListener("click", () => {
     scenedata.trigger();
  });
}

//UTILS
//sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//linear interpolation
const linterp = (a, b, n) => {
  return (1 - n) * a + n * b;
}

//ease in/out interpolation
const einterp = (a, b, n) => {
  return linterp(a, b, n<.5 ? 2*n*n : -1+(4-2*n)*n);
}

//passive promise
const passive_promise = () => {
    var resolve_, reject_;

    var promise = new Promise((resolve, reject) => {
        resolve_ = resolve;
        reject_ = reject;
    });
    promise.resolve = resolve_;
    promise.reject = reject_;
    return promise;
}

//oh, yeah, and maybe launch all this shit.
window.onload = setup;
