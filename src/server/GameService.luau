-- Игровая логика: награды, уровень, криты, комбо, характеристики, зоны,
-- перерождение, ежедневная награда, задания и доход офлайн.
-- Все действия игрока приходят сюда через Remotes.Action и проверяются на сервере.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Format = require(ReplicatedStorage.Shared.Format)
local DataService = require(script.Parent.DataService)
local Remotes = require(script.Parent.Remotes)

local GameService = {}

local ACTION_COOLDOWN = 0.12
local actions = {}

---------------------------------------------------------------------
-- Общие функции
---------------------------------------------------------------------

function GameService.Notify(player: Player, text: string, kind: string?)
	Remotes.Notify:FireClient(player, text, kind or "info")
end

-- Визуальный эффект у клиента (см. src/client/Main.client.luau → Fx).
function GameService.Fx(player: Player, kind: string, ...)
	Remotes.Fx:FireClient(player, kind, ...)
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

function GameService.AddGems(player: Player, amount: number)
	local session = DataService.Get(player)
	if session and amount > 0 then
		session.data.gems += math.floor(amount)
		DataService.MarkDirty(player)
	end
end

function GameService.AddXp(player: Player, amount: number)
	local session = DataService.Get(player)
	if not session then
		return
	end
	local data = session.data
	data.xp += amount
	local leveled = false
	while data.xp >= Config.XpNeeded(data.level) do
		data.xp -= Config.XpNeeded(data.level)
		data.level += 1
		leveled = true
	end
	if leveled then
		GameService.Notify(player, "⭐ Уровень " .. data.level .. "! Урон и эссенция выросли", "gold")
		GameService.Fx(player, "levelUp", data.level)
		DataService.Push(player)
	else
		DataService.MarkDirty(player)
	end
end

-- Урон удара игрока с учётом крита. Возвращает урон и был ли крит.
function GameService.RollTapDamage(session): (number, boolean)
	local data = session.data
	local damage = Config.TapDamage(data)
	if math.random() < Config.CritChance(data.upgrades.crit) then
		data.stats.crits += 1
		return damage * Config.CritMultiplier(data.upgrades.critDamage), true
	end
	return damage, false
end

-- Учитывает удар в комбо. Возвращает текущее комбо.
function GameService.RegisterCombo(session): number
	local now = os.clock()
	if now - session.lastComboHit <= Config.Combo.window then
		session.combo += 1
	else
		session.combo = 1
	end
	session.lastComboHit = now
	return session.combo
end

-- Награда за пойманную тень. kind: "normal", "gold" или "boss".
-- combo = 0 для ударов авто-ловли и духов.
-- Возвращает: эссенция, кристаллы, была ли счастливая ловля.
function GameService.RewardKill(player: Player, zoneIndex: number, kind: string, combo: number): (number, number, boolean)
	local session = DataService.Get(player)
	if not session then
		return 0, 0, false
	end
	local data = session.data
	local zone = Config.Zones[zoneIndex]

	local base = zone.shadowValue
	local gems = 0
	local xp = zoneIndex
	local lucky = false

	if kind == "gold" then
		base *= Config.Golden.rewardMultiplier
		gems = Config.Golden.gems
		xp *= Config.Golden.xpMultiplier
		data.stats.golden += 1
	elseif kind == "boss" then
		base *= Config.Boss.rewardMultiplier
		gems = Config.Boss.gemsPerZone * zoneIndex
		xp *= Config.Boss.xpMultiplier
		data.stats.bosses += 1
	elseif math.random() < Config.LuckyChance(data.upgrades.luck) then
		base *= Config.Golden.rewardMultiplier
		gems = Config.Golden.gems
		xp *= Config.Golden.xpMultiplier
		data.stats.golden += 1
		lucky = true
	end

	data.stats.kills += 1
	local amount = GameService.AddEssence(
		player,
		math.max(1, base * GameService.Multiplier(player) * Config.ComboMultiplier(combo))
	)
	GameService.AddGems(player, gems)
	GameService.AddXp(player, xp)
	return amount, gems, lucky
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

