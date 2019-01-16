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
const int OutputPinCount = 9;
const int OutputPins[9] = {16, 5, 4, 0, 2, 14, 12, 13, 15};

String ipString = String(ip[0])+"."+String(ip[1])+"."+String(ip[2])+"."+String(ip[3])+":"+port;

String deviceInfo = "{\"info\":{\"name\":\""+deviceName+"\",\"ip\":\""+ipString+"\",\"channels\":"+OutputPinCount+"}}";

WebSocketsServer webSocket = WebSocketsServer(port, "*");

int OutputValues[9] = {0, 0, 0, 0, 0, 0, 0, 0, 0};

void setup() {
  Serial.begin(115200);
  Serial.println("Serial connection initialized");
  for (int i=0; i<OutputPinCount; i++) {
    //Serial.println("Initializing GPIO Pin "+String(OutputPins[i])+" as Port "+String(i));
    pinMode(OutputPins[i],OUTPUT);
  }

  //BOOTUP ANIMATION - FADE WARM WHITE TO 900
  for (int i=0; i<=900; i++) {
    OutputValues[4] = i;
    analogWrite(OutputPins[4], i);
    delay(1);
  }

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

        //JSON Mode!!
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
  //static unsigned long last = 0;

  //delay(1000);
  webSocket.loop();
  /*if(abs(millis() - last) > 1000) {
    webSocket.sendTXT(String(millis()));
    last = millis();
  }*/

}
