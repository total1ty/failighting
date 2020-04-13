class failDevice {
  constructor(ip, name, channels) {
    this.name = name;
    this.ip = ip;
    this.port = config.port;
    this.channels = channels;
    this.state = "offline"; //states: offline, opening, online, tx, rx
  }
