-- Игровая логика: награды, улучшения, зоны, перерождение, ежедневная награда.
-- Все действия игрока приходят сюда через Remotes.Action и проверяются на сервере.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Format = require(ReplicatedStorage.Shared.Format)
local DataService = require(script.Parent.DataService)
local Remotes = require(script.Parent.Remotes)

local GameService = {}

local ACTION_COOLDOWN = 0.15
local actions = {}

function GameService.Notify(player: Player, text: string, kind: string?)
	Remotes.Notify:FireClient(player, text, kind or "info")
end

function GameService.Multiplier(player: Player): number
	local session = DataService.Get(player)
	if not session then
		return 1
	end
	return Config.EssenceMultiplier(session.data, session.passes, os.time())
end

-- Начисляет эссенцию. pushNow = true — сразу обновить интерфейс.
function GameService.AddEssence(player: Player, amount: number, pushNow: boolean?): number
	local session = DataService.Get(player)
	if not session then
		return 0
	end
	amount = math.max(0, math.floor(amount))
	session.data.essence += amount
	session.data.totalEssence += amount
	if pushNow then
		DataService.Push(player)
	else
		DataService.MarkDirty(player)
	end
	return amount
end

-- Награда за пойманную тень.
function GameService.RewardShadow(player: Player, zoneIndex: number): number
	local zone = Config.Zones[zoneIndex]
	return GameService.AddEssence(player, math.max(1, zone.shadowValue * GameService.Multiplier(player)))
end

function GameService.ApplySpeed(player: Player)
	local session = DataService.Get(player)
	local character = player.Character
	if not session or not character then
		return
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.WalkSpeed = Config.WalkSpeed(session.data.upgrades.speed, session.passes.VIP == true)
	end
end

-- Регистрирует действие, которое клиент может вызвать: Action:FireServer(name, arg)
function GameService.RegisterAction(name: string, handler)
	actions[name] = handler
end

---------------------------------------------------------------------
-- Действия
---------------------------------------------------------------------

GameService.RegisterAction("sync", function(player)
	DataService.Push(player)
end)

GameService.RegisterAction("buyUpgrade", function(player, session, id)
	local def = if type(id) == "string" then Config.Upgrades[id] else nil
	if not def then
		return
	end
	local data = session.data
	local level = data.upgrades[id]
	if level >= def.maxLevel then
		return GameService.Notify(player, "Это улучшение уже на максимуме", "bad")
	end
	local cost = Config.UpgradeCost(id, level)
	if data.essence < cost then
		return GameService.Notify(player, "Не хватает эссенции", "bad")
	end
	data.essence -= cost
	data.upgrades[id] = level + 1
	if id == "speed" then
		GameService.ApplySpeed(player)
	end
	DataService.Push(player)
end)

GameService.RegisterAction("buyZone", function(player, session)
	local data = session.data
	local nextIndex = data.unlockedZone + 1
	local zone = Config.Zones[nextIndex]
	if not zone then
		return GameService.Notify(player, "Все зоны уже открыты!", "info")
	end
	if data.essence < zone.price then
		return GameService.Notify(player, "Не хватает эссенции", "bad")
	end
	data.essence -= zone.price
	data.unlockedZone = nextIndex
	DataService.Push(player)
	GameService.Notify(player, "Открыта зона «" .. zone.name .. "»!", "good")
end)

GameService.RegisterAction("rebirth", function(player, session)
	local data = session.data
	local cost = Config.RebirthCost(data.rebirths)
	if data.essence < cost then
		return GameService.Notify(player, "Для перерождения нужно " .. Format.Number(cost) .. " эссенции", "bad")
	end
	data.rebirths += 1
	data.essence = 0
	data.unlockedZone = 1
	for id in data.upgrades do
		data.upgrades[id] = 0
	end
	DataService.Push(player)
	player:LoadCharacter() -- возвращаем на старт
	GameService.Notify(
		player,
		"Перерождение! Множитель теперь " .. Format.Multiplier(Config.RebirthMultiplier(data.rebirths)),
		"good"
	)
end)

GameService.RegisterAction("claimDaily", function(player, session)
	local data = session.data
	local now = os.time()
	local remaining = Config.Daily.cooldown - (now - data.lastDaily)
	if data.lastDaily > 0 and remaining > 0 then
		return GameService.Notify(player, "Награда будет доступна через " .. Format.Duration(remaining), "bad")
	end
	local streak = Config.NextDailyStreak(data.lastDaily, data.dailyStreak, now)
	local reward = Config.DailyReward(streak, data.unlockedZone, data.rebirths)
	data.dailyStreak = streak
	data.lastDaily = now
	GameService.AddEssence(player, reward, true)
	GameService.Notify(player, string.format("День %d: +%s эссенции!", streak, Format.Number(reward)), "good")
end)

---------------------------------------------------------------------

function GameService.Init()
	Remotes.Action.OnServerEvent:Connect(function(player, name, arg)
		if type(name) ~= "string" then
			return
		end
		local handler = actions[name]
		local session = DataService.Get(player)
		if not handler or not session then
			return
		end
		local now = os.clock()
		if now - session.lastAction < ACTION_COOLDOWN then
			return
		end
		session.lastAction = now

		local ok, err = pcall(handler, player, session, arg)
		if not ok then
			warn("[GameService] ошибка в действии " .. name .. ": " .. tostring(err))
		end
	end)

	DataService.OnPlayerLoaded(function(player)
		player.CharacterAdded:Connect(function(character)
			character:WaitForChild("Humanoid", 10)
			GameService.ApplySpeed(player)
		end)
		GameService.ApplySpeed(player)
	end)
end

return GameService
