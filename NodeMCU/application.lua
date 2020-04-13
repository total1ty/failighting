--set up variables
local values = {}

--read config.json
if file.open("config.json") then
  config = sjson.decode(file.read())
  file.close()
  config["ip"] = wifi.sta.getip()
else
  print("error reading config")
end


--websocket setup
print('setting up websocket...')

local url = "ws://"..config.server..":"..config.port

local ws = websocket.createClient()

wstimer = tmr.create()
wstimer:register(5000, tmr.ALARM_SEMI, function() connectws() end)

function connectws()
  wstimer:stop()
  if pcall(function () ws:connect(url) end) then
    print('trying to connect to '..url)
  else
    print('connection unsuccessful')
  end
end


ws:on("connection", function(ws)
  print('got ws connection')
  wstimer:stop()
  update()
end)


ws:on("receive", function(_, msg, opcode)
  print('got message:', msg, opcode) -- opcode is 1 for text message, 2 for binary

  --update()
end)

ws:on("close", function(_, status)
  print('connection closed', status)
  --ws = nil -- required to Lua gc the websocket client
  wstimer:start()
end)


--sends name and values
function update()
  local connectionmsg = {}
  connectionmsg["type"] = "faildevice"
  connectionmsg["name"] = config.name
  connectionmsg["values"] = values
  ws:send(sjson.encode(connectionmsg))
  print('status sent')
end

for i=1, config.channels do
  values[i] = 0
end



connectws()











print('testing lo---')

--OutputPins = {16,5,4,0,2,14,12,13,15}
--OutputPins = {5,4,0,2,12,15}
OutputPins = {12,1,2,3,4,5,6,7,8}
--OutputPins = {2,12}

for OutputPinsCount = 1, 9 do
  local pinGpio = OutputPins[OutputPinsCount]
  print ('Channel '..OutputPinsCount..', Pin '..pinGpio)

  if pcall(function () pwm2.setup_pin_hz(pinGpio,10,1024,100) end) then
    print('PWM Setup Pin '..pinGpio..' successful')
  else
    print('PWM Setup Pin '..pinGpio..' failed')
  end
end
pwm2.start()


--gpio.mode(0, gpio.OUTPUT)
--gpio.write(0, gpio.LOW)


--[[
counter = 0;
channelcount = 6;
function test()
    local pinNumber = counter % channelcount
    pinNumber = pinNumber+1
    local pinGpio = OutputPins[pinNumber]
    --print (counter..' - Channel '..pinNumber..', Pin '..pin)
    print ('Channel '..pinNumber..', Pin '..pinGpio..', Counter '..counter)
    --print('test'..counter)
    if pcall(function () pwm2.setup_pin_hz(pinGpio,1,2,1) end) then
      pwm2.start()
    else
      print('Pin '..pinGpio..' failed!')
    end
    counter = counter+1
end

mytimer = tmr.create()
mytimer:register(10000, tmr.ALARM_AUTO, function() test() end)
mytimer:interval(1000) -- actually, 3 seconds is better!
mytimer:start()
]]--
