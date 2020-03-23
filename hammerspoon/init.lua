hs.window.animationDuration = 0
units = {
  right50       = { x = 0.50, y = 0.00, w = 0.50, h = 1.00 },
  left50        = { x = 0.00, y = 0.00, w = 0.50, h = 1.00 },
  top50         = { x = 0.00, y = 0.00, w = 1.00, h = 0.50 },
  bot50         = { x = 0.00, y = 0.50, w = 1.00, h = 0.50 },
  upleft50      = { x = 0.00, y = 0.00, w = 0.50, h = 0.50 },
  upright50     = { x = 0.50, y = 0.00, w = 0.50, h = 0.50 },
  botleft50     = { x = 0.00, y = 0.50, w = 0.50, h = 0.50 },
  botright50    = { x = 0.50, y = 0.50, w = 0.50, h = 0.50 },
  maximum       = { x = 0.00, y = 0.00, w = 1.00, h = 1.00 },
  center        = { x = 0.125, y = 0.125, w = 0.75, h = 0.75 }
}
mash = { 'option', 'ctrl', 'cmd' }
hs.hotkey.bind(mash, 'right', function() hs.window.focusedWindow():move(units.right50,    nil, true) end)
hs.hotkey.bind(mash, 'left', function() hs.window.focusedWindow():move(units.left50,     nil, true) end)
hs.hotkey.bind(mash, 'up', function() hs.window.focusedWindow():move(units.top50,      nil, true) end)
hs.hotkey.bind(mash, 'down', function() hs.window.focusedWindow():move(units.bot50,      nil, true) end)
hs.hotkey.bind(mash, 'm', function() hs.window.focusedWindow():move(units.maximum,    nil, true) end)
hs.hotkey.bind(mash, 'n', function() hs.window.focusedWindow():move(units.center,    nil, true) end)
mash = { 'shift', 'ctrl', 'option' }
hs.hotkey.bind(mash, 'right', function() hs.window.focusedWindow():move(units.upright50,  nil, true) end)
hs.hotkey.bind(mash, 'up', function() hs.window.focusedWindow():move(units.upleft50,   nil, true) end)
hs.hotkey.bind(mash, 'left', function() hs.window.focusedWindow():move(units.botleft50,  nil, true) end)
hs.hotkey.bind(mash, "down", function() hs.window.focusedWindow():move(units.botright50, nil, true) end)
mash = { 'ctrl', 'option' }
-- bind hotkey
hs.hotkey.bind(mash, 'right', function()
  -- get the focused window
  local win = hs.window.focusedWindow()
  -- get the screen where the focused window is displayed, a.k.a. current screen
  local screen = win:screen()
  -- compute the unitRect of the focused window relative to the current screen
  -- and move the window to the next screen setting the same unitRect
  win:move(win:frame():toUnitRect(screen:frame()), screen:next(), true, 0)
end)
-- bind hotkey
hs.hotkey.bind(mash, 'left', function()
  -- get the focused window
  local win = hs.window.focusedWindow()
  -- get the screen where the focused window is displayed, a.k.a. current screen
  local screen = win:screen()
  -- compute the unitRect of the focused window relative to the current screen
  -- and move the window to the next screen setting the same unitRect
  win:move(win:frame():toUnitRect(screen:frame()), screen:next(), true, 0)
end)

local wifiMenu = hs.menubar.new()
function ssidChangedCallback()
    SSID = hs.wifi.currentNetwork()
    if SSID == nil then
        SSID = "Disconnected"
    end
    wifiMenu:setTitle("" .. SSID .. "" )
end
wifiWatcher = hs.wifi.watcher.new(ssidChangedCallback)
wifiWatcher:start()
ssidChangedCallback()


