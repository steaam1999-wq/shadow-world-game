-- Точка входа сервера. Порядок важен: сначала подписки, потом загрузка игроков.

local Server = script.Parent

local DataService = require(Server.DataService)
local GameService = require(Server.GameService)
local MonetizationService = require(Server.MonetizationService)
local WorldService = require(Server.WorldService)

GameService.Init()
MonetizationService.Init()
WorldService.Init()
DataService.Start()
