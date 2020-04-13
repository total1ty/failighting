#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <Hash.h>
#include <ArduinoJson.h>

#include "config.h"
#include "wifiCredentials.h"

const char* ssid     = WIFI_SSID;
const char* password = WIFI_PASS;

const IPAddress ip(CONFIG_IP01, CONFIG_IP02, CONFIG_IP03, CONFIG_IP04);
const IPAddress subnet(255, 255, 255, 0);
const int port = CONFIG_PORT;
const String deviceName = CONFIG_DEVICE_NAME;

const int builtInLED = 4;
const int OutputPinCount = CONFIG_CHANNELS;
int OutputPins[OutputPinCount];
int OutputValues[OutputPinCount];

/*if (OutputPinCount==4) {
  int OutputValues[4] = {0, 0, 0, 0};
}
else {
  int OutputValues[9] = {0, 0, 0, 0, 0, 0, 0, 0, 0};
}*/


String ipString = String(ip[0])+"."+String(ip[1])+"."+String(ip[2])+"."+String(ip[3])+":"+port;

String deviceInfo = "{\"info\":{\"name\":\""+deviceName+"\",\"ip\":\""+ipString+"\",\"channels\":"+OutputPinCount+"}}";

WebSocketsServer webSocket = WebSocketsServer(port, "*");

void setup() {
  if (OutputPinCount==4) {
    OutputPins[0] = 14;
    OutputPins[1] = 12;
    OutputPins[2] = 13;
    OutputPins[3] = 5;
  }
  else {
    OutputPins[0] = 16;
    OutputPins[1] = 5;
    OutputPins[2] = 4;
    OutputPins[3] = 0;
    OutputPins[4] = 2;
    OutputPins[5] = 14;
    OutputPins[6] = 12;
    OutputPins[7] = 13;
    OutputPins[8] = 15;
    //OutputPins = {16, 5, 4, 0, 2, 14, 12, 13, 15};
  }

  //set all channels to output & 0
  for (int i=0; i<OutputPinCount; i++) {
    OutputValues[i] = 0;
    pinMode(OutputPins[i], OUTPUT);
    analogWrite(OutputPins[i], 0);
  }

  //Serial.begin(115200);
  //Serial.println("Serial connection initialized");

  //BOOTUP ANIMATION 1 - FADE WARM WHITE TO 900 - FOR STUDIO 191
  //TODO: this should not be hard-coded...
  for (int i=0; i<=900; i++) {
    OutputValues[7] = i;
    analogWrite(OutputPins[7], i);
    delay(1);
  }

  //BOOTUP ANIMATION 2- FADE WARM WHITE TO 1023, FADE RED TO 1023 - FOR BEDROOM 195/196
  /*for (int i=0; i<1023; i++) {
    OutputValues[0] = i;
    OutputValues[7] = i;
    analogWrite(OutputPins[0], i);
    analogWrite(OutputPins[7], i);
    delay(1);
  }*/


  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.config(ip, ip, subnet);
  WiFi.begin(ssid, password);

    while(WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Waiting for WiFi connection...");
    }

  Serial.println("WiFi connected");
  Serial.println(WiFi.localIP());
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void broadcastOutputs() {
  String buf;
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& jsonObject = jsonBuffer.createObject();
  JsonArray& jsonData = jsonObject.createNestedArray("values");
  jsonData.copyFrom(OutputValues);
  jsonObject.printTo(buf);
  webSocket.broadcastTXT(buf);
  jsonBuffer.clear();
}

void updateOutputs() {
  for (int i=0; i<OutputPinCount; i++) {
    analogWrite(OutputPins[i], OutputValues[i]);
  }
  broadcastOutputs();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) {
  switch(type) {
    case WStype_DISCONNECTED:
      break;

    case WStype_CONNECTED:

        Serial.println("Connected to: " + String(payload[0]) + ", Name: "+deviceName+", IP "+ipString);
        broadcastOutputs();

      break;

    case WStype_TEXT:
        {
        String text = String((char *) &payload[0]);

        //JSON
        if (text.startsWith("{")) {
          StaticJsonBuffer<200> jsonBuffer2;
          JsonObject& root = jsonBuffer2.parseObject((char *) &payload[0]);

          if (root.containsKey("values")) {
            JsonArray& values = root["values"];
            for (int i=0; i<OutputPinCount; i++) {
              OutputValues[i] = values[i];
            }
            updateOutputs();
          }

          else if (root.containsKey("info")) {
            webSocket.sendTXT(num, deviceInfo);
          }
          jsonBuffer2.clear();
        }

        else {
          webSocket.sendTXT(num, "unknown command: "+text);
        }
        }
        break;

    case WStype_BIN:
      hexdump(payload, lenght);
      // echo data back to browser
      webSocket.sendBIN(num, payload, lenght);
      break;
  }
}

void loop() {
  webSocket.loop();
}
