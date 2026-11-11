-- Точка входа сервера. Порядок важен: сначала подписки, потом загрузка игроков.

local Server = script.Parent

local DataService = require(Server.DataService)
local GameService = require(Server.GameService)
local MonetizationService = require(Server.MonetizationService)
local PetService = require(Server.PetService)
local WorldService = require(Server.WorldService)

-- Купили «+1 слот питомца» — перерисовываем питомцев.
MonetizationService.SetPassesChangedCallback(PetService.Refresh)

GameService.Init()
MonetizationService.Init()
PetService.Init()
WorldService.Init()
DataService.Start()