-- Доход, пока игрока не было. Вызывается после проверки Game Pass'ов.
function GameService.GrantOfflineEarnings(player: Player)
	local session = DataService.Get(player)
	if not session or session.offlineGranted then
		return
	end
	session.offlineGranted = true
	local data = session.data
	if data.lastSeen <= 0 then
		return
	end
	local away = math.min(Config.Offline.maxSeconds, os.time() - data.lastSeen)
	if away < Config.Offline.minSeconds then
		return
	end
	local zone = Config.Zones[data.unlockedZone]
	local dps = Config.SpiritDamage(data)
	if session.passes.AutoCatch then
		dps += Config.TapDamage(data) / Config.AutoCatchInterval
	end
	if dps <= 0 then
		return
	end
	local killsPerSecond = math.min(dps / zone.shadowHp, 4)
	local amount = killsPerSecond * zone.shadowValue * GameService.Multiplier(player) * Config.Offline.efficiency * away
	amount = GameService.AddEssence(player, amount, true)
	if amount > 0 then
		GameService.Fx(player, "offline", amount, away)
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

-- amount: 1, 10 или 0 (= максимум, сколько хватит эссенции)
GameService.RegisterAction("buyUpgrade", function(player, session, id, amount)
	local def = if type(id) == "string" then Config.Upgrades[id] else nil
	if not def then
		return
	end
	if amount ~= 1 and amount ~= 10 and amount ~= 0 then
		amount = 1
	end
	local wanted = if amount == 0 then math.huge else amount

	local data = session.data
	local level = data.upgrades[id]
	if level >= def.maxLevel then
		return GameService.Notify(player, "Это улучшение уже на максимуме", "bad")
	end

	local bought, total = 0, 0
	while bought < wanted and level + bought < def.maxLevel do
		local cost = Config.UpgradeCost(id, level + bought)
		if data.essence < total + cost then
			break
		end
		total += cost
		bought += 1
	end
	if bought == 0 then
		return GameService.Notify(player, "Не хватает эссенции", "bad")
	end

	data.essence -= total
	data.upgrades[id] = level + bought
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
	data.maxZone = math.max(data.maxZone, nextIndex)
	DataService.Push(player)
	GameService.Notify(player, "🗺 Открыта зона «" .. zone.name .. "»!", "good")
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
	-- Уровень, питомцы, кристаллы и задания сохраняются.
	local gems = Config.Rebirth.gemsPerRebirth * data.rebirths
	data.gems += gems
	DataService.Push(player)
	player:LoadCharacter() -- возвращаем на старт
	GameService.Fx(player, "rebirth", data.rebirths, gems)
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
	data.gems += streak
	GameService.AddEssence(player, reward, true)
	GameService.Fx(player, "daily", streak, reward, streak)
end)

GameService.RegisterAction("claimQuest", function(player, session, questId)
	local quest = if type(questId) == "string" then Config.FindQuest(questId) else nil
	if not quest or not Config.QuestReady(session.data, quest) then
		return
	end
	local stage = (session.data.quests[quest.id] or 0) + 1
	local reward = quest.rewards[stage]
	session.data.quests[quest.id] = stage
	session.data.gems += reward
	DataService.Push(player)
	GameService.Notify(player, string.format("📜 %s: +%d 💎", quest.name, reward), "gem")
end)

GameService.RegisterAction("gemBoost", function(player, session)
	local data = session.data
	if data.gems < Config.GemBoost.price then
		return GameService.Notify(player, "Не хватает кристаллов 💎", "bad")
	end
	data.gems -= Config.GemBoost.price
	data.boostEndsAt = math.max(data.boostEndsAt, os.time()) + Config.GemBoost.duration
	DataService.Push(player)
	GameService.Notify(player, "⚡ Буст x2 на 5 минут!", "good")
end)

---------------------------------------------------------------------

function GameService.Init()
	Remotes.Action.OnServerEvent:Connect(function(player, name, arg1, arg2)
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

		local ok, err = pcall(handler, player, session, arg1, arg2)
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

	-- Время в игре (для профиля)
	task.spawn(function()
		while true do
			task.wait(10)
			for _, player in Players:GetPlayers() do
				local session = DataService.Get(player)
				if session then
					session.data.stats.time += 10
				end
			end
		end
	end)
end

return GameService
